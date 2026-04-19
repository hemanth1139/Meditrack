path = r'h:\project\backend\accounts\views.py'
content = open(path, 'rb').read().decode('utf-8')

old = (
    '        # Send OTP via Fast2SMS — works for any Indian mobile number\r\n'
    '        from meditrack.utils import send_sms\r\n'
    '        from django.conf import settings\r\n'
    '        import logging\r\n'
    '        logger = logging.getLogger(__name__)\r\n'
    '\r\n'
    '        # send_sms now accepts the raw OTP (Fast2SMS uses its own OTP template)\r\n'
    '        success = send_sms(phone, otp)\r\n'
    '\r\n'
    '        if not success:\r\n'
    '            if settings.DEBUG:\r\n'
    '                # Fallback: log OTP to console so dev/testing is never blocked\r\n'
    '                logger.warning(\r\n'
    '                    "[DEV] SMS failed for %s. OTP for manual testing: %s", phone, otp\r\n'
    '                )\r\n'
    '                return api_response(True, {"dev_otp": otp},\r\n'
    '                                    "SMS unavailable (dev mode). Use the OTP from the server console.")\r\n'
    '            return api_response(False, None, "Failed to send SMS. Please try again later.", status=500)\r\n'
    '\r\n'
    '        return api_response(True, None, "Verification code sent to " + phone)\r\n'
)

new = (
    '        # Send OTP via SMS using Twilio\r\n'
    '        from meditrack.utils import send_sms\r\n'
    '        from django.conf import settings\r\n'
    '        import logging\r\n'
    '        logger = logging.getLogger(__name__)\r\n'
    '\r\n'
    '        sms_body = f"Your MediTrack verification code is: {otp}. It will expire in 10 minutes."\r\n'
    '        success = send_sms(phone, sms_body)\r\n'
    '\r\n'
    '        if not success:\r\n'
    '            if settings.DEBUG:\r\n'
    '                # Twilio trial accounts can only SMS verified numbers.\r\n'
    '                # In dev mode: log OTP so registration can still be tested.\r\n'
    '                logger.warning(\r\n'
    '                    "[DEV] SMS failed for %s. OTP for manual testing: %s", phone, otp\r\n'
    '                )\r\n'
    '                return api_response(True, {"dev_otp": otp},\r\n'
    '                                    "SMS unavailable (dev mode). Use the OTP from the server console.")\r\n'
    '            return api_response(False, None, "Failed to send SMS. Please try again later.", status=500)\r\n'
    '\r\n'
    '        return api_response(True, None, "Verification code sent to " + phone)\r\n'
)

if old in content:
    content = content.replace(old, new, 1)
    # Be sure to write correctly encoded
    open(path, 'wb').write(content.encode('utf-8'))
    print('SUCCESS')
else:
    print('NOT FOUND')
