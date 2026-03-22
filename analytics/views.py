from collections import Counter, defaultdict

from django.db.models import Count
from django.utils import timezone
from rest_framework import permissions, views

from accounts.models import DoctorProfile, User
from accounts.permissions import IsDoctor
from common.utils import api_response
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
            pending_doctor_approvals = DoctorProfile.objects.filter(
                user__hospital=hospital, status=DoctorProfile.Status.PENDING
            ).count()
        else:
            patients_qs = Patient.objects.all()
            doctors_qs = User.objects.filter(role=User.Roles.DOCTOR)
            records_qs = MedicalRecord.objects.all()
            pending_doctor_approvals = DoctorProfile.objects.filter(status=DoctorProfile.Status.PENDING).count()

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
        return api_response(True, serializer.data, "Doctor analytics")

