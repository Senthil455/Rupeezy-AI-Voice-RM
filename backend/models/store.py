"""
models/store.py — JSON-based data store for hackathon
Simulates MongoDB collections using in-memory + JSON persistence
"""

import json
import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

LEADS_FILE = DATA_DIR / "leads.json"
CONVERSATIONS_FILE = DATA_DIR / "conversations.json"
SUMMARIES_FILE = DATA_DIR / "summaries.json"


def _read(path: Path) -> list:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text())
    except Exception:
        return []


def _write(path: Path, data: list):
    path.write_text(json.dumps(data, indent=2, default=str))


# ─────────────────────────────────────────
#  LEAD OPERATIONS
# ─────────────────────────────────────────

def get_all_leads() -> List[Dict]:
    return _read(LEADS_FILE)


def get_lead(lead_id: str) -> Optional[Dict]:
    return next((l for l in _read(LEADS_FILE) if l["id"] == lead_id), None)


def create_lead(data: Dict) -> Dict:
    leads = _read(LEADS_FILE)
    lead = {
        "id": str(uuid.uuid4())[:8].upper(),
        "created_at": datetime.now().isoformat(),
        "status": "new",          # new | calling | hot | warm | cold | converted
        "score": 0,
        "score_label": "unscored",
        "call_count": 0,
        "language": data.get("language", "unknown"),
        "conversation_ids": [],
        **data
    }
    leads.append(lead)
    _write(LEADS_FILE, leads)
    return lead


def update_lead(lead_id: str, updates: Dict) -> Optional[Dict]:
    leads = _read(LEADS_FILE)
    for i, lead in enumerate(leads):
        if lead["id"] == lead_id:
            leads[i] = {**lead, **updates, "updated_at": datetime.now().isoformat()}
            _write(LEADS_FILE, leads)
            return leads[i]
    return None


def bulk_create_leads(leads_data: List[Dict]) -> List[Dict]:
    return [create_lead(d) for d in leads_data]


# ─────────────────────────────────────────
#  CONVERSATION OPERATIONS
# ─────────────────────────────────────────

def get_conversation(conv_id: str) -> Optional[Dict]:
    return next((c for c in _read(CONVERSATIONS_FILE) if c["id"] == conv_id), None)


def get_lead_conversations(lead_id: str) -> List[Dict]:
    return [c for c in _read(CONVERSATIONS_FILE) if c["lead_id"] == lead_id]


def create_conversation(lead_id: str) -> Dict:
    convs = _read(CONVERSATIONS_FILE)
    conv = {
        "id": str(uuid.uuid4())[:12],
        "lead_id": lead_id,
        "started_at": datetime.now().isoformat(),
        "ended_at": None,
        "duration_seconds": 0,
        "messages": [],
        "language": "unknown",
        "detected_languages": [],
        "objections_raised": [],
        "objections_resolved": [],
        "sentiment_timeline": [],
        "score": 0,
        "score_label": "unscored",
        "state": "INIT",   # conversation state machine state
        "summary": None,
    }
    convs.append(conv)
    _write(CONVERSATIONS_FILE, convs)
    return conv


def add_message(conv_id: str, role: str, content: str, metadata: Dict = None) -> Optional[Dict]:
    convs = _read(CONVERSATIONS_FILE)
    for i, conv in enumerate(convs):
        if conv["id"] == conv_id:
            msg = {
                "id": str(uuid.uuid4())[:8],
                "role": role,           # agent | user
                "content": content,
                "timestamp": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            convs[i]["messages"].append(msg)
            _write(CONVERSATIONS_FILE, convs)
            return convs[i]
    return None


def update_conversation(conv_id: str, updates: Dict) -> Optional[Dict]:
    convs = _read(CONVERSATIONS_FILE)
    for i, conv in enumerate(convs):
        if conv["id"] == conv_id:
            convs[i] = {**conv, **updates}
            _write(CONVERSATIONS_FILE, convs)
            return convs[i]
    return None


def end_conversation(conv_id: str, summary: Dict) -> Optional[Dict]:
    convs = _read(CONVERSATIONS_FILE)
    for i, conv in enumerate(convs):
        if conv["id"] == conv_id:
            started = datetime.fromisoformat(conv["started_at"])
            ended = datetime.now()
            duration = int((ended - started).total_seconds())
            convs[i].update({
                "ended_at": ended.isoformat(),
                "duration_seconds": duration,
                "summary": summary,
                "state": "END"
            })
            _write(CONVERSATIONS_FILE, convs)
            return convs[i]
    return None


# ─────────────────────────────────────────
#  ANALYTICS
# ─────────────────────────────────────────

def get_analytics_snapshot() -> Dict:
    leads = _read(LEADS_FILE)
    convs = _read(CONVERSATIONS_FILE)
    
    total = len(leads)
    hot = sum(1 for l in leads if l.get("score_label") == "hot")
    warm = sum(1 for l in leads if l.get("score_label") == "warm")
    cold = sum(1 for l in leads if l.get("score_label") == "cold")
    converted = sum(1 for l in leads if l.get("status") == "converted")
    called = sum(1 for l in leads if l.get("call_count", 0) > 0)
    
    lang_counts = {}
    for l in leads:
        lang = l.get("language", "unknown")
        lang_counts[lang] = lang_counts.get(lang, 0) + 1

    obj_counts = {}
    for c in convs:
        for obj in c.get("objections_raised", []):
            obj_counts[obj] = obj_counts.get(obj, 0) + 1

    conv_rate = round((hot + converted) / total * 100, 1) if total > 0 else 0
    
    return {
        "total_leads": total,
        "called": called,
        "hot": hot,
        "warm": warm,
        "cold": cold,
        "converted": converted,
        "conversion_rate": conv_rate,
        "language_breakdown": lang_counts,
        "objection_breakdown": obj_counts,
        "total_conversations": len(convs),
    }
