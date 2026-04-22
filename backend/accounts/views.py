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
import random, hashlib
from django.core.cache import cache

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


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, retrieving, and creating users.
    Admin can list/create all; users can retrieve own details.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "email", "phone"]

    http_method_names = ["get", "post", "head", "options"]  # no PUT/PATCH/DELETE

    def get_permissions(self):
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Admin creates a HOSPITAL_ADMIN or DOCTOR account directly."""
        if request.user.role != "ADMIN":
            return api_response(False, None, "Only Super Admin can create users this way", status=403)

        data = request.data
        role = data.get("role", "").strip().upper()
        allowed_roles = ["HOSPITAL_ADMIN", "DOCTOR", "STAFF"]
        if role not in allowed_roles:
            return api_response(False, None, f"Role must be one of: {', '.join(allowed_roles)}", status=400)

        email = data.get("email", "").strip()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        phone = data.get("phone", "").strip()
        password = data.get("password", "").strip()
        hospital_id = data.get("hospital_id")

        if not email:
            return api_response(False, None, "Email is required", status=400)
        if not password:
            return api_response(False, None, "Password is required", status=400)

        if User.objects.filter(email__iexact=email).exists():
            return api_response(False, None, "A user with this email already exists", status=400)

        # Username: prefer explicit, else derive from email
        username = data.get("username", "").strip() or email.split("@")[0]
        base = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(password)
        except DjangoValidationError as e:
            return api_response(False, None, " ".join(e.messages), status=400)

        hospital = None
        if hospital_id:
            from hospitals.models import Hospital
            try:
                hospital = Hospital.objects.get(id=hospital_id)
            except Hospital.DoesNotExist:
                return api_response(False, None, "Hospital not found", status=400)

        # Role-specific fields
        specialization = data.get("specialization", "").strip()
        qualification = data.get("qualification", "").strip()
        department = data.get("department", "").strip()
        medical_reg_number = data.get("medical_reg_number", "").strip() or None
        medical_council = data.get("medical_council", "").strip()
        years_of_experience = data.get("years_of_experience")
        role_title = data.get("role_title", "").strip()

        if medical_reg_number and User.objects.filter(medical_reg_number=medical_reg_number).exists():
            return api_response(False, None, "A doctor with this registration number already exists", status=400)

        new_user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
            hospital=hospital,
            created_by=request.user,
            is_active=True,
            requires_password_change=True,
            # Doctor fields
            specialization=specialization,
            qualification=qualification,
            department=department,
            medical_reg_number=medical_reg_number,
            medical_council=medical_council,
            years_of_experience=int(years_of_experience) if years_of_experience else None,
            # Staff field
            role_title=role_title,
        )

        if role == "HOSPITAL_ADMIN":
            new_user.is_verified = True
            new_user.status = User.DoctorStatus.APPROVED

        elif role == "DOCTOR":
            # Admin-created doctors are auto-approved (Admin vouches for them)
            new_user.is_verified = True
            new_user.status = User.DoctorStatus.APPROVED

        elif role == "STAFF":
            new_user.is_verified = True

        new_user.set_password(password)
        new_user.save()

        AuditLog.objects.create(
            user=request.user,
            action="USER_CREATED",
            target_model="User",
            target_id=str(new_user.id),
            description=(
                f"Admin created {role} account for {email} "
                f"(hospital: {hospital.name if hospital else 'N/A'})"
            ),
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return api_response(True, self.get_serializer(new_user).data, f"{role} account created successfully")

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

    @action(detail=False, methods=["post"], url_path="create-staff")
    def create_staff(self, request):
        """Create a new STAFF account. Only ADMIN or HOSPITAL_ADMIN may call this."""
        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"]:
            return api_response(False, None, "Permission denied", status=403)

        data = request.data
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        role_title = data.get("role_title", "Staff").strip()
        department = data.get("department", "").strip()
        phone = data.get("phone", "").strip()

        if not email or not password:
            return api_response(False, None, "Email and password are required")

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(password)
        except ValidationError as e:
            return api_response(False, None, " ".join(e.messages), status=400)

        if User.objects.filter(email__iexact=email).exists():
            return api_response(False, None, "A user with this email already exists")

        # Unique username from email prefix
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
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
            is_active=True,
            requires_password_change=True,
        )
        user.set_password(password)  # hash before first save
        user.save()

        AuditLog.objects.create(
            user=request.user,
            action="STAFF_CREATED",
            target_model="User",
            target_id=str(user.id),
            description=(
                f"Staff member {email} created for hospital "
                f"{request.user.hospital.name if request.user.hospital else 'N/A'}"
            ),
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, self.get_serializer(user).data, "Staff created successfully")

class DoctorAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin and Hospital Admin to manage doctors (Approved vs Pending).
    """
    serializer_class = UserSerializer

    def get_permissions(self):
        return [IsAuthenticated(), (IsAdminUserRole | IsHospitalAdmin)()]

    def get_queryset(self):
        qs = User.objects.filter(role=User.Roles.DOCTOR).order_by("-id")
        user = self.request.user
        # Hospital admins can only see doctors in their own hospital
        if user.role == "HOSPITAL_ADMIN":
            qs = qs.filter(hospital=user.hospital)
        return qs

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
        if request.user.role == "HOSPITAL_ADMIN" and doctor.hospital_id != request.user.hospital_id:
            return api_response(False, None, "Permission denied")
        doctor.is_verified = True
        doctor.status = "APPROVED"
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

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        doctor = self.get_object()
        if request.user.role == "HOSPITAL_ADMIN" and doctor.hospital_id != request.user.hospital_id:
            return api_response(False, None, "Permission denied")
        reason = request.data.get("reason", "").strip()
        doctor.is_verified = False
        doctor.status = "REJECTED"
        doctor.rejection_reason = reason
        doctor.save()
        AuditLog.objects.create(
            user=request.user,
            action="DOCTOR_REJECTED",
            target_model="User",
            target_id=str(doctor.id),
            description=f"Doctor {doctor.email} rejected. Reason: {reason}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "Doctor rejected")

    @action(detail=False, methods=["post"], url_path="create-doctor")
    def create_doctor(self, request):
        """
        Hospital Admin (or Super Admin) directly creates a doctor.
        The doctor is auto-approved instantly and must change password on first login.
        Certificate upload is mandatory.
        """
        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"]:
            return api_response(False, None, "Permission denied", status=403)

        data = request.data
        certificate_file = request.FILES.get("certificate")
        if not certificate_file:
            return api_response(False, None, "Medical certificate is required", status=400)

        # Required fields
        email = data.get("email", "").strip()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        phone = data.get("phone", "").strip()
        specialization = data.get("specialization", "").strip()
        qualification = data.get("qualification", "").strip()
        department = data.get("department", "").strip()
        medical_reg_number = data.get("medical_reg_number", "").strip()
        medical_council = data.get("medical_council", "").strip()
        years_of_experience = data.get("years_of_experience")
        password = data.get("password", "").strip()

        missing = [f for f, v in [
            ("email", email), ("first_name", first_name), ("specialization", specialization),
            ("qualification", qualification), ("department", department),
            ("medical_reg_number", medical_reg_number), ("medical_council", medical_council),
        ] if not v]
        if missing:
            return api_response(False, None, f"Missing required fields: {', '.join(missing)}", status=400)

        if User.objects.filter(email__iexact=email).exists():
            return api_response(False, None, "A user with this email already exists", status=400)

        if medical_reg_number and User.objects.filter(medical_reg_number=medical_reg_number).exists():
            return api_response(False, None, "A doctor with this registration number already exists", status=400)

        # Unique username from email prefix
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Use a temporary password if none provided; doctor MUST change it on first login
        from django.utils.crypto import get_random_string
        temp_password = password or get_random_string(12)

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(temp_password)
        except DjangoValidationError as e:
            return api_response(False, None, " ".join(e.messages), status=400)

        hospital = request.user.hospital if request.user.role == "HOSPITAL_ADMIN" else None
        hospital_id = data.get("hospital_id")
        if request.user.role == "ADMIN" and hospital_id:
            from hospitals.models import Hospital
            try:
                hospital = Hospital.objects.get(id=hospital_id)
            except Hospital.DoesNotExist:
                return api_response(False, None, "Hospital not found", status=400)

        doctor = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=User.Roles.DOCTOR,
            hospital=hospital,
            specialization=specialization,
            qualification=qualification,
            department=department,
            medical_reg_number=medical_reg_number or None,
            medical_council=medical_council,
            years_of_experience=int(years_of_experience) if years_of_experience else None,
            created_by=request.user,
            is_verified=True,
            status=User.DoctorStatus.APPROVED,
            is_active=True,
            requires_password_change=True,
        )
        doctor.set_password(temp_password)
        doctor.save()

        # Upload certificate
        from .serializers import _upload_certificate
        _upload_certificate(doctor, certificate_file)

        AuditLog.objects.create(
            user=request.user,
            action="DOCTOR_CREATED",
            target_model="User",
            target_id=str(doctor.id),
            description=(
                f"Doctor {email} created directly by {request.user.role} "
                f"{request.user.email} for hospital "
                f"{hospital.name if hospital else 'N/A'}"
            ),
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return api_response(
            True,
            {
                **self.get_serializer(doctor).data,
                "temp_password": temp_password,  # Return so admin can share with doctor
            },
            "Doctor created successfully",
        )


class SendOTPView(views.APIView):
    """
    Endpoint to send an OTP via SMS to the user's phone for registration verification.
    Phone numbers are normalised to E.164 format (+91 prefix for Indian numbers).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        phone = request.data.get("phone", "").strip()
        email = request.data.get("email", "").strip()
        if not phone:
            return api_response(False, None, "Phone number is required", status=400)
        if not email:
            return api_response(False, None, "Email is required", status=400)

        # Normalise to E.164: prepend +91 for 10-digit Indian numbers
        if phone.startswith("0"):
            phone = phone[1:]  # strip leading 0
        if not phone.startswith("+"):
            phone = "+91" + phone

        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(phone=phone).exists():
            return api_response(False, None, "A user with this phone number already exists", status=400)
        if User.objects.filter(email__iexact=email).exists():
            return api_response(False, None, "A user with this email already exists", status=400)

        import random
        import hashlib
        from django.core.cache import cache
        otp = str(random.randint(100000, 999999))
        cache_key = f"register_otp_{phone}"

        hashed_otp = hashlib.sha256(otp.encode("utf-8")).hexdigest()
        cache.set(cache_key, hashed_otp, timeout=600)  # Valid for 10 minutes

        # Send OTP via SMS using Twilio
        from meditrack.utils import send_sms
        from django.conf import settings
        import logging
        logger = logging.getLogger(__name__)

        sms_body = f"Your MediTrack verification code is: {otp}. It will expire in 10 minutes."
        success = send_sms(phone, sms_body)

        if not success:
            if settings.DEBUG:
                # Twilio trial accounts can only SMS verified numbers.
                # In dev mode: log OTP so registration can still be tested.
                logger.warning(
                    "[DEV] SMS failed for %s. OTP for manual testing: %s", phone, otp
                )
                return api_response(True, {"dev_otp": otp},
                                    "SMS unavailable (dev mode). Use the OTP from the server console.")
            return api_response(False, None, "Failed to send SMS. Please try again later.", status=500)

        return api_response(True, None, "Verification code sent to " + phone)


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for patient or doctor self-registration.
    Requires OTP verification for patients.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Verify OTP for patients
        if data.get("role") == "PATIENT":
            phone = data.get("phone", "").strip()
            otp = data.get("otp")
            if not otp:
                return api_response(False, None, "OTP is required for patient registration", status=400)

            # Normalise to E.164 so cache key matches what SendOTPView stored
            if phone.startswith("0"):
                phone = phone[1:]
            if not phone.startswith("+"):
                phone = "+91" + phone

            import hashlib
            from django.core.cache import cache
            cache_key = f"register_otp_{phone}"
            cached_hash = cache.get(cache_key)
            
            if not cached_hash:
                return api_response(False, None, "OTP has expired or is invalid", status=400)
                
            provided_hash = hashlib.sha256(str(otp).encode("utf-8")).hexdigest()
            if provided_hash != cached_hash:
                return api_response(False, None, "Invalid OTP", status=400)
                
            cache.delete(cache_key)

        serializer = self.get_serializer(data=data)
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

        # If the serializer returned a 2FA challenge (admin/hospital-admin), return it immediately
        if "requires_2fa" in data:
            return api_response(True, dict(data), "2FA required")

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
        cookie_name = jwt_settings.get("AUTH_COOKIE", "access_token")
        cookie_refresh = jwt_settings.get("AUTH_COOKIE_REFRESH", "refresh_token")
        cookie_samesite = jwt_settings.get("AUTH_COOKIE_SAMESITE", "Lax")
        
        # When unsetting cookies with SameSite=None, we must explicitly pass the 
        # same samesite policy back, otherwise the browser will refuse to delete it.
        response.delete_cookie(cookie_name, path="/", samesite=cookie_samesite)
        response.delete_cookie(cookie_refresh, path="/", samesite=cookie_samesite)
        
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


class ChangePasswordView(views.APIView):
    """
    Endpoint for users to change their password, updating requires_password_change.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return api_response(False, None, 'Old and new passwords are required', status=400)

        if not user.check_password(old_password):
            return api_response(False, None, 'Incorrect old password', status=400)

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return api_response(False, None, ' '.join(e.messages), status=400)

        user.set_password(new_password)
        user.requires_password_change = False
        user.save()

        AuditLog.objects.create(
            user=user,
            action='PASSWORD_CHANGED',
            target_model='User',
            target_id=str(user.id),
            description='User changed their password',
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return api_response(True, None, 'Password updated successfully')


import base64
import io
import pyotp
import qrcode
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken

class Setup2FAView(views.APIView):
    permission_classes = []

    def post(self, request):
        temp_token = request.data.get('temp_token')
        if not temp_token:
            return api_response(False, None, 'Token required', 400)
        
        user_id = cache.get(f"2fa_pending_{temp_token}")
        if not user_id:
            return api_response(False, None, 'Session expired', 400)
            
        user = User.objects.get(id=user_id)
        if user.totp_secret:
            return api_response(False, None, '2FA already setup', 400)
        
        secret = pyotp.random_base32()
        cache.set(f"2fa_staged_{temp_token}", secret, timeout=300)
        
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="MediTrack")
        
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return api_response(True, {
            "qr_code": f"data:image/png;base64,{qr_b64}",
            "secret": secret
        }, "2FA setup initiated")

class Verify2FAView(views.APIView):
    permission_classes = []

    def post(self, request):
        temp_token = request.data.get('temp_token')
        code = request.data.get('code')
        if not temp_token or not code:
            return api_response(False, None, 'Token and code required', 400)
            
        user_id = cache.get(f"2fa_pending_{temp_token}")
        if not user_id:
            return api_response(False, None, 'Session expired', 400)
            
        user = User.objects.get(id=user_id)
        
        secret = user.totp_secret
        if not secret:
            secret = cache.get(f"2fa_staged_{temp_token}")
            if not secret:
                return api_response(False, None, 'Setup required', 400)
                
        totp = pyotp.TOTP(secret)
        if not totp.verify(code):
            return api_response(False, None, 'Invalid authentication code', 400)
            
        if not user.totp_secret:
            user.totp_secret = secret
            user.save()
            
        cache.delete(f"2fa_pending_{temp_token}")
        cache.delete(f"2fa_staged_{temp_token}")
        
        refresh = RefreshToken.for_user(user)
        role = user.role or ("ADMIN" if user.is_superuser else "USER")
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "id": user.id,
            "email": user.email,
            "role": role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "hospital_id": getattr(user, "hospital_id", None),
            "requires_password_change": getattr(user, "requires_password_change", False)
        }
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
