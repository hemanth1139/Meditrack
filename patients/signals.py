from datetime import datetime
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.conf import settings

from common.utils import sha256_hash
from .models import Patient
from .utils import generate_patient_qr_content, generate_qr_image


def _generate_patient_id() -> str:
    """Generate a unique 10-digit patient ID."""
    # Simple deterministic approach using timestamp hash; in production, use a sequence.
    base = sha256_hash(str(datetime.utcnow().timestamp()))[:10]
    return "".join(filter(str.isdigit, base)).ljust(10, "0")[:10]


@receiver(pre_save, sender=Patient)
def ensure_patient_id(sender, instance: Patient, **kwargs):
    """Ensure patient_id is set before saving."""
    if not instance.patient_id:
        instance.patient_id = _generate_patient_id()


@receiver(post_save, sender=Patient)
def generate_qr_on_save(sender, instance: Patient, created: bool, **kwargs):
    """Generate or refresh QR code whenever a patient is created."""
    # In local/dev environments without Cloudinary configured, skip QR upload.
    if not getattr(settings, "CLOUDINARY_STORAGE", {}).get("CLOUD_NAME"):
        return
    if created or not instance.qr_code:
        content = generate_patient_qr_content(instance)
        qr_file = generate_qr_image(content)
        
        try:
            import cloudinary.uploader
            res = cloudinary.uploader.upload(
                qr_file.read(), 
                public_id=f"qr_{instance.patient_id}",
                folder="meditrack_qrs",
                format="png"
            )
            Patient.objects.filter(pk=instance.pk).update(qr_code=res['public_id'])
        except Exception as e:
            print(f"Failed to upload QR code to Cloudinary: {e}")

