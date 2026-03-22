from axes.decorators import axes_dispatch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import generics, permissions
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from audit.models import AuditLog
from common.utils import api_response
from .serializers import RegisterSerializer
from .serializers_auth import LoginSerializer


class LoginRateThrottle(AnonRateThrottle):
    """Rate limit login to 10 requests per minute per IP."""

    rate = "10/min"


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

