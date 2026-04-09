from datetime import timedelta
import io

from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from accounts.models import User
from accounts.permissions import IsDoctor, IsStaff
from accounts.models import AuditLog
from meditrack.utils import api_response
from records.models import MedicalRecord
from records.serializers import MedicalRecordSerializer
from .models import Patient
from .serializers import PatientSerializer, VitalsSerializer


from rest_framework.exceptions import NotFound
from rest_framework import filters
from rest_framework.views import APIView
from rest_framework.response import Response

class PatientLookupView(APIView):
    """
    Publicly accessible endpoint (for authenticated staff/doctors) to look up a patient's name
    and blood group just by their 10-digit ID, without requiring full access to their profile.
    Used for live preview in the QRScanner manual entry modal.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient_id")
        if not patient_id:
            return Response({"error": "patient_id required"}, status=400)
        try:
            patient = Patient.objects.select_related("user").get(patient_id=patient_id)
            return Response({
                "patient_id": patient.patient_id,
                "full_name": patient.user.get_full_name(),
                "blood_group": patient.blood_group,
            })
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found"}, status=404)

class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patient profiles and related operations:
    - Create patient (staff or doctor only)
    - List patients (filtered by hospital for staff/doctor)
    - Retrieve patient profile by patient_id
    - Retrieve QR code URL
    - OTP request and verification for cross-hospital access
    - PDF export of approved record history
    """

    queryset = Patient.objects.select_related("user", "hospital").all()
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["patient_id", "user__first_name", "user__last_name", "user__email", "user__phone"]

    def get_permissions(self):
        if self.action in ["create"]:
            return [permissions.IsAuthenticated(), (IsStaff | IsDoctor)()]
        if self.action in ["list", "retrieve", "qr", "export_pdf", "profile"]:
            return [permissions.IsAuthenticated()]
        if self.action in ["add_vitals"]:
            return [permissions.IsAuthenticated(), IsStaff()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        # Lookup by patient_id instead of pk
        lookup = self.kwargs.get("pk")
        try:
            return Patient.objects.select_related("user", "hospital").get(patient_id=lookup)
        except Patient.DoesNotExist:
            raise NotFound(f"Patient with ID '{lookup}' not found.")

    def list(self, request, *args, **kwargs):
        user = request.user
        qs = self.get_queryset()
        if user.role == "PATIENT":
            qs = qs.filter(user=user)
            
        qs = self.filter_queryset(qs.order_by("-id"))
        limit = request.query_params.get("limit")
        if limit and hasattr(self, 'paginator') and hasattr(self.paginator, 'page_size'):
            self.paginator.page_size = int(limit)
            
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return api_response(True, {
                "data": serializer.data,
                "total": self.paginator.page.paginator.count,
                "page": self.paginator.page.number,
                "totalPages": self.paginator.page.paginator.num_pages
            }, "Patients fetched")

        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Patients fetched")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        AuditLog.objects.create(
            user=request.user,
            action="PATIENT_CREATED",
            target_model="Patient",
            target_id=patient.patient_id,
            description="Patient created",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, self.get_serializer(patient).data, "Patient created")

    def retrieve(self, request, *args, **kwargs):
        patient = self.get_object()
        user = request.user
        if user.role == "PATIENT" and patient.user != user:
            return api_response(False, None, "You can only view your own profile")
        serializer = self.get_serializer(patient)
        return api_response(True, serializer.data, "Patient detail")

    @action(detail=True, methods=["get"], url_path="profile")
    def profile(self, request, pk=None):
        patient = self.get_object()
        user = request.user
        
        # Access control
        if user.role == "PATIENT" and patient.user != user:
            return api_response(False, None, "You can only view your own profile")


        # Gather data
        patient_data = self.get_serializer(patient).data
        vitals = patient.vitals.all().order_by("-recorded_at")
        records = patient.records.select_related("created_by", "approved_by").prefetch_related("prescriptions", "documents").order_by("-created_at")
        
        # If PATIENT, filter records to only show APPROVED
        if user.role == "PATIENT":
            records = records.filter(status=MedicalRecord.Status.APPROVED)
            
        all_records = records.all()
        
        # Calculate Quick Stats
        total_visits = all_records.count()
        last_visit = all_records.first().visit_date if total_visits > 0 else None
        
        from records.models import Prescription, MedicalDocument
        active_prescriptions = Prescription.objects.filter(record__in=all_records).count()
        pending_labs = all_records.filter(visit_type="LAB_DIAGNOSTICS", status="PENDING").count()

        all_documents = MedicalDocument.objects.filter(record__in=all_records).order_by("-uploaded_at")
        from records.serializers import MedicalDocumentSerializer
            
        # Augment patient_data with readable name and hospital
        patient_data = dict(patient_data)
        patient_data["user"] = patient.user.get_full_name() or patient.user.username
        patient_data["hospital"] = patient.hospital.name if patient.hospital else "—"
        patient_data["user_name"] = patient_data["user"]
        patient_data["hospital_name"] = patient_data["hospital"]

        return api_response(True, {
            "patient": patient_data,
            "vitals": VitalsSerializer(vitals, many=True).data,
            "records": MedicalRecordSerializer(all_records, many=True).data,
            "documents": MedicalDocumentSerializer(all_documents, many=True).data,
            "stats": {
                "total_visits": total_visits,
                "last_visit": str(last_visit) if last_visit else None,
                "active_prescriptions": active_prescriptions,
                "pending_labs": pending_labs
            }
        }, "Patient profile fetched")

    @action(detail=True, methods=["post"], url_path="add-vitals")
    def add_vitals(self, request, pk=None):
        patient = self.get_object()
        user = request.user
        
        if user.role != "STAFF":
            return api_response(False, None, "Only staff can add vitals")
            
        serializer = VitalsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=patient, recorded_by=user)
        
        AuditLog.objects.create(
            user=user,
            action="VITALS_ADDED",
            target_model="Vitals",
            target_id=str(serializer.instance.id),
            description=f"Vitals added for patient {patient.patient_id}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, serializer.data, "Vitals added successfully")

    @action(detail=True, methods=["post"], url_path="assign-staff")
    def assign_staff(self, request, pk=None):
        patient = self.get_object()
        user = request.user
        if user.role != "DOCTOR":
            return api_response(False, None, "Only doctors can assign staff")
            
        staff_id = request.data.get("staff_id")
        if not staff_id:
            return api_response(False, None, "Staff ID is required")
            
        try:
            staff = User.objects.get(id=staff_id, role="STAFF", hospital=user.hospital)
        except User.DoesNotExist:
            return api_response(False, None, "Invalid staff ID")
            
        from .models import DoctorStaffAccess
        access, created = DoctorStaffAccess.objects.get_or_create(
            staff=staff,
            patient=patient,
            defaults={"is_active": True}
        )
        if not created and not access.is_active:
            access.is_active = True
            access.save()
            
        AuditLog.objects.create(
            user=user,
            action="STAFF_ASSIGNED",
            target_model="DoctorStaffAccess",
            target_id=str(access.id),
            description=f"Staff {staff.username} assigned to patient {patient.patient_id}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "Staff assigned successfully")

    @action(detail=True, methods=["get"], url_path="qr")
    def qr(self, request, pk=None):
        patient = self.get_object()
        user = request.user
        if user.role == "PATIENT" and patient.user != user:
            return api_response(False, None, "You can only view your own QR code")
        return api_response(True, {"qr_code_url": patient.qr_code.url if patient.qr_code else None}, "QR code")

    @action(detail=False, methods=["get"], url_path="profile-status")
    def profile_status(self, request):
        user = request.user
        if user.role != "PATIENT":
            return api_response(False, None, "Only patients have a profile status")
        try:
            patient = user.patient_profile
            return api_response(True, {"is_complete": patient.is_profile_complete}, "Profile status")
        except Patient.DoesNotExist:
            return api_response(True, {"is_complete": False}, "Profile status")

    @action(detail=False, methods=["post"], url_path="complete-profile")
    def complete_profile(self, request):
        user = request.user
        if user.role != "PATIENT":
            return api_response(False, None, "Only patients can complete their profile")
        
        try:
            patient = user.patient_profile
        except Patient.DoesNotExist:
            return api_response(False, None, "Patient profile not found")

        data = request.data
        if "address" in data:
            patient.address = data["address"]
        if "emergency_contact_name" in data:
            patient.emergency_contact_name = data["emergency_contact_name"]
        if "emergency_contact_phone" in data:
            patient.emergency_contact_phone = data["emergency_contact_phone"]
        if "known_allergies" in data:
            patient.known_allergies = data["known_allergies"]
        if "blood_group" in data:
            patient.blood_group = data["blood_group"]
            
        patient.is_profile_complete = True
        patient.save()
        
        AuditLog.objects.create(
            user=user,
            action="PROFILE_COMPLETED",
            target_model="Patient",
            target_id=patient.patient_id,
            description="Patient completed their profile",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "Profile completed successfully")

    @action(detail=True, methods=["get"], url_path="export-pdf")
    def export_pdf(self, request, pk=None):
        patient = self.get_object()
        user = request.user
        if user.role == "PATIENT" and patient.user != user:
            return api_response(False, None, "You can only export your own records")

        records = MedicalRecord.objects.filter(
            patient=patient, status=MedicalRecord.Status.APPROVED
        ).order_by("visit_date")

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        p.setFont("Helvetica-Bold", 14)
        p.drawString(20 * mm, (height - 20 * mm), "MediTrack - Patient Record History")
        p.setFont("Helvetica", 11)
        p.drawString(20 * mm, (height - 30 * mm), f"Name: {patient.user.get_full_name()}")
        p.drawString(20 * mm, (height - 36 * mm), f"Patient ID: {patient.patient_id}")
        p.drawString(20 * mm, (height - 42 * mm), f"Blood Group: {patient.blood_group}")

        # Table header
        y = height - 60 * mm
        p.setFont("Helvetica-Bold", 10)
        p.drawString(20 * mm, y, "Visit Date")
        p.drawString(50 * mm, y, "Type")
        p.drawString(80 * mm, y, "Diagnosis")
        p.drawString(140 * mm, y, "Status")
        y -= 6 * mm
        p.setFont("Helvetica", 9)

        for record in records:
            if y < 30 * mm:
                # Watermark on each page
                p.saveState()
                p.setFont("Helvetica", 40)
                p.setFillGray(0.9, 0.3)
                p.rotate(45)
                p.drawString(40 * mm, 0, patient.patient_id)
                p.restoreState()
                p.showPage()
                y = height - 20 * mm
                p.setFont("Helvetica", 9)
            p.drawString(20 * mm, y, record.visit_date.isoformat() if hasattr(record.visit_date, "isoformat") else str(record.visit_date))
            p.drawString(50 * mm, y, record.visit_type)
            p.drawString(80 * mm, y, (record.diagnosis or "")[:40])
            p.drawString(140 * mm, y, record.status)
            y -= 6 * mm

        # Watermark for the last page
        p.saveState()
        p.setFont("Helvetica", 40)
        p.setFillGray(0.9, 0.3)
        p.rotate(45)
        p.drawString(40 * mm, 0, patient.patient_id)
        p.restoreState()

        p.showPage()
        p.save()
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="patient_{patient.patient_id}_records.pdf"'
        return response

