import os
import langchain
import boto3
from botocore.config import Config
from langchain_aws.chat_models import ChatBedrock
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

print(f"LangChain version: {langchain.__version__}")
print(f"boto3 version: {boto3.__version__}")


class Connections:
    """
    Manage connections to AWS Resources
    """
    namespace = "Writing-GenAI"
    boto3_config = Config(
        retries=dict(
            max_attempts=10,
            mode='adaptive',
            total_max_attempts=10
        )
    )
    bedrock_runtime_client = boto3.client("bedrock-runtime", region_name=os.environ["AWS_REGION"], config=boto3_config)
    bedrock_client = boto3.client("bedrock", region_name=os.environ["AWS_REGION"])

    def __init__(self, max_tokens=8192, cache=False, streaming=False, model_id="Claude37Sonnet"):
        """
        Connections constructor.

        Args:
            max_tokens (int): contains the events from frontend.
            cache (bool): flag to turn on the cache of not.
            streaming (bool): flag to stream the model response or not.
            model_id (str): the llm model id to use.

        Returns:
            http response json object.
        """
        super().__init__()

        self.cache = cache
        self.streaming = streaming
        self.model_name = model_id
        self.model_config = {
            "Titan":{
                "provider": "amazon",
                "config": {
                    "maxTokenCount": max_tokens,
                    "temperature": 0,
                    "topP": 1,
                }
            },
            "Claude37Sonnet": {
                "provider": "anthropic",
                "model_id": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
                "config":{
                    "max_tokens": max_tokens,
                    "temperature": 0,
                    "top_p": 1,
                    "top_k": 50,
                    "stop_sequences": ["\n\nHuman"],
                }
            },
            "Claude4Sonnet": {
                "provider": "anthropic",
                "model_id": "us.anthropic.claude-sonnet-4-20250514-v1:0",
                "config": {
                    "max_tokens": max_tokens,
                    "temperature": 0,
                    "top_p": 1,
                    "top_k": 50,
                    "stop_sequences": ["\n\nHuman"],
                }
            },
            "Claude4Opus": {
                "provider": "anthropic",
                "model_id": "us.anthropic.claude-opus-4-20250514-v1:0",
                "config": {
                    "max_tokens": max_tokens,
                    "temperature": 0,
                    "top_p": 1,
                    "top_k": 50,
                    "stop_sequences": ["\n\nHuman"],
                }
            }
        }

    def get_bedrock_llm(self):
        """
        Create and return the bedrock instance with the llm model to use.

        Args: None.

        Returns:
            Bedrock instance with the llm model to use.
        """
        model_config = self.model_config[self.model_name]
        return ChatBedrock(
            provider=model_config["provider"],
            model=model_config["model_id"],
            callbacks=[StreamingStdOutCallbackHandler()],
            streaming=self.streaming,
            client=Connections.bedrock_runtime_client,
            model_kwargs=model_config["config"],
        )

