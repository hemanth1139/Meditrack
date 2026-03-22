from django.utils.dateparse import parse_datetime
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminUserRole
from common.utils import api_response
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    Endpoint for admins to view audit logs with filters.
    Filterable by user, action, and date range.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AuditLog.objects.all().order_by("-timestamp")
        # Role-based scoping
        if self.request.user.role == "HOSPITAL_ADMIN":
            qs = qs.filter(user__hospital=self.request.user.hospital)
        elif self.request.user.role != "ADMIN":
            return AuditLog.objects.none()

        hospital_id = self.request.query_params.get("hospital_id")
        if hospital_id and self.request.user.role == "ADMIN":
            qs = qs.filter(user__hospital_id=hospital_id)
        user_id = self.request.query_params.get("user")
        action = self.request.query_params.get("action")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if user_id:
            qs = qs.filter(user_id=user_id)
        if action:
            qs = qs.filter(action=action)
        if date_from:
            dt = parse_datetime(date_from)
            if dt:
                qs = qs.filter(timestamp__gte=dt)
        if date_to:
            dt = parse_datetime(date_to)
            if dt:
                qs = qs.filter(timestamp__lte=dt)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return api_response(True, serializer.data, "Audit logs fetched")

