import os
from operator import itemgetter

from langchain.prompts import PromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate
from langchain.schema import StrOutputParser, SystemMessage, HumanMessage
from langchain.schema.runnable import RunnableLambda, RunnablePassthrough
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory

from llm.reusable_prompts import initial_prompt
from util import date_util, bool_util
from llm.connections import Connections
from util.dynamodb_util import DynamoDBChatMessageHistory


def get_answer_chain(memory):
    from prompts import action_identification_template, input_prompt, questions_human_template, question_system_template

    action_llm = Connections(
        max_tokens=10,
        cache=False,
        streaming=False,
        model_id="Claude37Sonnet"
    ).get_bedrock_llm()

    print(f"Creating action model: {str(action_llm)}")

    llm = Connections(
        max_tokens=int(os.environ["MAX_TOKENS"]),
        cache=bool_util.is_true(os.environ["MODEL_CACHE"]),
        streaming=bool_util.is_true(os.environ["STREAMING"]),
        model_id=os.environ["MODEL_ID"]
    ).get_bedrock_llm()

    print(f"Creating main model: {str(llm)}")

    print(f"action_identification_template: {type(action_identification_template)}")
    print(f"input_prompt: {type(input_prompt)}")
    print(f"questions_human_template: {type(questions_human_template)}")
    print(f"question_system_template: {type(question_system_template)}")

    # Identify type of action
    action_identification_chat_template = ChatPromptTemplate.from_messages(
        [HumanMessagePromptTemplate.from_template(template=action_identification_template)],
    )
    action_identification_chain = {
        "prompt": itemgetter("prompt")
    } | action_identification_chat_template | action_llm | StrOutputParser()

    # If prompt is a submission <1>
    submission_prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=(initial_prompt)),
            HumanMessagePromptTemplate.from_template(template=input_prompt),
        ]
    )
    submission_chain = {
        "submission": itemgetter("prompt"),
        "guidelines": itemgetter("guidelines"),
        "current_month_year": itemgetter("date"),
    } | submission_prompt | llm | StrOutputParser()

    # If prompt is a question <2>
    question_chat_template = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=(question_system_template)),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template(template=questions_human_template),
        ],
    )
    question_chain = {
        "chat_history": itemgetter("history"),
        "prompt": itemgetter("prompt"),
    } | question_chat_template | llm | StrOutputParser()
    question_chain_with_memory = RunnableWithMessageHistory(
        question_chain,
        lambda session_id: memory,
        input_messages_key="question",
        history_messages_key="history",
    )

    def routing(info):
        if "<1>" in info["route"]:
            return submission_chain

        if "<2>" in info["route"]:
            del info['guidelines']
            return question_chain_with_memory

        if "<3>" in info["route"]:
            del info['guidelines']
            return "Sorry, I can only answer writing related questions"

    full_chain = (
        {
            "route": action_identification_chain,
            "prompt": itemgetter("prompt"),
            "guidelines": itemgetter("guidelines"),
            "date": itemgetter("date"),
        } |
        RunnablePassthrough.assign(answer=RunnableLambda(routing))
    )

    return full_chain

def get_output_chain(session_id, memory):
    llm = Connections(
        int(os.environ["MAX_TOKENS"]),
        bool_util.is_true(os.environ["MODEL_CACHE"]),
        bool_util.is_true(os.environ["STREAMING"]),
        os.environ["MODEL_ID"]
    ).get_bedrock_llm()

    if not memory:
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", initial_prompt),
                ("human", "{question}"),
            ]
        )
        chain = prompt | llm | StrOutputParser()
        return chain
    else:
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", initial_prompt),
                MessagesPlaceholder(variable_name="history"),
                ("human", "{question}"),
            ]
        )
        chain = prompt | llm | StrOutputParser()
        chain_with_history = RunnableWithMessageHistory(
            chain,
            lambda message_history: DynamoDBChatMessageHistory(
                table_name=os.environ["CONVERSATION_MEMORY_TABLE_NAME"],
                session_id=session_id,
                primary_key_name="session_id",
            ),
            input_messages_key="question",
            history_messages_key="history",
        )
        return chain_with_history
