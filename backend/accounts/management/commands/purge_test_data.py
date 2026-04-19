from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Purges all DOCTOR, PATIENT, and STAFF users plus all patients/records/vitals. Keeps ADMIN and HOSPITAL_ADMIN accounts and all hospitals intact."

    def handle(self, *args, **kwargs):
        from accounts.models import User, AuditLog, Notification
        from patients.models import Patient, Vitals, DoctorStaffAccess
        from records.models import MedicalRecord, Prescription, MedicalDocument

        self.stdout.write(self.style.WARNING("Starting targeted purge — irreversible!"))
        self.stdout.write("")

        # ── 1. Medical Documents ──────────────────────────────────
        doc_count = MedicalDocument.objects.count()
        MedicalDocument.objects.all().delete()
        self.stdout.write(f"  Deleted {doc_count} medical documents")

        # ── 2. Prescriptions ─────────────────────────────────────
        rx_count = Prescription.objects.count()
        Prescription.objects.all().delete()
        self.stdout.write(f"  Deleted {rx_count} prescriptions")

        # ── 3. Medical Records ────────────────────────────────────
        rec_count = MedicalRecord.objects.count()
        MedicalRecord.objects.all().delete()
        self.stdout.write(f"  Deleted {rec_count} medical records")

        # ── 4. DoctorStaffAccess entries ─────────────────────────
        dsa_count = DoctorStaffAccess.objects.count()
        DoctorStaffAccess.objects.all().delete()
        self.stdout.write(f"  Deleted {dsa_count} staff-patient access grants")

        # ── 5. Vitals ─────────────────────────────────────────────
        vit_count = Vitals.objects.count()
        Vitals.objects.all().delete()
        self.stdout.write(f"  Deleted {vit_count} vitals records")

        # ── 6. Patient profiles ───────────────────────────────────
        pat_count = Patient.objects.count()
        Patient.objects.all().delete()
        self.stdout.write(f"  Deleted {pat_count} patient profiles")

        # ── 7. Users: DOCTOR, PATIENT, STAFF only ─────────────────
        roles_to_delete = [User.Roles.DOCTOR, User.Roles.PATIENT, User.Roles.STAFF]
        target_users = User.objects.filter(role__in=roles_to_delete)
        user_count = target_users.count()
        breakdown = {r: User.objects.filter(role=r).count() for r in roles_to_delete}
        target_users.delete()
        self.stdout.write(
            f"  Deleted {user_count} users  "
            f"(doctors={breakdown[User.Roles.DOCTOR]}, "
            f"staff={breakdown[User.Roles.STAFF]}, "
            f"patients={breakdown[User.Roles.PATIENT]})"
        )

        # ── 8. Audit logs and notifications ───────────────────────
        log_count = AuditLog.objects.count()
        AuditLog.objects.all().delete()
        self.stdout.write(f"  Deleted {log_count} audit log entries")

        notif_count = Notification.objects.count()
        Notification.objects.all().delete()
        self.stdout.write(f"  Deleted {notif_count} notifications")

        # ── Summary ───────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Purge complete. Remaining in database:"))
        self.stdout.write(f"  Users         : {User.objects.count()}")
        for role in [User.Roles.ADMIN, User.Roles.HOSPITAL_ADMIN]:
            count = User.objects.filter(role=role).count()
            self.stdout.write(f"    {role:<18}: {count}")
        from hospitals.models import Hospital
        self.stdout.write(f"  Hospitals     : {Hospital.objects.count()}")
        self.stdout.write(f"  Patients      : {Patient.objects.count()}")
        self.stdout.write(f"  Medical Records: {MedicalRecord.objects.count()}")
        self.stdout.write("")
        self.stdout.write("Hospital admins and hospitals are untouched.")
