input_prompt = """
Below is a Enterprise Report submission regarding a customer engagement. You job is to extract the customer name of the customer from the submission.
It is possible that the customer is an internal team. Only return the customer name in this format <CUSTOMER NAME>. Dont include any preamble, dont explain anything just return the customer name.
If you dont know who the customer is, return "<Enter customer name>"


Below are examples:
Submission:
HR and IT achieves 80% cost reduction for operations department retirement strategy recommendation initiative. HR and IT are developing and deploying AI/ML-based Financial Advisor for recommending retirement strategies. IT led delivery promoted three models to production for use by the operations department. This solution allowed retirement recommendation cost reduction by 80%, reduced data processing time by 85% (from 14 days to 2 days).
You:
<operations department>

Submission:
Marketing & IT achieves 65% efficiency gain for Sales Department campaign targeting system. Marketing and IT collaborated on an AI-powered Customer Segmentation Engine for optimizing marketing campaigns. IT successfully deployed two predictive models for the Sales Department's use. This solution increased campaign conversion rates by 65% and reduced campaign planning time by 70% (from 21 days to 6 days).
You:
<Sales>


Now its your turn to do it:
Submission:
{submission}

You:
"""
