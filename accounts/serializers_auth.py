from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied


class LoginSerializer(TokenObtainPairSerializer):
    """
    Serializer for login using username and password.
    Ensures doctor must be approved to log in.
    """

    # Frontend sends email/password.
    email = serializers.EmailField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make username optional so email-based login works.
        if self.username_field in self.fields:
            self.fields[self.username_field].required = False

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["hospital_id"] = user.hospital_id
        return token

    def validate(self, attrs):
        # Support login by email (frontend sends email/password).
        email = attrs.get("email") or attrs.get("username")
        password = attrs.get("password")
        if not email:
            raise serializers.ValidationError({"email": "Email address is required"})
        if not password:
            raise serializers.ValidationError({"password": "Password is required"})
        User = get_user_model()
        if email and "@" in str(email):
            try:
                u = User.objects.get(email__iexact=email)
                attrs["username"] = u.username
            except User.DoesNotExist:
                attrs["username"] = email
        else:
            attrs["username"] = email

        data = super().validate(attrs)
        user = self.user
        if not user.is_active:
            raise PermissionDenied("Account deactivated")
        if user.role == "DOCTOR":
            profile = getattr(user, "doctor_profile", None)
            if not profile or profile.status != "APPROVED":
                raise PermissionDenied("Account pending approval")
        if user.role == "DOCTOR" and not user.is_verified:
            raise PermissionDenied("Account pending approval")

        user_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "hospital_id": user.hospital_id,
        }

        if user.role == "PATIENT":
            patient_profile = getattr(user, "patient_profile", None)
            if patient_profile is not None:
                user_data["patient_id"] = patient_profile.patient_id

        return {
            "access": data["access"],
            "refresh": data["refresh"],
            "role": user.role,
            "user": user_data,
        }

