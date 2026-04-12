from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import generics, permissions, viewsets, views
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from axes.decorators import axes_dispatch
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from meditrack.utils import api_response, send_email
from .permissions import IsAdminUserRole, IsHospitalAdmin
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, NotificationSerializer

class LoginRateThrottle(AnonRateThrottle):
    rate = '20/min'

class AuthMeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
        
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(True, serializer.data, "Current user fetched")

User = get_user_model()

from rest_framework import filters
from .models import AuditLog, Notification
from .serializers import AuditLogSerializer, NotificationSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs.
    ADMINs can view all logs, HOSPITAL_ADMINs can view logs from their hospital.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("user").all().order_by("-timestamp")
        user = self.request.user
        if user.role == "HOSPITAL_ADMIN":
            return qs.filter(user__hospital=user.hospital)
        elif user.role == "ADMIN":
            return qs
        return qs.none()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        
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
            }, "Logs fetched")

        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Logs fetched")


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
            if user.hospital_id != request.user.hospital_id or user.role not in ["STAFF", "DOCTOR"]:
                return api_response(False, None, "Permission denied")
        reason = request.data.get("reason", "").strip()
        if not reason:
            return api_response(False, None, "A reason must be provided")
        user.is_active = False
        user.save()
        AuditLog.objects.create(
            user=request.user,
            action="USER_DEACTIVATED",
            target_model="User",
            target_id=str(user.id),
            description=f"User {user.email} deactivated. Reason: {reason}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "User deactivated")

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        user = self.get_object()
        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"]:
            return api_response(False, None, "Permission denied")
        if request.user.role == "HOSPITAL_ADMIN":
            if user.hospital_id != request.user.hospital_id or user.role not in ["STAFF", "DOCTOR"]:
                return api_response(False, None, "Permission denied")
        
        user.is_active = True
        user.save()
        AuditLog.objects.create(
            user=request.user,
            action="USER_ACTIVATED",
            target_model="User",
            target_id=str(user.id),
            description=f"User {user.email} activated.",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "User activated")

class DoctorAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin to manage doctors (Approved vs Pending).
    """
    queryset = User.objects.filter(role=User.Roles.DOCTOR).order_by("-id")
    serializer_class = UserSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsAdminUserRole()]

    @action(detail=False, methods=["get"], url_path="approved")
    def approved(self, request):
        qs = self.get_queryset().filter(is_verified=True, is_active=True)
        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Approved doctors")

    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        qs = self.get_queryset().filter(is_verified=False, is_active=True)
        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Pending doctors")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        doctor = self.get_object()
        doctor.is_verified = True
        doctor.save()
        AuditLog.objects.create(
            user=request.user,
            action="DOCTOR_APPROVED",
            target_model="User",
            target_id=str(doctor.id),
            description=f"Doctor {doctor.email} approved",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "Doctor approved")


class StaffCreationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Hospital Admins to create new staff natively.
    """
    serializer_class = UserSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = User.objects.filter(role=User.Roles.STAFF).order_by("-date_joined")
        if self.request.user.role == "HOSPITAL_ADMIN":
            return qs.filter(hospital=self.request.user.hospital)
        elif self.request.user.role == "ADMIN":
            return qs
        return qs.none()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"]:
            return api_response(False, None, "Permission denied")

        data = request.data
        email = data.get("email")
        password = data.get("password")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")

        role_title = data.get("role_title", "Nurse")
        department = data.get("department", "")
        phone = data.get("phone", "")

        if not email or not password:
            return api_response(False, None, "Email and password are required")
            
        if User.objects.filter(email=email).exists():
            return api_response(False, None, "User with this email already exists")

        # Robust username generation
        base_username = email.split("@")[0]

        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=User.Roles.STAFF,
            role_title=role_title,
            department=department,
            phone=phone,
            hospital=request.user.hospital,
            created_by=request.user,
            is_verified=True,
            is_active=True
        )
        user.set_password(password)
        user.save()

        from accounts.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action="STAFF_CREATED",
            target_model="User",
            target_id=str(user.id),
            description=f"Staff member {email} created for hospital {request.user.hospital.name if request.user.hospital else 'N/A'}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, self.get_serializer(user).data, "Staff created successfully")

    rate = "100/min"


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for patient or doctor self-registration.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        AuditLog.objects.create(
            user=user,
            action="REGISTER",
            target_model="User",
            target_id=user.id,
            description=f"User registered with role {user.role}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, {"id": user.id, "username": user.username}, "Registration successful")


@method_decorator(axes_dispatch, name="dispatch")
@method_decorator(never_cache, name="dispatch")
class LoginView(TokenObtainPairView):
    """
    Endpoint for user login returning JWT access and refresh tokens.
    Rate-limited and protected by django-axes.
    """

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = getattr(serializer, "user", None)
        if user is not None:
            AuditLog.objects.create(
                user=user,
                action="LOGIN",
                target_model="User",
                target_id=user.id,
                description="User logged in",
                ip_address=request.META.get("REMOTE_ADDR"),
            )

        response = api_response(True, {k: v for k, v in data.items() if k not in ["access", "refresh"]}, "Login successful")
        from django.conf import settings
        jwt_settings = getattr(settings, "SIMPLE_JWT", {})
        
        response.set_cookie(
            key=jwt_settings.get("AUTH_COOKIE", "access_token"),
            value=data["access"],
            expires=jwt_settings.get("ACCESS_TOKEN_LIFETIME"),
            secure=jwt_settings.get("AUTH_COOKIE_SECURE", False),
            httponly=jwt_settings.get("AUTH_COOKIE_HTTP_ONLY", True),
            samesite=jwt_settings.get("AUTH_COOKIE_SAMESITE", "Lax"),
            path=jwt_settings.get("AUTH_COOKIE_PATH", "/")
        )
        response.set_cookie(
            key=jwt_settings.get("AUTH_COOKIE_REFRESH", "refresh_token"),
            value=data["refresh"],
            expires=jwt_settings.get("REFRESH_TOKEN_LIFETIME"),
            secure=jwt_settings.get("AUTH_COOKIE_SECURE", False),
            httponly=jwt_settings.get("AUTH_COOKIE_HTTP_ONLY", True),
            samesite=jwt_settings.get("AUTH_COOKIE_SAMESITE", "Lax"),
            path=jwt_settings.get("AUTH_COOKIE_PATH", "/")
        )
        return response


class RefreshTokenView(TokenRefreshView):
    """
    Endpoint to refresh JWT tokens.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from django.conf import settings
        jwt_settings = getattr(settings, "SIMPLE_JWT", {})
        refresh_cookie_name = jwt_settings.get("AUTH_COOKIE_REFRESH", "refresh_token")
        
        # Inject the refresh token from the cookie into request data so simplejwt can validate it
        if refresh_cookie_name in request.COOKIES and 'refresh' not in request.data:
            request.data['refresh'] = request.COOKIES[refresh_cookie_name]

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            custom_response = api_response(True, {k: v for k, v in response.data.items() if k not in ["access", "refresh"]}, "Token refreshed")
            custom_response.set_cookie(
                key=jwt_settings.get("AUTH_COOKIE", "access_token"),
                value=response.data["access"],
                expires=jwt_settings.get("ACCESS_TOKEN_LIFETIME"),
                secure=jwt_settings.get("AUTH_COOKIE_SECURE", False),
                httponly=jwt_settings.get("AUTH_COOKIE_HTTP_ONLY", True),
                samesite=jwt_settings.get("AUTH_COOKIE_SAMESITE", "Lax"),
                path=jwt_settings.get("AUTH_COOKIE_PATH", "/")
            )
            if "refresh" in response.data:
                custom_response.set_cookie(
                    key=jwt_settings.get("AUTH_COOKIE_REFRESH", "refresh_token"),
                    value=response.data["refresh"],
                    expires=jwt_settings.get("REFRESH_TOKEN_LIFETIME"),
                    secure=jwt_settings.get("AUTH_COOKIE_SECURE", False),
                    httponly=jwt_settings.get("AUTH_COOKIE_HTTP_ONLY", True),
                    samesite=jwt_settings.get("AUTH_COOKIE_SAMESITE", "Lax"),
                    path=jwt_settings.get("AUTH_COOKIE_PATH", "/")
                )
            return custom_response
        return api_response(False, response.data, "Token refresh failed")


class LogoutView(generics.GenericAPIView):
    """
    Endpoint to blacklist refresh token (logout).
    """

    def post(self, request, *args, **kwargs):
        from django.conf import settings
        jwt_settings = getattr(settings, "SIMPLE_JWT", {})
        refresh_cookie_name = jwt_settings.get("AUTH_COOKIE_REFRESH", "refresh_token")
        
        refresh_token = request.data.get("refresh") or request.COOKIES.get(refresh_cookie_name)
        if not refresh_token:
            return api_response(False, None, "Refresh token required")
            
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass # Ignore invalid tokens during logout
            
        response = api_response(True, None, "Logged out")
        response.delete_cookie(jwt_settings.get("AUTH_COOKIE", "access_token"))
        response.delete_cookie(refresh_cookie_name)
        return response

 


from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

class NotificationReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return api_response(True, None, "Notifications marked as read")

