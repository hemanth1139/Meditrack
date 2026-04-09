"""
Safe CloudinaryField that falls back to ImageField when Cloudinary is not configured.
This prevents the cloudinary library from being imported on machines where it hangs
(e.g. Windows with network restrictions).

Usage in models:
    from meditrack.fields import SafeCloudinaryField
    photo = SafeCloudinaryField("photo", blank=True, null=True)
"""
from django.conf import settings

if getattr(settings, "CLOUDINARY_ENABLED", False):
    from cloudinary.models import CloudinaryField as SafeCloudinaryField  # noqa: F401
else:
    from django.db.models import ImageField as SafeCloudinaryField  # noqa: F401
