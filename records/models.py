from django.db import models
from django.conf import settings
from encrypted_model_fields.fields import EncryptedTextField
from cloudinary.models import CloudinaryField

from hospitals.models import Hospital
from patients.models import Patient


class MedicalRecord(models.Model):
    class VisitType(models.TextChoices):
        CONSULTATION = "CONSULTATION", "General Consultation"
        PRESCRIPTION = "PRESCRIPTION", "Prescription Only"
        LAB_TEST = "LAB_TEST", "Lab Test Request"
        SCAN = "SCAN", "Scan / Imaging"
        PROCEDURE = "PROCEDURE", "Procedure / Surgery"
        EMERGENCY = "EMERGENCY", "Emergency Visit"
        FOLLOWUP = "FOLLOWUP", "Follow-up Visit"

    class Severity(models.TextChoices):
        MILD = "MILD", "Mild"
        MODERATE = "MODERATE", "Moderate"
        SEVERE = "SEVERE", "Severe"
        CRITICAL = "CRITICAL", "Critical"

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
    
    visit_type = models.CharField(max_length=20, choices=VisitType.choices, default=VisitType.CONSULTATION)
    visit_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    flag_reason = models.TextField(null=True, blank=True)
    
    # Audit fields
    record_hash = models.CharField(max_length=64, blank=True)
    prev_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    # General / Consultation
    chief_complaint = EncryptedTextField(blank=True, null=True)
    history = EncryptedTextField(blank=True, null=True)
    symptoms = models.JSONField(default=list, blank=True)
    symptom_duration = models.CharField(max_length=50, blank=True)
    examination_findings = EncryptedTextField(blank=True, null=True)
    diagnosis = EncryptedTextField(blank=True, null=True)
    severity = models.CharField(max_length=10, choices=Severity.choices, blank=True)
    treatment_given = EncryptedTextField(blank=True, null=True)
    doctor_notes = EncryptedTextField(blank=True, null=True)

    # Lab fields
    clinical_indication = EncryptedTextField(blank=True, null=True)
    tests_ordered = models.JSONField(default=list, blank=True)
    priority = models.CharField(max_length=10, blank=True)
    fasting_required = models.BooleanField(default=False)
    fasting_hours = models.IntegerField(null=True, blank=True)
    lab_instructions = models.TextField(blank=True)
    lab_results = EncryptedTextField(blank=True, null=True)

    # Scan fields
    scan_types = models.JSONField(default=list, blank=True)
    body_part = models.CharField(max_length=100, blank=True)
    contrast_required = models.BooleanField(default=False)
    radiologist_report = EncryptedTextField(blank=True, null=True)

    # Procedure fields
    procedure_name = models.CharField(max_length=200, blank=True)
    procedure_type = models.CharField(max_length=50, blank=True)
    anesthesia_type = models.CharField(max_length=50, blank=True)
    pre_op_diagnosis = models.CharField(max_length=200, blank=True)
    post_op_diagnosis = models.CharField(max_length=200, blank=True)
    procedure_details = EncryptedTextField(blank=True, null=True)
    complications = EncryptedTextField(blank=True, null=True)
    post_op_instructions = EncryptedTextField(blank=True, null=True)

    # Emergency fields
    triage_level = models.CharField(max_length=10, blank=True)
    mode_of_arrival = models.CharField(max_length=50, blank=True)
    gcs_score = models.IntegerField(null=True, blank=True)
    disposition = models.CharField(max_length=50, blank=True)

    # Follow-up fields
    patient_progress = models.CharField(max_length=20, blank=True)
    assessment = EncryptedTextField(blank=True, null=True)
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    follow_up_instructions = EncryptedTextField(blank=True, null=True)

    class Meta:
        ordering = ["-visit_date"]
        indexes = [
            models.Index(fields=["patient", "visit_date"]),
            models.Index(fields=["created_by", "visit_date"]),
            models.Index(fields=["visit_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.patient.patient_id} - {self.visit_type} - {self.status}"


class Prescription(models.Model):
    MEDICINE_TYPES = [
        ("TABLET", "Tablet"),
        ("CAPSULE", "Capsule"),
        ("SYRUP", "Syrup"),
        ("INJECTION", "Injection"),
        ("DROPS", "Drops"),
        ("INHALER", "Inhaler"),
        ("CREAM", "Cream"),
        ("PATCH", "Patch"),
        ("OTHER", "Other"),
    ]

    FREQUENCY_CHOICES = [
        ("OD", "Once daily"),
        ("BD", "Twice daily"),
        ("TDS", "Three times daily"),
        ("QID", "Four times daily"),
        ("Q6H", "Every 6 hours"),
        ("Q8H", "Every 8 hours"),
        ("Q12H", "Every 12 hours"),
        ("SOS", "As needed (SOS)"),
        ("AC", "Before food"),
        ("PC", "After food"),
        ("HS", "At bedtime"),
    ]

    ROUTE_CHOICES = [
        ("ORAL", "Oral"),
        ("TOPICAL", "Topical"),
        ("IV", "Intravenous"),
        ("IM", "Intramuscular"),
        ("SC", "Subcutaneous"),
        ("INH", "Inhalation"),
        ("SL", "Sublingual"),
    ]

    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="prescriptions"
    )
    medicine_name = EncryptedTextField()
    medicine_type = models.CharField(max_length=20, choices=MEDICINE_TYPES, default="TABLET")
    dosage = models.CharField(max_length=50)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default="OD")
    duration_value = models.IntegerField(default=1)
    duration_unit = models.CharField(
        max_length=10,
        choices=[("Days", "Days"), ("Weeks", "Weeks"), ("Months", "Months")],
        default="Days"
    )
    route = models.CharField(max_length=10, choices=ROUTE_CHOICES, default="ORAL")
    special_instructions = EncryptedTextField(blank=True, null=True)
    refills_allowed = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"Prescription {self.medicine_name} for {self.record.patient.patient_id}"

class MedicalDocument(models.Model):
    DOC_TYPES = [
        ("LAB_REPORT", "Lab Report"),
        ("SCAN_REPORT", "Scan Report"),
        ("SCAN_IMAGE", "Scan Image"),
        ("CONSENT_FORM", "Consent Form"),
        ("OP_NOTES", "Operation Notes"),
        ("DISCHARGE", "Discharge Summary"),
        ("OTHER", "Other"),
    ]

    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    label = models.CharField(max_length=100)
    cloudinary_url = models.URLField(max_length=500)
    cloudinary_public_id = models.CharField(max_length=200)
    file_type = models.CharField(max_length=10)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Doc: {self.label} for Record ID {self.record_id}"


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

