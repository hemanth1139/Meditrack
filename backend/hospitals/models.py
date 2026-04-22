from django.db import models


class Hospital(models.Model):
    """Hospital entity representing one institution in MediTrack."""

    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()

    # Verification Details
    registration_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    hospital_type = models.CharField(max_length=100, default="General", choices=[("General", "General"), ("Clinic", "Clinic"), ("Multi-Specialty", "Multi-Specialty"), ("Emergency", "Emergency"), ("Research", "Research"), ("Other", "Other")])
    website = models.URLField(blank=True, null=True)
    verification_document = models.URLField(blank=True, null=True, help_text="Cloudinary URL for the registration certificate")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name

