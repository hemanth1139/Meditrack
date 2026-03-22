from rest_framework import permissions, views

from accounts.permissions import IsAdminUserRole, IsDoctor
from common.utils import api_response
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
        from common.utils import sha256_hash

        for record in records:
            payload = (
                record.patient.patient_id
                + record.record_type
                + (record.diagnosis or "")
                + (record.notes or "")
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

