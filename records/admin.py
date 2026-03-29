from django.contrib import admin

from .models import MedicalRecord, Prescription, MedicalDocument

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "hospital",
        "visit_type",
        "status",
        "created_by",
        "approved_by",
        "created_at",
        "approved_at",
    )
    list_filter = ("status", "visit_type", "hospital", "created_at", "approved_at")
    search_fields = ("patient__patient_id", "diagnosis", "doctor_notes")

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "record", "medicine_name")

@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "record", "label", "doc_type")
