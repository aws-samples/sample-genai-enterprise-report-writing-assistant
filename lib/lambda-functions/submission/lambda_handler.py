from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
import time
import json
from connections import Connections
from index import insert_submission

service = "writing-App"

logger = Logger(service=service, namespace=Connections.namespace)
tracer = Tracer(service=service)
metrics = Metrics(service=service, namespace=Connections.namespace)


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event, context):
    """
    Lambda handler to submit text
    """

    payload = json.loads(event["body"])
    name = payload["name"]
    text = payload["text"]
    role = payload["role"]
    category = payload["category"]
    customer = payload["customer"]
    
    # Start timer
    start_time = time.time()

    # Update DynamoDB table
    output = insert_submission(name, text, role, category, customer)

    # End timer
    end_time = time.time()
    # Calculate response time in seconds
    response_time = end_time - start_time

    # Add metrics
    metrics.add_metric(
        name="SubmitResponseTime", unit=MetricUnit.Seconds, value=response_time
    )
    
    if output['status'] == 'success':
        statusCode = 200
    else:
        statusCode = 500
    return {
        "statusCode": statusCode,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(output),
        "isBase64Encoded": False
    }
