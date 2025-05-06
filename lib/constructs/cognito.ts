import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  VerificationEmailStyle,
  AccountRecovery,
  OAuthScope,
  CfnUserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";

export class CognitoUserPool extends Construct {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly cognitoAuthorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Cognito User Pool
    this.userPool = this.createUserPool();

    // Create Cognito User Pool application client
    this.userPoolClient = this.createUserPoolClient();

    // Create Cloudformation Outputs
    this.createOutputs();

    // Add suppressions for CDK-NAG if needed
    this.addNagSuppressions(this.userPool);
  }

  private createUserPool(): UserPool {
    const accountId = Stack.of(this).account;
    const cognitoDomainPrefix = `genai-assistant-${accountId}`;

    const userPool = new UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: "Verify your email to use the GenAI Assistant app!",
        emailBody:
          "Verify your email to use the GenAI Assistant app! Your verification code is {####}",
        emailStyle: VerificationEmailStyle.CODE,
        smsMessage:
          "Verify your email to use the GenAI Assistant app! Your verification code is {####}",
      },
      userInvitation: {
        emailSubject: "Invite to join our GenAI Assistant app!",
        emailBody:
          "Hello {username}, you have been invited to join our GenAI Assistant app! Login at https://chat.awsurl.com. Your temporary password is {####}",
        smsMessage:
          "Hello {username}, your temporary password for our GenAI Assistant app is {####}",
      },
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });

    userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });

    return userPool;
  }

  private createUserPoolClient(): UserPoolClient {
    const authRedirectUriDev = 'http://localhost:3000/callback'

    return this.userPool.addClient("AppClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: [authRedirectUriDev],
      },
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
      refreshTokenValidity: Duration.days(30),
    });
  }

  private createOutputs(): void {
    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "The ID of the Cognito User Pool",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "The ID of the Cognito User Pool Client",
    });
  }

  public addCallbackUrls(urls: string[]): void {
    const cfnUserPoolClient = this.userPoolClient.node
      .defaultChild as CfnUserPoolClient;
    const existingUrls = cfnUserPoolClient.callbackUrLs || [];
    const newUrls = urls
      .filter((url) => url && url.trim() !== "")
      .map((url) => `https://${url}/callback`);

    cfnUserPoolClient.callbackUrLs = [...new Set([...existingUrls, ...newUrls])];
  }

  private addNagSuppressions(userPool: UserPool) {
    NagSuppressions.addResourceSuppressions(
      userPool,
      [
        {
          id: "AwsSolutions-COG2",
          reason: "MFA is not required for this application",
        },
        {
          id: "AwsSolutions-COG3",
          reason: "Advanced security mode not required for this application",
        },
      ],
      true
    );
  }
}
