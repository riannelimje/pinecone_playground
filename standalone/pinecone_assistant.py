from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
from dotenv import load_dotenv
import os 

load_dotenv()

PINECONE_API = os.getenv("PINECONE_API")
pc = Pinecone(api_key=PINECONE_API)

# seems like i only need to set this once 
# assistant = pc.assistant.create_assistant(
#     assistant_name="example-assistant", 
#     instructions="Use British English for spelling and grammar.", # Description or directive for the assistant to apply to all responses.
#     region="us", # Region to deploy assistant. Options: "us" (default) or "eu".
#     timeout=30 # Maximum seconds to wait for assistant status to become "Ready" before timing out.
# )
assistant = pc.assistant.Assistant(assistant_name="example-assistant")

# # Upload a file.
response = assistant.upload_file(
    file_path="change file path accordingly",
    timeout=None
)

msg = Message(role="user", content="What is the content of the pdf about?")
resp = assistant.chat(messages=[msg])

print(resp.message.content)

# this deletes the assistant
pc.assistant.delete_assistant(
    assistant_name="example-assistant", 
)