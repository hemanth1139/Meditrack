from django.contrib import admin

from .models import OTPConsent, Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "patient_id",
        "user",
        "hospital",
        "blood_group",
        "gender",
        "created_at",
    )
    list_filter = ("hospital", "blood_group", "gender", "created_at")
    search_fields = ("patient_id", "user__username", "user__first_name", "user__last_name")


@admin.register(OTPConsent)
class OTPConsentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "requested_by", "requesting_hospital", "is_used", "expires_at", "created_at")
    list_filter = ("requesting_hospital", "is_used", "expires_at")
    search_fields = ("patient__patient_id", "requested_by__username")

