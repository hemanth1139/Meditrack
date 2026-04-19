from collections import defaultdict

from django.core.cache import cache
from django.utils import timezone
from rest_framework import permissions, views

from accounts.models import User
from meditrack.utils import api_response
from hospitals.models import Hospital
from patients.models import Patient, Vitals
from records.models import MedicalRecord, Prescription


CACHE_TTL = 0  # Disabled for instant live updates


# ─────────────────────────────────────────
# Admin Dashboard Stats
# ─────────────────────────────────────────

class AdminDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "ADMIN" and not request.user.is_superuser:
            return api_response(False, None, "Permission denied")

        cache_key = f"dashboard_admin_{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            return api_response(True, cached, "Admin dashboard stats (cached)")

        total_hospitals = Hospital.objects.count()
        total_users = User.objects.count()
        pending_approvals = User.objects.filter(role=User.Roles.DOCTOR).filter(
            status=User.DoctorStatus.PENDING
        ).count()

        recent_hospitals = list(
            Hospital.objects.order_by("-created_at")[:5].values(
                "id", "name", "city", "is_active", "created_at"
            )
        )
        for h in recent_hospitals:
            h["active"] = h.pop("is_active", False)
            if h.get("created_at"):
                h["created_at"] = h["created_at"].strftime("%Y-%m-%d")

        pending_doctors_qs = User.objects.filter(role=User.Roles.DOCTOR).filter(
            status=User.DoctorStatus.PENDING
        ).select_related("hospital").order_by("-date_joined")[:5]

        pending_doctors = []
        for dp in pending_doctors_qs:
            pending_doctors.append({
                "id": dp.id,
                "name": dp.get_full_name() or dp.username,
                "email": dp.email,
                "specialization": dp.specialization,
                "hospital": dp.hospital.name if dp.hospital else "—",
                "medical_reg_number": dp.medical_reg_number,
            })

        data = {
            "total_hospitals": total_hospitals,
            "total_users": total_users,
            "pending_approvals": pending_approvals,
            "recent_hospitals": recent_hospitals,
            "pending_doctors": pending_doctors,
        }
        cache.set(cache_key, data, CACHE_TTL)
        return api_response(True, data, "Admin dashboard stats")


# ─────────────────────────────────────────
# Hospital Admin Dashboard Stats
# ─────────────────────────────────────────

class HospitalAdminDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "HOSPITAL_ADMIN":
            return api_response(False, None, "Permission denied")

        cache_key = f"dashboard_hospital_admin_{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            return api_response(True, cached, "Hospital admin dashboard stats (cached)")

        hospital = request.user.hospital
        if not hospital:
            return api_response(False, None, "No hospital assigned")

        total_doctors = User.objects.filter(
            role=User.Roles.DOCTOR, hospital=hospital, is_active=True
        ).count()
        total_staff = User.objects.filter(
            role=User.Roles.STAFF, hospital=hospital, is_active=True
        ).count()
        pending_approvals = User.objects.filter(role=User.Roles.DOCTOR).filter(
            hospital=hospital, status=User.DoctorStatus.PENDING
        ).count()

        pending_doctors_qs = User.objects.filter(role=User.Roles.DOCTOR).filter(
            hospital=hospital, status=User.DoctorStatus.PENDING
        ).order_by("-date_joined")[:5]

        pending_doctors = []
        for dp in pending_doctors_qs:
            pending_doctors.append({
                "id": dp.id,
                "name": dp.get_full_name() or dp.username,
                "email": dp.email,
                "specialization": dp.specialization,
                "medical_reg_number": dp.medical_reg_number,
            })

        recent_staff_qs = User.objects.filter(
            role=User.Roles.STAFF, hospital=hospital
        ).order_by("-date_joined")[:5]

        recent_staff = [
            {
                "id": s.id,
                "name": s.get_full_name() or s.username,
                "email": s.email,
                "date_joined": s.date_joined.strftime("%Y-%m-%d") if s.date_joined else "—",
            }
            for s in recent_staff_qs
        ]

        data = {
            "total_doctors": total_doctors,
            "total_staff": total_staff,
            "pending_approvals": pending_approvals,
            "pending_doctors": pending_doctors,
            "recent_staff": recent_staff,
            "hospital_name": hospital.name,
        }
        cache.set(cache_key, data, CACHE_TTL)
        return api_response(True, data, "Hospital admin dashboard stats")


# ─────────────────────────────────────────
# Doctor Dashboard Stats
# ─────────────────────────────────────────

class DoctorDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "DOCTOR":
            return api_response(False, None, "Permission denied")
        if not request.user.is_verified:
            return api_response(False, None, "Your account is pending admin approval.", status=403)

        cache_key = f"dashboard_doctor_{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            return api_response(True, cached, "Doctor dashboard stats (cached)")

        doctor = request.user
        now = timezone.now()

        # Total unique patients this doctor has treated
        total_patients = Patient.objects.filter(
            records__created_by=doctor
        ).distinct().count()

        # Records added this month
        records_this_month = MedicalRecord.objects.filter(
            created_by=doctor,
            created_at__year=now.year,
            created_at__month=now.month,
        ).count()

        # Staff who have active access to this doctor's patients (via DoctorStaffAccess)
        from patients.models import DoctorStaffAccess
        assigned_staff = DoctorStaffAccess.objects.filter(
            patient__records__created_by=doctor,
            is_active=True,
        ).values("staff").distinct().count()

        # Recent 5 unique patients with last record info
        recent_records_qs = (
            MedicalRecord.objects.filter(created_by=doctor)
            .select_related("patient", "patient__user")
            .order_by("-created_at")
        )
        seen_patients = {}
        for rec in recent_records_qs:
            pid = rec.patient.patient_id
            if pid not in seen_patients:
                seen_patients[pid] = {
                    "patient_id": pid,
                    "name": rec.patient.user.get_full_name() or rec.patient.user.username,
                    "last_record_type": rec.visit_type,
                    "last_visit_date": rec.created_at.strftime("%Y-%m-%d"),
                }
            if len(seen_patients) >= 5:
                break

        data = {
            "total_patients": total_patients,
            "records_this_month": records_this_month,
            "assigned_staff": assigned_staff,
            "recent_patients": list(seen_patients.values()),
            "hospital_name": doctor.hospital.name if doctor.hospital else "—",
        }
        cache.set(cache_key, data, CACHE_TTL)
        return api_response(True, data, "Doctor dashboard stats")


# ─────────────────────────────────────────
# Staff Dashboard Stats
# ─────────────────────────────────────────

class StaffDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "STAFF":
            return api_response(False, None, "Permission denied")

        cache_key = f"dashboard_staff_{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            return api_response(True, cached, "Staff dashboard stats (cached)")

        staff = request.user
        now = timezone.now()

        from patients.models import DoctorStaffAccess

        # Active assignments from doctors to this staff member
        active_accesses = DoctorStaffAccess.objects.filter(
            staff=staff, is_active=True
        ).select_related("patient", "patient__user")

        assigned_patients_count = active_accesses.count()

        # Completed assignments (is_active=False means staff submitted, pending doctor approval)
        completed_count = DoctorStaffAccess.objects.filter(
            staff=staff, is_active=False
        ).count()

        # Vitals recorded today by this staff
        vitals_today = Vitals.objects.filter(
            recorded_by=staff,
            recorded_at__date=now.date(),
        ).count()

        # Build patient cards from active DoctorStaffAccess assignments
        patients = []
        for access in active_accesses:
            patient = access.patient
            last_vitals = Vitals.objects.filter(
                patient=patient, recorded_by=staff
            ).order_by("-recorded_at").first()
            patients.append({
                "patient_id": patient.patient_id,
                "name": patient.user.get_full_name() or patient.user.username,
                "blood_group": patient.blood_group,
                "last_vitals_date": last_vitals.recorded_at.strftime("%Y-%m-%d") if last_vitals else None,
                "access_id": access.id,
            })

        data = {
            "assigned_patients_count": assigned_patients_count,
            "completed_count": completed_count,
            "vitals_today": vitals_today,
            "hospital_name": staff.hospital.name if staff.hospital else "—",
            "patients": patients,
        }
        cache.set(cache_key, data, CACHE_TTL)
        return api_response(True, data, "Staff dashboard stats")


# ─────────────────────────────────────────
# Patient Dashboard Stats
# ─────────────────────────────────────────

class PatientDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != "PATIENT":
            return api_response(False, None, "Permission denied")

        cache_key = f"dashboard_patient_{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            return api_response(True, cached, "Patient dashboard stats (cached)")

        try:
            patient = request.user.patient_profile
        except Patient.DoesNotExist:
            return api_response(False, None, "Patient profile not found")

        total_records = MedicalRecord.objects.filter(
            patient=patient, status=MedicalRecord.Status.APPROVED
        ).count()

        # Active prescriptions: from approved consultation records
        active_prescriptions = Prescription.objects.filter(
            record__patient=patient,
            record__status=MedicalRecord.Status.APPROVED,
        ).count()

        # Latest vitals
        latest_vitals_obj = (
            Vitals.objects.filter(patient=patient)
            .select_related("recorded_by")
            .order_by("-recorded_at")
            .first()
        )

        latest_vitals = None
        last_vitals_date = None
        if latest_vitals_obj:
            last_vitals_date = latest_vitals_obj.recorded_at.strftime("%Y-%m-%d")
            latest_vitals = {
                "bp": latest_vitals_obj.blood_pressure,
                "pulse": latest_vitals_obj.pulse,
                "temp": str(latest_vitals_obj.temperature),
                "weight": str(latest_vitals_obj.weight),
                "spo2": latest_vitals_obj.spo2,
                "recorded_by": latest_vitals_obj.recorded_by.get_full_name() or latest_vitals_obj.recorded_by.username,
                "recorded_at": last_vitals_date,
            }

        # Recent 3 approved records
        recent_records_qs = (
            MedicalRecord.objects.filter(patient=patient, status=MedicalRecord.Status.APPROVED)
            .select_related("created_by")
            .order_by("-created_at")[:3]
        )
        recent_records = [
            {
                "id": r.id,
                "visit_type": r.visit_type,
                "doctor_name": r.created_by.get_full_name() or r.created_by.username,
                "doctor_specialization": getattr(r.created_by, 'specialization', ''),
                "visit_date": r.created_at.strftime("%Y-%m-%d"),
                "diagnosis": r.diagnosis if r.visit_type == MedicalRecord.VisitType.CONSULTATION else None,
            }
            for r in recent_records_qs
        ]

        # QR code URL
        qr_code_url = None
        if patient.qr_code:
            from django.conf import settings
            if getattr(settings, "CLOUDINARY_CLOUD_NAME", ""):
                cloud = settings.CLOUDINARY_CLOUD_NAME
                qr_code_url = f"https://res.cloudinary.com/{cloud}/image/upload/{str(patient.qr_code)}"
            else:
                try:
                    qr_code_url = patient.qr_code.url
                except Exception:
                    qr_code_url = None

        data = {
            "total_records": total_records,
            "active_prescriptions": active_prescriptions,
            "last_vitals_date": last_vitals_date,
            "patient_id": patient.patient_id,
            "qr_code_url": qr_code_url,
            "recent_records": recent_records,
            "latest_vitals": latest_vitals,
        }
        cache.set(cache_key, data, CACHE_TTL)
        return api_response(True, data, "Patient dashboard stats")


from collections import Counter, defaultdict

from django.core.cache import cache
from django.db.models import Count
from django.utils import timezone
from rest_framework import permissions, views

from accounts.models import User
from accounts.permissions import IsDoctor
from meditrack.utils import api_response
from hospitals.models import Hospital
from patients.models import Patient
from records.models import MedicalRecord
from .serializers import DoctorAnalyticsSerializer, HospitalAnalyticsSerializer


class HospitalAnalyticsView(views.APIView):
    """
    Return hospital-level analytics:
    - Total patients
    - Total doctors
    - Monthly record activity
    - Top 5 diagnoses
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        cache_key = f"analytics_{request.user.role}_{request.user.id}"
        data = cache.get(cache_key)
        if data:
            return api_response(True, data, "Hospital analytics (cached)")

        if request.user.role not in ["ADMIN", "HOSPITAL_ADMIN"]:
            return api_response(False, None, "Permission denied")

        hospital_id = request.query_params.get("hospital_id")
        if request.user.role == "HOSPITAL_ADMIN":
            hospital = request.user.hospital
        elif hospital_id:
            hospital = Hospital.objects.get(id=hospital_id)
        else:
            hospital = None

        if hospital:
            patients_qs = Patient.objects.filter(hospital=hospital)
            doctors_qs = User.objects.filter(role=User.Roles.DOCTOR, hospital=hospital)
            records_qs = MedicalRecord.objects.filter(hospital=hospital)
            pending_doctor_approvals = User.objects.filter(role=User.Roles.DOCTOR).filter(
                hospital=hospital, status=User.DoctorStatus.PENDING
            ).count()
        else:
            patients_qs = Patient.objects.all()
            doctors_qs = User.objects.filter(role=User.Roles.DOCTOR)
            records_qs = MedicalRecord.objects.all()
            pending_doctor_approvals = User.objects.filter(role=User.Roles.DOCTOR).filter(status=User.DoctorStatus.PENDING).count()

        total_patients = patients_qs.count()
        total_doctors = doctors_qs.count()

        # Monthly activity for last 12 months
        now = timezone.now()
        monthly_counts = defaultdict(int)
        for record in records_qs.filter(created_at__gte=now.replace(year=now.year - 1)):
            key = record.created_at.strftime("%Y-%m")
            monthly_counts[key] += 1

        records_this_month = records_qs.filter(created_at__year=now.year, created_at__month=now.month).count()
        flagged_records = records_qs.filter(status=MedicalRecord.Status.FLAGGED).count()

        # Top 5 diagnoses (by plain text; encrypted in DB but queryset returns decrypted)
        diagnoses_counter = Counter(records_qs.values_list("diagnosis", flat=True))
        top_diagnoses = [
            {"diagnosis": diag, "count": cnt} for diag, cnt in diagnoses_counter.most_common(5)
        ]

        data = {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "records_this_month": records_this_month,
            "pending_doctor_approvals": pending_doctor_approvals,
            "flagged_records": flagged_records,
            "monthly_activity": [{"month": k, "count": v} for k, v in sorted(monthly_counts.items())],
            "top_diagnoses": top_diagnoses,
        }
        serializer = HospitalAnalyticsSerializer(data)
        cache.set(cache_key, serializer.data, 300)
        return api_response(True, serializer.data, "Hospital analytics")


class DoctorAnalyticsView(views.APIView):
    """
    Return analytics for the current doctor:
    - My patients
    - My approvals
    - My pending queue
    - My diagnosis breakdown
    """

    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request, *args, **kwargs):
        cache_key = f"analytics_{request.user.role}_{request.user.id}"
        data = cache.get(cache_key)
        if data:
            return api_response(True, data, "Doctor analytics (cached)")

        doctor = request.user
        records_qs = MedicalRecord.objects.filter(created_by=doctor)
        my_patients = Patient.objects.filter(records__created_by=doctor).distinct().count()
        my_approvals = records_qs.filter(status=MedicalRecord.Status.APPROVED).count()
        my_pending_queue = records_qs.filter(status=MedicalRecord.Status.PENDING).count()

        breakdown_counter = Counter(records_qs.values_list("diagnosis", flat=True))
        diagnosis_breakdown = dict(breakdown_counter)

        data = {
            "my_patients": my_patients,
            "my_approvals": my_approvals,
            "my_pending_queue": my_pending_queue,
            "diagnosis_breakdown": diagnosis_breakdown,
        }
        serializer = DoctorAnalyticsSerializer(data)
        cache.set(cache_key, serializer.data, 300)
        return api_response(True, serializer.data, "Doctor analytics")

