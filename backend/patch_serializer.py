import re

with open("h:/project/backend/accounts/serializers.py", "r", encoding="utf-8") as f:
    content = f.read()

match_pattern = r"            data\['id'\] = self\.user\.id.*?requires_password_change': getattr\(user, 'requires_password_change', False\),\n        \}"

replacement = '''        
        # Unified token generation
        user = self.user
        role = user.role or ("ADMIN" if user.is_superuser else "USER")
        
        # Intercept for 2FA on Admin/Hospital Admin
        if role in ["ADMIN", "HOSPITAL_ADMIN"]:
            import uuid
            from django.core.cache import cache
            temp_token = str(uuid.uuid4())
            # Store user.id in cache for 5 minutes
            cache.set(f"2fa_pending_{temp_token}", user.id, timeout=300)
            return {
                "requires_2fa": True,
                "temp_token": temp_token,
                "is_setup": bool(user.totp_secret),
                "role": role
            }

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "id": user.id,
            "email": user.email,
            "role": role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "hospital_id": getattr(user, "hospital_id", None),
            "requires_password_change": getattr(user, "requires_password_change", False),
        }'''

new_content = re.sub(match_pattern, replacement, content, flags=re.DOTALL)

with open("h:/project/backend/accounts/serializers.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patch applied to serializers.py")
