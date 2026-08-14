import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.crud import document as document_crud
from app.crud import patient as patient_crud
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.document import DocumentOut

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = settings.UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".txt"}


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist", "doctor")),
):
    if not patient_crud.get_patient(db, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400, detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit"
        )

    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as out_file:
        out_file.write(contents)

    return document_crud.create_document(
        db,
        patient_id=patient_id,
        uploaded_by=current_user.id,
        file_name=file.filename or stored_name,
        stored_name=stored_name,
        file_type=file.content_type,
    )


@router.get("", response_model=list[DocumentOut])
def list_documents(
    patient_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        patient_id = own_patient.id if own_patient else -1

    return document_crud.list_documents(db, patient_id)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = document_crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        if not own_patient or document.patient_id != own_patient.id:
            raise HTTPException(status_code=403, detail="Not your document")

    file_path = os.path.join(UPLOAD_DIR, document.stored_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File is missing from storage")

    return FileResponse(file_path, filename=document.file_name)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    document = document_crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(UPLOAD_DIR, document.stored_name)
    if os.path.exists(file_path):
        os.remove(file_path)

    document_crud.delete_document(db, document)
