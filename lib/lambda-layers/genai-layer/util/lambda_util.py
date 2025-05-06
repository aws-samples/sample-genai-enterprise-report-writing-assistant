import json
import time
from aws_lambda_powertools.metrics import MetricUnit
from util.websocket_util import push_to_websocket

NAMESPACE = "Writing-GenAI"

def handle_event(get_response, extracted_event, prompts, metrics, logger):
    """
    Handle the achievement and challenge lambda event.

    Args:
        get_response: the function to get the lambda response, e.g. for answer or output, etc.
        extracted_event: the lambda extracted event object
        prompts: the prompt module
        metrics: lambda metrics
        logger: logger object

    Returns:
        A dictionary representing the response object.
    """
    try:
        start_time = time.time()
        response = get_response(extracted_event, prompts, logger)
        end_time = time.time()

        response_time = end_time - start_time
        metrics.add_metric(
            name="LLMResponseTime", unit=MetricUnit.Seconds, value=response_time
        )
        return http_response(200, json.dumps(response))
    except Exception as ex:
        logger.exception(f"Exception in lambda handle event: {ex}")
        if extracted_event.websocket:
            push_to_websocket(extracted_event.websocket, f"<ERROR>{ex}")
        return http_response(500, "Exception occurred in handling lambda event.")

def http_response(status_code: int, body: str):
    """
    Builds a standardized response object with the provided output data.

    Args:
        status_code: the http code to return
        body: the data to be included in the body of the response

    Returns:
        A dictionary representing the response object.
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Origin": "*"
        },
        "body": body,
        "isBase64Encoded": False
    }
