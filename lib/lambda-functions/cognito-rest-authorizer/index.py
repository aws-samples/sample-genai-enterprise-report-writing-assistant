import boto3
import json
import os
import requests
from jwt import decode, get_unverified_header
from jwt.algorithms import RSAAlgorithm

cognito_idp = boto3.client('cognito-idp')


def lambda_handler(event, _context):
    try:
        token = event['authorizationToken'].replace('Bearer ', '')
        
        # Verify and decode the token
        user_pool_id = os.environ['USER_POOL_ID']
        user_pool_client_id = os.environ['USER_POOL_CLIENT_ID']
        region = os.environ['AWS_REGION']

        keys_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        response = requests.get(keys_url, timeout=(5, 30))
        response.raise_for_status()
        keys = response.json()['keys']

        headers = get_unverified_header(token)
        key = next((k for k in keys if k['kid'] == headers['kid']), None)
        if not key:
            raise ValueError('Public key not found in jwks.json')
        
        public_key = RSAAlgorithm.from_jwk(json.dumps(key))

        claims = decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=user_pool_client_id,
            options={'verify_exp': True}
        )

        # Extract relevant information from claims
        user_id = claims['sub']
        email = claims.get('email', '')

        return {
            'principalId': user_id,
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': event['methodArn']
                }]
            },
            'context': {
                'userId': user_id,
                'email': email
            }
        }

    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        raise Exception('Unauthorized')
