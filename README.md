# Enterprise Report Writing Assistant

This project demonstrates a GenAI-powered business reporting solution built with Amazon Bedrock and AWS serverless services. The application helps organizations streamline their internal reporting processes by:

- Automating report generation with AI assistance
- Providing real-time feedback on report content
- Rephrasing text for clarity and professionalism
- Streamlining submission and review workflows

Traditional business reporting is time-consuming, with associates spending ~2 hours per month on reports and managers spending up to 10 hours reviewing them. This solution reduces that time while improving consistency and quality.

## Architecture

![Architecture Diagram](/architecture.jpg)

## How It Works

The solution uses a serverless architecture with these key components:

1. **User Interaction**: Web application hosted on S3/CloudFront with Cognito authentication
2. **API Layer**: WebSocket API for real-time communication and REST API for transactions
3. **Orchestration**: Lambda functions for report writing, rephrasing, and submission
4. **AI and Storage**: Amazon Bedrock for LLM capabilities and DynamoDB for data storage

The workflow classifies user inputs into:
- Questions/Commands: Processed by the LLM with conversation memory
- Verification Requests: Evaluated against submission criteria
- Out-of-Scope: Redirected with appropriate messaging

Users can write achievements or challenges, get AI assistance, automatically rephrase content, and manage submissions through an intuitive interface.

## Resources:
- [AWS CDK](https://aws.amazon.com/cdk/)
- [Amazon Bedrock](https://aws.amazon.com/bedrock/)
- [LangChain](https://www.langchain.com/)
- [Vue.js](https://vuejs.org/)

## Deployment

```bash
# Install dependencies
npm install

# Bootstrap CDK (only needed once per account/region)
cdk bootstrap

# Deploy the CDK stack
cdk deploy
```

## Launch Application

After the CDK application deploys, the Vue.js front-end application will build and deploy. This typically takes 1-2 minutes. 

- Open the application in your Web browser using the `VueAppUrl` URL found in the CDK outputs.
- At the sign-in screen, click `Create Account`.
- Enter a valid email address where you can receive an account validation code.
- Copy the validation code into the sign-in screen to access the app.

## Cleanup

To remove all resources created by this stack:

```bash
cdk destroy
```
