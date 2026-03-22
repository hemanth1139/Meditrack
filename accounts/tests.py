from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from .serializers import RegisterSerializer
from .serializers_auth import LoginSerializer

User = get_user_model()


class RegisterSerializerTests(TestCase):
    def test_register_without_last_name_still_works(self):
        from hospitals.models import Hospital
        hospital = Hospital.objects.create(name="Test Hospital", address="123 x", city="C", state="S", phone="1112223333", email="test@hosp.com")
        data = {
            "username": "john123",
            "password": "passw0rd123",
            "email": "john@example.com",
            "first_name": "John",
            "last_name": "",
            "phone": "1234567890",
            "role": User.Roles.PATIENT,
            "hospital_id": hospital.id,
            "date_of_birth": "1990-01-01",
            "gender": "Male",
            "blood_group": "O+",
            "address": "123 Test Street",
            "emergency_contact_name": "Jane",
            "emergency_contact_phone": "0987654321",
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "")


class LoginSerializerTests(TestCase):
    def test_login_missing_email_raises_error(self):
        serializer = LoginSerializer(data={"password": "passw0rd"})
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_login_missing_password_raises_error(self):
        serializer = LoginSerializer(data={"email": "john@example.com"})
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
