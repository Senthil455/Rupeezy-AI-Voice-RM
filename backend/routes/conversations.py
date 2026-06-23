"""
routes/conversations.py
"""
from fastapi import APIRouter, HTTPException
from models.store import get_conversation, get_lead_conversations, get_all_conversations

router = APIRouter()

@router.get("/{conv_id}")
def get_single(conv_id: str):
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return conv

@router.get("/lead/{lead_id}")
def get_for_lead(lead_id: str):
    return {"conversations": get_lead_conversations(lead_id)}

@router.get("/")
def list_all(limit: int = 50):
    convs = get_all_conversations()
    return {"conversations": convs[:limit], "total": len(convs)}
