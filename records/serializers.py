from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from hospitals.models import Hospital
from patients.models import Patient
from .models import MedicalRecord, Prescription, MedicalDocument


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = [
            "id", "medicine_name", "medicine_type", "dosage", 
            "frequency", "duration_value", "duration_unit", 
            "route", "special_instructions", "refills_allowed"
        ]


class MedicalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalDocument
        fields = [
            "id", "doc_type", "label", "cloudinary_url", 
            "cloudinary_public_id", "file_type", "uploaded_at"
        ]
        read_only_fields = ["id", "uploaded_at"]


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for creating and viewing medical records with dynamic category fields."""

    patient_id = serializers.CharField(write_only=True)
    hospital_id = serializers.IntegerField(write_only=True)
    created_by_id = serializers.IntegerField(write_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    documents = MedicalDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            "id", "patient_id", "hospital_id", "created_by_id", "approved_by",
            "visit_type", "visit_date", "status", "flag_reason",
            "record_hash", "prev_hash", "created_at", "approved_at",
            "prescriptions", "documents",
            # General
            "chief_complaint", "history", "symptoms", "symptom_duration",
            "examination_findings", "diagnosis", "severity", "treatment_given", "doctor_notes",
            # Lab
            "clinical_indication", "tests_ordered", "priority", "fasting_required",
            "fasting_hours", "lab_instructions", "lab_results",
            # Scan
            "scan_types", "body_part", "contrast_required", "radiologist_report",
            # Procedure
            "procedure_name", "procedure_type", "anesthesia_type", "pre_op_diagnosis",
            "post_op_diagnosis", "procedure_details", "complications", "post_op_instructions",
            # Emergency
            "triage_level", "mode_of_arrival", "gcs_score", "disposition",
            # Follow-up
            "patient_progress", "assessment", "follow_up_required", "follow_up_date", "follow_up_instructions"
        ]
        read_only_fields = (
            "id", "record_hash", "prev_hash", "created_at", "approved_at", "status",
        )

    def create(self, validated_data):
        patient_id = validated_data.pop("patient_id")
        hospital_id = validated_data.pop("hospital_id")
        created_by_id = validated_data.pop("created_by_id")
        patient = Patient.objects.get(patient_id=patient_id)
        hospital = Hospital.objects.get(id=hospital_id)
        created_by = User.objects.get(id=created_by_id)
        return MedicalRecord.objects.create(
            patient=patient,
            hospital=hospital,
            created_by=created_by,
            **validated_data,
        )
