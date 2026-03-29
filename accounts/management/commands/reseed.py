from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from hospitals.models import Hospital
from patients.models import Patient
import random
import string

User = get_user_model()

class Command(BaseCommand):
    help = "Delete all users and reseed fresh data"

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting all existing data...")

        # Delete all users and hospitals
        User.objects.all().delete()
        Hospital.objects.all().delete()

        self.stdout.write("All data deleted")
        self.stdout.write("Seeding fresh data...")

        # ── Create Hospitals ──────────────────────────
        hospitals = []
        hospital_data = [
            {
                "name": "Apollo Hospital",
                "city": "Chennai",
                "phone": "9876543210",
                "email": "apollo@meditrack.com",
            },
            {
                "name": "Fortis Hospital",
                "city": "Bangalore",
                "phone": "9876543211",
                "email": "fortis@meditrack.com",
            },
            {
                "name": "MIOT Hospital",
                "city": "Chennai",
                "phone": "9876543212",
                "email": "miot@meditrack.com",
            },
        ]

        for h in hospital_data:
            hospital = Hospital.objects.create(**h, is_active=True)
            hospitals.append(hospital)
            self.stdout.write(f"  Created hospital: {hospital.name}")

        # ── Create Admin ──────────────────────────────
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@meditrack.com",
            password="Admin@1234",
            first_name="Super",
            last_name="Admin",
            role="ADMIN",
            is_verified=True,
        )
        self.stdout.write(f"  Created admin: admin / Admin@1234")

        # ── Create Hospital Admins ────────────────────
        hospital_admin_data = [
            {
                "username": "apollo_admin",
                "email": "apollo.admin@meditrack.com",
                "full_name": "Apollo Admin",
                "hospital": hospitals[0],
            },
            {
                "username": "fortis_admin",
                "email": "fortis.admin@meditrack.com",
                "full_name": "Fortis Admin",
                "hospital": hospitals[1],
            },
            {
                "username": "miot_admin",
                "email": "miot.admin@meditrack.com",
                "full_name": "MIOT Admin",
                "hospital": hospitals[2],
            },
        ]

        for ha in hospital_admin_data:
            first_name, *last_name_parts = ha["full_name"].split(" ")
            last_name = " ".join(last_name_parts)
            User.objects.create_user(
                username=ha["username"],
                email=ha["email"],
                password="Admin@1234",
                first_name=first_name,
                last_name=last_name,
                role="HOSPITAL_ADMIN",
                hospital=ha["hospital"],
                is_verified=True,
            )
            self.stdout.write(
                f"  Created hospital admin: "
                f"{ha['username']} / Admin@1234"
            )

        # ── Create Doctors (1 per hospital) ──────────
        doctor_data = [
            {
                "username": "apollo_doctor",
                "email": "doctor@apollo.com",
                "full_name": "Dr. Rajesh Kumar",
                "hospital": hospitals[0],
                "specialization": "Cardiology",
                "reg_number": "MEDI-REG-0001",
            },
            {
                "username": "fortis_doctor",
                "email": "doctor@fortis.com",
                "full_name": "Dr. Priya Sharma",
                "hospital": hospitals[1],
                "specialization": "Neurology",
                "reg_number": "MEDI-REG-0002",
            },
            {
                "username": "miot_doctor",
                "email": "doctor@miot.com",
                "full_name": "Dr. Arun Patel",
                "hospital": hospitals[2],
                "specialization": "Orthopedics",
                "reg_number": "MEDI-REG-0003",
            },
        ]

        for d in doctor_data:
            first_name, *last_name_parts = d["full_name"].split(" ")
            last_name = " ".join(last_name_parts)
            user = User.objects.create_user(
                username=d["username"],
                email=d["email"],
                password="Doctor@1234",
                first_name=first_name,
                last_name=last_name,
                role="DOCTOR",
                hospital=d["hospital"],
                is_verified=True,
            )
            
            from accounts.models import DoctorProfile
            DoctorProfile.objects.create(
                user=user,
                specialization=d["specialization"],
                qualification="MBBS, MD",  # Dummy data
                department=d["specialization"],
                medical_reg_number=d["reg_number"],
                medical_council="Medical Council", # Dummy data
                years_of_experience=10, # Dummy data
                status="APPROVED",
            )
            self.stdout.write(
                f"  Created doctor: {d['username']} / Doctor@1234"
            )

        # ── Create Staff (1 per hospital) ────────────
        staff_data = [
            {
                "username": "apollo_staff",
                "email": "staff@apollo.com",
                "full_name": "Apollo Staff",
                "hospital": hospitals[0],
            },
            {
                "username": "fortis_staff",
                "email": "staff@fortis.com",
                "full_name": "Fortis Staff",
                "hospital": hospitals[1],
            },
            {
                "username": "miot_staff",
                "email": "staff@miot.com",
                "full_name": "MIOT Staff",
                "hospital": hospitals[2],
            },
        ]

        for s in staff_data:
            first_name, *last_name_parts = s["full_name"].split(" ")
            last_name = " ".join(last_name_parts)
            user = User.objects.create_user(
                username=s["username"],
                email=s["email"],
                password="Staff@1234",
                first_name=first_name,
                last_name=last_name,
                role="STAFF",
                hospital=s["hospital"],
                is_verified=True,
            )
            
            from accounts.models import StaffProfile
            StaffProfile.objects.create(
                user=user,
                department="General",
                role_title="Nurse/Staff",
                created_by=admin,
            )
            self.stdout.write(
                f"  Created staff: {s['username']} / Staff@1234"
            )

        # ── Create Patients (5 total) ─────────────────
        patient_data = [
            {
                "username": "patient_hemanth",
                "email": "hemanth@patient.com",
                "full_name": "Hemanth Kumar",
                "blood_group": "O+",
            },
            {
                "username": "patient_priya",
                "email": "priya@patient.com",
                "full_name": "Priya Rajan",
                "blood_group": "A+",
            },
            {
                "username": "patient_arjun",
                "email": "arjun@patient.com",
                "full_name": "Arjun Singh",
                "blood_group": "B+",
            },
            {
                "username": "patient_kavya",
                "email": "kavya@patient.com",
                "full_name": "Kavya Menon",
                "blood_group": "AB+",
            },
            {
                "username": "patient_rohit",
                "email": "rohit@patient.com",
                "full_name": "Rohit Verma",
                "blood_group": "A-",
            },
        ]

        for p in patient_data:
            # Generate unique 10-digit patient ID
            patient_id = "".join(
                random.choices(string.digits, k=10)
            )

            first_name, *last_name_parts = p["full_name"].split(" ")
            last_name = " ".join(last_name_parts)
            
            user = User.objects.create_user(
                username=p["username"],
                email=p["email"],
                password="Patient@1234",
                first_name=first_name,
                last_name=last_name,
                role="PATIENT",
                is_verified=True,
            )

            import datetime
            # Create patient profile
            Patient.objects.create(
                user=user,
                patient_id=patient_id,
                hospital=hospitals[0],  # Give them a default hospital for testing
                blood_group=p["blood_group"],
                gender="M",
                date_of_birth=datetime.date(1990, 1, 1),
                address="123 Dummy Street",
                emergency_contact_name="Emergency Contact",
                emergency_contact_phone="9876543210",
                is_profile_complete=False,
            )

            self.stdout.write(
                f"  Created patient: {p['username']} / "
                f"Patient@1234 / ID: {patient_id}"
            )

        # ── Summary ───────────────────────────────────
        self.stdout.write("\n" + "="*50)
        self.stdout.write("DATABASE SEEDED SUCCESSFULLY")
        self.stdout.write("="*50)
        self.stdout.write("\n LOGIN CREDENTIALS:")
        self.stdout.write(
            "  Admin:          admin / Admin@1234"
        )
        self.stdout.write(
            "  Hospital Admins: apollo_admin, fortis_admin, "
            "miot_admin / Admin@1234"
        )
        self.stdout.write(
            "  Doctors:        apollo_doctor, fortis_doctor, "
            "miot_doctor / Doctor@1234"
        )
        self.stdout.write(
            "  Staff:          apollo_staff, fortis_staff, "
            "miot_staff / Staff@1234"
        )
        self.stdout.write(
            "  Patients:       patient_hemanth, patient_priya, "
            "patient_arjun, patient_kavya, "
            "patient_rohit / Patient@1234"
        )
        self.stdout.write("="*50)
