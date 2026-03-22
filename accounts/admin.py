from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import DoctorProfile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("id", "username", "email", "role", "hospital", "is_verified", "is_active")
    list_filter = ("role", "hospital", "is_verified", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("MediTrack", {"fields": ("role", "phone", "profile_photo", "hospital", "is_verified")}),
    )


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "specialization", "medical_reg_number", "status")
    list_filter = ("status", "specialization", "department", "medical_council")
    search_fields = ("user__username", "medical_reg_number")

