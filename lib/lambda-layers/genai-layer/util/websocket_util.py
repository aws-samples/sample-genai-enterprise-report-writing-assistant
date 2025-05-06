import os
import json
import boto3

WEBSOCKET_CALLBACK_URL = os.environ['WEBSOCKET_CALLBACK_URL']
websocket_client = boto3.client('apigatewaymanagementapi', endpoint_url=WEBSOCKET_CALLBACK_URL)

def push_to_websocket(websocket, text):
    """
    Real time to push the data directly to its client.

    Args:
        websocket: websocket id, message id, and user action
        text: text to push to client

    Returns:
        None
    """
    if websocket:
        payload = {
            "action": websocket["action"],
            "message_id": websocket["message_id"],
            "text": text
        }
        return websocket_client.post_to_connection(
            Data=json.dumps(payload),
            ConnectionId=websocket["websocket_id"]
        )
