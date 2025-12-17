from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_upload_file(file: UploadFile) -> str:
	ext = Path(file.filename or "").suffix
	filename = f"{uuid4().hex}{ext}"
	destination = UPLOAD_DIR / filename
	content = await file.read()
	with destination.open("wb") as buffer:
		buffer.write(content)
	return f"/uploads/{filename}"

