"""
models/store.py — JSON-based data store for hackathon
Simulates MongoDB collections using in-memory + JSON persistence
"""

import json
import os
import uuid
import logging
import portalocker
from datetime import datetime
from typing import Optional, List, Dict, Any, Callable
from pathlib import Path

logger = logging.getLogger("rupeezy.store")

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

LEADS_FILE = DATA_DIR / "leads.json"
CONVERSATIONS_FILE = DATA_DIR / "conversations.json"
SUMMARIES_FILE = DATA_DIR / "summaries.json"

LOCK_SUFFIX = ".lock"


def _lock_path(path: Path) -> Path:
    return path.parent / (path.name + LOCK_SUFFIX)


def _read_with_lock(path: Path) -> list:
    if not path.exists():
        logger.warning("Data file does not exist, returning empty list: %s", path)
        return []
    lock = _lock_path(path)
    try:
        with portalocker.Lock(lock, timeout=5, flags=portalocker.LOCK_EX):
            return json.loads(path.read_text())
    except json.JSONDecodeError as e:
        logger.error("Corrupted JSON file %s: %s", path, e)
        return []
    except portalocker.LockException as e:
        logger.error("Could not acquire lock for %s: %s", path, e)
        return []


def _transaction(path: Path, callback: Callable[[list], list]) -> list:
    lock = _lock_path(path)
    try:
        with portalocker.Lock(lock, timeout=5, flags=portalocker.LOCK_EX):
            data = json.loads(path.read_text()) if path.exists() else []
            result = callback(data)
            path.write_text(json.dumps(data, indent=2, default=str))
            return result
    except json.JSONDecodeError as e:
        logger.error("Corrupted JSON file during transaction on %s: %s", path, e)
        raise
    except portalocker.LockException as e:
        logger.error("Could not acquire lock for transaction on %s: %s", path, e)
        raise
    except Exception as e:
        logger.error("Unexpected error in transaction on %s: %s", path, e)
        raise


# ─────────────────────────────────────────
#  LEAD OPERATIONS
# ─────────────────────────────────────────

def get_all_leads() -> List[Dict]:
    return _read_with_lock(LEADS_FILE)


def get_lead(lead_id: str) -> Optional[Dict]:
    leads = _read_with_lock(LEADS_FILE)
    return next((l for l in leads if l["id"] == lead_id), None)


def create_lead(data: Dict) -> Dict:
    def _create(leads: list) -> Dict:
        phone = data.get("phone", "")
        if phone:
            existing = next((l for l in leads if l.get("phone") == phone), None)
            if existing:
                logger.info("Duplicate phone number %s, returning existing lead %s", phone, existing["id"])
                return existing
        lead = {
            "id": str(uuid.uuid4())[:8].upper(),
            "created_at": datetime.now().isoformat(),
            "status": "new",
            "score": 0,
            "score_label": "unscored",
            "call_count": 0,
            "language": data.get("language", "unknown"),
            "conversation_ids": [],
            **data
        }
        leads.append(lead)
        return lead
    return _transaction(LEADS_FILE, _create)


def update_lead(lead_id: str, updates: Dict) -> Optional[Dict]:
    def _update(leads: list) -> Optional[Dict]:
        for i, lead in enumerate(leads):
            if lead["id"] == lead_id:
                leads[i] = {**lead, **updates, "updated_at": datetime.now().isoformat()}
                return leads[i]
        return None
    return _transaction(LEADS_FILE, _update)


def bulk_create_leads(leads_data: List[Dict]) -> List[Dict]:
    return [create_lead(d) for d in leads_data]


# ─────────────────────────────────────────
#  CONVERSATION OPERATIONS
# ─────────────────────────────────────────

def get_conversation(conv_id: str) -> Optional[Dict]:
    convs = _read_with_lock(CONVERSATIONS_FILE)
    return next((c for c in convs if c["id"] == conv_id), None)


def get_lead_conversations(lead_id: str) -> List[Dict]:
    convs = _read_with_lock(CONVERSATIONS_FILE)
    return [c for c in convs if c["lead_id"] == lead_id]


def get_all_conversations() -> List[Dict]:
    return _read_with_lock(CONVERSATIONS_FILE)


def create_conversation(lead_id: str) -> Dict:
    def _create(convs: list) -> Dict:
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
            "state": "INIT",
            "summary": None,
        }
        convs.append(conv)
        return conv
    return _transaction(CONVERSATIONS_FILE, _create)


def add_message(conv_id: str, role: str, content: str, metadata: Dict = None) -> Optional[Dict]:
    def _add(convs: list) -> Optional[Dict]:
        for i, conv in enumerate(convs):
            if conv["id"] == conv_id:
                msg = {
                    "id": str(uuid.uuid4())[:8],
                    "role": role,
                    "content": content,
                    "timestamp": datetime.now().isoformat(),
                    "metadata": metadata or {}
                }
                convs[i]["messages"].append(msg)
                return convs[i]
        return None
    return _transaction(CONVERSATIONS_FILE, _add)


def update_conversation(conv_id: str, updates: Dict) -> Optional[Dict]:
    def _update(convs: list) -> Optional[Dict]:
        for i, conv in enumerate(convs):
            if conv["id"] == conv_id:
                convs[i] = {**conv, **updates}
                return convs[i]
        return None
    return _transaction(CONVERSATIONS_FILE, _update)


def end_conversation(conv_id: str, summary: Dict) -> Optional[Dict]:
    def _end(convs: list) -> Optional[Dict]:
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
                return convs[i]
        return None
    return _transaction(CONVERSATIONS_FILE, _end)


# ─────────────────────────────────────────
#  ANALYTICS
# ─────────────────────────────────────────

def get_analytics_snapshot() -> Dict:
    leads = _read_with_lock(LEADS_FILE)
    convs = _read_with_lock(CONVERSATIONS_FILE)
    
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
