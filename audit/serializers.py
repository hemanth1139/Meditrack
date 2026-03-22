from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for viewing audit logs."""

    class Meta:
        model = AuditLog
        fields = "__all__"

