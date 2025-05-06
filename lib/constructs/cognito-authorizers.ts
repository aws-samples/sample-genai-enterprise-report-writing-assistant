import { Aws, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import path = require("path");

export interface LambdaAuthorizerProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
}

export class LambdaAuthorizer extends Construct {
  public readonly restAuthorizerFunction: IFunction;
  public readonly websocketAuthorizerFunction: IFunction;

  constructor(scope: Construct, id: string, props: LambdaAuthorizerProps) {
    super(scope, id);

    // Create the REST Authorizer function
    this.restAuthorizerFunction = this.createRestAuthorizerFunction(props);

    // Create the WebSocket Authorizer function
    this.websocketAuthorizerFunction = this.createWebSocketAuthorizerFunction(props);
  }

  private createRestAuthorizerFunction(props: LambdaAuthorizerProps): IFunction {
    const authorizerRole = new Role(this, "RestAuthorizerExecutionRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add permission to verify Cognito tokens
    authorizerRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "cognito-idp:GetUser",
        ],
        resources: [
          `arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/${props.userPoolId}`,
        ],
      })
    );

    return new PythonFunction(this, "RestAuthorizer", {
      runtime: Runtime.PYTHON_3_12,
      entry: path.join(__dirname, "../lambda-functions/cognito-rest-authorizer"),
      index: "index.py",
      handler: "lambda_handler",
      role: authorizerRole,
      timeout: Duration.seconds(30),
      memorySize: 128,
      environment: {
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });
  }

  private createWebSocketAuthorizerFunction(props: LambdaAuthorizerProps): IFunction {
    const authorizerRole = new Role(this, "WebSocketAuthorizerExecutionRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add permission to verify Cognito tokens
    authorizerRole.addToPolicy(
      new PolicyStatement({
        actions: ["cognito-idp:GetUser"],
        resources: [`arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/${props.userPoolId}`],
      })
    );

    return new PythonFunction(this, "WebSocketAuthorizer", {
      runtime: Runtime.PYTHON_3_12,
      entry: path.join(__dirname, "../lambda-functions/cognito-websocket-authorizer"),
      index: "index.py",
      handler: "lambda_handler",
      role: authorizerRole,
      timeout: Duration.seconds(30),
      memorySize: 128,
      environment: {
        USER_POOL_ID: props.userPoolId,
      },
    });
  }
}
