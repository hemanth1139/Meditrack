from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    """Allow only ADMIN role users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class IsDoctor(BasePermission):
    """Allow only DOCTOR users with approved status."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.role == "DOCTOR"):
            return False
        profile = getattr(user, "doctor_profile", None)
        return bool(profile and profile.status == "APPROVED")


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

