from django.contrib import admin

from .models import MedicalRecord


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "hospital",
        "record_type",
        "status",
        "created_by",
        "approved_by",
        "created_at",
        "approved_at",
    )
    list_filter = ("status", "record_type", "hospital", "created_at", "approved_at")
    search_fields = ("patient__patient_id", "diagnosis", "notes")

