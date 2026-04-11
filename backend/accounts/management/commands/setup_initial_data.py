from django.core.management.base import BaseCommand
from decouple import config


class Command(BaseCommand):
    help = "Creates the initial admin account and hospitals if they do not already exist."

    def handle(self, *args, **kwargs):
        from accounts.models import User
        from hospitals.models import Hospital

        # ── Admin ────────────────────────────────────────────────────
        admin_email = config("ADMIN_EMAIL", default="admin@meditrack.com")
        admin_password = config("ADMIN_PASSWORD", default="Admin123!")
        admin_username = config("ADMIN_USERNAME", default="admin")

        if not User.objects.filter(email=admin_email).exists():
            user = User.objects.create_superuser(admin_username, admin_email, admin_password)
            user.first_name = "System"
            user.last_name = "Administrator"
            user.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin created: {admin_email}"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️  Admin already exists: {admin_email}"))

        # ── Hospitals ─────────────────────────────────────────────────
        hospitals = [
            {"name": "City General Hospital",  "city": "New York",    "address": "123 City Center", "phone": "1112223333"},
            {"name": "Metro Health Center",     "city": "Chicago",     "address": "456 Metro Blvd",  "phone": "4445556666"},
            {"name": "Westside Clinic",         "city": "Los Angeles", "address": "789 West Ave",    "phone": "7778889999"},
        ]

        for h in hospitals:
            obj, created = Hospital.objects.get_or_create(
                name=h["name"],
                defaults={**h, "is_active": True},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Hospital created: {h['name']}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️  Hospital already exists: {h['name']}"))

        self.stdout.write(self.style.SUCCESS("🎉 Setup complete."))
