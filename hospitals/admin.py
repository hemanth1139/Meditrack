from django.contrib import admin

from .models import Hospital


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "city", "state", "phone", "email", "is_active", "created_at")
    list_filter = ("city", "state", "is_active")
    search_fields = ("name", "city", "state", "email")

