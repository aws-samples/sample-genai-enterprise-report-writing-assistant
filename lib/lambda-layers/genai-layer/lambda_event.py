import json

class LambdaEvent:
    """
    The common lambda event class that contains session id, websocket id, message id, and action.
    """
    def __init__(self,  session_id, websocket_id, message_id, action, query):
        super().__init__()

        self.session_id = session_id
        if websocket_id is None and message_id is None and action is None:
            self.websocket = None
        else:
            self.websocket = {
                "websocket_id": websocket_id,
                "message_id": message_id,
                "action": action
            }
        self.query = query


def extract_lambda_event(event) -> LambdaEvent:
    """
    Extract info from event.

    Args:
        event: lambda event

    Returns:
        object of LambdaEvent
    """
    if "body" in event:
        payload = json.loads(event["body"])
        websocket_id = None
        message_id = None
        action = None
    else:
        payload = event
        websocket_id = payload["websocket_id"]
        message_id = payload.get('message_id', None)
        action = payload["action"]
    query = payload["query"]
    session_id = payload.get('session_id', None)
    return LambdaEvent(session_id, websocket_id, message_id, action, query)
