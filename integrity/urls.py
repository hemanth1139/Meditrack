from django.urls import path

from .views import VerifyIntegrityView

urlpatterns = [
    path("verify/<str:patient_id>/", VerifyIntegrityView.as_view(), name="integrity-verify"),
]

