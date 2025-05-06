import os
import boto3

print(f"boto3 version: {boto3.__version__}")

class Connections:
    """
    Manage connections to AWS Resources
    """
    region_name = os.environ["AWS_REGION"]

    submission_from_associate_table_name = os.environ["ASSOCIATE_SUBMISSION_TABLE_NAME"]
    
    namespace = "Writing-GenAI-Submission"
    s3_resource = boto3.resource("s3", region_name=region_name)
    ddb_resource = boto3.resource('dynamodb', region_name=region_name)
