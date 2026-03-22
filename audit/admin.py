from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "action", "user", "target_model", "target_id", "ip_address", "timestamp")
    list_filter = ("action", "target_model", "timestamp")
    search_fields = ("action", "target_model", "target_id", "user__username", "ip_address")

