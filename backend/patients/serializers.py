from django.contrib.auth import get_user_model
from rest_framework import serializers
from encrypted_model_fields.fields import EncryptedTextField  # noqa: F401

from accounts.models import User
from hospitals.models import Hospital
from .models import Patient, Vitals


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
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "patient_id",
            "user_id",
            "hospital_id",
            "user_name",
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
        read_only_fields = ("patient_id", "created_at", "qr_code_url", "user_name")

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else "—"

    def get_qr_code_url(self, obj):
        if not obj.qr_code:
            return None
        from django.conf import settings
        if getattr(settings, "CLOUDINARY_CLOUD_NAME", ""):
            # Build Cloudinary URL from public_id
            public_id = str(obj.qr_code)
            cloud = settings.CLOUDINARY_CLOUD_NAME
            return f"https://res.cloudinary.com/{cloud}/image/upload/{public_id}"
        # Local file storage
        try:
            return obj.qr_code.url
        except Exception:
            return None

    def create(self, validated_data):
        # Default known_allergies to empty string if not provided (handles null/missing)
        if not validated_data.get("known_allergies"):
            validated_data["known_allergies"] = ""
            
        user_id = validated_data.pop("user_id")
        hospital_id = validated_data.pop("hospital_id")
        user = User.objects.get(id=user_id)
        hospital = Hospital.objects.get(id=hospital_id)
        patient = Patient.objects.create(user=user, hospital=hospital, **validated_data)
        
        # Generate QR code after creating the patient so we have a patient_id
        try:
            import qrcode
            import io
            from django.conf import settings
            
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(patient.patient_id)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            
            if getattr(settings, "CLOUDINARY_CLOUD_NAME", ""):
                import cloudinary.uploader
                result = cloudinary.uploader.upload(
                    buffer,
                    public_id=f"meditrack/qr_codes/{patient.patient_id}",
                    resource_type="image",
                    overwrite=True,
                )
                # Store only the public_id in the CloudinaryField
                patient.qr_code = result.get("public_id")
            else:
                from django.core.files.base import ContentFile
                patient.qr_code.save(
                    f"{patient.patient_id}.png",
                    ContentFile(buffer.read()),
                    save=False,
                )
            patient.save(update_fields=["qr_code"])
        except Exception as e:
            # QR generation failure should not block patient creation
            import logging
            logging.getLogger(__name__).warning(f"QR code generation failed for {patient.patient_id}: {e}")
        
        return patient
