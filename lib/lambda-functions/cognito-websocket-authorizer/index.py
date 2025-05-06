"""
Lambda function to handle WebSocket authorizer.
This function is triggered by an API Gateway event.
It verifies the token provided in the query string parameters and
authorizes the connection if valid.
"""
import os
import boto3

cognito = boto3.client('cognito-idp')

def lambda_handler(event, _context):
    """
    Lambda function to handle WebSocket authorizer.
    This function is triggered by an API Gateway event.
    It verifies the token provided in the query string parameters and
    authorizes the connection if valid.
    """
    token = event.get('queryStringParameters', {}).get('Auth')
    session_id = event.get('queryStringParameters', {}).get('SessionId')

    if not token:
        return generate_policy(None, None, 'Deny', event.get('methodArn', '*'))

    # Verify the Access token against Cognito
    user_id = verify_token(token)
    if user_id:
        return generate_policy(user_id, session_id, 'Allow', event.get('methodArn', '*'))
    else:
        return generate_policy(None, None, 'Deny', event.get('methodArn', '*'))


def verify_token(token):
    """
    Verify the token by checking it against Cognito.
    """
    try:
        response = cognito.get_user(AccessToken=token)
        return response['Username']
    except cognito.exceptions.NotAuthorizedException as e:
        print(f"Error verifying token: {str(e)}")
        return None


def generate_policy(principal_id, session_id, effect, resource):
    """
    Generate an IAM policy for the authorizer response.
    This function formats the policy based on the API type (WebSocket or REST).
    """
    auth_response = {
        'principalId': principal_id or 'user',
        'context': {
            'userId': principal_id,
            'sessionId': session_id,
        },
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        }
    }
    return auth_response
