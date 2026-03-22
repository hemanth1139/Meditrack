from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from audit.models import AuditLog
from common.utils import api_response, send_email
from .models import DoctorProfile, StaffProfile
from .permissions import IsAdminUserRole, IsHospitalAdmin
from .serializers import DoctorProfileSerializer, UserSerializer

User = get_user_model()


from rest_framework import filters

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving users.
    Admin can list all; users can retrieve own details.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "email", "phone"]

    def get_permissions(self):
        if self.action == "list":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        role = request.query_params.get("role")
        hospital_id = request.query_params.get("hospital_id")

        # Admin can list all users with optional filters.
        if request.user.role == "ADMIN":
            if role:
                qs = qs.filter(role=role)
            if hospital_id:
                qs = qs.filter(hospital_id=hospital_id)
        # Hospital Admin can only list users in their hospital (typically STAFF/DOCTOR/PATIENT).
        elif request.user.role == "HOSPITAL_ADMIN":
            qs = qs.filter(hospital=request.user.hospital)
            if role:
                qs = qs.filter(role=role)
        # Doctor can list STAFF in their hospital to assign them patients
        elif request.user.role == "DOCTOR":
            qs = qs.filter(hospital=request.user.hospital, role="STAFF")
        else:
            return api_response(False, None, "Permission denied")

        qs = self.filter_queryset(qs.order_by("-id"))
        
        # Override page_size if limit is provided
        limit = request.query_params.get("limit")
        if limit and hasattr(self, 'paginator') and hasattr(self.paginator, 'page_size'):
            self.paginator.page_size = int(limit)
            
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return api_response(True, {
                "data": serializer.data,
                "total": self.paginator.page.paginator.count,
                "page": self.paginator.page.number,
                "totalPages": self.paginator.page.paginator.num_pages
            }, "Users list")

        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Users list")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"] and instance.id != request.user.id:
            return api_response(False, None, "Permission denied")
        if request.user.role == "HOSPITAL_ADMIN" and instance.hospital_id != request.user.hospital_id:
            return api_response(False, None, "Permission denied")
        serializer = self.get_serializer(instance)
        return api_response(True, serializer.data, "User detail")

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"]:
            return api_response(False, None, "Permission denied")
        if request.user.role == "HOSPITAL_ADMIN":
            if user.hospital_id != request.user.hospital_id or user.role != "STAFF":
                return api_response(False, None, "Permission denied")
        user.is_active = False
        user.save()
        AuditLog.objects.create(
            user=request.user,
            action="USER_DEACTIVATED",
            target_model="User",
            target_id=str(user.id),
            description="User deactivated",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "User deactivated")


class DoctorAdminViewSet(viewsets.GenericViewSet):
    """
    Admin viewset for approving, rejecting, and listing pending doctors.
    """

    queryset = DoctorProfile.objects.select_related("user")
    serializer_class = DoctorProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["user__first_name", "user__last_name", "user__email", "user__phone", "specialization", "department"]

    def _is_allowed(self, request):
        return request.user.role in ["ADMIN", "HOSPITAL_ADMIN"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None)
        if user and getattr(user, "role", None) == "HOSPITAL_ADMIN":
            return qs.filter(user__hospital=user.hospital)
        return qs

    @action(detail=True, methods=["post"], url_path="approve")
    def approve_doctor(self, request, pk=None):
        doctor = self.get_object()
        doctor.status = DoctorProfile.Status.APPROVED
        doctor.rejection_reason = None
        doctor.save()
        doctor.user.is_verified = True
        doctor.user.save()
        send_email(
            "Doctor Approval",
            "Your doctor account has been approved.",
            doctor.user.email,
        )
        AuditLog.objects.create(
            user=request.user,
            action="DOCTOR_APPROVED",
            target_model="DoctorProfile",
            target_id=doctor.id,
            description=f"Doctor {doctor.user.username} approved",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        serializer = self.get_serializer(doctor)
        return api_response(True, serializer.data, "Doctor approved")

    @action(detail=True, methods=["post"], url_path="reject")
    def reject_doctor(self, request, pk=None):
        doctor = self.get_object()
        reason = request.data.get("reason", "")
        doctor.status = DoctorProfile.Status.REJECTED
        doctor.rejection_reason = reason
        doctor.save()
        doctor.user.is_verified = False
        doctor.user.save()
        send_email(
            "Doctor Application Rejected",
            f"Your doctor application has been rejected. Reason: {reason}",
            doctor.user.email,
        )
        AuditLog.objects.create(
            user=request.user,
            action="DOCTOR_REJECTED",
            target_model="DoctorProfile",
            target_id=doctor.id,
            description=f"Doctor {doctor.user.username} rejected",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        serializer = self.get_serializer(doctor)
        return api_response(True, serializer.data, "Doctor rejected")

    @action(detail=False, methods=["get"], url_path="pending")
    def pending_doctors(self, request):
        if not self._is_allowed(request):
            return api_response(False, None, "Permission denied")
        qs = self.get_queryset().filter(status=DoctorProfile.Status.PENDING)
        qs = self.filter_queryset(qs.order_by("-id"))
        limit = request.query_params.get("limit")
        if limit and hasattr(self, 'paginator') and hasattr(self.paginator, 'page_size'):
            self.paginator.page_size = int(limit)
            
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return api_response(True, {
                "data": serializer.data,
                "total": self.paginator.page.paginator.count,
                "page": self.paginator.page.number,
                "totalPages": self.paginator.page.paginator.num_pages
            }, "Pending doctors")
            
        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Pending doctors")

    @action(detail=False, methods=["get"], url_path="approved")
    def approved_doctors(self, request):
        if not self._is_allowed(request):
            return api_response(False, None, "Permission denied")
        qs = self.get_queryset().filter(status=DoctorProfile.Status.APPROVED)
        qs = self.filter_queryset(qs.order_by("-id"))
        limit = request.query_params.get("limit")
        if limit and hasattr(self, 'paginator') and hasattr(self.paginator, 'page_size'):
            self.paginator.page_size = int(limit)
            
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return api_response(True, {
                "data": serializer.data,
                "total": self.paginator.page.paginator.count,
                "page": self.paginator.page.number,
                "totalPages": self.paginator.page.paginator.num_pages
            }, "Approved doctors")
            
        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Approved doctors")


class StaffCreationViewSet(viewsets.ViewSet):
    """
    Hospital Admin endpoint to create staff accounts.
    POST /api/users/create-staff/
    """

    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def create(self, request):
        full_name = (request.data.get("full_name") or "").strip()
        email = request.data.get("email")
        password = request.data.get("password")
        phone = request.data.get("phone", "")
        department = request.data.get("department", "")
        role_title = request.data.get("role_title", "")

        if not (full_name and email and password and department and role_title):
            return api_response(False, None, "Missing required fields")

        first_name = full_name.split(" ")[0]
        last_name = " ".join(full_name.split(" ")[1:])

        staff = User.objects.create(
            username=email.split("@")[0],
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=User.Roles.STAFF,
            hospital=request.user.hospital,
            is_active=True,
            is_verified=True,
        )
        staff.set_password(password)
        staff.save()

        StaffProfile.objects.create(
            user=staff,
            department=department,
            role_title=role_title,
            created_by=request.user,
        )

        AuditLog.objects.create(
            user=request.user,
            action="STAFF_CREATED",
            target_model="User",
            target_id=str(staff.id),
            description="Staff account created by hospital admin",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return api_response(
            True,
            {"email": staff.email, "password": password},
            "Staff account created successfully",
        )

