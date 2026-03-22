from django.db import models
from django.conf import settings
from encrypted_model_fields.fields import EncryptedTextField
from cloudinary.models import CloudinaryField

from hospitals.models import Hospital
from patients.models import Patient


class MedicalRecord(models.Model):
    """Medical records with encrypted diagnosis and chained hashes."""

    class RecordType(models.TextChoices):
        LAB = "LAB", "Lab"
        SCAN = "SCAN", "Scan"
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        FLAGGED = "FLAGGED", "Flagged"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="records", db_index=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="records", db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="records_created",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="records_approved",
    )
    record_type = models.CharField(max_length=20, choices=RecordType.choices)
    file = CloudinaryField("file", blank=True, null=True)
    diagnosis = EncryptedTextField()
    notes = EncryptedTextField()
    visit_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    flag_reason = models.TextField(null=True, blank=True)
    lab_tests_requested = models.JSONField(default=list, blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    record_hash = models.CharField(max_length=64, blank=True)
    prev_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.patient.patient_id} - {self.record_type} - {self.status}"


class Prescription(models.Model):
    """Prescription details linked to a MedicalRecord."""

    record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name="prescriptions")
    medicine_name = EncryptedTextField()
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)

    def __str__(self) -> str:
        return f"Prescription for {self.record.patient.patient_id} - {self.medicine_name}"


class DoctorStaffAccess(models.Model):
    """Access control granted by a Doctor to a Staff member for a specific Patient."""

    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="granted_staff_accesses")
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assigned_patient_accesses")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="staff_accesses")
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("doctor", "staff", "patient")

    def __str__(self) -> str:
        return f"Staff {self.staff.get_full_name()} assigned to {self.patient.patient_id} by Dr. {self.doctor.get_full_name()}"

