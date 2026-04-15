import re

with open("h:/project/backend/accounts/views.py", "r", encoding="utf-8") as f:
    content = f.read()

match_pattern = r'class SendOTPView\(views\.APIView\):.*?def create\(self, request, \*args, \*\*kwargs\):.*?cache\.delete\(cache_key\)'

replacement = '''class SendOTPView(views.APIView):
    """
    Endpoint to send an OTP to the user's phone for registration verification.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        phone = request.data.get("phone")
        if not phone:
            return api_response(False, None, "Phone number is required", status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(phone=phone).exists():
            return api_response(False, None, "A user with this phone number already exists", status=400)

        import random
        import hashlib
        from django.core.cache import cache
        otp = str(random.randint(100000, 999999))
        cache_key = f"register_otp_{phone}"
        
        hashed_otp = hashlib.sha256(otp.encode("utf-8")).hexdigest()
        cache.set(cache_key, hashed_otp, timeout=600)  # Valid for 10 minutes

        # Send SMS
        from meditrack.utils import send_sms
        message = f"Your MediTrack verification code is: {otp}. It will expire in 10 minutes."
        
        # We will attempt to send SMS. If twilio is misconfigured, we'll return an error.
        success = send_sms(phone, message)
        if not success:
            return api_response(False, None, "Failed to send SMS. Please check Twilio configuration.", status=500)
            
        return api_response(True, None, "OTP sent successfully to " + phone)


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
            phone = data.get("phone")
            otp = data.get("otp")
            if not otp:
                return api_response(False, None, "OTP is required for patient registration", status=400)
            
            import hashlib
            from django.core.cache import cache
            cache_key = f"register_otp_{phone}"
            cached_hash = cache.get(cache_key)
            
            if not cached_hash:
                return api_response(False, None, "OTP has expired or is invalid", status=400)
                
            provided_hash = hashlib.sha256(str(otp).encode("utf-8")).hexdigest()
            if provided_hash != cached_hash:
                return api_response(False, None, "Invalid OTP", status=400)
                
            cache.delete(cache_key)'''

new_content = re.sub(match_pattern, replacement, content, flags=re.DOTALL)

with open("h:/project/backend/accounts/views.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("SMS patch applied successfully")
