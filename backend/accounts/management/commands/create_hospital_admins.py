from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Creates hospital admin accounts for the 3 core hospitals."

    def handle(self, *args, **kwargs):
        from accounts.models import User
        from hospitals.models import Hospital

        admins = [
            {"hospital_name": "City General Hospital", "email": "admin@citygeneral.com", "first": "Alex",   "last": "Carter",   "username": "admin_citygeneral"},
            {"hospital_name": "Metro Health Center",   "email": "admin@metrohealth.com", "first": "Jordan", "last": "Mitchell", "username": "admin_metrohealth"},
            {"hospital_name": "Westside Clinic",       "email": "admin@westside.com",    "first": "Taylor", "last": "Brooks",   "username": "admin_westside"},
        ]
        PASSWORD = "HAdmin@123"

        for ha in admins:
            try:
                hospital = Hospital.objects.get(name=ha["hospital_name"])
            except Hospital.DoesNotExist:
                self.stdout.write("Hospital not found: " + ha["hospital_name"])
                continue

            if User.objects.filter(email=ha["email"]).exists():
                self.stdout.write("Already exists: " + ha["email"])
                continue

            user = User.objects.create(
                username=ha["username"],
                email=ha["email"],
                first_name=ha["first"],
                last_name=ha["last"],
                role="HOSPITAL_ADMIN",
                hospital=hospital,
                is_verified=True,
                is_active=True,
            )
            user.set_password(PASSWORD)
            user.save()
            self.stdout.write("Created: " + ha["email"] + " -> " + ha["hospital_name"])

        count = User.objects.filter(role="HOSPITAL_ADMIN").count()
        self.stdout.write("Done. Total hospital admins: " + str(count))
