import { Aspects, Aws, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaAuthorizer as CognitoAuthorizers } from "./constructs/cognito-authorizers";
import { LambdaFunctions } from "./constructs/lambda-functions";
import { WebSocketApiGateway } from "./constructs/websocket";
import { RestApiGateway } from "./constructs/rest-api";
import { CognitoUserPool } from "./constructs/cognito";
import { VueAppBuild } from "./constructs/vue-app-build";
import { VueAppDeploy } from "./constructs/vue-app-deploy";
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import { DynamoDbTables } from "./constructs/dynamodb-db";

const CUSTOM_APP_DOMAIN = "chat.awsurl.com"; // Example: "myapp.mydomain.com"

export class CdkVueAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Apply AwsSolutionsChecks
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));

    // Create the DynamoDB tables
    const dynamoDbTables = new DynamoDbTables(this, "DynamoDbTables");

    // Create the Cognito User Pool
    const cognito = new CognitoUserPool(this, "Cognito");

    // Create the Cognito custom authorizers
    const cognitoAuthorizers = new CognitoAuthorizers(this, "CognitoAuthorizers", {
      userPoolId: cognito.userPool.userPoolId,
      userPoolClientId: cognito.userPoolClient.userPoolClientId,
    });

    // Create the WebSocket API
    const webSocketApi = new WebSocketApiGateway(this, "WebSocketApiGateway", {
      authorizerFunction: cognitoAuthorizers.websocketAuthorizerFunction,
      userPoolId: cognito.userPool.userPoolId,
    });

    // Create Lambda functions
    const lambdaFunctions = new LambdaFunctions(this, 'LambdaFunctions', {
      userPoolId: cognito.userPool.userPoolId,
      userPoolClientId: cognito.userPoolClient.userPoolClientId,
      conversationMemoryTableName: dynamoDbTables.conversationMemoryTable.tableName,
      associateSubmissionTableName: dynamoDbTables.associateSubmissionTable.tableName,
      associateSubmissionTableGsiName: dynamoDbTables.associateSubmissionTableGsiName,
      websocketArnForExecuteApi: webSocketApi.webSocketArnForExecuteApi,
      websocketCallbackUrl: webSocketApi.webSocketCallbackUrl,
    });

    // Create REST API
    const apiGateway = new RestApiGateway(this, 'RestApi', {
      lambdaAuthorizerFunction: cognitoAuthorizers.restAuthorizerFunction,
      achievementFunction: lambdaFunctions.achievementFunction,
      challengeFunction: lambdaFunctions.challengeFunction,
      rephraseFunction: lambdaFunctions.rephraseFunction,
      submissionFunction: lambdaFunctions.submissionFunction,
      feedbackFunction: lambdaFunctions.feedbackFunction,
      notificationFunction: lambdaFunctions.notificationFunction,
      viewSubmissionFunction: lambdaFunctions.viewSubmissionFunction,
      extractCustomerNameFunction: lambdaFunctions.extractCustomerNameFunction,
      recommendSubmissionFunction: lambdaFunctions.recommendSubmissionFunction,
      combineSubmissionFunction: lambdaFunctions.combineSubmissionFunction,
    });

    // Create the Vue app build
    const vueAppBuild = new VueAppBuild(this, "VueAppBuild", {
      restApiUrl: apiGateway.restApiUrl,
      webSocketUrl: webSocketApi.webSocketUrl,
      cognitoUserPoolId: cognito.userPool.userPoolId,
      cognitoUserPoolClientId: cognito.userPoolClient.userPoolClientId,
    });

    // Create the Vue.js app deployment
    const vueAppDeployment = new VueAppDeploy(this, "VueAppDeploy", {
      kmsKey: vueAppBuild.kmsKey,
      vueAppBucket: vueAppBuild.vueAppBucket,
    });

    // Add the CloudFront distribution to the Cognito app client's callback URLs
    cognito.addCallbackUrls([
      vueAppDeployment.cloudFrontDistributionUrl,
      CUSTOM_APP_DOMAIN,
    ]);

    // Add NAG suppressions
    NagSuppressions.addStackSuppressions(this, [
      {
        id: "AwsSolutions-IAM4",
        reason: "Suppressing L3 IAM policies since it is not managed by the application",
      },
      {
        id: "AwsSolutions-IAM5",
        reason: "Suppressing L3 IAM policies since it is not managed by the application",
      },
      {
        id: "AwsSolutions-L1",
        reason: "Lambda managed by L3 construct",
      },
    ]);
  }
}
