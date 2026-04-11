from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import F, Q
from patients.models import Patient

User = get_user_model()

class Command(BaseCommand):
    help = 'Purges corrupted profiles and fixes naming issues by deleting invalid records.'

    def handle(self, *args, **options):
        self.stdout.write('Starting cleanup/purge process...')

        # 1. Purge Patients with missing IDs or 'N/A'
        # According to user: "qrcode ... occur in the existing profile then remove it completely"
        broken_patients = Patient.objects.filter(
            Q(patient_id__in=['', 'N/A']) | Q(patient_id__isnull=True)
        )
        
        count_p = 0
        for p in broken_patients:
            user = p.user
            p_id = p.patient_id
            p.delete()
            if user:
                email = user.email
                user.delete()
                self.stdout.write(f'Deleted patient {p_id} and user {email}')
            count_p += 1
        
        self.stdout.write(self.style.SUCCESS(f'Deleted {count_p} patients with missing/invalid IDs.'))

        # 2. Purge Users with duplicated names
        # High-risk: User requested "remove it completely from the database"
        # We exclude ADMINs unless they specifically have this issue? User didn't specify.
        # But usually we don't want to delete the main admin.
        duplicated_users = User.objects.filter(
            first_name=F('last_name')
        ).exclude(first_name='').exclude(role='ADMIN')
        
        count_u = 0
        for u in duplicated_users:
            email = u.email
            u.delete()
            self.stdout.write(f'Deleted user {email} due to duplicated name.')
            count_u += 1
            
        self.stdout.write(self.style.SUCCESS(f'Deleted {count_u} users with duplicated names.'))

        self.stdout.write(self.style.SUCCESS('Cleanup completed.'))
