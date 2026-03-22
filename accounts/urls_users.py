from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views_users import DoctorAdminViewSet, StaffCreationViewSet, UserViewSet

router = DefaultRouter()
router.register("", UserViewSet, basename="user")
router.register("doctors", DoctorAdminViewSet, basename="doctor-admin")
router.register("create-staff", StaffCreationViewSet, basename="create-staff")

urlpatterns = [
    path("", include(router.urls)),
]

