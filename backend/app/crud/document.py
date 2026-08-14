from sqlalchemy.orm import Session

from app.models.document import Document


def create_document(
    db: Session,
    patient_id: int,
    uploaded_by: int,
    file_name: str,
    stored_name: str,
    file_type: str | None,
) -> Document:
    document = Document(
        patient_id=patient_id,
        uploaded_by=uploaded_by,
        file_name=file_name,
        stored_name=stored_name,
        file_type=file_type,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document(db: Session, document_id: int) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()


def list_documents(db: Session, patient_id: int | None = None) -> list[Document]:
    query = db.query(Document)
    if patient_id is not None:
        query = query.filter(Document.patient_id == patient_id)
    return query.order_by(Document.id.desc()).all()


def delete_document(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()
