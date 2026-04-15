from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Resets the 2FA TOTP secret for a user so they get a fresh QR code on next login'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to reset')

    def handle(self, *args, **kwargs):
        email = kwargs['email']
        try:
            user = User.objects.get(email__iexact=email)
            if user.totp_secret:
                user.totp_secret = None
                user.save(update_fields=['totp_secret'])
                self.stdout.write(self.style.SUCCESS(f"Successfully deleted 2FA secret for {email}. They will get a fresh QR code on next login."))
            else:
                self.stdout.write(self.style.WARNING(f"User {email} didn't have 2FA set up anyway."))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User with email {email} does not exist."))
