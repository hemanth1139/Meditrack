new_views = '''

import base64
import io
import pyotp
import qrcode
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken

class Setup2FAView(views.APIView):
    permission_classes = []

    def post(self, request):
        temp_token = request.data.get('temp_token')
        if not temp_token:
            return api_response(False, None, 'Token required', 400)
        
        user_id = cache.get(f"2fa_pending_{temp_token}")
        if not user_id:
            return api_response(False, None, 'Session expired', 400)
            
        user = User.objects.get(id=user_id)
        if user.totp_secret:
            return api_response(False, None, '2FA already setup', 400)
        
        secret = pyotp.random_base32()
        cache.set(f"2fa_staged_{temp_token}", secret, timeout=300)
        
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="MediTrack")
        
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return api_response(True, {
            "qr_code": f"data:image/png;base64,{qr_b64}",
            "secret": secret
        }, "2FA setup initiated")

class Verify2FAView(views.APIView):
    permission_classes = []

    def post(self, request):
        temp_token = request.data.get('temp_token')
        code = request.data.get('code')
        if not temp_token or not code:
            return api_response(False, None, 'Token and code required', 400)
            
        user_id = cache.get(f"2fa_pending_{temp_token}")
        if not user_id:
            return api_response(False, None, 'Session expired', 400)
            
        user = User.objects.get(id=user_id)
        
        secret = user.totp_secret
        if not secret:
            secret = cache.get(f"2fa_staged_{temp_token}")
            if not secret:
                return api_response(False, None, 'Setup required', 400)
                
        totp = pyotp.TOTP(secret)
        if not totp.verify(code):
            return api_response(False, None, 'Invalid authentication code', 400)
            
        if not user.totp_secret:
            user.totp_secret = secret
            user.save()
            
        cache.delete(f"2fa_pending_{temp_token}")
        cache.delete(f"2fa_staged_{temp_token}")
        
        refresh = RefreshToken.for_user(user)
        role = user.role or ("ADMIN" if user.is_superuser else "USER")
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "id": user.id,
            "email": user.email,
            "role": role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "hospital_id": getattr(user, "hospital_id", None),
            "requires_password_change": getattr(user, "requires_password_change", False)
        }
        return api_response(True, data, "Login successful")
'''

with open("h:/project/backend/accounts/views.py", "a", encoding="utf-8") as f:
    f.write(new_views)
