from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.cache import cache

from accounts.permissions import IsAdminUserRole
from meditrack.utils import api_response
from .models import Hospital
from .serializers import HospitalSerializer


class HospitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage hospitals.
    Admins can create, list, update, and delete hospitals.
    """

    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

    def get_permissions(self):
        # Allow public hospital list for registration dropdown.
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUserRole()]

    def list(self, request, *args, **kwargs):
        cached_data = cache.get("all_hospitals")
        if cached_data is not None:
            return api_response(True, cached_data, "Hospitals fetched (cached)")
            
        serializer = self.get_serializer(self.get_queryset(), many=True)
        cache.set("all_hospitals", serializer.data, 600)  # cache for 10 minutes
        return api_response(True, serializer.data, "Hospitals fetched")

    def create(self, request, *args, **kwargs):
        # Accept optional nested hospital admin account setup.
        # Payload supports:
        # - hospital fields
        # - hospital_admin: {full_name, email, password, phone}
        hospital_admin = request.data.get("hospital_admin") or {}

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        hospital = serializer.instance

        created_admin = None
        temp_password = None
        if hospital_admin:
            User = get_user_model()
            full_name = (hospital_admin.get("full_name") or "").strip()
            first_name = full_name.split(" ")[0] if full_name else ""
            last_name = " ".join(full_name.split(" ")[1:]) if full_name else ""
            email = hospital_admin.get("email")
            temp_password = hospital_admin.get("password")
            phone = hospital_admin.get("phone", "")

            if email and temp_password:
                username = email.split("@")[0]
                created_admin, _ = User.objects.get_or_create(
                    username=username,
                    defaults={
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "phone": phone,
                        "role": "HOSPITAL_ADMIN",
                        "hospital": hospital,
                        "is_verified": True,
                        "is_active": True,
                    },
                )
                if created_admin and not created_admin.check_password(temp_password):
                    created_admin.set_password(temp_password)
                    created_admin.save()

        data = serializer.data
        if created_admin:
            data = {
                "hospital": serializer.data,
                "hospital_admin": {
                    "email": created_admin.email,
                    "password": temp_password,
                },
            }
        cache.delete("all_hospitals")
        return api_response(True, data, "Hospital created")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(True, serializer.data, "Hospital detail")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        cache.delete("all_hospitals")
        return api_response(True, serializer.data, "Hospital updated")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        cache.delete("all_hospitals")
        return api_response(True, None, "Hospital deleted")
