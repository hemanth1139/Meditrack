import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'meditrack.settings')
django.setup()

from patients.models import Patient
from records.models import MedicalRecord
from hospitals.models import Hospital
from django.contrib.auth import get_user_model

User = get_user_model()

def test_hashing():
    print("Starting Integrity Test...")
    
    # Get or create a test patient and doctor
    doctor = User.objects.filter(role="DOCTOR").first()
    if not doctor:
        print("No doctor found. Testing aborted.")
        return
        
    patient = Patient.objects.all().first()
    if not patient:
        print("No patient found. Testing aborted.")
        return
    
    hospital = Hospital.objects.all().first()
    if not hospital:
        print("No hospital found. Testing aborted.")
        return

    # Delete existing records for this patient to have a clean chain for testing
    MedicalRecord.objects.filter(patient=patient).delete()
    print(f"Cleared existing records for patient {patient.patient_id}")

    # 1. Create first record (Genesis)
    print("\nCreating Record #1...")
    rec1 = MedicalRecord.objects.create(
        patient=patient,
        hospital=hospital,
        created_by=doctor,
        visit_type="CONSULTATION",
        diagnosis="Healthy",
        doctor_notes="No issues",
        status="APPROVED"  # This should trigger hashing
    )
    rec1.refresh_from_db()
    print(f"Record #1 Hash: {rec1.record_hash[:16]}...")
    print(f"Record #1 Prev Hash: {rec1.prev_hash}")
    assert rec1.prev_hash == "GENESIS", "First record should have GENESIS as prev_hash"
    assert rec1.record_hash != "", "First record should have a hash"

    # 2. Create second record (Linked)
    print("\nCreating Record #2...")
    rec2 = MedicalRecord.objects.create(
        patient=patient,
        hospital=hospital,
        created_by=doctor,
        visit_type="LAB_DIAGNOSTICS",
        diagnosis="Blood Test",
        doctor_notes="Wait for results",
        status="APPROVED"
    )
    rec2.refresh_from_db()
    print(f"Record #2 Hash: {rec2.record_hash[:16]}...")
    print(f"Record #2 Prev Hash: {rec2.prev_hash[:16]}...")
    assert rec2.prev_hash == rec1.record_hash, "Second record should link to first record's hash"

    # 3. Test Verification Endpoint Logic
    print("\nVerifying Chain...")
    from records.views import VerifyIntegrityView
    from rest_framework.test import APIRequestFactory
    factory = APIRequestFactory()
    view = VerifyIntegrityView.as_view()
    
    request = factory.get(f'/api/records/integrity/verify/{patient.patient_id}/')
    django.contrib.auth.models.AnonymousUser = User # Mock
    from rest_framework.test import force_authenticate
    force_authenticate(request, user=doctor)
    
    response = view(request, patient_id=patient.patient_id)
    data = response.data['data']
    
    records = data['records']
    print(f"Verified {len(records)} records.")
    for r in records:
        print(f"Record {r['record_id']}: hash_valid={r['hash_valid']}, chain_valid={r['chain_valid']}")
        assert r['hash_valid'] and r['chain_valid'], f"Record {r['record_id']} should be valid"

    # 4. Simulate Tampering
    print("\nSimulating Tampering on Record #1...")
    # Directly update the database bypass save() logic that would re-hash
    MedicalRecord.objects.filter(id=rec1.id).update(diagnosis="TAMPERED DATA")
    
    print("Re-verifying Chain...")
    response = view(request, patient_id=patient.patient_id)
    data = response.data['data']
    records = data['records']
    
    rec1_verified = next(r for r in records if r['record_id'] == rec1.id)
    rec2_verified = next(r for r in records if r['record_id'] == rec2.id)
    
    print(f"Record #1 (Tampered): hash_valid={rec1_verified['hash_valid']}, chain_valid={rec1_verified['chain_valid']}")
    print(f"Record #2 (Broken Chain): hash_valid={rec2_verified['hash_valid']}, chain_valid={rec2_verified['chain_valid']}")
    
    assert rec1_verified['hash_valid'] == False, "Tampered record should have invalid hash"
    assert rec2_verified['chain_valid'] == False, "Subsequent record should have invalid chain (prev_hash mismatch)"

    print("\n--- TEST PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_hashing()
