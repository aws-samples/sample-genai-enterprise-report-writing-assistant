import { Aws, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CfnAuthorizer,
  CfnIntegration,
  CfnIntegrationResponse,
  CfnRoute,
  CfnRouteResponse,
  CfnStage,
  WebSocketApi,
} from "aws-cdk-lib/aws-apigatewayv2";
import { NagSuppressions } from "cdk-nag";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

export interface WebSocketApiGatewayProps {
  readonly authorizerFunction: IFunction;
  readonly userPoolId: string;
}

export class WebSocketApiGateway extends Construct {
  public readonly webSocketUrl: string;
  public readonly webSocketCallbackUrl: string;
  public readonly webSocketArnForExecuteApi: string;

  constructor(scope: Construct, id: string, props: WebSocketApiGatewayProps) {
    super(scope, id);

    // Create WebSocket API
    const webSocketApi = this.createWebSocketApi();

    // Create the authorizer
    this.createAuthorizer(
      webSocketApi.apiId,
      props.authorizerFunction
    );

    // Create "$default" WebSocket integration request
    const defaultIntegrationRequest = this.createDefaultIntegrationRequest(
      webSocketApi.apiId
    );

    // Create "$default" WebSocket integration response that returns connection Id
    this.createDefaultIntegrationResponse(
      webSocketApi.apiId,
      defaultIntegrationRequest
    );

    // Create "$default" WebSocket route
    const defaultRoute = this.createDefaultRoute(
      webSocketApi.apiId,
      defaultIntegrationRequest
    );

    // Create "$default" WebSocket route response
    this.createDefaultRouteResponse(webSocketApi.apiId, defaultRoute);

    // Create WebSocket API deployment stage
    const webSocketStage = this.createApiDeploymentStage(webSocketApi.apiId);

    // Create WebSocket URL and callback URL
    const webSocketUrl = `wss://${webSocketApi.apiId}.execute-api.${Aws.REGION}.amazonaws.com/${webSocketStage.stageName}/`;
    const webSocketCallbackUrl = `https://${webSocketApi.apiId}.execute-api.${Aws.REGION}.amazonaws.com/${webSocketStage.stageName}/`;

    new CfnOutput(this, "WebSocketApiInvokeUrl", {
      key: "WebSocketUrl",
      value: webSocketUrl,
    });

    this.webSocketUrl = webSocketUrl;
    this.webSocketCallbackUrl = webSocketCallbackUrl;
    this.webSocketArnForExecuteApi = webSocketApi.arnForExecuteApi();
  }

  private createWebSocketApi(): WebSocketApi {
    return new WebSocketApi(this, "WebSocketApi", {
      apiName: "writing-assistant-websocket-api",
    });
  }

  private createAuthorizer(
    apiId: string,
    authorizerFunction: IFunction,
  ): CfnAuthorizer {
    // Create the authorizer
    const authorizer = new CfnAuthorizer(this, "WebSocketAuthorizer", {
      apiId: apiId,
      authorizerType: "REQUEST",
      identitySource: ["route.request.querystring.Auth"],
      name: "WebSocketAuthorizer",
      authorizerUri: `arn:aws:apigateway:${Aws.REGION}:lambda:path/2015-03-31/functions/${authorizerFunction.functionArn}/invocations`,
    });

    // Allow the api to invoke the authorizer
    authorizerFunction.addPermission('APIGatewayInvoke', {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${apiId}/authorizers/${authorizer.ref}`,
    });
    
    return authorizer;
  }

  private createDefaultIntegrationRequest(apiId: string): CfnIntegration {
    return new CfnIntegration(this, "DefaultIntegrationId", {
      apiId: apiId,
      integrationType: "MOCK",
      requestTemplates: {
        $default: '{"statusCode": 200}',
      },
      templateSelectionExpression: "\\$default",
    });
  }

  private createDefaultIntegrationResponse(
    apiId: string,
    integrationRequest: CfnIntegration
  ): CfnIntegrationResponse {
    return new CfnIntegrationResponse(this, "DefaultIntegrationResponse", {
      apiId: apiId,
      integrationId: integrationRequest.ref,
      integrationResponseKey: "$default",
      responseTemplates: {
        $default: '{"connectionId" : "$context.connectionId"}',
      },
    });
  }

  private createDefaultRoute(
    apiId: string,
    integrationRequest: CfnIntegration
  ): CfnRoute {
    const defaultRoute = new CfnRoute(this, "DefaultRoute", {
      apiId: apiId,
      routeKey: "$default",
      target: "integrations/" + integrationRequest.ref,
    });

    NagSuppressions.addResourceSuppressions(
      defaultRoute,
      [
        {
          id: "AwsSolutions-APIG4",
          reason: "Lambda authorizer used for authorization",
        },
      ],
      true
    );
    return defaultRoute;
  }

  private createDefaultRouteResponse(
    apiId: string,
    route: CfnRoute
  ): CfnRouteResponse {
    return new CfnRouteResponse(this, "DefaultRouteResponse", {
      apiId: apiId,
      routeId: route.ref,
      routeResponseKey: "$default",
    });
  }

  private createApiDeploymentStage(apiId: string): CfnStage {
    const stage = new CfnStage(this, "WebSocketApiStage", {
      apiId: apiId,
      stageName: "dev",
      autoDeploy: true,
    });
    
    NagSuppressions.addResourceSuppressions(
      stage,
      [
        {
          id: "AwsSolutions-APIG1",
          reason: "Access logging disabled for demo purposes to simplify deployment",
        },
      ],
      true
    );
    
    return stage;
  }
}
