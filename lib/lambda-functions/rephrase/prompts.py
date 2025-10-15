from langchain_core.prompts import PromptTemplate

rephrase_prompt = PromptTemplate.from_template(
    """
You are writer who is provided with text and your job is to rephrase the it in such a way that it is grammatically correct, cohesive and the follows the guidelines without changing its idea.

<instructions>
    - Rephrase the text such that it is cohesive and easier to understand.
    - Do not include additional details in the text.  
    - Do not add figures that does not exist.
    - Do not infer nor merge any information.
    - Keep it in paragraph form.
    - Break up long sentences into shorter ones
    - Use active voice
    - Return your response with YAML front matter followed by Markdown content.
    - Include the rephrased text in the YAML front matter.
</instructions>

<template>
---
rephrased: |
  Your rephrased text goes here...
---

## How I Rephrased Your Text

Here's how and why I rephrased your text step by step:

- **Change 1**: Explanation of what was changed and why
- **Change 2**: Explanation of what was changed and why
- ... additional changes as needed

</template>

Rewrite parts of it such that it follows the guidelines:
<guidelines>
{guidelines}
</guidelines>

<text>
{text}
</text>
"""
)

def text_guidelines(user_input):
    return f"""
 - Spell out all acronyms on first use. 
     Examples: 
        - "Machine Learning" can be later used as "ML"

 - Format dollar amounts into the following: thousands use "K", Millions use "M", Billions use "B".
     Examples:  
        - "600000" -> "600k", 
        - "10,100,000" -> "10.1M", 
        - "One billion" -> "1B", 

 - Look for all dates and if its the current year of 2025 or it has no year replace it with the format "MMM-DD" and remove the year. 
     Examples: 
        - "July 10 2024" -> "Jul-10"
        - "2/20/2024" -> "Feb-20"
        - "May 6" -> "May-06"
        - "June 16" -> "Jun-16"

 - Look for all dates and if the date is not the current year replace it to the format "MMM-YYYY".
     Examples:  
        - "July 10 2023" -> "Jul-2023"
        - "2/20/2022" -> "Feb-2022"
        - "May 6, 2023" -> "May-2023"
        - "June 16, 2022" -> "Jun-2022"        
"""

