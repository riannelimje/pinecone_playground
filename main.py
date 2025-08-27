import uvicorn
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pinecone_assistant_setup import generate_notes, upload_pdf, generate_mcq, create_pinecone_assistant, delete_assistant, assistant_list
from parser import format_response
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# global var to track upload status
pdf_uploaded = False

# create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def read_root():
    return {"status": "running", 
            "pdf_uploaded": pdf_uploaded}
    
@app.post("/upload_pdf")
async def upload_pdf_endpoint(file: UploadFile = File(...)):
    global pdf_uploaded
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Generate file path
        file_path = UPLOAD_DIR / file.filename
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Call upload_pdf function with the file path
        response = upload_pdf(file_path=str(file_path))
        
        if response:
            pdf_uploaded = True
            return {"message": "PDF uploaded successfully.", "file_path": str(file_path)}
        else:
            # Clean up file if upload_pdf failed
            if file_path.exists():
                file_path.unlink()
            return {"message": "PDF upload failed.", "error": "upload_pdf function returned False"}
            
    except Exception as e:
        # Clean up file if something went wrong
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    finally:
        # Close the file
        file.file.close()

@app.get("/generate_notes")
def generate_notes_endpoint() -> dict:
    global pdf_uploaded
    if not pdf_uploaded:
        return {"message": "PDF not uploaded yet."}
    notes = generate_notes()
    return {"notes": notes}

@app.get("/generate_mcq")
def generate_mcq_endpoint() -> dict:
    global pdf_uploaded
    if not pdf_uploaded:
        return {"message": "PDF not uploaded yet."}
    mcq = format_response(generate_mcq())
    return {"mcq": mcq}

@app.get("/create_pinecone_assistant", tags=["helper"])
def create_pinecone_assistant_endpoint():
    assistant = create_pinecone_assistant()
    return {"message": "Pinecone assistant created successfully."}

@app.get("/delete_pinecone_assistant", tags=["helper"])
def delete_pinecone_assistant_endpoint():
    delete_assistant()
    return {"message": "Pinecone assistant deleted successfully."}

@app.get("/assistant_list", tags=["helper"])
def assistant_list_endpoint():
    assistants = assistant_list()
     # If assistants is a complex object, convert it to a list of dicts:
    return {"assistants": [a.to_dict() for a in assistants]}  # or manually extract fields

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)