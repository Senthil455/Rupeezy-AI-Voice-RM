"""
routes/whatsapp.py — WhatsApp simulation endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.store import get_lead
from services.whatsapp import send_whatsapp, get_whatsapp_log, mark_clicked

router = APIRouter()


class SendWARequest(BaseModel):
    lead_id: str
    language: Optional[str] = None
    custom_message: Optional[str] = None


@router.post("/send")
def send_message(req: SendWARequest):
    lead = get_lead(req.lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    language = req.language or lead.get("language", "english")
    result = send_whatsapp(lead, language, req.custom_message)
    return result


@router.get("/log")
def wa_log(lead_id: Optional[str] = None):
    return {"messages": get_whatsapp_log(lead_id)}


@router.post("/click/{message_id}")
def track_click(message_id: str):
    ok = mark_clicked(message_id)
    return {"success": ok}
