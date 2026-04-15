from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView, LogoutView, RefreshTokenView, RegisterView,
    UserViewSet, NotificationListView, NotificationReadView,
    DoctorAdminViewSet, AuditLogViewSet, AuthMeView, SendOTPView,
    ChangePasswordView, Setup2FAView, Verify2FAView
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"users/doctors", DoctorAdminViewSet, basename="doctor")
router.register(r"audit/logs", AuditLogViewSet, basename="auditlogs")

urlpatterns = [
    path("auth/me/", AuthMeView.as_view(), name="auth_me"),
    path("auth/send-otp/", SendOTPView.as_view(), name="send_otp"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("auth/2fa/setup/", Setup2FAView.as_view(), name="setup_2fa"),
    path("auth/2fa/verify/", Verify2FAView.as_view(), name="verify_2fa"),
    path("auth/token/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/read/", NotificationReadView.as_view(), name="notifications-read"),
    path("", include(router.urls)),
]
