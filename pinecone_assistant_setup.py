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
        assistant = pc.assistant.create_assistant(
            assistant_name="pdf-assistant", 
            instructions="Use British English for spelling and grammar. You are a helpful AI tutor that creates study material from documents. Generate clear, comprehensive and concise summaries and mcq questions with detailed answers.", # Description or directive for the assistant to apply to all responses.
            region="us", # Region to deploy assistant. Options: "us" (default) or "eu".
            timeout=30 # Maximum seconds to wait for assistant status to become "Ready" before timing out.
        )
    except:
        assistant = pc.assistant.describe_assistant(assistant_name="pdf-assistant")
        logger.critical("Pinecone assistant already exists.")
    return assistant

assistant = create_pinecone_assistant()

# seems like deleting is necessary as it stores the prev files as well 
def delete_assistant():
    # this deletes the assistant
    pc.assistant.delete_assistant(
        assistant_name="pdf-assistant", 
    )
    logger.info("Assistant deleted successfully.")

def assistant_list():
    return pc.assistant.list_assistants()


# TODO: create my own pdf parser kinda thing and embedding??? + accept uploads from the web those kind or tbh i can just upload here
def upload_pdf(file_path):
    # it seems like the quota for upload is 10 
    delete_assistant() # what im thinking of is it will delete curr and recreate a new assistant each time they upload new pdf 
    assistant = create_pinecone_assistant()
    logger.info("after the assistant stage")
    try:
        logger.info("Uploading file to Pinecone assistant...")
        response = assistant.upload_file(
            file_path=file_path,    
            timeout=None)
        logger.info("File uploaded successfully.")
        return response
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return None

def generate_notes():
    NOTES_PROMPT = """
        You are a helpful AI tutor. Your task is to generate clear, comprehensive, and well-structured study notes from the uploaded document to ace the course. 
        Please follow these instructions:

        1. Coverage: Ensure that every page and section of the document is addressed. 
        - Do not skip content, even if it seems repetitive.
        - Reorganise fragmented points into a logical flow.

        2. Structure:
        - Main Topics and Subtopics (use headings and bullet points)
        - Key Concepts and Definitions (explain in simple terms)
        - Important Facts, Figures, and Examples (highlight data, formulas, or cases)
        - Explanations of Diagrams or Tables (describe them in words if present)
        - End with a Concise Summary (3 to 5 bullet points of the overall chapter/module)

        3. Style:
        - Use British English for spelling and grammar.
        - Write in clear, student-friendly language suitable for exam revision.
        - Use bullet points, numbered lists, and bold/italic text for emphasis.

        4. Depth:
        - Where possible, expand with short explanations, context, or examples.
        - Add in thinking points whenever possible.
        - Avoid copying sentences verbatim; rephrase into easy-to-digest notes.

        5. Study Techniques
        - Active Recall: For each major topic, generate 2 to 3 practice questions (mix of short-answer and multiple choice) with answers provided separately.
        - Elaboration: Add short “Why does this matter?” or “How does this connect to other concepts?” notes where relevant.
        - Chunking: Group related ideas into numbered or bulleted clusters to reduce cognitive load.
        - Dual Coding: Where appropriate, describe how content could be visualised (e.g., a timeline, diagram, table).
        - Prioritisation: Mark the *must-know* concepts with a ⭐ symbol so the student knows what to memorise first.

        Output the notes in a structured format, ready to be used as a study guide.


        Ensure that every page of the document is being covered and make the notes clear and comprehensive with a concise summary at the end.
    """
    logger.info("Generating notes from the document...")
    notes_msg = Message(role="user", content=NOTES_PROMPT)
    notes_resp = assistant.chat(messages=[notes_msg])
    notes = notes_resp.message.content
    logger.info("Notes generated successfully.")

    return notes

def generate_mcq(difficulty):
    logger.info(f"Generating MCQs with difficulty level: {difficulty}")
    EASY = """
        Ensure that the questions are straightforward and test basic understanding of key concepts.
    """
    MEDIUM = """
        Ensure that the questions are moderately difficult and require application and analysis of the concepts.
    """
    HARD = """
        Ensure that the questions challenge the student's comprehension, critical thinking and problem-solving skills. The entire topic, subtopics, everything should be tested to the fine details, there is no limit as to how many questions there should be as long as everything is being tested. Do incorporate question that requires higher-order thinking skills.
    """
    difficulty_instructions = {
        "easy": EASY,
        "medium": MEDIUM,
        "hard": HARD
    }
    MCQ_PROMPT = f"""
        You are a helpful AI tutor that creates multiple choice questions from the notes and documents. 
        Create multiple choice questions with 4 options each, and provide the correct answer with a detailed explanation.
        Ensure that the questions cover all the main topics and subtopics from the notes.
        Make the questions clear and concise, and ensure that they test understanding of key concepts and important facts.

        The difficulty of the question should be {difficulty}
        Requirements for the difficulty level: {difficulty_instructions[difficulty]}

        Stricly format the questions in JSON 
        Format as below 
        {{
            "questions": [
                {{
                    "question": "your question here",
                    "options": ["option1", "option2", "option3", "option4"],
                    "answer": "correct answer",
                    "explanation": "explanation here"
                }}
            ]
        }}
        This is what the class looks like
        class Question(BaseModel):
            question: str
            options: List[str]
            answer: str
            explanation: str
        
        Do not copy the above example questions.
        Come up with your own questions that is relevant to the uploaded file's content.
    """
    logger.info("Generating MCQs from the document...")
    mcq_msg = Message(role="user", content=MCQ_PROMPT)
    mcq_resp = assistant.chat(messages=[mcq_msg])
    mcq = mcq_resp.message.content
    logger.info(mcq)
    logger.info("MCQs generated successfully.")

    return mcq


def test_workflow():
    upload_res = upload_pdf()
    if upload_res:
        logger.info("PDF uploaded successfully.")
    else:
        logger.error("PDF upload failed.")

    notes = generate_notes()

    if notes:
        logger.info(f"Notes generated successfully: {notes}")
    else:
        logger.error("Notes generation failed.")

    mcq = generate_mcq()

    if mcq:
        logger.info(f"MCQ generated successfully: {mcq}")
    else:
        logger.error("MCQ generation failed.")

    return None