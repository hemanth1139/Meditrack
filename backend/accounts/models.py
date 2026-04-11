from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from meditrack.fields import SafeCloudinaryField
from hospitals.models import Hospital

class User(AbstractUser):
    """Custom user with role and hospital mapping directly containing role profiles."""

    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        HOSPITAL_ADMIN = "HOSPITAL_ADMIN", "Hospital Admin"
        DOCTOR = "DOCTOR", "Doctor"
        STAFF = "STAFF", "Staff"
        PATIENT = "PATIENT", "Patient"

    class DoctorStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    role = models.CharField(max_length=20, choices=Roles.choices, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    profile_photo = SafeCloudinaryField("profile_photo", blank=True, null=True)
    hospital = models.ForeignKey(Hospital, null=True, blank=True, on_delete=models.SET_NULL, db_index=True)
    is_verified = models.BooleanField(default=False)

    # Doctor/Staff shared
    department = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name="staff_created"
    )

    # Doctor specific
    specialization = models.CharField(max_length=255, blank=True)
    qualification = models.CharField(max_length=255, blank=True)
    medical_reg_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    medical_council = models.CharField(max_length=255, blank=True)
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)
    certificate = SafeCloudinaryField("certificate", blank=True, null=True)
    status = models.CharField(max_length=20, choices=DoctorStatus.choices, default=DoctorStatus.PENDING)
    rejection_reason = models.TextField(null=True, blank=True)

    # Staff specific
    role_title = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["hospital"]),
            models.Index(fields=["role", "hospital"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"





class AuditLog(models.Model):
    """Append-only audit log; updates and deletes are forbidden."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk is not None and self.__class__.objects.filter(pk=self.pk).exists():
            raise PermissionError("AuditLog entries are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("AuditLog entries cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.timestamp} - {self.action}"





class Notification(models.Model):
    class NotificationType(models.TextChoices):
        GENERAL = "GENERAL", "General"
        APPOINTMENT = "APPOINTMENT", "Appointment"
        SYSTEM = "SYSTEM", "System"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.GENERAL)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_read"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.message[:20]}"
