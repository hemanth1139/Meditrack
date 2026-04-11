import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'meditrack.settings')
django.setup()

from django.contrib.auth import get_user_model
from patients.models import Patient

User = get_user_model()

print("--- Data Integrity Check ---")

# Check for duplicated names
duplicated_names = User.objects.filter(first_name=django.db.models.F('last_name'))
print(f"Users with duplicated First/Last names: {duplicated_names.count()}")

# Check for patients with missing patient_id
missing_ids = Patient.objects.filter(django.db.models.Q(patient_id__isnull=True) | django.db.models.Q(patient_id=''))
print(f"Patients with missing Patient ID: {missing_ids.count()}")

# List some examples
if duplicated_names.exists():
    print("\nExamples of duplicated names:")
    for u in duplicated_names[:5]:
        print(f"- {u.email}: {u.first_name} | {u.last_name}")

if missing_ids.exists():
    print("\nExamples of missing Patient IDs:")
    for p in missing_ids[:5]:
        print(f"- {p.user.email} (Patient ID: {p.patient_id})")
