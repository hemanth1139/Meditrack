from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from hospitals.models import Hospital
from patients.models import Patient
from records.models import MedicalRecord


class Command(BaseCommand):
    help = "Seed database with sample data for MediTrack demo."

    def handle(self, *args, **options):
        User = get_user_model()

        # Hospitals
        h1, _ = Hospital.objects.update_or_create(
            name="Apollo Hospital Chennai",
            defaults={
                "address": "Greams Road",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "phone": "044-12345678",
                "email": "apollo.chennai@meditrack.com",
            },
        )
        h2, _ = Hospital.objects.update_or_create(
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
        admin, _ = User.objects.update_or_create(
            username="admin",
            defaults={
                "email": "admin@meditrack.com",
                "role": User.Roles.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
            },
        )
        admin.set_password("Admin@123")
        admin.save()

        # Hospital Admins
        ha1, _ = User.objects.update_or_create(
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
        ha1.set_password("Hospital@123")
        ha1.save()

        ha2, _ = User.objects.update_or_create(
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
        ha2.set_password("Hospital@123")
        ha2.save()

        # Doctors
        doctor_approved, _ = User.objects.update_or_create(
            username="doctor_approved",
            defaults={
                "email": "doctor@meditrack.com",
                "first_name": "Asha",
                "last_name": "Kumar",
                "role": User.Roles.DOCTOR,
                "hospital": h1,
                "is_verified": True,
                "specialization": "Cardiology",
                "qualification": "MBBS",
                "department": "Cardiology",
                "medical_reg_number": "MEDI-REG-0001",
                "medical_council": "Tamil Nadu Medical Council",
                "years_of_experience": 10,
                "status": User.DoctorStatus.APPROVED,
            },
        )
        doctor_approved.set_password("Doctor@123")
        doctor_approved.save()

        doctor_pending, _ = User.objects.update_or_create(
            username="doctor_pending",
            defaults={
                "email": "doctor.pending@meditrack.com",
                "first_name": "Ravi",
                "last_name": "Shah",
                "role": User.Roles.DOCTOR,
                "hospital": h2,
                "is_verified": False,
                "specialization": "Neurology",
                "qualification": "MBBS",
                "department": "Neurology",
                "medical_reg_number": "MEDI-REG-0002",
                "medical_council": "Karnataka Medical Council",
                "years_of_experience": 5,
                "status": User.DoctorStatus.PENDING,
            },
        )
        doctor_pending.set_password("Doctor@123")
        doctor_pending.save()

        # Staff
        staff1, _ = User.objects.update_or_create(
            username="apollo_staff",
            defaults={
                "email": "staff@meditrack.com",
                "first_name": "Nisha",
                "last_name": "Verma",
                "role": User.Roles.STAFF,
                "hospital": h1,
                "is_verified": True,
                "department": "OPD",
                "role_title": "Reception Staff",
                "created_by": ha1,
            },
        )
        staff1.set_password("Staff@123")
        staff1.save()

        staff2, _ = User.objects.update_or_create(
            username="fortis_staff",
            defaults={
                "email": "staff2@meditrack.com",
                "first_name": "Imran",
                "last_name": "Ali",
                "role": User.Roles.STAFF,
                "hospital": h2,
                "is_verified": True,
                "department": "Radiology",
                "role_title": "Lab Staff",
                "created_by": ha2,
            },
        )
        staff2.set_password("Staff@123")
        staff2.save()

        # Patients and records
        patient_user, _ = User.objects.update_or_create(
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
        patient_user.set_password("Patient@123")
        patient_user.save()

        patient, _ = Patient.objects.update_or_create(
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
                diagnosis=f"Sample diagnosis {j} for patient",
                defaults={
                    "doctor_notes": "Sample notes",
                    "visit_type": MedicalRecord.VisitType.LAB_DIAGNOSTICS,
                }
            )

        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))

