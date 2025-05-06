"""
This script contains the logic of the Lambda Function
"""

import os
import boto3
from datetime import datetime
from connections import Connections
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()

def view_submission_associates(submission_table, name, start_date, end_date=None, category=None):
    """
    Query DynamoDB to retrieve submissions by a specific name within a single day or a date range, optionally filtered by category.

    Inputs:
        submission_table: str, DDB table name of the submission_from_associates
        name: str, author's name
        start_date: str, start date in "YYYY-MM-DD" format. Represents a single day if end_date is None.
        end_date: str, optional, end date in "YYYY-MM-DD" format. If provided, query covers the range from start_date to end_date inclusive.
        category: str, optional, category to filter the submissions. If provided, only submissions of this category are returned.
    """
    # Import a DynamoDB service resource handle.
    dynamodb = boto3.resource('dynamodb')

    # Select the table.
    table = dynamodb.Table(submission_table)

    # If end_date is not provided, set it to start_date to query for a single day.
    if not end_date:
        end_date = start_date

    # Define start and end timestamps to cover the entire period from the start of start_date to the end of end_date.
    start_ts = f"{start_date}T00:00:00.000000"
    end_ts = f"{end_date}T23:59:59.999999"

    # Initialize the query parameters.
    query_params = {
        'KeyConditionExpression': boto3.dynamodb.conditions.Key('name').eq(name) &
                                 boto3.dynamodb.conditions.Key('submission_ts').between(start_ts, end_ts)
    }

    # If category is provided, add a filter expression to the query.
    if category:
        filter_expression = boto3.dynamodb.conditions.Attr('category').eq(category)
        query_params['FilterExpression'] = filter_expression

    logger.debug(f"DDB query_params: {query_params}")
    try:
        # Query the table with the specified parameters.
        response = table.query(**query_params)

        # Extract and format items from the response.
        items = [{
            'text': item['text'],
            'customer': item['customer'],
            'submission_ts': item['submission_ts'],  # Keep the original format, or convert as needed
            'category': item.get('category', 'N/A')  # Include category in the response
        } for item in response.get('Items', [])]

        return {'status': 'success', 'data': items}

    except ClientError as e:
        return {'status': 'error', 'message': str(e)}


def view_submission_managers(submission_table, gsi, start_date, end_date=None, category=None, name=None, customer=None):
    """
    Query or Scan DynamoDB using GSI to retrieve submissions within a single day or a date range.
    When 'category' is provided, it's used as the partition key in the GSI for querying. If 'category' is not provided, a scan operation is performed across all categories.

    Inputs:
        submission_table: str, DDB table name of the submission_from_associates or the final submission_from_managers
        gsi: str, the Global Secondary Index of the 'submission_table'.
        start_date: str, start date in "YYYY-MM-DD" format. Represents a single day if end_date is None.
        end_date: str, optional, end date in "YYYY-MM-DD" format. If provided, query or scan covers the range from start_date to end_date inclusive.
        category: str, optional, category to filter the submissions. If provided, only submissions of this category are returned.
    """
    # Import a DynamoDB service resource handle.
    dynamodb = boto3.resource('dynamodb')

    # Select the table.
    table = dynamodb.Table(submission_table)

    # Define start and end timestamps to cover the entire period from the start of start_date to the end of end_date.
    start_ts = f"{start_date}T00:00:00.000000"
    end_ts = f"{end_date}T23:59:59.999999"

    # Use category as partition key in the key condition expression if provided.
    if category:
        key_condition_expression = boto3.dynamodb.conditions.Key("category").eq(
            category) & boto3.dynamodb.conditions.Key("submission_ts").between(start_ts, end_ts)
        query_params = {
            "IndexName": gsi,
            "KeyConditionExpression": key_condition_expression,
        }

        filter_expression = None
        if name:
            filter_expression = boto3.dynamodb.conditions.Attr('name').contains(name)
        if customer:
            if filter_expression:
                filter_expression = boto3.dynamodb.conditions.And(filter_expression, boto3.dynamodb.conditions.Attr('customer').contains(customer))
            else:
                filter_expression = boto3.dynamodb.conditions.Attr('customer').contains(customer)
        
        if filter_expression:
            query_params['FilterExpression'] = filter_expression
        operation = table.query

    else:
        # Initialize a list to hold filter expressions, including date range, for scan params.
        filter_expressions = [boto3.dynamodb.conditions.Attr('submission_ts').between(start_ts, end_ts)]

        # If customer is provided, add a filter expression for customer to the list.
        if customer:
            filter_expressions.append(boto3.dynamodb.conditions.Attr('customer').contains(customer))

        # If name is provided, add a filter expression for name to the list.
        if name:
            filter_expressions.append(boto3.dynamodb.conditions.Attr('name').contains(name))

        # Combine filter expressions if any are provided.
        if filter_expressions:
            combined_filter_expression = boto3.dynamodb.conditions.And(*filter_expressions)

        # If no category is provided, prepare to scan all categories with filter expressions.
        scan_params = {
            'IndexName': gsi,
            'FilterExpression': combined_filter_expression
        }
        operation = table.scan

    try:
        # Perform the query or scan operation with the specified parameters.
        response = operation(**(query_params if category else scan_params))

        # Extract and format items from the response.
        items = [{
            'text': item['text'],
            'customer': item['customer'],
            'submission_ts': item['submission_ts'],  # Keep the original format, or convert as needed
            'name': item['name'],                    # Include name in the response
            'category': item.get('category', 'N/A')  # Include category in the response
        } for item in response.get('Items', [])]

        return {'status': 'success', 'data': items}

    except ClientError as e:
        return {'status': 'error', 'message': str(e)}
