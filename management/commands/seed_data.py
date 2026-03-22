from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import DoctorProfile, StaffProfile
from hospitals.models import Hospital
from patients.models import Patient
from records.models import MedicalRecord


class Command(BaseCommand):
    help = "Seed database with sample data for MediTrack demo."

    def handle(self, *args, **options):
        User = get_user_model()

        # Hospitals
        h1, _ = Hospital.objects.get_or_create(
            name="Apollo Hospital Chennai",
            defaults={
                "address": "Greams Road",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "phone": "044-12345678",
                "email": "apollo.chennai@meditrack.com",
            },
        )
        h2, _ = Hospital.objects.get_or_create(
            name="Fortis Hospital Bangalore",
            defaults={
                "address": "Bannerghatta Road",
                "city": "Bangalore",
                "state": "Karnataka",
                "phone": "080-12345678",
                "email": "fortis.blr@meditrack.com",
            },
        )

        # Super Admin
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@meditrack.com",
                "role": User.Roles.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
            },
        )
        if created:
            admin.set_password("Admin@123")
            admin.save()

        # Hospital Admins
        ha1, created = User.objects.get_or_create(
            username="apollo_admin",
            defaults={
                "email": "apollo.admin@meditrack.com",
                "first_name": "Apollo",
                "last_name": "Admin",
                "role": User.Roles.HOSPITAL_ADMIN,
                "hospital": h1,
                "is_verified": True,
            },
        )
        if created:
            ha1.set_password("Hospital@123")
            ha1.save()

        ha2, created = User.objects.get_or_create(
            username="fortis_admin",
            defaults={
                "email": "fortis.admin@meditrack.com",
                "first_name": "Fortis",
                "last_name": "Admin",
                "role": User.Roles.HOSPITAL_ADMIN,
                "hospital": h2,
                "is_verified": True,
            },
        )
        if created:
            ha2.set_password("Hospital@123")
            ha2.save()

        # Doctors
        doctor_approved, created = User.objects.get_or_create(
            username="doctor_approved",
            defaults={
                "email": "doctor@meditrack.com",
                "first_name": "Asha",
                "last_name": "Kumar",
                "role": User.Roles.DOCTOR,
                "hospital": h1,
                "is_verified": True,
            },
        )
        if created:
            doctor_approved.set_password("Doctor@123")
            doctor_approved.save()

        DoctorProfile.objects.get_or_create(
            user=doctor_approved,
            defaults={
                "specialization": "Cardiology",
                "qualification": "MBBS",
                "department": "Cardiology",
                "medical_reg_number": "MEDI-REG-0001",
                "medical_council": "Tamil Nadu Medical Council",
                "years_of_experience": 10,
                "status": DoctorProfile.Status.APPROVED,
            },
        )

        doctor_pending, created = User.objects.get_or_create(
            username="doctor_pending",
            defaults={
                "email": "doctor.pending@meditrack.com",
                "first_name": "Ravi",
                "last_name": "Shah",
                "role": User.Roles.DOCTOR,
                "hospital": h2,
                "is_verified": False,
            },
        )
        if created:
            doctor_pending.set_password("Doctor@123")
            doctor_pending.save()

        DoctorProfile.objects.get_or_create(
            user=doctor_pending,
            defaults={
                "specialization": "Neurology",
                "qualification": "MBBS",
                "department": "Neurology",
                "medical_reg_number": "MEDI-REG-0002",
                "medical_council": "Karnataka Medical Council",
                "years_of_experience": 5,
                "status": DoctorProfile.Status.PENDING,
            },
        )

        # Staff
        staff1, created = User.objects.get_or_create(
            username="apollo_staff",
            defaults={
                "email": "staff@meditrack.com",
                "first_name": "Nisha",
                "last_name": "Verma",
                "role": User.Roles.STAFF,
                "hospital": h1,
                "is_verified": True,
            },
        )
        if created:
            staff1.set_password("Staff@123")
            staff1.save()
        StaffProfile.objects.get_or_create(
            user=staff1,
            defaults={
                "department": "OPD",
                "role_title": "Reception Staff",
                "created_by": ha1,
            },
        )

        staff2, created = User.objects.get_or_create(
            username="fortis_staff",
            defaults={
                "email": "staff2@meditrack.com",
                "first_name": "Imran",
                "last_name": "Ali",
                "role": User.Roles.STAFF,
                "hospital": h2,
                "is_verified": True,
            },
        )
        if created:
            staff2.set_password("Staff@123")
            staff2.save()
        StaffProfile.objects.get_or_create(
            user=staff2,
            defaults={
                "department": "Radiology",
                "role_title": "Lab Staff",
                "created_by": ha2,
            },
        )

        # Patients and records
        patient_user, created = User.objects.get_or_create(
            username="patient",
            defaults={
                "email": "patient@meditrack.com",
                "first_name": "Arun",
                "last_name": "Das",
                "role": User.Roles.PATIENT,
                "hospital": h1,
                "is_verified": True,
            },
        )
        if created:
            patient_user.set_password("Patient@123")
            patient_user.save()

        patient, _ = Patient.objects.get_or_create(
            user=patient_user,
            defaults={
                "hospital": h1,
                "date_of_birth": "1995-06-15",
                "gender": "M",
                "blood_group": "O+",
                "address": "Chennai",
                "emergency_contact_name": "Kiran",
                "emergency_contact_phone": "9999999999",
                "known_allergies": "None",
                "aadhaar_number": "123412341234",
            },
        )

        for j in range(1, 3):
            MedicalRecord.objects.get_or_create(
                patient=patient,
                hospital=patient.hospital,
                created_by=doctor_approved,
                visit_date=timezone.now().date(),
                diagnosis=f"Sample diagnosis {j} for patient",
                notes="Sample notes",
                record_type=MedicalRecord.RecordType.LAB,
            )

        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))

