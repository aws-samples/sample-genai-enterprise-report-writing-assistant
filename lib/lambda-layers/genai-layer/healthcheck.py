"""
This script is to check if the container is healthy.
"""  

import logging
from botocore.exceptions import ClientError


logger = logging.getLogger(__name__)


def list_foundation_models(bedrock):
    """
    List the available Amazon Bedrock foundation models.

    :return: The list of available bedrock foundation models.
    """
    
    try:
        response = bedrock.list_foundation_models()
        models = response["modelSummaries"]
        logger.info("Got %s foundation models.", len(models))
    except ClientError:
        logger.error("Couldn't list foundation models.")
        raise
    else:
        return models

if __name__ == "__main__":
    import os
    if 'LAMBDA_TASK_ROOT' in os.environ:
        # if this script is run in Lambda Environment
        from code.lambdas.layer.llm.connections import Connections
        bedrock_client = Connections.bedrock_client
        list_foundation_models(bedrock_client)
    else:
        # if this script is run locally
        import pandas as pd
        df_env = pd.read_csv('env.csv')
        key_list = df_env.Key.tolist()
        val_list = df_env.Value.tolist()

        for key, val in zip(key_list, val_list):
            os.environ[key]=val
        os.environ['AWS_PROFILE'] = 'genai'
      
        from code.lambdas.layer.llm.connections import Connections
        bedrock_client = Connections.bedrock_client
        list_foundation_models(bedrock_client)
