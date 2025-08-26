import json 
# TODO: check whether anything else needs formatting
def format_response(response):
    # to remove all the ''' json
    response = response.replace("```", "").replace("json", "").strip()
    return json.loads(response) #json dump - change to str, loads - change to dict