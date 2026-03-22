from rest_framework import serializers

from .models import Hospital


class HospitalSerializer(serializers.ModelSerializer):
    """Serializer for creating and viewing hospital data."""

    class Meta:
        model = Hospital
        fields = "__all__"
        read_only_fields = ("id", "created_at")

