from typing import Any, Dict
import hashlib
import json


from django.core.mail import send_mail
from django.conf import settings
from rest_framework.response import Response


def api_response(success: bool, data: Any = None, message: str = "", status: int = None) -> Response:
    """
    Return API response in unified format:
    {"success": bool, "data": {...}, "message": str}
    """
    response_data = {"success": success, "data": data, "message": message}
    if status is not None:
        return Response(response_data, status=status)
    return Response(response_data)


def sha256_hash(value: str) -> str:
    """Return SHA-256 hex digest of a string."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()




def send_email(subject: str, message: str, to_email: str) -> None:
    """Send an email using Django's email backend."""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=True)

def send_sms(phone: str, message: str) -> bool:
    """Send an SMS using Twilio."""
    from decouple import config
    from twilio.rest import Client
    import logging
    logger = logging.getLogger(__name__)

    try:
        account_sid = config("TWILIO_ACCOUNT_SID", default="")
        auth_token = config("TWILIO_AUTH_TOKEN", default="")
        from_phone = config("TWILIO_PHONE_NUMBER", default="")
        
        if not account_sid or not auth_token:
            logger.error("Twilio credentials not configured.")
            return False
            
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message,
            from_=from_phone,
            to=phone
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone}: {e}")
        return False


def dict_to_json(d: Dict[str, Any]) -> str:
    """Convert a dictionary to a compact JSON string."""
    return json.dumps(d, separators=(",", ":"))

