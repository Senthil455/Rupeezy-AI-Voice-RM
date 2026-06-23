"""
routes/analytics.py
"""
from fastapi import APIRouter
from models.store import get_analytics_snapshot, get_all_leads, get_all_conversations
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/snapshot")
def analytics_snapshot():
    return get_analytics_snapshot()

@router.get("/funnel")
def conversion_funnel():
    leads = get_all_leads()
    total = len(leads)
    called = sum(1 for l in leads if l.get("call_count", 0) > 0)
    engaged = sum(1 for l in leads if l.get("score", 0) > 0)
    hot_warm = sum(1 for l in leads if l.get("score_label") in ["hot", "warm"])
    converted = sum(1 for l in leads if l.get("status") == "converted")
    
    return {
        "stages": [
            {"stage": "Total Leads", "count": total, "pct": 100},
            {"stage": "Called", "count": called, "pct": round(called/total*100, 1) if total else 0},
            {"stage": "Engaged", "count": engaged, "pct": round(engaged/total*100, 1) if total else 0},
            {"stage": "Hot + Warm", "count": hot_warm, "pct": round(hot_warm/total*100, 1) if total else 0},
            {"stage": "Converted", "count": converted, "pct": round(converted/total*100, 1) if total else 0},
        ]
    }

@router.get("/rm-queue")
def rm_handoff_queue():
    """Hot leads ready for RM"""
    leads = get_all_leads()
    hot_leads = [l for l in leads if l.get("score_label") == "hot"]
    hot_leads.sort(key=lambda x: x.get("score", 0), reverse=True)
    return {"queue": hot_leads, "count": len(hot_leads)}
