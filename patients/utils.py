import io
import qrcode
from django.core.files.base import ContentFile

from common.utils import dict_to_json


from django.conf import settings

def generate_patient_qr_content(patient) -> str:
    """Generate the absolute URL encoded in the patient QR code."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{frontend_url}/qr/{patient.patient_id}"


def generate_qr_image(content: str) -> ContentFile:
    """Generate a QR code image as an in-memory file."""
    qr = qrcode.QRCode(version=1, box_size=8, border=4)
    qr.add_data(content)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name="patient_qr.png")

