"""
MediTrack Demo Seed Command
Run: python manage.py seed_demo

Creates:
  - 1 Admin
  - 2 Hospitals (Apollo Chennai, Fortis Bangalore)
  - 1 Hospital Admin per hospital
  - 2 Doctors per hospital (approved)
  - 1 Standalone Doctor (own clinic)
  - 2 Staff per hospital
  - 10 Patients with 10-digit IDs + QR codes
"""

import io
import random
import string

import qrcode
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from accounts.models import User
from hospitals.models import Hospital
from patients.models import Patient


PASSWORD = "MediTrack@123"
SEED_TAG = "meditrack_demo"


def random_phone():
    return "9" + "".join(random.choices(string.digits, k=9))


def generate_patient_id():
    """10-digit numeric patient ID."""
    while True:
        pid = "".join(random.choices(string.digits, k=10))
        if not Patient.objects.filter(patient_id=pid).exists():
            return pid


def make_qr(patient_id: str) -> str | None:
    """Generate a QR code PNG, upload to Cloudinary and return the public_id."""
    try:
        import cloudinary
        import cloudinary.uploader

        img = qrcode.make(f"http://localhost:3000/qr/{patient_id}")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        result = cloudinary.uploader.upload(
            buf,
            public_id=f"meditrack/qr_codes/{patient_id}",
            overwrite=True,
            resource_type="image",
            folder="meditrack/qr_codes",
        )
        return result.get("public_id")
    except Exception as e:
        print(f"  [WARNING] Cloudinary upload failed for {patient_id}: {e}")
        return None


class Command(BaseCommand):
    help = "Seed demo accounts for MediTrack presentation"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing seeded data before creating new ones",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing demo data...")
            Patient.objects.all().delete()
            User.objects.filter(
                role__in=["HOSPITAL_ADMIN", "DOCTOR", "STAFF", "PATIENT"]
            ).delete()
            Hospital.objects.all().delete()
            User.objects.filter(is_superuser=False, role="ADMIN").delete()

        self.stdout.write(self.style.MIGRATE_HEADING("=== MediTrack Demo Seed ==="))

        # ── 1. ADMIN ──────────────────────────────────────────────────────────
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults=dict(
                email="admin@meditrack.com",
                first_name="System",
                last_name="Administrator",
                role="ADMIN",
                phone=random_phone(),
                is_staff=True,
                is_superuser=True,
                is_verified=True,
            ),
        )
        admin.set_password(PASSWORD)
        admin.save()
        self.stdout.write(self.style.SUCCESS(f"[ADMIN] admin@meditrack.com / {PASSWORD}"))

        # ── 2. HOSPITALS ──────────────────────────────────────────────────────
        hospital_data = [
            dict(
                name="Apollo Hospitals Chennai",
                address="21, Greams Lane, Off Greams Road",
                city="Chennai",
                state="Tamil Nadu",
                phone="04428296000",
                email="info.chennai@apollohospitals.com",
            ),
            dict(
                name="Fortis Hospital Bangalore",
                address="154/9 Bannerghatta Road",
                city="Bangalore",
                state="Karnataka",
                phone="08066214444",
                email="corporate.bangalore@fortishealthcare.com",
            ),
        ]

        hospitals = []
        for hd in hospital_data:
            h, _ = Hospital.objects.get_or_create(name=hd["name"], defaults=hd)
            hospitals.append(h)
            self.stdout.write(self.style.SUCCESS(f"[HOSPITAL] {h.name}"))

        # Standalone clinic (for the solo doctor)
        solo_clinic, _ = Hospital.objects.get_or_create(
            name="MediCare Clinic (Solo Practice)",
            defaults=dict(
                address="12 Mount Road",
                city="Chennai",
                state="Tamil Nadu",
                phone="04423456789",
                email="info@medicareclinic.in",
            ),
        )
        self.stdout.write(self.style.SUCCESS(f"[CLINIC] {solo_clinic.name}"))

        # ── 3. HOSPITAL ADMINS ────────────────────────────────────────────────
        admin_users = []
        hospital_admin_info = [
            dict(
                username="admin_apollo",
                email="admin.apollo@meditrack.com",
                first_name="Rajesh",
                last_name="Kumar",
                phone="9841012345",
            ),
            dict(
                username="admin_fortis",
                email="admin.fortis@meditrack.com",
                first_name="Priya",
                last_name="Sharma",
                phone="9900123456",
            ),
        ]
        for i, (hospital, info) in enumerate(zip(hospitals, hospital_admin_info)):
            u, _ = User.objects.get_or_create(
                username=info["username"],
                defaults=dict(
                    **info,
                    role="HOSPITAL_ADMIN",
                    hospital=hospital,
                    is_verified=True,
                    department="Administration",
                ),
            )
            u.set_password(PASSWORD)
            u.save()
            admin_users.append(u)
            self.stdout.write(
                self.style.SUCCESS(f"[HOSPITAL_ADMIN] {info['email']} → {hospital.name}")
            )

        # ── 4. DOCTORS ────────────────────────────────────────────────────────
        doctor_specs = [
            ("Cardiology", "MD (Cardiology)", "TNMC", 12),
            ("Neurology", "DM (Neurology)", "TNMC", 8),
            ("Orthopedics", "MS (Ortho)", "KMC", 6),
            ("Dermatology", "MD (Dermatology)", "KMC", 5),
        ]
        doctor_personal = [
            ("Arun", "Venkatesh", "dr.arun.venkatesh"),
            ("Meena", "Raghavan", "dr.meena.raghavan"),
            ("Suresh", "Gowda", "dr.suresh.gowda"),
            ("Kavya", "Nair", "dr.kavya.nair"),
        ]

        doctors = []
        for i, (hospital, (spec, qual, council, exp), (fn, ln, uname)) in enumerate(
            zip(
                [hospitals[0], hospitals[0], hospitals[1], hospitals[1]],
                doctor_specs,
                doctor_personal,
            )
        ):
            email = f"{uname}@meditrack.com"
            reg_no = f"REG{10000 + i}"
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults=dict(
                    email=email,
                    first_name=fn,
                    last_name=ln,
                    role="DOCTOR",
                    hospital=hospital,
                    specialization=spec,
                    qualification=qual,
                    medical_reg_number=reg_no,
                    medical_council=council,
                    years_of_experience=exp,
                    department=spec,
                    is_verified=True,
                    status="APPROVED",
                    phone=random_phone(),
                ),
            )
            u.set_password(PASSWORD)
            u.save()
            doctors.append(u)
            self.stdout.write(
                self.style.SUCCESS(
                    f"[DOCTOR] {email} → {hospital.name} ({spec})"
                )
            )

        # Solo doctor
        solo_doctor, _ = User.objects.get_or_create(
            username="dr.arjun.solo",
            defaults=dict(
                email="dr.arjun.solo@meditrack.com",
                first_name="Arjun",
                last_name="Pillai",
                role="DOCTOR",
                hospital=solo_clinic,
                specialization="General Medicine",
                qualification="MBBS, MD",
                medical_reg_number="REG20000",
                medical_council="IMC",
                years_of_experience=15,
                department="General Medicine",
                is_verified=True,
                status="APPROVED",
                phone=random_phone(),
            ),
        )
        solo_doctor.set_password(PASSWORD)
        solo_doctor.save()
        doctors.append(solo_doctor)
        self.stdout.write(
            self.style.SUCCESS(f"[DOCTOR] dr.arjun.solo@meditrack.com → {solo_clinic.name}")
        )

        # ── 5. STAFF ──────────────────────────────────────────────────────────
        staff_personal = [
            ("Sunita", "Devi", "staff.sunita.apollo", "Head Nurse", hospitals[0]),
            ("Mohan", "Das", "staff.mohan.apollo", "Lab Technician", hospitals[0]),
            ("Anitha", "Rao", "staff.anitha.fortis", "Receptionist", hospitals[1]),
            ("Ramesh", "Babu", "staff.ramesh.fortis", "Nursing Assistant", hospitals[1]),
        ]
        staff_users = []
        for fn, ln, uname, title, hospital in staff_personal:
            email = f"{uname.replace('.', '_')}@meditrack.com"
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults=dict(
                    email=email,
                    first_name=fn,
                    last_name=ln,
                    role="STAFF",
                    hospital=hospital,
                    role_title=title,
                    department="Nursing" if "Nurse" in title else "Support",
                    is_verified=True,
                    phone=random_phone(),
                ),
            )
            u.set_password(PASSWORD)
            u.save()
            staff_users.append(u)
            self.stdout.write(
                self.style.SUCCESS(f"[STAFF] {email} → {hospital.name} ({title})")
            )

        # ── 6. PATIENTS ───────────────────────────────────────────────────────
        patient_records = [
            ("Hemanth", "Rajan", "hemanth.rajan", "1995-03-14", "M", "B+", hospitals[0]),
            ("Deepika", "Mohan", "deepika.mohan", "1990-07-22", "F", "A+", hospitals[0]),
            ("Suresh", "Patel", "suresh.patel", "1985-11-05", "M", "O+", hospitals[0]),
            ("Lalitha", "Krishnamurthy", "lalitha.km", "1998-01-30", "F", "AB+", hospitals[0]),
            ("Arjun", "Singh", "arjun.singh", "2000-06-19", "M", "B-", hospitals[0]),
            ("Nithya", "Sundaram", "nithya.sundaram", "1993-09-08", "F", "A-", hospitals[1]),
            ("Karan", "Mehta", "karan.mehta", "1987-04-12", "M", "O-", hospitals[1]),
            ("Pooja", "Agarwal", "pooja.agarwal", "1997-12-25", "F", "AB-", hospitals[1]),
            ("Vijay", "Bhat", "vijay.bhat", "1970-08-03", "M", "B+", hospitals[1]),
            ("Shalini", "Nair", "shalini.nair", "2001-02-17", "F", "O+", solo_clinic),
        ]

        self.stdout.write(self.style.MIGRATE_HEADING("\nCreating 10 patients with 10-digit IDs..."))
        for fn, ln, uname, dob, gender, blood, hospital in patient_records:
            email = f"{uname}@patient.meditrack.com"

            # Create user account for patient
            patient_user, _ = User.objects.get_or_create(
                username=uname,
                defaults=dict(
                    email=email,
                    first_name=fn,
                    last_name=ln,
                    role="PATIENT",
                    hospital=hospital,
                    is_verified=True,
                    phone=random_phone(),
                ),
            )
            patient_user.set_password(PASSWORD)
            patient_user.save()

            # Create patient profile if not exists
            if not Patient.objects.filter(user=patient_user).exists():
                pid = generate_patient_id()
                patient = Patient(
                    patient_id=pid,
                    user=patient_user,
                    hospital=hospital,
                    date_of_birth=dob,
                    gender=gender,
                    blood_group=blood,
                    address=f"123 Sample Street, {hospital.city}",
                    emergency_contact_name=f"{fn}'s Emergency Contact",
                    emergency_contact_phone=random_phone(),
                    known_allergies="None",
                    is_profile_complete=True,
                )

                # Generate and upload QR code to Cloudinary
                qr_public_id = make_qr(pid)
                if qr_public_id:
                    patient.qr_code = qr_public_id

                patient.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[PATIENT] {email} | ID: {pid} | {blood} | {hospital.name}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"[PATIENT] {email} already exists — skipped"
                    )
                )

        # ── SUMMARY ───────────────────────────────────────────────────────────
        self.stdout.write("\n" + self.style.MIGRATE_HEADING("=== SEED COMPLETE ==="))
        self.stdout.write(f"   Password for ALL accounts: {self.style.WARNING(PASSWORD)}")
        self.stdout.write("")
        self.stdout.write("   ADMIN:          admin@meditrack.com")
        self.stdout.write("   HOSPITAL ADMIN: admin.apollo@meditrack.com (Apollo)")
        self.stdout.write("   HOSPITAL ADMIN: admin.fortis@meditrack.com (Fortis)")
        self.stdout.write("   DOCTOR:         dr.arun.venkatesh@meditrack.com (Apollo - Cardiology)")
        self.stdout.write("   DOCTOR:         dr.meena.raghavan@meditrack.com (Apollo - Neurology)")
        self.stdout.write("   DOCTOR:         dr.suresh.gowda@meditrack.com (Fortis - Orthopedics)")
        self.stdout.write("   DOCTOR:         dr.kavya.nair@meditrack.com (Fortis - Dermatology)")
        self.stdout.write("   DOCTOR:         dr.arjun.solo@meditrack.com (Solo Clinic)")
        self.stdout.write("   STAFF:          staff_sunita_apollo@meditrack.com (Apollo - Head Nurse)")
        self.stdout.write("   STAFF:          staff_mohan_apollo@meditrack.com (Apollo - Lab Tech)")
        self.stdout.write("   STAFF:          staff_anitha_fortis@meditrack.com (Fortis - Receptionist)")
        self.stdout.write("   STAFF:          staff_ramesh_fortis@meditrack.com (Fortis - Nursing Asst)")
        self.stdout.write("")
        self.stdout.write("   10 PATIENT accounts → *@patient.meditrack.com")
        self.stdout.write(
            f"\n   Patients in DB: {Patient.objects.count()} total"
        )
