import os
import uuid
from pathlib import Path
from django.conf import settings
from django.core.exceptions import ValidationError


class TemporaryStorageService:
    ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
    TEMP_DIR_NAME = 'temp_uploads'

    @classmethod
    def get_temp_dir(cls) -> Path:
        """Get or create the temp uploads directory inside MEDIA_ROOT."""
        temp_dir = Path(settings.MEDIA_ROOT) / cls.TEMP_DIR_NAME
        temp_dir.mkdir(parents=True, exist_ok=True)
        return temp_dir

    @classmethod
    def save_temp_file(cls, uploaded_file) -> str:
        """
        Saves an uploaded file to the temporary storage directory.
        Returns the unique temp_file_id.
        """
        original_name = uploaded_file.name
        ext = Path(original_name).suffix.lower()

        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: {', '.join(cls.ALLOWED_EXTENSIONS)}"
            )

        # Generate a unique filename using UUID to prevent collisions
        temp_file_id = f"{uuid.uuid4().hex}{ext}"
        temp_path = cls.get_temp_dir() / temp_file_id

        try:
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
        except Exception as e:
            raise ValidationError(f"Failed to save temporary file: {str(e)}")

        return temp_file_id

    @classmethod
    def get_temp_file_path(cls, temp_file_id: str) -> Path:
        """
        Retrieves the absolute path for the given temporary file ID.
        Validates the ID to prevent path traversal vulnerability.
        """
        if not temp_file_id or '/' in temp_file_id or '\\' in temp_file_id or '..' in temp_file_id:
            raise ValidationError("Invalid temporary file identifier.")

        # Ensure it has a valid extension
        ext = Path(temp_file_id).suffix.lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValidationError("Invalid temporary file format.")

        temp_path = cls.get_temp_dir() / temp_file_id

        if not temp_path.exists():
            raise ValidationError("Temporary file does not exist or has expired.")

        return temp_path

    @classmethod
    def delete_temp_file(cls, temp_file_id: str) -> bool:
        """
        Deletes the temporary file from the disk.
        Returns True if deleted, False otherwise.
        """
        try:
            temp_path = cls.get_temp_file_path(temp_file_id)
            if temp_path.exists():
                os.remove(temp_path)
                return True
        except Exception:
            pass
        return False
