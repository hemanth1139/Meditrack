from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView, LogoutView, RefreshTokenView, RegisterView,
    UserViewSet, NotificationListView, NotificationReadView,
    DoctorAdminViewSet, StaffCreationViewSet, AuditLogViewSet, AuthMeView
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"users/doctors", DoctorAdminViewSet, basename="doctor")
router.register(r"users/staff", StaffCreationViewSet, basename="staff")
router.register(r"audit/logs", AuditLogViewSet, basename="auditlogs")

urlpatterns = [
    path("auth/me/", AuthMeView.as_view(), name="auth_me"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/token/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/read/", NotificationReadView.as_view(), name="notifications-read"),
    path("", include(router.urls)),
]
