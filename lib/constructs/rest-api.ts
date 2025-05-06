import { Aws, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import {
  AccessLogFormat,
  AuthorizationType,
  CfnAuthorizer,
  Cors,
  Deployment,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  ResponseType,
  RestApi,
  Stage,
} from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { NagSuppressions } from "cdk-nag";

export class RestApiGateway extends Construct {
  public restApiUrl: string;

  constructor(
    scope: Construct,
    id: string,
    props: {
      lambdaAuthorizerFunction: IFunction;
      achievementFunction: IFunction;
      challengeFunction: IFunction;
      rephraseFunction: IFunction;
      submissionFunction: IFunction;
      feedbackFunction: IFunction;
      notificationFunction: IFunction;
      viewSubmissionFunction: IFunction;
      extractCustomerNameFunction: IFunction;
      recommendSubmissionFunction: IFunction;
      combineSubmissionFunction: IFunction;
    }
  ) {
    super(scope, id);

    const allowedHeaders = Cors.DEFAULT_HEADERS;
    allowedHeaders.push("Authorization");

    // Define API Gateway log group for access logging
    const logGroup = new LogGroup(this, "ApiGatewayAccessLogs");

    // Create Rest API
    const restApi = new RestApi(this, "RestApi", {
      restApiName: "writing-assistant-rest-api",
      deploy: false,
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
      defaultCorsPreflightOptions: {
        allowHeaders: allowedHeaders,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    restApi.addGatewayResponse("GatewayResponseDefault4XX", {
      type: ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'*'",
        "Access-Control-Allow-Methods": "'*'",
        "Access-Control-Allow-Credentials": "'true'",
      },
    });

    restApi.addGatewayResponse("GatewayResponseDefault5XX", {
      type: ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'*'",
        "Access-Control-Allow-Methods": "'*'",
        "Access-Control-Allow-Credentials": "'true'",
      },
    });

    // Create Api Gateway authorizer
    props.lambdaAuthorizerFunction.addPermission("RestApiCognitoAuthorizer", {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${restApi.restApiId}/*/*`,
    });
    const lambdaAuthorizer = new CfnAuthorizer(this, "restApiAuthorizer", {
      name: "RestApiAuthorizer",
      restApiId: restApi.restApiId,
      type: "TOKEN",
      identitySource: "method.request.header.Authorization",
      authorizerUri: `arn:aws:apigateway:${Aws.REGION}:lambda:path/2015-03-31/functions/${props.lambdaAuthorizerFunction.functionArn}/invocations`,
      authorizerResultTtlInSeconds: 0,
    });

    // Add an API resource and method for each asyncronously invoked Lambda function.
    // Use this for functions that return a streaming LLM response to the WebSocket.
    const asyncLambdaApis = [
      { resource: "achievement", function: props.achievementFunction },
      { resource: "challenge", function: props.challengeFunction },
      { resource: "rephrase", function: props.rephraseFunction },
      {
        resource: "recommend_submissions",
        function: props.recommendSubmissionFunction,
      },
      {
        resource: "combine_submissions",
        function: props.combineSubmissionFunction,
      },
    ];
    asyncLambdaApis.forEach((api) => {
      const resource = restApi.root.addResource(api.resource);
      resource.addMethod(
        "POST",
        new LambdaIntegration(api.function, {
          proxy: false,
          requestParameters: {
            "integration.request.header.X-Amz-Invocation-Type": "'Event'",
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
              responseTemplates: {
                "application/json": "null",
              },
            },
          ],
        }),
        {
          authorizationType: AuthorizationType.CUSTOM,
          authorizer: {
            authorizerId: lambdaAuthorizer.attrAuthorizerId,
          },
          methodResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin": true,
              },
            },
          ],
        }
      );
    });

    // Add an API resource and method for each Lambda proxy integration. Use this for any
    // functions that are syncronously invoked and return a response to API Gateway.
    const proxyLambdaApis = [
      {
        resource: "view_submission_associates",
        method: "GET",
        function: props.viewSubmissionFunction,
      },
      {
        resource: "view_submission_managers",
        method: "GET",
        function: props.viewSubmissionFunction,
      },
      {
        resource: "submission",
        method: "POST",
        function: props.submissionFunction,
      },
      {
        resource: "extract_name",
        method: "POST",
        function: props.extractCustomerNameFunction,
      },
    ];
    proxyLambdaApis.forEach((api) => {
      console.log(api.function.functionArn);
      const resource = restApi.root.addResource(api.resource);
      resource.addMethod(api.method, new LambdaIntegration(api.function), {
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: {
          authorizerId: lambdaAuthorizer.attrAuthorizerId,
        },
      });
    });

    // Create Stage and Deployment
    const deployment = new Deployment(this, "Deployment", { api: restApi });
    const devStage = new Stage(this, "dev", {
      deployment,
      stageName: "dev",
      accessLogDestination: new LogGroupLogDestination(logGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields({
        caller: true,
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        user: true,
      }),
      loggingLevel: MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
    });
    restApi.deploymentStage = devStage;
  
    // Export API URL
    this.restApiUrl = restApi.url;

    new CfnOutput(this, "ApiGatewayInvokeUrl", {
      key: "RestApiBaseUrl",
      value: restApi.url,
    });

    // Add suppressions for CDK-NAG if needed
    NagSuppressions.addResourceSuppressions(
      restApi,
      [
        {
          id: "AwsSolutions-APIG2",
          reason: "Request validation not required for demo application",
        },
        {
          id: "AwsSolutions-APIG3",
          reason: "WAF not required for demo application",
        },
        {
          id: "AwsSolutions-APIG4",
          reason: "Using custom Lambda authorizer for authentication",
        },
        {
          id: "AwsSolutions-COG4",
          reason: "Using custom Lambda authorizer instead of Cognito",
        },
      ],
      true
    );
    NagSuppressions.addResourceSuppressions(
      devStage,
      [
        {
          id: "AwsSolutions-APIG3",
          reason: "WAF not required for demo application",
        },
      ],
      true
    );
  }
}
