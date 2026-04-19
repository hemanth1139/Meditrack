from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action

from accounts.permissions import IsAdminUserRole, IsDoctor, IsStaff
from accounts.models import AuditLog
from meditrack.utils import api_response
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

    queryset = MedicalRecord.objects.select_related("patient", "patient__user", "hospital", "created_by", "approved_by").prefetch_related("prescriptions", "documents").all()
    serializer_class = MedicalRecordSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        if self.action in ["approve", "reject", "flag"]:
            return [permissions.IsAuthenticated(), IsDoctor()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        user = request.user
        qs = self.get_queryset()
        if user.role == "PATIENT":
            qs = qs.filter(patient__user=user, status=MedicalRecord.Status.APPROVED)
        elif user.role in ["DOCTOR", "STAFF"] and user.hospital:
            # Scope to own hospital's records only
            qs = qs.filter(hospital=user.hospital)
            
        qs = qs.order_by("-visit_date")
        
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
            }, "Records fetched")

        serializer = self.get_serializer(qs, many=True)
        return api_response(True, serializer.data, "Records fetched")

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["DOCTOR", "STAFF"]:
            return api_response(False, None, "You don't have permission to do this", status=403)
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
        if user.role == "PATIENT" and record.status != MedicalRecord.Status.APPROVED:
            return api_response(False, None, "Patients can only view approved records")
        
        AuditLog.objects.create(
            user=user,
            action="RECORD_VIEWED",
            target_model="MedicalRecord",
            target_id=str(record.id),
            description=f"Record viewed by {user.email}",
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        
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
            # Use 'raw' for PDFs so Cloudinary serves them as downloadable files (/raw/upload/ URL)
            # Use 'image' for actual images so transformations work
            content_type = file.content_type or ""
            is_pdf = content_type == "application/pdf" or file.name.lower().endswith(".pdf")
            resource_type = "raw" if is_pdf else "image"
            
            upload_data = cloudinary.uploader.upload(file, resource_type=resource_type)
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



from rest_framework import permissions, views

from accounts.permissions import IsAdminUserRole, IsDoctor
from meditrack.utils import api_response
from patients.models import Patient
from records.models import MedicalRecord


class VerifyIntegrityView(views.APIView):
    """
    Walk the entire hash chain for a patient and return each record's validity status.
    """

    permission_classes = [permissions.IsAuthenticated, (IsAdminUserRole | IsDoctor)]

    def get(self, request, patient_id: str, *args, **kwargs):
        patient = Patient.objects.get(patient_id=patient_id)
        records = (
            MedicalRecord.objects.filter(patient=patient, status=MedicalRecord.Status.APPROVED)
            .order_by("approved_at")
            .all()
        )
        results = []
        prev_hash_expected = "GENESIS"
        from meditrack.utils import sha256_hash

        for record in records:
            payload = (
                record.patient.patient_id
                + record.visit_type
                + (record.diagnosis or "")
                + (record.doctor_notes or "")
                + record.visit_date.isoformat()
                + record.created_at.isoformat()
            )
            recomputed_hash = sha256_hash(payload)
            hash_valid = recomputed_hash == record.record_hash
            chain_valid = record.prev_hash == prev_hash_expected
            results.append(
                {
                    "record_id": record.id,
                    "record_hash": record.record_hash,
                    "prev_hash": record.prev_hash,
                    "hash_valid": hash_valid,
                    "chain_valid": chain_valid,
                }
            )
            prev_hash_expected = record.record_hash

        return api_response(True, {"patient_id": patient_id, "records": results}, "Integrity verification completed")

