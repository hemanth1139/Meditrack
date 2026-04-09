from django.db import models
from django.conf import settings
from meditrack.fields import SafeCloudinaryField
from encrypted_model_fields.fields import EncryptedTextField

from hospitals.models import Hospital


class Patient(models.Model):
    """Patient profile with QR code and encrypted identifiers."""

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]

    patient_id = models.CharField(max_length=10, unique=True, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="patient_profile")
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="patients", db_index=True)
    is_profile_complete = models.BooleanField(default=False)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_phone = models.CharField(max_length=20)
    known_allergies = EncryptedTextField()
    aadhaar_number = EncryptedTextField(null=True, blank=True)
    qr_code = SafeCloudinaryField("qr_code", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient_id"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.patient_id} - {self.user.get_full_name()}"


class Vitals(models.Model):
    """Patient vitals recorded by staff."""
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="vitals")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vitals_recorded",
    )
    blood_pressure = models.CharField(max_length=20) # e.g., "120/80"
    temperature = models.DecimalField(max_digits=5, decimal_places=2) # °F
    weight = models.DecimalField(max_digits=5, decimal_places=2) # kg
    pulse = models.IntegerField() # bpm
    spo2 = models.IntegerField() # %
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient", "recorded_at"]),
        ]

    def __str__(self) -> str:
        return f"Vitals for {self.patient.patient_id} at {self.recorded_at}"



class DoctorStaffAccess(models.Model):
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_accesses')
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, related_name='staff_accesses')
    granted_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

