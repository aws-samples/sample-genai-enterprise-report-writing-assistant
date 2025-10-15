import { Aws, Duration, Fn, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  IFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyStatement,
  Effect,
  Policy,
} from "aws-cdk-lib/aws-iam";

interface LambdaFunctionsProps extends StackProps {
  userPoolId: string;
  userPoolClientId: string;
  conversationMemoryTableName: string;
  associateSubmissionTableName: string;
  associateSubmissionTableGsiName: string;
  websocketArnForExecuteApi: string;
  websocketCallbackUrl: string;
}

export class LambdaFunctions extends Construct {
  public readonly achievementFunction: IFunction;
  public readonly challengeFunction: IFunction;
  public readonly submissionFunction: IFunction;
  public readonly feedbackFunction: IFunction;
  public readonly rephraseFunction: IFunction;
  public readonly notificationFunction: IFunction;
  public readonly viewSubmissionFunction: IFunction;
  public readonly extractCustomerNameFunction: IFunction;
  public readonly combineSubmissionFunction: IFunction;
  public readonly recommendSubmissionFunction: IFunction;

  constructor(scope: Construct, id: string, props: LambdaFunctionsProps) {
    super(scope, id);

    // Create the Lambda function execution role
    const lambdaExecutionRole = new Role(this, `LambdaExecutionRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // DynamoDB permissions (replacing AmazonDynamoDBFullAccess)
    const dynamoDbPolicy = new Policy(this, "DynamoDbPolicy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan"
          ],
          resources: [
            `arn:aws:dynamodb:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${props.conversationMemoryTableName}`,
            `arn:aws:dynamodb:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${props.associateSubmissionTableName}`,
            `arn:aws:dynamodb:${Aws.REGION}:${Aws.ACCOUNT_ID}:table/${props.associateSubmissionTableName}/index/*`
          ],
        }),
      ],
    });
    lambdaExecutionRole.attachInlinePolicy(dynamoDbPolicy);

    // Bedrock permissions
    const bedrockPolicy = new Policy(this, "BedrockPolicy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream",
          ],
          resources: [
            `arn:aws:bedrock:*::foundation-model/*`,
            `arn:aws:bedrock:*:${Aws.ACCOUNT_ID}:inference-profile/*`,
          ],
        }),
      ],
    });
    lambdaExecutionRole.attachInlinePolicy(bedrockPolicy);

    // WebSocket API permissions
    const websocketPolicy = new Policy(this, "WebSocketPolicy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["execute-api:ManageConnections"],
          resources: [props.websocketArnForExecuteApi],
        }),
      ],
    });
    lambdaExecutionRole.attachInlinePolicy(websocketPolicy);

    // Create the GenAI Lambda Layer
    const genAiLayer = new PythonLayerVersion(this, 'GenAiLayer', {
      entry: `${process.cwd()}/lib/lambda-layers/genai-layer`,
      compatibleRuntimes: [Runtime.PYTHON_3_12],
      compatibleArchitectures: [Architecture.ARM_64],
      description: 'A layer for common GenAI dependencies',
      layerVersionName: 'genAiLayer',
    });

    // create lambda function to write achievement
    const achievementFunction = new LambdaFunction(
      this,
      "AchievementWriting",
      {
        description: "Lambda code for helping associates write achievement",
        architecture: Architecture.ARM_64,
        handler: "lambda_handler.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: Code.fromAsset("./lib/lambda-functions/achievement/"),
        environment: {
          CONVERSATION_MEMORY_TABLE_NAME: props.conversationMemoryTableName,
          ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
          LAMBDA_TYPE: "ACHIEVEMENTS",
          WEBSOCKET_CALLBACK_URL: props.websocketCallbackUrl,
          MAX_TOKENS: "1024",
          MODEL_CACHE: "false",
          STREAMING: "true",
          MODEL_ID: "Claude37Sonnet",
          LOG_LEVEL: "INFO",
        },
        role: lambdaExecutionRole,
        timeout: Duration.minutes(15),
        memorySize: 2048,
        layers: [genAiLayer],
      }
    );

    // create lambda function to write challenge
    const challengeFunction = new LambdaFunction(
      this,
      "ChallengeWriting",
      {
        description: "Lambda code for helping associates write challenge",
        architecture: Architecture.ARM_64,
        handler: "lambda_handler.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: Code.fromAsset("./lib/lambda-functions/challenge/"),
        environment: {
          CONVERSATION_MEMORY_TABLE_NAME: props.conversationMemoryTableName,
          ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
          LAMBDA_TYPE: "CHALLENGES",
          WEBSOCKET_CALLBACK_URL: props.websocketCallbackUrl,
          MAX_TOKENS: "1024",
          MODEL_CACHE: "false",
          STREAMING: "true",
          MODEL_ID: "Claude37Sonnet",
          LOG_LEVEL: "INFO",
        },
        role: lambdaExecutionRole,
        timeout: Duration.minutes(15),
        memorySize: 2048,
        layers: [genAiLayer],
      }
    );

    // create lambda function to rephrase associate submissions
    const rephraseFunction = new LambdaFunction(
      this,
      "Rephrase",
      {
        description: "Rephrase submission",
        architecture: Architecture.ARM_64,
        handler: "lambda_handler.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: Code.fromAsset("./lib/lambda-functions/rephrase/"),
        environment: {
          CONVERSATION_MEMORY_TABLE_NAME: props.conversationMemoryTableName,
          ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
          WEBSOCKET_CALLBACK_URL: props.websocketCallbackUrl,
          MAX_TOKENS: "1024",
          MODEL_CACHE: "false",
          STREAMING: "true",
          MODEL_ID: "Claude37Sonnet",
          LOG_LEVEL: "INFO",
        },
        role: lambdaExecutionRole,
        timeout: Duration.minutes(15),
        memorySize: 1024,
        layers: [genAiLayer],
      }
    );

    // create lambda function to submit the writings from associates
    const submissionFunction = new PythonFunction(this, "Submission", {
      runtime: Runtime.PYTHON_3_12,
      description: "Allow associates to post submissions.",
      entry: `${process.cwd()}/lib/lambda-functions/submission`,
      index: "lambda_handler.py",
      handler: "lambda_handler",
      role: lambdaExecutionRole,
      timeout: Duration.seconds(15),
      memorySize: 1024,
      environment: {
        ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
        LOG_LEVEL: "INFO",
      },
    });

    // create lambda function to submit the writings from associates
    const viewSubmissionFunction = new PythonFunction(this, "ViewSubmission", {
      runtime: Runtime.PYTHON_3_12,
      description: "Allow associates to view submission.",
      entry: `${process.cwd()}/lib/lambda-functions/view_submission`,
      index: "lambda_handler.py",
      handler: "lambda_handler",
      role: lambdaExecutionRole,
      timeout: Duration.seconds(3),
      memorySize: 1024,
      environment: {
        ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
        ASSOCIATE_SUBMISSION_TABLE_NAME_GSI: props.associateSubmissionTableGsiName,
        LOG_LEVEL: "INFO",
      },
    });

    // create lambda function to rephrase associate submissions
    const extractCustomerNameFunction = new LambdaFunction(
      this,
      "ExtractCustomerName",
      {
        description: "Extract customer name from submission",
        architecture: Architecture.ARM_64,
        handler: "lambda_handler.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: Code.fromAsset("./lib/lambda-functions/extract_customer_name/"),
        environment: {
          CONVERSATION_MEMORY_TABLE_NAME: props.conversationMemoryTableName,
          ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
          WEBSOCKET_CALLBACK_URL: props.websocketCallbackUrl,
          MAX_TOKENS: "256",
          MODEL_CACHE: "false",
          STREAMING: "false",
          MODEL_ID: "Claude37Sonnet",
          LOG_LEVEL: "INFO",
        },
        role: lambdaExecutionRole,
        timeout: Duration.minutes(15),
        memorySize: 1024,
        layers: [genAiLayer],
      }
    );

    const combineSubmissionFunction = new LambdaFunction(
      this,
      "CombineSubmission",
      {
        description: "Combine submission",
        architecture: Architecture.ARM_64,
        handler: "lambda_handler.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: Code.fromAsset("./lib/lambda-functions/combine_submission/"),
        environment: {
          CONVERSATION_MEMORY_TABLE_NAME: props.conversationMemoryTableName,
          ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
          WEBSOCKET_CALLBACK_URL: props.websocketCallbackUrl,
          MAX_TOKENS: "1024",
          MODEL_CACHE: "false",
          STREAMING: "true",
          MODEL_ID: "Claude37Sonnet",
          LOG_LEVEL: "INFO",
        },
        role: lambdaExecutionRole,
        timeout: Duration.minutes(15),
        memorySize: 1024,
        layers: [genAiLayer],
      }
    );

    const recommendSubmissionFunction = new LambdaFunction(
      this,
      "RecommendSubmission",
      {
        description: "Recommend submission",
        architecture: Architecture.ARM_64,
        handler: "lambda_handler.lambda_handler",
        runtime: Runtime.PYTHON_3_12,
        code: Code.fromAsset("./lib/lambda-functions/recommend_submission/"),
        environment: {
          CONVERSATION_MEMORY_TABLE_NAME: props.conversationMemoryTableName,
          ASSOCIATE_SUBMISSION_TABLE_NAME: props.associateSubmissionTableName,
          WEBSOCKET_CALLBACK_URL: props.websocketCallbackUrl,
          MAX_TOKENS: "1024",
          MODEL_CACHE: "false",
          STREAMING: "true",
          MODEL_ID: "Claude37Sonnet",
          LOG_LEVEL: "INFO",
        },
        role: lambdaExecutionRole,
        timeout: Duration.minutes(15),
        memorySize: 1024,
        layers: [genAiLayer],
      }
    );

    // Assign the functions to public properties
    this.achievementFunction = achievementFunction;
    this.challengeFunction = challengeFunction;
    this.submissionFunction = submissionFunction;
    this.rephraseFunction = rephraseFunction;
    this.viewSubmissionFunction = viewSubmissionFunction;
    this.extractCustomerNameFunction = extractCustomerNameFunction;
    this.combineSubmissionFunction = combineSubmissionFunction;
    this.recommendSubmissionFunction = recommendSubmissionFunction;
  }
}