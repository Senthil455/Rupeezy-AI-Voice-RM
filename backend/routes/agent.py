"""
routes/agent.py — Core AI agent endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio

from models.store import (
    get_lead, get_conversation, create_conversation, add_message,
    update_conversation, end_conversation, update_lead, get_lead_conversations
)
from ai.logic.conversation_engine import engine
from ai.scoring.scorer import scorer

router = APIRouter()


class StartCallRequest(BaseModel):
    lead_id: str
    preferred_language: Optional[str] = None


class SendMessageRequest(BaseModel):
    conversation_id: str
    message: str


class EndCallRequest(BaseModel):
    conversation_id: str


# ─── START A CALL ────────────────────────────────────────────────────────────

@router.post("/start-call")
async def start_call(req: StartCallRequest):
    """Initialize a new conversation with a lead"""
    
    lead = get_lead(req.lead_id)
    if not lead:
        raise HTTPException(404, f"Lead {req.lead_id} not found")
    
    # Check for prior conversations (multi-turn memory)
    prior_convs = get_lead_conversations(req.lead_id)
    prior_summary = None
    if prior_convs:
        last = prior_convs[-1]
        if last.get("summary"):
            prior_summary = last["summary"].get("recommended_action", "")
    
    # Determine language
    language = (
        req.preferred_language or
        lead.get("language", "unknown")
    )
    if language in ["unknown", ""]:
        language = "english"
    
    # Create conversation
    conv = create_conversation(req.lead_id)
    conv_id = conv["id"]
    
    # Build lead context for the engine
    lead_context = {
        "name": lead.get("name", "ji"),
        "type": lead.get("type", "partner"),
        "call_count": lead.get("call_count", 0) + 1,
        "prior_summary": prior_summary or "First call"
    }
    
    # Generate opening line
    opening = engine.get_opening_line(lead.get("name", ""), language)
    
    # Save opening message
    add_message(conv_id, "agent", opening, {"state": "GREETING"})
    update_conversation(conv_id, {
        "language": language,
        "state": "GREETING",
        "detected_languages": [language]
    })
    
    # Update lead call count + status
    update_lead(req.lead_id, {
        "status": "calling",
        "call_count": lead_context["call_count"]
    })
    
    return {
        "conversation_id": conv_id,
        "opening_message": opening,
        "language": language,
        "lead": {
            "id": lead["id"],
            "name": lead.get("name"),
            "type": lead.get("type")
        }
    }


# ─── SEND A MESSAGE (main conversation loop) ─────────────────────────────────

@router.post("/send-message")
async def send_message(req: SendMessageRequest):
    """Process user message and return AI agent response"""
    
    conv = get_conversation(req.conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    
    if conv.get("state") == "END":
        raise HTTPException(400, "Conversation has ended")
    
    lead = get_lead(conv["lead_id"])
    if not lead:
        raise HTTPException(404, "Lead not found")
    
    # Detect language from this message
    detected_lang = await engine.detect_language(req.message)
    
    # Update language if different (code-switching detection)
    current_lang = conv.get("language", "english")
    if detected_lang != "unknown" and detected_lang != current_lang:
        langs = conv.get("detected_languages", [])
        if detected_lang not in langs:
            langs.append(detected_lang)
        # If they switch mid-call, adapt
        if len(langs) > 1:
            detected_lang = "hinglish"  # treat mixed as hinglish
        update_conversation(req.conversation_id, {
            "language": detected_lang,
            "detected_languages": langs
        })
        current_lang = detected_lang
    
    # Save user message
    add_message(req.conversation_id, "user", req.message, {
        "detected_language": detected_lang
    })
    
    # Get updated conversation (with the new message)
    conv = get_conversation(req.conversation_id)
    messages = conv.get("messages", [])
    
    # Detect objections in this message
    analysis = scorer.analyze_message(req.message)
    if analysis["objections"]:
        existing_objs = conv.get("objections_raised", [])
        new_objs = [o for o in analysis["objections"] if o not in existing_objs]
        update_conversation(req.conversation_id, {
            "objections_raised": existing_objs + new_objs
        })
    
    # Build lead context
    lead_context = {
        "name": lead.get("name", "ji"),
        "type": lead.get("type", "partner"),
        "call_count": lead.get("call_count", 1),
        "prior_summary": lead.get("prior_summary", "First call")
    }
    
    # Generate agent response
    response_text, next_state = await engine.generate_response(
        conversation_messages=messages,
        language=current_lang,
        lead_context=lead_context,
        current_state=conv.get("state", "PITCH")
    )
    
    # Save agent response
    add_message(req.conversation_id, "agent", response_text, {"state": next_state})
    update_conversation(req.conversation_id, {"state": next_state})
    
    # Quick score update (lightweight)
    quick_score = scorer.score_conversation(messages + [
        {"role": "agent", "content": response_text}
    ])
    
    return {
        "response": response_text,
        "state": next_state,
        "language": current_lang,
        "quick_score": quick_score,
        "objections_detected": analysis["objections"]
    }


# ─── END CALL ────────────────────────────────────────────────────────────────

@router.post("/end-call")
async def end_call(req: EndCallRequest):
    """End conversation, score lead, generate summary"""
    
    conv = get_conversation(req.conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    
    lead = get_lead(conv["lead_id"])
    
    messages = conv.get("messages", [])
    
    # Score the full conversation
    score_result = await engine.score_conversation(messages)
    
    # Generate AI summary
    updated_conv = {**conv, "score": score_result["score"], "score_label": score_result["label"]}
    summary = await engine.generate_summary(updated_conv, lead or {})
    
    # End conversation in store
    end_conversation(req.conversation_id, {
        **score_result,
        "summary": summary
    })
    
    # Update lead status
    label = score_result["label"]
    new_status = label  # hot | warm | cold
    
    lead_update = {
        "status": new_status,
        "score": score_result["score"],
        "score_label": label,
        "last_call_summary": summary.get("headline", ""),
        "recommended_action": summary.get("recommended_action", ""),
        "whatsapp_message": summary.get("whatsapp_message", ""),
    }
    
    # Add conversation to lead's history
    conv_ids = (lead or {}).get("conversation_ids", [])
    lead_update["conversation_ids"] = conv_ids + [req.conversation_id]
    
    update_lead(conv["lead_id"], lead_update)
    
    return {
        "score": score_result,
        "summary": summary,
        "lead_status": new_status,
        "action": _get_action(label)
    }


def _get_action(label: str) -> Dict:
    actions = {
        "hot": {
            "type": "rm_handoff",
            "message": "🔥 Hot lead! Routing to RM dashboard with full context.",
            "priority": "immediate"
        },
        "warm": {
            "type": "whatsapp_followup",
            "message": "🌡 Warm lead. Sending WhatsApp signup link + scheduling 48hr follow-up.",
            "priority": "24h"
        },
        "cold": {
            "type": "nurture",
            "message": "❄ Cold lead. Logging for nurture campaign in 7 days.",
            "priority": "low"
        }
    }
    return actions.get(label, actions["cold"])


# missing import
from typing import Dict
