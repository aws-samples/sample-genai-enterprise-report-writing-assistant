from langchain_core.prompts import PromptTemplate

combine_submission_prompt = PromptTemplate.from_template(
    """
    Enterprise Report is a monthly reporting tool for the business regarding updates on their projects with their internal customer. 
    The customer is an internal entity within the business.

    You are provided with the following Enterprise Report submissions, your job is to summarize them into a single paragraph. 
    You must strictly only use the information found in the submission, do not assume or make anything up.
    Only write the summary and nothing else, do not write a preamble.

    {paragraphs}
    """
)