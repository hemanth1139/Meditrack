from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicalRecordViewSet, MedicalDocumentViewSet, VerifyIntegrityView

router = DefaultRouter()
router.register("documents", MedicalDocumentViewSet, basename="document")
router.register("", MedicalRecordViewSet, basename="record")

urlpatterns = [
    path("integrity/verify/<str:patient_id>/", VerifyIntegrityView.as_view(), name="verify-integrity"),
    path("", include(router.urls)),
]

