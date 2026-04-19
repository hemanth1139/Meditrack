path = r'h:\project\backend\meditrack\utils.py'
content = open(path, 'rb').read().decode('utf-8')

old = '''def send_sms(phone: str, message: str) -> bool:\r\n    """Send an SMS using Twilio."""\r\n    from decouple import config\r\n    from twilio.rest import Client\r\n    import logging\r\n    logger = logging.getLogger(__name__)\r\n\r\n    try:\r\n        account_sid = config("TWILIO_ACCOUNT_SID", default="")\r\n        auth_token = config("TWILIO_AUTH_TOKEN", default="")\r\n        from_phone = config("TWILIO_PHONE_NUMBER", default="")\r\n        \r\n        if not account_sid or not auth_token:\r\n            logger.error("Twilio credentials not configured.")\r\n            return False\r\n            \r\n        client = Client(account_sid, auth_token)\r\n        message = client.messages.create(\r\n            body=message,\r\n            from_=from_phone,\r\n            to=phone\r\n        )\r\n        return True\r\n    except Exception as e:\r\n        logger.error(f"Failed to send SMS to {phone}: {e}")\r\n        return False'''

new = '''def send_sms(phone: str, otp: str) -> bool:\r\n    """Send an OTP SMS using Fast2SMS — works for any Indian mobile number.\"\"\"\r\n    import requests\r\n    import logging\r\n    from decouple import config\r\n    logger = logging.getLogger(__name__)\r\n\r\n    try:\r\n        api_key = config("FAST2SMS_API_KEY", default="")\r\n        if not api_key:\r\n            logger.error("FAST2SMS_API_KEY not configured.")\r\n            return False\r\n\r\n        # Strip +91 or leading zeros — Fast2SMS expects a plain 10-digit number\r\n        number = phone.strip()\r\n        if number.startswith("+91"):\r\n            number = number[3:]\r\n        elif number.startswith("91") and len(number) == 12:\r\n            number = number[2:]\r\n        elif number.startswith("0"):\r\n            number = number[1:]\r\n\r\n        response = requests.get(\r\n            "https://www.fast2sms.com/dev/bulkV2",\r\n            params={\r\n                "authorization": api_key,\r\n                "route": "otp",\r\n                "variables_values": otp,\r\n                "flash": "0",\r\n                "numbers": number,\r\n            },\r\n            timeout=10,\r\n        )\r\n        result = response.json()\r\n        if result.get("return") is True:\r\n            logger.info(f"OTP SMS sent to {number} via Fast2SMS.")\r\n            return True\r\n        else:\r\n            logger.error(f"Fast2SMS error for {number}: {result}")\r\n            return False\r\n    except Exception as e:\r\n        logger.error(f"Failed to send SMS to {phone}: {e}")\r\n        return False'''

if old in content:
    content = content.replace(old, new, 1)
    open(path, 'wb').write(content.encode('utf-8'))
    print('SUCCESS')
else:
    print('NOT FOUND')
    for i, line in enumerate(content.splitlines(), 1):
        if 33 <= i <= 58:
            print(i, repr(line))
