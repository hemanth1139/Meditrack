from django.contrib.auth import get_user_model
from rest_framework import serializers
from encrypted_model_fields.fields import EncryptedTextField  # noqa: F401

from accounts.models import User
from hospitals.models import Hospital
from .models import OTPConsent, Patient, Vitals


class VitalsSerializer(serializers.ModelSerializer):
    """Serializer for patient vitals."""

    class Meta:
        model = Vitals
        fields = ["id", "blood_pressure", "temperature", "weight", "pulse", "spo2", "recorded_at", "recorded_by"]
        read_only_fields = ["id", "recorded_at", "recorded_by"]


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for creating and viewing patient profiles."""

    user_id = serializers.IntegerField(write_only=True)
    hospital_id = serializers.IntegerField(write_only=True)
    qr_code_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "patient_id",
            "user_id",
            "hospital_id",
            "date_of_birth",
            "gender",
            "blood_group",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "known_allergies",
            "aadhaar_number",
            "qr_code_url",
            "created_at",
        ]
        read_only_fields = ("patient_id", "created_at", "qr_code_url")

    def get_qr_code_url(self, obj):
        return obj.qr_code.url if obj.qr_code else None

    def create(self, validated_data):
        user_id = validated_data.pop("user_id")
        hospital_id = validated_data.pop("hospital_id")
        user = User.objects.get(id=user_id)
        hospital = Hospital.objects.get(id=hospital_id)
        return Patient.objects.create(user=user, hospital=hospital, **validated_data)


class OTPConsentRequestSerializer(serializers.Serializer):
    """Serializer for requesting OTP consent for cross-hospital access."""

    requesting_hospital_id = serializers.IntegerField()


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying an OTP for cross-hospital access."""

    otp = serializers.CharField()

