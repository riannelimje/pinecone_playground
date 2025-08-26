import uvicorn
from fastapi import FastAPI
from pinecone_assistant_setup import generate_notes, upload_pdf, generate_mcq, assistant 
from parser import format_response

app = FastAPI()

pdf_uploaded = False

@app.get("/")
def read_root():
    return {"status": "running", 
            "pdf_uploaded": pdf_uploaded}

@app.post("/upload_pdf")
def upload_pdf_endpoint():
    global pdf_uploaded
    response = upload_pdf()
    if response:
        pdf_uploaded = True
        return {"message": "PDF uploaded successfully."}
    else:
        return {"message": "PDF upload failed."}

@app.get("/generate_notes")
def generate_notes_endpoint():
    global pdf_uploaded
    if not pdf_uploaded:
        return {"message": "PDF not uploaded yet."}
    notes = generate_notes()
    return {"notes": notes}

@app.get("/generate_mcq")
def generate_mcq_endpoint():
    global pdf_uploaded
    if not pdf_uploaded:
        return {"message": "PDF not uploaded yet."}
    mcq = format_response(generate_mcq())
    return {"mcq": mcq}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)