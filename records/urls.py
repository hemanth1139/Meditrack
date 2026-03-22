from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicalRecordViewSet

router = DefaultRouter()
router.register("", MedicalRecordViewSet, basename="record")

urlpatterns = [
    path("", include(router.urls)),
]

