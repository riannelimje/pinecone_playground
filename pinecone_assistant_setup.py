from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
from dotenv import load_dotenv
import logging
import os 

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

PINECONE_API = os.getenv("PINECONE_API")
pc = Pinecone(api_key=PINECONE_API)

def create_pinecone_assistant():
    try: 
        assistant = pc.assistant.describe_assistant(assistant_name="pdf-assistant")
    except:
        assistant = pc.assistant.create_assistant(
            assistant_name="pdf-assistant", 
            instructions="Use British English for spelling and grammar. You are a helpful AI tutor that creates study material from documents. Generate clear, comprehensive and concise summaries and mcq questions with detailed answers.", # Description or directive for the assistant to apply to all responses.
            region="us", # Region to deploy assistant. Options: "us" (default) or "eu".
            timeout=30 # Maximum seconds to wait for assistant status to become "Ready" before timing out.
    )

    return assistant

assistant = create_pinecone_assistant()

def upload_pdf():
    try:
        response = assistant.upload_file(
            file_path="/Users/riannelim/Desktop/mcra/week1/M19-2025-MCRA-W01-Attract-Awareness-Student-Deck.pdf",
            timeout=None)
        return response
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return None

def generate_notes():
    NOTES_PROMPT = """
        You are a helpful AI tutor that creates notes from the documents. 
        Structure the notes with 
        1. Main topics and subtopics
        2. Key concepts and definitions
        3. Important facts and figures
        4. Summary of main points

        Ensure that every page of the document is being covered and make the notes clear and comprehensive with a concise summary at the end.
    """
    notes_msg = Message(role="user", content=NOTES_PROMPT)
    notes_resp = assistant.chat(messages=[notes_msg])

    return notes_resp.message.content

def generate_mcq():
    MCQ_PROMPT = """
        You are a helpful AI tutor that creates multiple choice questions from the notes and documents. 
        Create multiple choice questions with 4 options each, and provide the correct answer with a detailed explanation.
        Ensure that the questions cover all the main topics and subtopics from the notes.
        Make the questions clear and concise, and ensure that they test understanding of key concepts and important facts.

        Format the questions in JSON 
        Here is an example: 
        {
            "questions": [
                {
                    "question": "What is the capital of France?",
                    "options": [
                        "Berlin",
                        "Madrid",
                        "Paris",
                        "Rome"
                    ],
                    "answer": "Paris",
                    "explanation": "Paris is the capital and most populous city of France."
                },
                {
                    "question": "What is the largest planet in our solar system?",
                    "options": [
                        "Earth",
                        "Jupiter",
                        "Mars",
                        "Saturn"
                    ],
                    "answer": "Jupiter",
                    "explanation": "Jupiter is the largest planet in our solar system."
                }
            ]
        }
    """
    mcq_msg = Message(role="user", content=MCQ_PROMPT)
    mcq_resp = assistant.chat(messages=[mcq_msg])

    return mcq_resp.message.content

def delete_assistant():
    # this deletes the assistant
    pc.assistant.delete_assistant(
        assistant_name="pdf-assistant", 
    )

def test_workflow():
    upload_res = upload_pdf()
    if upload_res:
        logger.info("PDF uploaded successfully.")
    else:
        logger.error("PDF upload failed.")

    notes = generate_notes()

    if notes:
        logger.info(f"Notes generated successfully: {notes}")
        return notes
    else:
        logger.error("Notes generation failed.")

    mcq = generate_mcq()

    if mcq:
        logger.info(f"MCQ generated successfully: {mcq}")
        return mcq
    else:
        logger.error("MCQ generation failed.")

    return None

if __name__ == "__main__":
    test_workflow()