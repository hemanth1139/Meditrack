from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone

from common.utils import sha256_hash
from audit.models import AuditLog
from .models import MedicalRecord


@receiver(pre_save, sender=MedicalRecord)
def enforce_immutability(sender, instance: MedicalRecord, **kwargs):
    """
    Prevent edits to key fields after a record has been approved.
    """
    if not instance.pk:
        return
    previous = MedicalRecord.objects.get(pk=instance.pk)
    if previous.status == MedicalRecord.Status.APPROVED:
        immutable_fields = ["diagnosis", "notes", "file", "record_type", "visit_date"]
        for field in immutable_fields:
            if getattr(previous, field) != getattr(instance, field):
                from django.core.exceptions import ValidationError

                raise ValidationError("Approved records cannot be modified.")


@receiver(post_save, sender=MedicalRecord)
def compute_hash_chain_and_audit(sender, instance: MedicalRecord, created: bool, **kwargs):
    """
    When a record becomes APPROVED, compute its hash and link to previous.
    Also create audit logs on creation and status changes.
    """
    if created:
        AuditLog.objects.create(
            user=instance.created_by,
            action="RECORD_CREATED",
            target_model="MedicalRecord",
            target_id=str(instance.id),
            description=f"Record created with status {instance.status}",
            ip_address=None,
        )

    # Status change handling
    if instance.status == MedicalRecord.Status.APPROVED and not instance.record_hash:
        # Compute record_hash
        payload = (
            instance.patient.patient_id
            + instance.record_type
            + (instance.diagnosis or "")
            + (instance.notes or "")
            + instance.visit_date.isoformat()
            + instance.created_at.isoformat()
        )
        instance.record_hash = sha256_hash(payload)
        # prev_hash is last approved record_hash or 'GENESIS'
        last = (
            MedicalRecord.objects.filter(
                patient=instance.patient,
                status=MedicalRecord.Status.APPROVED,
            )
            .exclude(pk=instance.pk)
            .order_by("-approved_at")
            .first()
        )
        instance.prev_hash = last.record_hash if last else "GENESIS"
        instance.approved_at = timezone.now()
        MedicalRecord.objects.filter(pk=instance.pk).update(
            record_hash=instance.record_hash,
            prev_hash=instance.prev_hash,
            approved_at=instance.approved_at,
        )
        AuditLog.objects.create(
            user=instance.approved_by or instance.created_by,
            action="RECORD_APPROVED",
            target_model="MedicalRecord",
            target_id=str(instance.id),
            description="Record approved and added to hash chain",
            ip_address=None,
        )

