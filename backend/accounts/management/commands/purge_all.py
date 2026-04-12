from django.core.management.base import BaseCommand
from decouple import config


KEEP_HOSPITALS = [
    "City General Hospital",
    "Metro Health Center",
    "Westside Clinic",
]


class Command(BaseCommand):
    help = "Purges ALL data except the superadmin and the 3 core hospitals."

    def handle(self, *args, **kwargs):
        from accounts.models import User, AuditLog, Notification
        from hospitals.models import Hospital
        from patients.models import Patient
        from records.models import MedicalRecord, Prescription, MedicalDocument

        admin_email = config("ADMIN_EMAIL", default="admin@meditrack.com")

        self.stdout.write("Starting purge — this is irreversible!")

        # 1. Delete all medical documents
        doc_count = MedicalDocument.objects.count()
        MedicalDocument.objects.all().delete()
        self.stdout.write(f"Deleted {doc_count} medical documents")

        # 2. Delete all prescriptions
        rx_count = Prescription.objects.count()
        Prescription.objects.all().delete()
        self.stdout.write(f"Deleted {rx_count} prescriptions")

        # 3. Delete all medical records
        rec_count = MedicalRecord.objects.count()
        MedicalRecord.objects.all().delete()
        self.stdout.write(f"Deleted {rec_count} medical records")

        # 4. Delete all vitals
        try:
            from patients.models import Vitals
            vit_count = Vitals.objects.count()
            Vitals.objects.all().delete()
            self.stdout.write(f"Deleted {vit_count} vitals")
        except Exception as e:
            self.stdout.write(f"Vitals skip: {e}")

        # 5. Delete all patient profiles
        pat_count = Patient.objects.count()
        Patient.objects.all().delete()
        self.stdout.write(f"Deleted {pat_count} patient profiles")

        # 6. Delete all non-admin users (doctors, staff, hospital admins, patients)
        users_to_delete = User.objects.exclude(email=admin_email)
        user_count = users_to_delete.count()
        users_to_delete.delete()
        self.stdout.write(f"Deleted {user_count} users (doctors, staff, hospital admins, patients)")

        # 7. Delete extra hospitals (keep only the 3 core ones)
        extra_hospitals = Hospital.objects.exclude(name__in=KEEP_HOSPITALS)
        extra_count = extra_hospitals.count()
        extra_hospitals.delete()
        self.stdout.write(f"Deleted {extra_count} extra hospitals")
        self.stdout.write(f"Kept hospitals: {', '.join(KEEP_HOSPITALS)}")

        # 8. Clear audit logs and notifications
        log_count = AuditLog.objects.count()
        AuditLog.objects.all().delete()
        self.stdout.write(f"Deleted {log_count} audit log entries")

        notif_count = Notification.objects.count()
        Notification.objects.all().delete()
        self.stdout.write(f"Deleted {notif_count} notifications")

        # Summary
        self.stdout.write("")
        self.stdout.write("Purge complete. Remaining:")
        self.stdout.write(f"  Users:     {User.objects.count()} (superadmin only)")
        self.stdout.write(f"  Hospitals: {Hospital.objects.count()}")
        self.stdout.write(f"  Patients:  {Patient.objects.count()}")
        self.stdout.write(f"  Records:   {MedicalRecord.objects.count()}")
