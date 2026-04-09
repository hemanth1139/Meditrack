from typing import Any, Dict
import hashlib
import json


from django.core.mail import send_mail
from django.conf import settings
from rest_framework.response import Response


def api_response(success: bool, data: Any = None, message: str = "") -> Response:
    """
    Return API response in unified format:
    {"success": bool, "data": {...}, "message": str}
    """
    return Response({"success": success, "data": data, "message": message})


def sha256_hash(value: str) -> str:
    """Return SHA-256 hex digest of a string."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()




def send_email(subject: str, message: str, to_email: str) -> None:
    """Send an email using Django's email backend."""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=True)


def dict_to_json(d: Dict[str, Any]) -> str:
    """Convert a dictionary to a compact JSON string."""
    return json.dumps(d, separators=(",", ":"))

