import os
import uvicorn
import shutil
import sqlite3 # database operations
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pinecone_assistant_setup import generate_notes, upload_pdf, generate_mcq, create_pinecone_assistant, delete_assistant, assistant_list
from utils.parser_json import format_response
from pathlib import Path
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext # password hashing
from jose import JWTError, jwt # create and validate JWTs
from datetime import datetime, timedelta # token expiration
from typing import Optional # optional type hinting that can be None
from dotenv import load_dotenv

load_dotenv()

# AUTH CONFIG 
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# password hashing 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # so this creates a password hasher using bycript algo 

# JWT security 
security = HTTPBearer()

# Pydantic model for auth 
class UserCreate(BaseModel):
    email: EmailStr # validate email format
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    id: int
    email: str
    name: str

class MCQRequest(BaseModel):
    difficulty_level: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# setup db
def init_db():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            name TEXT NOT NULL, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit() # save changes to db
    conn.close()

init_db() # initialise db on startup

# TODO: check where this is used again and delete if not needed 
# global var to track upload status - tbh this can delete
pdf_uploaded = False

# create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# auth utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, hashed_password, name FROM users WHERE email = ?', (email,))
    row = cursor.fetchone() # this gets the first mathching row
    conn.close()
    if row:
        return {"id": row[0], "email": row[1], "hashed_password": row[2], "name": row[3]}
    return None

def create_user(user: UserCreate):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    hashed_password = get_password_hash(user.password)
    try:
        cursor.execute('INSERT INTO users (email, hashed_password, name) VALUES (?, ?, ?)', 
                       (user.email, hashed_password, user.name))
        conn.commit()
        user_id = cursor.lastrowid
        return {"id": user_id, "email": user.email, "name": user.name}
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # decode JWT token using secret key
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user


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
    notes = generate_notes()
    return {"notes": notes}

@app.post("/generate_mcq")
def generate_mcq_endpoint(request: MCQRequest) -> dict:
    try:
        # Check what generate_mcq actually returns
        raw_mcq = generate_mcq(request.difficulty_level)
        print(f"Raw MCQ response: {repr(raw_mcq)}")
        
        if not raw_mcq:
            raise HTTPException(status_code=500, detail="generate_mcq returned empty response")
        
        mcq = format_response(raw_mcq)
        print(mcq)
        return {"mcq": mcq}
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Response formatting error: {(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")
    

# helper endpoints
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


# auth endpoints 
@app.post("/auth/register", response_model=Token, tags=["auth"])
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = create_user(user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User creation failed"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token, tags=["auth"])
async def login(user_credentials: UserLogin):
    user = get_user_by_email(user_credentials.email)
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=User, tags=["auth"])
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"]
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)