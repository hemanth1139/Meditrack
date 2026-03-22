from django.core.exceptions import ValidationError


def validate_record_file(file):
    """Validate uploaded record file type and size."""
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        raise ValidationError("File size cannot exceed 10MB.")
    valid_content_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
    ]
    if file.content_type not in valid_content_types:
        raise ValidationError("Invalid file type. Only PDF and JPG/PNG images are allowed.")

