import json 
from pydantic import BaseModel
from typing import List

class Question(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str

class MCQResponse(BaseModel):
    questions: List[Question]

# TODO: check whether anything else needs formatting
def format_response(response):
    # to remove all the ''' json
    formatted_response = response.replace("```", "").replace("json", "").strip()
    formatted_response_json = json.loads(formatted_response) #json dump - change to str, loads - change to dict
    return MCQResponse(**formatted_response_json) 