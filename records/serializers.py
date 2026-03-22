from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from hospitals.models import Hospital
from patients.models import Patient
from .models import MedicalRecord, Prescription
from .validators import validate_record_file


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ["id", "medicine_name", "dosage", "frequency", "duration"]


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for creating and viewing medical records."""

    patient_id = serializers.CharField(write_only=True)
    hospital_id = serializers.IntegerField(write_only=True)
    created_by_id = serializers.IntegerField(write_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "patient_id",
            "hospital_id",
            "created_by_id",
            "approved_by",
            "record_type",
            "file",
            "diagnosis",
            "notes",
            "visit_date",
            "status",
            "flag_reason",
            "lab_tests_requested",
            "follow_up_date",
            "record_hash",
            "prev_hash",
            "created_at",
            "approved_at",
            "prescriptions",
        ]
        read_only_fields = (
            "id",
            "record_hash",
            "prev_hash",
            "created_at",
            "approved_at",
            "status",
        )

    def validate_file(self, value):
        if value:
            validate_record_file(value)
        return value

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

