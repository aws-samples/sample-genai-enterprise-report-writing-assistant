import { Construct } from "constructs";
import { Aws, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Key } from "aws-cdk-lib/aws-kms";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  Source as S3Source,
} from "aws-cdk-lib/aws-s3-deployment";
import {
  BuildSpec,
  Source,
  LinuxBuildImage,
  Project,
  Artifacts,
} from "aws-cdk-lib/aws-codebuild";
import { PolicyStatement, Effect, Policy } from "aws-cdk-lib/aws-iam";
import { Rule } from "aws-cdk-lib/aws-events";
import { CodeBuildProject } from "aws-cdk-lib/aws-events-targets";
import { NagSuppressions } from "cdk-nag";

export interface VueAppProps {
  readonly restApiUrl: string;
  readonly webSocketUrl: string;
  readonly cognitoUserPoolId: string;
  readonly cognitoUserPoolClientId: string;
}

export class VueAppBuild extends Construct {
  public readonly kmsKey: Key;
  public readonly vueAppBucket: Bucket;

  constructor(scope: Construct, id: string, props: VueAppProps) {
    super(scope, id);

    // Define the environment variables to be passed into the Vue app
    const vueEnvironmentVariables: Record<string, string> = {
      VITE_REST_API_URL: props.restApiUrl,
      VITE_WEBSOCKET_URL: props.webSocketUrl,
      VITE_USER_POOL_ID: props.cognitoUserPoolId,
      VITE_USER_POOL_CLIENT_ID: props.cognitoUserPoolClientId,
    };

    // Create the Vue app's KMS key
    this.kmsKey = this.createKmsKey();

    // Create a bucket for the Vue user interface
    this.vueAppBucket = this.createS3Bucket();

    // Deploy the Vue source code to S3
    this.deployVueSourceCode(this.vueAppBucket);

    // Create the shell commands to create the Vue .env file during the build
    const commands = this.createEnvFileCommands(vueEnvironmentVariables);

    // Create a CodeBuild project to build the Vue application
    const codebuildProject = this.createCodeBuildProject(
      this.vueAppBucket,
      this.kmsKey,
      vueEnvironmentVariables,
      commands
    );

    // Grant the CodeBuild project permission to access S3
    this.grantCodeBuildAccess(codebuildProject);

    // Create an EventBridge rule to trigger CodeBuild on stack deployment
    this.createCodeBuildTriggerRule(codebuildProject, this.vueAppBucket);
  }

  private createKmsKey(): Key {
    const key = new Key(this, "SSEKmsKey", {
      alias: "writing-assistant-kms-key",
      description: "Customer-managed KMS key for SSE-KMS encryption",
      removalPolicy: RemovalPolicy.DESTROY,
      enableKeyRotation: true,
    });

    return key;
  }

  private createS3Bucket(): Bucket {
    const loggingBucket = new Bucket(this, "VueAppAccessLogBucket", {
      bucketName: `genai-vue-app-logs-${Aws.ACCOUNT_ID}`,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    const bucket = new Bucket(this, "VueAppBucket", {
      bucketName: `genai-vue-app-${Aws.ACCOUNT_ID}`,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: "access-logs/"
    });

    return bucket;
  }

  private deployVueSourceCode(vueAppBucket: IBucket): void {
    new BucketDeployment(this, "DeployVueSourceCode", {
      destinationBucket: vueAppBucket,
      destinationKeyPrefix: "source",
      sources: [
        S3Source.asset("./lib/vue-app", {
          exclude: ["build", "node_modules", ".env.*"],
        }),
      ],
    }).node.addDependency(vueAppBucket);
  }

  private createEnvFileCommands(
    environmentVariables: Record<string, string>
  ): string[] {
    const commands = [];
    for (const [key, value] of Object.entries(environmentVariables)) {
      commands.push(`echo "${key}=$${key}" >> .env`);
    }
    return commands;
  }

  private createCodeBuildProject(
    vueAppBucket: IBucket,
    kmsKey: Key,
    environmentVariables: Record<string, string>,
    commands: string[]
  ): Project {
    const project = new Project(this, "VueBuildProject", {
      projectName: "genai-vue-app-build",
      encryptionKey: kmsKey,
      source: Source.s3({
        bucket: vueAppBucket,
        path: "source/",
      }),
      artifacts: Artifacts.s3({
        bucket: vueAppBucket,
        includeBuildId: false,
        packageZip: false,
        name: "build",
        encryption: true,
      }),
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        env: {
          shell: "bash",
          variables: environmentVariables,
        },
        phases: {
          install: {
            "runtime-versions": {
              nodejs: 20,
            },
          },
          pre_build: {
            commands,
          },
          build: {
            commands: ["npm ci", "npm run build"],
          },
        },
        artifacts: {
          files: "**/*",
          "base-directory": "build",
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_6_0,
      },
    });
    project.node.addDependency(vueAppBucket);

    return project;
  }

  private grantCodeBuildAccess(codebuildProject: Project): void {
    if (codebuildProject.role) {
      this.vueAppBucket.grantRead(codebuildProject.role);
    } else {
      console.error("CodeBuild project role is undefined");
    }
  }

  private createCodeBuildTriggerRule(
    codebuildProject: Project,
    vueAppBucket: IBucket
  ): void {
    const rule = new Rule(this, "VueBuildTriggerRule", {
      ruleName: "writing-assistant-build-vue-on-stack-create",
      eventPattern: {
        source: ["aws.cloudformation"],
        detailType: ["CloudFormation Stack Status Change"],
        detail: {
          "stack-id": [Stack.of(this).stackId],
          "status-details": {
            status: ["CREATE_COMPLETE", "UPDATE_COMPLETE"],
          },
        },
      },
      targets: [new CodeBuildProject(codebuildProject)],
      description:
        "Trigger CodeBuild Lambda when Vue.js source code is updated",
      enabled: true,
    });
    rule.node.addDependency(vueAppBucket);

    if (codebuildProject.role) {
      const policyStatement = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["codebuild:StartBuild"],
        resources: [codebuildProject.projectArn],
      });
      codebuildProject.role.attachInlinePolicy(
        new Policy(this, "CodeBuildStartBuildPolicy", {
          statements: [policyStatement],
        })
      );
    }
  }
}
