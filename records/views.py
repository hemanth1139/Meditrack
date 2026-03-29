from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action

from accounts.permissions import IsAdminUserRole, IsDoctor, IsStaff
from audit.models import AuditLog
from common.utils import api_response
from .models import MedicalRecord, Prescription, MedicalDocument
from .serializers import MedicalRecordSerializer, MedicalDocumentSerializer
from rest_framework.parsers import MultiPartParser
import cloudinary.uploader


class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing medical records:
    - Create record (doctor auto-approved, staff pending)
    - List records (filtered by role and hospital)
    - Approve/reject/flag records
    - Delete flagged records (admin only)
    """

    queryset = MedicalRecord.objects.select_related("patient", "hospital", "created_by", "approved_by").all()
    serializer_class = MedicalRecordSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), (IsDoctor | IsStaff)()]
        if self.action in ["approve", "reject", "flag"]:
            return [permissions.IsAuthenticated(), IsDoctor()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        user = request.user
        qs = self.get_queryset()
        if user.role in ["STAFF", "DOCTOR"]:
            qs = qs.filter(hospital=user.hospital)
        if user.role == "PATIENT":
            qs = qs.filter(patient__user=user, status=MedicalRecord.Status.APPROVED)
        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Records fetched")

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        prescriptions_data = data.pop("prescriptions", [])
        
        documents_data = data.pop("documents", [])
        
        data["created_by_id"] = request.user.id
        data["hospital_id"] = request.user.hospital_id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        
        # Save prescriptions
        for p_data in prescriptions_data:
            Prescription.objects.create(
                record=record,
                medicine_name=p_data.get("medicine_name", ""),
                medicine_type=p_data.get("medicine_type", "TABLET"),
                dosage=p_data.get("dosage", ""),
                frequency=p_data.get("frequency", "OD"),
                duration_value=p_data.get("duration_value", 1),
                duration_unit=p_data.get("duration_unit", "Days"),
                route=p_data.get("route", "ORAL"),
                special_instructions=p_data.get("special_instructions", ""),
                refills_allowed=p_data.get("refills_allowed", 0),
            )
            
        # Save documents
        from .models import MedicalDocument
        for d_data in documents_data:
            MedicalDocument.objects.create(
                record=record,
                doc_type=d_data.get("doc_type", "OTHER"),
                label=d_data.get("label", "Document"),
                cloudinary_url=d_data.get("cloudinary_url", ""),
                cloudinary_public_id=d_data.get("cloudinary_public_id", ""),
                file_type=d_data.get("file_type", "pdf")
            )

        # Auto-approve if doctor, pending if staff
        if request.user.role == "DOCTOR":
            record.status = MedicalRecord.Status.APPROVED
            record.approved_by = request.user
            record.approved_at = timezone.now()
            record.save()
        else:
            record.status = MedicalRecord.Status.PENDING
            record.save()
        AuditLog.objects.create(
            user=request.user,
            action="RECORD_CREATED",
            target_model="MedicalRecord",
            target_id=str(record.id),
            description=f"Record created with status {record.status}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        
        # Refresh to get nested prescriptions
        record.refresh_from_db()
        return api_response(True, self.get_serializer(record).data, "Record created")

    def retrieve(self, request, *args, **kwargs):
        record = self.get_object()
        user = request.user
        if user.role == "PATIENT" and record.patient.user != user:
            return api_response(False, None, "You can only view your own records")
        if user.role in ["STAFF", "DOCTOR"] and record.hospital != user.hospital:
            return api_response(False, None, "Cross-hospital access requires OTP")
        if user.role == "PATIENT" and record.status != MedicalRecord.Status.APPROVED:
            return api_response(False, None, "Patients can only view approved records")
        serializer = self.get_serializer(record)
        return api_response(True, serializer.data, "Record detail")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        record = self.get_object()
        if record.status != MedicalRecord.Status.PENDING:
            return api_response(False, None, "Only pending records can be approved")
        record.status = MedicalRecord.Status.APPROVED
        record.approved_by = request.user
        record.approved_at = timezone.now()
        record.save()
        AuditLog.objects.create(
            user=request.user,
            action="RECORD_APPROVED",
            target_model="MedicalRecord",
            target_id=str(record.id),
            description="Record approved via endpoint",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, self.get_serializer(record).data, "Record approved")

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        record = self.get_object()
        if record.status != MedicalRecord.Status.PENDING:
            return api_response(False, None, "Only pending records can be rejected")
        reason = request.data.get("reason", "")
        record.status = MedicalRecord.Status.REJECTED
        record.flag_reason = reason
        record.save()
        AuditLog.objects.create(
            user=request.user,
            action="RECORD_REJECTED",
            target_model="MedicalRecord",
            target_id=str(record.id),
            description=f"Record rejected: {reason}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, self.get_serializer(record).data, "Record rejected")

    @action(detail=True, methods=["post"], url_path="flag")
    def flag(self, request, pk=None):
        record = self.get_object()
        reason = request.data.get("reason", "")
        record.status = MedicalRecord.Status.FLAGGED
        record.flag_reason = reason
        record.save()
        AuditLog.objects.create(
            user=request.user,
            action="RECORD_FLAGGED",
            target_model="MedicalRecord",
            target_id=str(record.id),
            description=f"Record flagged: {reason}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, self.get_serializer(record).data, "Record flagged")

    def destroy(self, request, *args, **kwargs):
        record = self.get_object()
        if record.status != MedicalRecord.Status.FLAGGED:
            return api_response(False, None, "Only flagged records can be deleted")
        record.delete()
        AuditLog.objects.create(
            user=request.user,
            action="RECORD_DELETED",
            target_model="MedicalRecord",
            target_id=str(record.id),
            description="Flagged record deleted by admin",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return api_response(True, None, "Record deleted")


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for uploading and deleting medical documents via Cloudinary.
    """
    queryset = MedicalDocument.objects.all()
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request):
        user = request.user
        if user.role not in ["DOCTOR", "STAFF"]:
            return api_response(False, None, "Only staff and doctors can upload documents")
            
        file = request.FILES.get('file')
        if not file:
            return api_response(False, None, "No file provided")
            
        try:
            # We can rely on Django's cloudinary-storage or call Cloudinary directly
            upload_data = cloudinary.uploader.upload(file)
            return api_response(True, {
                "cloudinary_url": upload_data.get("secure_url"),
                "cloudinary_public_id": upload_data.get("public_id"),
            }, "File uploaded successfully")
        except Exception as e:
            return api_response(False, None, f"Upload error: {str(e)}")

    def destroy(self, request, *args, **kwargs):
        doc = self.get_object()
        user = request.user
        if user.role not in ["ADMIN", "DOCTOR", "STAFF"]:
            return api_response(False, None, "Not authorized to delete documents")
            
        try:
            if doc.cloudinary_public_id:
                cloudinary.uploader.destroy(doc.cloudinary_public_id)
            doc.delete()
            return api_response(True, None, "Document deleted")
        except Exception as e:
            return api_response(False, None, f"Error deleting document: {str(e)}")

