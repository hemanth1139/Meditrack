from django.contrib.auth import get_user_model
from rest_framework import serializers

from hospitals.models import Hospital
from patients.models import Patient
from .models import DoctorProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """
    Serializer used for patient and doctor self-registration.
    Creates a User (and DoctorProfile if doctor).
    """

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField()
    role = serializers.ChoiceField(choices=[User.Roles.PATIENT, User.Roles.DOCTOR])
    hospital_id = serializers.IntegerField(required=False, allow_null=True)
    specialization = serializers.CharField(required=False, allow_blank=True)
    qualification = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    medical_reg_number = serializers.CharField(required=False, allow_blank=True)
    medical_council = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False)
    # patient profile fields (required when role=PATIENT)
    date_of_birth = serializers.DateField(required=False)
    gender = serializers.CharField(required=False)
    blood_group = serializers.CharField(required=False)
    address = serializers.CharField(required=False)
    known_allergies = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_name = serializers.CharField(required=False)
    emergency_contact_phone = serializers.CharField(required=False)

    def validate(self, attrs):
        role = attrs.get("role")
        if role not in [User.Roles.PATIENT, User.Roles.DOCTOR]:
            raise serializers.ValidationError("Only patient and doctor registration is allowed.")
        if role == User.Roles.DOCTOR:
            required = ["specialization", "qualification", "department", "medical_reg_number", "medical_council"]
            missing = [f for f in required if not attrs.get(f)]
            if missing:
                raise serializers.ValidationError(f"Missing doctor fields: {', '.join(missing)}")
        if role == User.Roles.PATIENT:
            required = [
                "hospital_id",
                "date_of_birth",
                "gender",
                "blood_group",
                "address",
                "emergency_contact_name",
                "emergency_contact_phone",
            ]
            missing = [f for f in required if not attrs.get(f)]
            if missing:
                raise serializers.ValidationError(f"Missing patient fields: {', '.join(missing)}")
        return attrs

    def create(self, validated_data):
        hospital_id = validated_data.pop("hospital_id", None)
        role = validated_data.pop("role")

        doctor_fields = [
            "specialization",
            "qualification",
            "department",
            "medical_reg_number",
            "medical_council",
            "years_of_experience",
        ]
        doctor_data = {k: validated_data.pop(k) for k in list(validated_data.keys()) if k in doctor_fields}

        password = validated_data.pop("password")
        hospital = None
        if hospital_id:
            hospital = Hospital.objects.get(id=hospital_id)
        patient_fields = [
            "date_of_birth",
            "gender",
            "blood_group",
            "address",
            "known_allergies",
            "emergency_contact_name",
            "emergency_contact_phone",
        ]
        patient_data = {k: validated_data.pop(k) for k in list(validated_data.keys()) if k in patient_fields}

        user = User.objects.create(
            role=role,
            hospital=hospital,
            is_active=True,
            **validated_data,
        )
        user.set_password(password)
        if role == User.Roles.DOCTOR:
            user.is_verified = False
        if role == User.Roles.PATIENT:
            user.is_verified = True
        user.save()
        if role == User.Roles.DOCTOR:
            DoctorProfile.objects.create(user=user, **doctor_data)
        if role == User.Roles.PATIENT:
            gender_map = {"Male": "M", "Female": "F", "Other": "O", "M": "M", "F": "F", "O": "O"}
            g = patient_data.get("gender")
            patient_data["gender"] = gender_map.get(g, g)
            Patient.objects.create(user=user, hospital=hospital, is_profile_complete=True, **patient_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for listing and updating users."""

    department = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "hospital",
            "hospital_id",
            "is_verified",
            "department",
            "created_at",
        )
        read_only_fields = ("id", "role", "is_verified")

    def get_department(self, obj):
        sp = getattr(obj, "staff_profile", None)
        return getattr(sp, "department", None)

    def get_created_at(self, obj):
        sp = getattr(obj, "staff_profile", None)
        return getattr(sp, "created_at", None)


class DoctorProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing doctor profile details."""

    user = UserSerializer(read_only=True)

    class Meta:
        model = DoctorProfile
        fields = "__all__"

