path = r'h:\project\backend\meditrack\utils.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We will use regex to replace the entire send_sms function, just in case of formatting variations
new_func = '''def send_sms(phone: str, message: str) -> bool:
    """Send an SMS using Twilio."""
    from decouple import config
    from twilio.rest import Client
    import logging
    logger = logging.getLogger(__name__)

    try:
        account_sid = config("TWILIO_ACCOUNT_SID", default="")
        auth_token = config("TWILIO_AUTH_TOKEN", default="")
        from_phone = config("TWILIO_PHONE_NUMBER", default="")
        
        if not account_sid or not auth_token:
            logger.error("Twilio credentials not configured.")
            return False
            
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message,
            from_=from_phone,
            to=phone
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone}: {e}")
        return False'''

# Locate the send_sms function and everything until the next function (def dict_to_json)
pattern = re.compile(r'def send_sms.*?return False', re.DOTALL)

if pattern.search(content):
    content = pattern.sub(new_func, content, count=1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS restoring Twilio in utils.py')
else:
    print('FAILED to find send_sms function in utils.py')
