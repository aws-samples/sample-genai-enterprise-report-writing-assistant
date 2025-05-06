from langchain_core.prompts import PromptTemplate

recommend_submissions_prompt = PromptTemplate.from_template(
    """
    <background>
    Enterprise Report is a monthly reporting tool for the business regarding updates on their projects with their internal customer. 
    The customer is an internal entity within the business.
    </background>

    <instructions>
    You are provided with the following Enterprise Report submissions, your job is to provide the top 3 submissions on how insightful and impactful (financially or otherwise) the Enterprise Report submission is.
        <criteria>
            <financial impact>
            Financial impact in the hundreds of thousands is low and anything in the tens of millions is high. 
            </financial impact>
            <operational impact>
            Impact on how much the solution benefited the customer. Making process improvements or reducing turn around time are examples. 
            </operational impact>
            <quantitativeness>
            Submission with one quantitative data point in terms of dimension of impact to customer is bad and having 3 or more is best.
            </quantitativeness>
        </criteria>
        <explanation>
        You must also explain why you chose the submission| relative to other submissions. Do not mention the deliverable and having multiple data points.
        </explanation>
    </instructions>

    <output_format>
    Your output must be in JSON format. You must have three keys, one for "submission_nos", one for "preamble", and another for "explanations". Ensure "submission_nos" is correct.
    Only include submissions that were included in the input.
    </output_format>

    <output_example>
    {{
        "submission_nos": [1,2,3],
        "preamble": "The following submissions...",
        "explanations": ["Submission 1...", "Submission 2...", "Submission 3..."]
    }},
    <output_example>

    <submission>
    {samples}
    </submission>
    """
)
