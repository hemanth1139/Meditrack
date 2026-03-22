from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from common.utils import api_response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # limit to last 20 for basic listing
        qs = qs[:20]
        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Notifications fetched")

    @action(detail=True, methods=["post"], url_path="read")
    def read(self, request, pk=None):
        try:
            notification = self.get_queryset().get(pk=pk)
            notification.is_read = True
            notification.save()
            return api_response(True, None, "Notification marked as read")
        except Notification.DoesNotExist:
            return api_response(False, None, "Notification not found", 404)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return api_response(True, None, "All notifications marked as read")
