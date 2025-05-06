from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
import time
import json
from connections import Connections
from index import view_submission_associates, view_submission_managers

service = "writing-App"

logger = Logger(service=service, namespace=Connections.namespace)
tracer = Tracer(service=service)
metrics = Metrics(service=service, namespace=Connections.namespace)


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event, context):
    """
    Lambda handler to submit text, from GET method of API Gateway call
    """
    logger.info(f"Incoming Event: {event}")
    resource_path = event['resource']
    logger.info(f"resource_path: {resource_path}")
    
    # Check if the request has a query string parameter and default to None if not present
    query_params = event.get('queryStringParameters', {})
    name = query_params.get("name")
    category = query_params.get("category")
    customer = query_params.get("customer")
    start_date = query_params.get("start_date")
    end_date = query_params.get("end_date") 
    
    # retrieve env vars
    submission_table = Connections.submission_from_associate_table_name
    submission_table_gsi = Connections.submission_from_associate_table_gsi
    
    logger.info(f"query_params: {query_params}")
    logger.info(f"name: {name}")
    logger.info(f"category: {category}")
    logger.info(f"customer: {customer}")
    logger.info(f"start_date: {start_date}")
    logger.info(f"end_date: {end_date}")
    logger.info(f"submission_table: {submission_table}")
    logger.info(f"submission_table_gsi: {submission_table_gsi}")
    
    # Start timer
    start_time = time.time()

    # Retrieve info from DDB table
    if resource_path == "/view_submission_associates":
        logger.info(f"Retrieving submissions for associates: {resource_path}")
        output = view_submission_associates(submission_table, name, start_date, end_date, category)
        
    elif resource_path == "/view_submission_managers":
        logger.info(f"Retrieving submissions for managers: {resource_path}")
        output = view_submission_managers(submission_table, submission_table_gsi, start_date, end_date, category, name, customer)

    # End timer
    end_time = time.time()
    # Calculate response time in seconds
    response_time = end_time - start_time

    # Add metrics
    metrics.add_metric(
        name="RetrieveResponseTime", unit=MetricUnit.Seconds, value=response_time
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
