"""
services/whatsapp.py
WhatsApp message simulation service
In production: replace with Meta Business API / Twilio WhatsApp
"""

import json
from datetime import datetime
from pathlib import Path

WA_LOG_FILE = Path(__file__).parent.parent / "data" / "whatsapp_log.json"

TEMPLATES = {
    "hindi": """नमस्ते {name} जी! 👋

Rupeezy AI Agent (Priya) से बात करके अच्छा लगा।

जैसा discuss किया:
✅ Zero joining fee
✅ 100% brokerage share  
✅ Daily payouts via RISE Portal

Sign-up link: rupeezy.in/partner/signup
RISE Portal demo: rupeezy.in/rise-demo
Commission calculator: rupeezy.in/calculator

कोई सवाल हो तो बताएं! हम 24/7 available हैं। 😊

— Team Rupeezy""",

    "english": """Hi {name}! 👋

Great speaking with you via Rupeezy AI Agent (Priya).

As discussed:
✅ Zero joining fee
✅ 100% brokerage share
✅ Daily payouts via RISE Portal

Sign up now (takes 5 mins): rupeezy.in/partner/signup
RISE Portal demo: rupeezy.in/rise-demo
Commission calculator: rupeezy.in/calculator

Any questions? We're available 24/7! 😊

— Team Rupeezy""",

    "hinglish": """Hello {name} ji! 👋

Rupeezy AI Agent (Priya) se baat karke achha laga!

Jaise discuss kiya:
✅ Zero joining fee
✅ 100% brokerage share
✅ Daily payouts via RISE Portal

Sign up karo (5 min mein hoga): rupeezy.in/partner/signup
RISE Portal demo: rupeezy.in/rise-demo
Commission calculator: rupeezy.in/calculator

Koi sawaal ho toh batao! 24/7 available hain. 😊

— Team Rupeezy""",

    "tamil": """வணக்கம் {name} அவர்களே! 👋

Rupeezy AI Agent (Priya) உடன் பேசியது மகிழ்ச்சி!

✅ சேர்வதற்கு கட்டணமில்லை
✅ 100% தரகு பங்கு
✅ RISE Portal மூலம் தினசரி கட்டணம்

இணைய: rupeezy.in/partner/signup
— Team Rupeezy""",

    "telugu": """నమస్కారం {name} గారు! 👋

Rupeezy AI Agent (Priya) తో మాట్లాడినందుకు సంతోషం!

✅ Zero joining fee
✅ 100% brokerage share
✅ Daily payouts via RISE Portal

Sign up: rupeezy.in/partner/signup
— Team Rupeezy""",

    "marathi": """नमस्कार {name} जी! 👋

Rupeezy AI Agent (Priya) शी बोलणे आनंददायी होते!

✅ Zero joining fee
✅ 100% brokerage share
✅ Daily payouts via RISE Portal

Sign up: rupeezy.in/partner/signup
— Team Rupeezy""",

    "bengali": """নমস্কার {name} সাহেব! 👋

Rupeezy AI Agent (Priya)-এর সাথে কথা বলে ভালো লাগলো!

✅ Zero joining fee
✅ 100% brokerage share
✅ Daily payouts via RISE Portal

Sign up: rupeezy.in/partner/signup
— Team Rupeezy""",

    "gujarati": """નમસ્તે {name} ભાઈ/બહેન! 👋

Rupeezy AI Agent (Priya) સાથે વાત કરીને આનંદ થયો!

✅ Zero joining fee
✅ 100% brokerage share
✅ Daily payouts via RISE Portal

Sign up: rupeezy.in/partner/signup
— Team Rupeezy""",
}


def _read_log():
    if not WA_LOG_FILE.exists():
        return []
    try:
        return json.loads(WA_LOG_FILE.read_text())
    except Exception:
        return []


def _write_log(data):
    WA_LOG_FILE.parent.mkdir(exist_ok=True)
    WA_LOG_FILE.write_text(json.dumps(data, indent=2, default=str))


def send_whatsapp(lead: dict, language: str = "english", custom_message: str = None) -> dict:
    """
    Simulate sending a WhatsApp message to a lead.
    In production: POST to Meta Business API or Twilio WhatsApp endpoint.
    """
    name = lead.get("name", "Partner")
    phone = lead.get("phone", "")

    # Get template for language
    template = TEMPLATES.get(language.lower(), TEMPLATES["english"])
    message = custom_message or template.format(name=name.split()[0])

    record = {
        "id": f"WA-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "lead_id": lead.get("id"),
        "lead_name": name,
        "phone": phone,
        "language": language,
        "message": message,
        "status": "sent",          # simulated
        "sent_at": datetime.now().isoformat(),
        "delivery_status": "delivered",   # simulated
        "clicked": False,
    }

    log = _read_log()
    log.append(record)
    _write_log(log)

    return {
        "success": True,
        "message_id": record["id"],
        "phone": phone,
        "preview": message[:120] + "..." if len(message) > 120 else message,
        "note": "Simulated send — integrate Meta Business API for production"
    }


def get_whatsapp_log(lead_id: str = None) -> list:
    log = _read_log()
    if lead_id:
        return [m for m in log if m.get("lead_id") == lead_id]
    return log


def mark_clicked(message_id: str) -> bool:
    log = _read_log()
    for i, m in enumerate(log):
        if m["id"] == message_id:
            log[i]["clicked"] = True
            log[i]["clicked_at"] = datetime.now().isoformat()
            _write_log(log)
            return True
    return False
