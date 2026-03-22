from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

from audit.models import AuditLog


@receiver(user_logged_in)
def log_login(sender, request, user, **kwargs):
    """Create audit log entry on every login."""
    AuditLog.objects.create(
        user=user,
        action="LOGIN",
        target_model="User",
        target_id=user.id,
        description="User logged in via signal",
        ip_address=request.META.get("REMOTE_ADDR"),
    )

