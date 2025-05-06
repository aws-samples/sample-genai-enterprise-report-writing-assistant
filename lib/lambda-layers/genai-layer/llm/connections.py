import os
import langchain
import boto3
from langchain_community.chat_models import BedrockChat
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

print(f"LangChain version: {langchain.__version__}")
print(f"boto3 version: {boto3.__version__}")

MODEL_ID_MAPPING = {
    "Titan": "amazon.titan-tg1-large",
    "Claude2": "anthropic.claude-v2",
    "ClaudeInstant": "anthropic.claude-instant-v1",
    "Claude3Haiku": "anthropic.claude-3-haiku-20240307-v1:0",
    "Claude3Sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
}


class Connections:
    """
    Manage connections to AWS Resources
    """
    namespace = "Writing-GenAI"
    bedrock_runtime_client = boto3.client("bedrock-runtime", region_name=os.environ["AWS_REGION"])
    bedrock_client = boto3.client("bedrock", region_name=os.environ["AWS_REGION"])

    def __init__(self, max_tokens=512, cache=False, streaming=False, model_id="Claude3Sonnet"):
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
        self.model_id = model_id
        self.model_kwargs_mapping = {
            "Titan": {
                "maxTokenCount": max_tokens,
                "temperature": 0,
                "topP": 1,
            },
            "Claude2": {
                "max_tokens": max_tokens,
                "temperature": 0,
                "top_p": 1,
                "top_k": 50,
                "stop_sequences": ["\n\nHuman"],
            },
            "ClaudeInstant": {
                "max_tokens": max_tokens,
                "temperature": 0,
                "top_p": 1,
                "top_k": 50,
                "stop_sequences": ["\n\nHuman"],
            },
            "Claude3Sonnet": {
                "max_tokens": max_tokens,
                "temperature": 0,
                "top_p": 1,
                "top_k": 50,
                "stop_sequences": ["\n\nHuman"],
            },
            "Claude3Haiku": {
                "max_tokens": max_tokens,
                "temperature": 0,
                "top_p": 1,
                "top_k": 50,
                "stop_sequences": ["\n\nHuman"],
            },
        }

    def get_bedrock_llm(self):
        """
        Create and return the bedrock instance with the llm model to use.

        Args: None.

        Returns:
            Bedrock instance with the llm model to use.
        """
        return BedrockChat(
            model_id=MODEL_ID_MAPPING[self.model_id],
            model_kwargs=self.model_kwargs_mapping[self.model_id],
            client=Connections.bedrock_runtime_client,
            cache=self.cache,
            streaming=self.streaming,
            callbacks=[StreamingStdOutCallbackHandler()],
        )
