from rest_framework import serializers


class HospitalAnalyticsSerializer(serializers.Serializer):
    """Serializer for hospital-level analytics response."""

    total_patients = serializers.IntegerField()
    total_doctors = serializers.IntegerField()
    records_this_month = serializers.IntegerField()
    pending_doctor_approvals = serializers.IntegerField()
    flagged_records = serializers.IntegerField()
    monthly_activity = serializers.ListField(child=serializers.DictField())
    top_diagnoses = serializers.ListField(child=serializers.DictField())


class DoctorAnalyticsSerializer(serializers.Serializer):
    """Serializer for doctor-level analytics response."""

    my_patients = serializers.IntegerField()
    my_approvals = serializers.IntegerField()
    my_pending_queue = serializers.IntegerField()
    diagnosis_breakdown = serializers.DictField(child=serializers.IntegerField())

