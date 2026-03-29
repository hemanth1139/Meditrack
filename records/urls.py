from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicalRecordViewSet, MedicalDocumentViewSet

router = DefaultRouter()
router.register("documents", MedicalDocumentViewSet, basename="document")
router.register("", MedicalRecordViewSet, basename="record")

urlpatterns = [
    path("", include(router.urls)),
]

