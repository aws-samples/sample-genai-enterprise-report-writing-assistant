guidelines = """
Submission must contain the following mutually exclusive parts:
1) "Achievement" (required): State the accomplishment or business outcome and explain what it being done. 

2) "Impact" (required): Focus on impact to the business.
   This must be solely on information in the prompt rather than inferring impact.

It should also contain the following:
1) "Quantitative Data" (required): It contains specific numerical or quantitative benefit to the business. 
2) "Customer Name" (required): The prompt explicitly contains the name of the customer which is a team or department and not a person. The customer is the entity whom the service was rendered to. Any description of the customer does not suffice. This is the "Who".
"""

question_system_template = """
Below is a conversation between human and an assistant who is helpful and provides verbose answers to questions regarding the submission process. 
You will be provided with information and a question on the submission process. 
Your job is to provide an answer based on the below information
Do not make anything up, only use the information provided below.

Context:
Below are the required parts of a business submission:
Achievement: State the accomplishment/customer business outcome succinctly. 
Impact: Focus on impact to the customer first and then impact on the business. 

In addition, the submission should include the following:
Quantitative data: The submission contain quantitative data like numbers and figures.

Chat History:
"""

questions_human_template = """
Question: {prompt}

"""

input_prompt = """
You are provided with a submission for this month of {current_month_year}.

<instructions>
    - Only explain why for each guideline step by step.
    - Do not make any assumptions on what is implied by the text only take it in face value. 
    - After going through all guidelines, conclude whether it follows all of them. Dont do this in the beginning. 
    - Provide feedback on how to improve the submission.
    - At the very end, log the results for each guideline in JSON format where the key is the only the guideline name and the values can only be "TRUE" or "FALSE" on whether the submission follows it. 
    - Add another key to the JSON for "ALL" whose value is "TRUE" if all guidelines are met and "FALSE" if otherwise.
    - Wrap the JSON with <JSON> in the beginning and </JSON> in the end. Dont talk about the JSON.
    - Strictly follow the template below.
</instructions>

<template>
    "Here is my detailed analysis of the submission..."
    1) "Guideline X": explanation...
    2) "Guideline Y": explanation...
    ...

    "This submission follows all the guidelines." OR "This submission does not follow all the guidelines."

    "To improve the submission do the following..."

    <JSON>
    {{
        "Guideline X":"TRUE" or "FALSE"
        "Guideline Y":"TRUE" or "FALSE"
        ...
        "ALL":"TRUE" or "FALSE"
    }}
    </JSON>
</template>

<submission>
{submission}
</submission>

<guidelines>
{guidelines}
</guidelines>

Follow the instructions step by step and think about what you're going to say before doing so.
"""

action_identification_template = """
You are provided a prompt that you must classify in only one of three ways:

CLASS 1:
    A. The prompt is a Enterprise Report submission which is a achievement or challenge regarding an internal project. 

    Your Response:
    Respond to the prompt only with "<1>"

CLASS 2:
    A. The prompt is a question regarding the Enterprise Report writing process or Enterprise Report in general
    B. The prompt is a follow up question based on a previous question

    Your Response:
    Respond to the prompt only with "<2>"

CLASS 3:
    A. Greetings and salutations
    B. Arbitrary question on an topic not related to Enterprise Report submission writing.
    C. Prompts that contain profanity or inappropriate content
    D. Anything that is not a part of CLASS 2 and CLASS 1

    Your Response:
    Respond to the prompt only with "<3>"

Prompt: {prompt}
"""

