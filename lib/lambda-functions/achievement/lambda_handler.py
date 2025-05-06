"""
This is achievement lambda handler.
"""
import os
from aws_lambda_powertools import Logger, Tracer, Metrics

import lambda_event
from util import lambda_util
from llm.response import get_answer
import prompts

SERVICE = "writing-achievements"

logger = Logger(service=SERVICE, namespace=lambda_util.NAMESPACE)
logger.setLevel(os.environ["LOG_LEVEL"])
tracer = Tracer(service=SERVICE)
metrics = Metrics(service=SERVICE, namespace=lambda_util.NAMESPACE)

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event, context):
    """
    Achievement lambda handler.

    Args:
        event (dict): contains the events from frontend.
        context: the lambda context.

    Returns:
        http response json object
    """
    extracted_event = lambda_event.extract_lambda_event(event)
    return lambda_util.handle_event(get_answer, extracted_event, prompts, metrics, logger)
