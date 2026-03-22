from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from cloudinary.models import CloudinaryField
from hospitals.models import Hospital


class User(AbstractUser):
    """Custom user with role and hospital mapping."""

    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        HOSPITAL_ADMIN = "HOSPITAL_ADMIN", "Hospital Admin"
        DOCTOR = "DOCTOR", "Doctor"
        STAFF = "STAFF", "Staff"
        PATIENT = "PATIENT", "Patient"

    role = models.CharField(max_length=20, choices=Roles.choices, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    profile_photo = CloudinaryField("profile_photo", blank=True, null=True)
    hospital = models.ForeignKey(Hospital, null=True, blank=True, on_delete=models.SET_NULL, db_index=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"


class DoctorProfile(models.Model):
    """Doctor profile with verification status."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="doctor_profile")
    specialization = models.CharField(max_length=255)
    qualification = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    medical_reg_number = models.CharField(max_length=100, unique=True)
    medical_council = models.CharField(max_length=255)
    years_of_experience = models.PositiveIntegerField()
    certificate = CloudinaryField("certificate", blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Dr {self.user.get_full_name()} - {self.status}"


class StaffProfile(models.Model):
    """Staff profile created by a Hospital Admin."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile")
    department = models.CharField(max_length=255)
    role_title = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} - {self.department}"

