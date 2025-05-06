import os
from typing import Any, Dict, List, Union

from langchain_core.callbacks import BaseCallbackHandler

from util import date_util
from util.dynamodb_util import DynamoDBChatMessageHistory
from util.websocket_util import push_to_websocket
from llm.chains import get_answer_chain, get_output_chain

class ResponseCallbackHandler(BaseCallbackHandler):

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """
        called when the llm request starts.
        """
        formatted_prompts = "\n".join(prompts)
        print(f"llm started - prompt template substituted with values:\n{formatted_prompts}")

    def on_llm_end(self, response: Union[str, Dict[str, Any]], **kwargs: Any) -> None:
        """
        called when the llm request ends.
        """
        if isinstance(response, dict):
            print(f"llm ended - response: {response['result']}")
        else:
            print(f"llm ended - response: {str(response)}")

    def on_llm_error(self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any) -> None:
        """
        called when the llm request encounters an error.
        """
        print(f"llm error occurred: {error}")


def get_answer(extracted_event, prompts, logger) -> str:
    """
    Get the stream answer from action, submission, question chain, and use websocket to send the streamed responses
    to frontend.

    Args:
        extracted_event: extracted lambda event.
        prompts: instruction of the input to llm.
        logger: logger object.

    Returns:
        The streamed responses from llm.
    """
    memory = DynamoDBChatMessageHistory(
        table_name=os.environ["CONVERSATION_MEMORY_TABLE_NAME"],
        session_id=extracted_event.session_id,
        primary_key_name="session_id",
    )
    answer_chain = get_answer_chain(memory)
    output = ""
    route = ""
    for response in answer_chain.stream(
        {
            "prompt": extracted_event.query,
            "guidelines": prompts.guidelines,
            "date": date_util.get_current_month_year()
        },
        config={
            "configurable": {"session_id": extracted_event.session_id},
            "callbacks": [ResponseCallbackHandler()]
        }
    ):
        logger.info(f"response: {response}")
        text = response.get("answer", "")
        output += text
        route += response.get("route", "")

        push_to_websocket(extracted_event.websocket, text)
    push_to_websocket(extracted_event.websocket, "<END>")

    logger.info(f"route: {route}")
    if ("<1>" in route) or ("<2>" in route):
        memory.add_user_message(extracted_event.query)
        memory.add_ai_message(output)

    logger.info(f"output: {output}")

    return output


def get_output(extracted_event, prompt, logger) -> str:
    """
    Get the stream or invoke answer from output chain, and use websocket to send the streamed responses or the invoked
    response to frontend.

    Args:
        extracted_event: extracted lambda event.
        prompts: instruction of the input to llm.
        logger: logger object.

    Returns:
        The streamed responses from llm.
    """
    output_chain = get_output_chain(extracted_event.session_id, False)
    if extracted_event.websocket:
        output = ""
        for response in output_chain.stream(
            {"question": prompt},
            config={
                "configurable": {"session_id": extracted_event.session_id},
                "callbacks": [ResponseCallbackHandler()]
            }
        ):
            response = str(response)
            logger.info(f"response: {response}")
            output += response
            push_to_websocket(extracted_event.websocket, response)
        push_to_websocket(extracted_event.websocket, "<END>")

        logger.info(f"output: {output}")
        return output
    else:
        output = output_chain.invoke(
            {"question": prompt},
            config={
                "configurable": {"session_id": extracted_event.session_id},
                "callbacks": [ResponseCallbackHandler()]
            }
        )

        logger.info(f"output: {output}")
        return output
