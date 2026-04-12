from accounts.models import User
from hospitals.models import Hospital

hospital_admins = [
    {"hospital_name": "City General Hospital", "email": "admin@citygeneral.com", "first": "Alex",   "last": "Carter",   "username": "admin_citygeneral"},
    {"hospital_name": "Metro Health Center",   "email": "admin@metrohealth.com", "first": "Jordan", "last": "Mitchell", "username": "admin_metrohealth"},
    {"hospital_name": "Westside Clinic",       "email": "admin@westside.com",    "first": "Taylor", "last": "Brooks",   "username": "admin_westside"},
]

PASSWORD = "HAdmin@123"

for ha in hospital_admins:
    hospital = Hospital.objects.get(name=ha["hospital_name"])
    if User.objects.filter(email=ha["email"]).exists():
        print("Already exists: " + ha["email"])
    else:
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
        print("Created: " + ha["email"] + " -> " + ha["hospital_name"])

print("Done. Total HOSPITAL_ADMIN users: " + str(User.objects.filter(role="HOSPITAL_ADMIN").count()))
