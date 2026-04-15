import re

with open("h:/project/backend/accounts/views.py", "r", encoding="utf-8") as f:
    content = f.read()

# Clear out the duplicate SendOTPView classes and rewrite the create method
# Looking for everything from the first SendOTPView up to the end of the create method's signature.
match_pattern = r'class SendOTPView\(views\.APIView\):.*?def create\(self, request, \*args, \*\*kwargs\):\n        serializer = self\.get_serializer\(data=request\.data\)\n        serializer\.is_valid\(raise_exception=True\)\n        user = serializer\.save\(\)'

replacement = '''class SendOTPView(views.APIView):
    """
    Endpoint to send an OTP to the user's email for registration verification.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return api_response(False, None, "Email is required", status=400)
        
        # Check if email is already registered
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=email).exists():
            return api_response(False, None, "A user with this email already exists", status=400)

        import random
        import hashlib
        from django.core.cache import cache
        otp = str(random.randint(100000, 999999))
        cache_key = f"register_otp_{email}"
        
        hashed_otp = hashlib.sha256(otp.encode("utf-8")).hexdigest()
        cache.set(cache_key, hashed_otp, timeout=600)  # Valid for 10 minutes

        # Send email
        from meditrack.utils import send_email
        send_email(
            subject="MediTrack Verification Code",
            message=f"Your registration verification code is: {otp}\\n\\nThis code will expire in 10 minutes.",
            to_email=email,
        )
        return api_response(True, None, "OTP sent successfully")


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for patient or doctor self-registration.
    Requires OTP verification for patients.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Verify OTP for patients
        if data.get("role") == "PATIENT":
            email = data.get("email")
            otp = data.get("otp")
            if not otp:
                return api_response(False, None, "OTP is required for patient registration", status=400)
            
            import hashlib
            from django.core.cache import cache
            cache_key = f"register_otp_{email}"
            cached_hash = cache.get(cache_key)
            
            if not cached_hash:
                return api_response(False, None, "OTP has expired or is invalid", status=400)
                
            provided_hash = hashlib.sha256(str(otp).encode("utf-8")).hexdigest()
            if provided_hash != cached_hash:
                return api_response(False, None, "Invalid OTP", status=400)
                
            cache.delete(cache_key)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()'''

new_content = re.sub(match_pattern, replacement, content, flags=re.DOTALL)

with open("h:/project/backend/accounts/views.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patch applied successfully.")
