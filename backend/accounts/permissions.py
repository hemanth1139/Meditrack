from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    """Allow only ADMIN role users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class IsDoctor(BasePermission):
    """Allow only DOCTOR users with approved status."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and user.role == "DOCTOR"
            and user.status == "APPROVED"
        )


class IsStaff(BasePermission):
    """Allow only STAFF users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "STAFF")


class IsPatient(BasePermission):
    """Allow only PATIENT users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "PATIENT")


class IsHospitalAdmin(BasePermission):
    """Allow only HOSPITAL_ADMIN users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "HOSPITAL_ADMIN"
        )

from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        from django.conf import settings
        jwt_settings = getattr(settings, "SIMPLE_JWT", {})
        cookie_name = jwt_settings.get("AUTH_COOKIE", "access_token")
        token = request.COOKIES.get(cookie_name)
        if not token:
            return None
        validated_token = self.get_validated_token(token)
        return self.get_user(validated_token), validated_token
