"""
routes/leads.py — Lead management endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from models.store import get_all_leads, get_lead, create_lead, update_lead, bulk_create_leads
import random

router = APIRouter()

class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    language: Optional[str] = "english"
    type: Optional[str] = "MFD"
    city: Optional[str] = None
    network_size: Optional[str] = None
    source: Optional[str] = "manual"

class BulkLeadCreate(BaseModel):
    leads: List[LeadCreate]

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language: Optional[str] = None
    type: Optional[str] = None
    city: Optional[str] = None
    network_size: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None

@router.get("/")
def list_leads(status: Optional[str] = None, limit: int = 100):
    leads = get_all_leads()
    if status:
        leads = [l for l in leads if l.get("status") == status]
    return {"leads": leads[:limit], "total": len(leads)}

@router.get("/{lead_id}")
def get_single_lead(lead_id: str):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead

@router.post("/")
def create_single_lead(data: LeadCreate):
    return create_lead(data.model_dump())

@router.post("/bulk")
def create_bulk_leads(data: BulkLeadCreate):
    created = bulk_create_leads([l.model_dump() for l in data.leads])
    return {"created": len(created), "leads": created}

@router.post("/seed")
def seed_mock_leads():
    """Seed 20 realistic mock leads for demo"""
    names = [
        ("Rajesh Kumar", "MFD", "hindi", "Delhi"),
        ("Priya Sharma", "Financial Advisor", "hinglish", "Mumbai"),
        ("Arjun Nair", "Insurance Agent", "english", "Bangalore"),
        ("Sunita Mehta", "MFD", "hinglish", "Pune"),
        ("Mohammed Rafi", "Finance Influencer", "english", "Hyderabad"),
        ("Kavitha Krishnan", "Financial Advisor", "tamil", "Chennai"),
        ("Vikram Joshi", "Insurance Agent", "hindi", "Jaipur"),
        ("Deepa Rao", "MFD", "telugu", "Vijayawada"),
        ("Amit Patel", "Finance Influencer", "gujarati", "Ahmedabad"),
        ("Meera Iyer", "Financial Advisor", "english", "Kochi"),
        ("Suresh Agarwal", "MFD", "hindi", "Lucknow"),
        ("Anjali Singh", "Insurance Agent", "hinglish", "Noida"),
        ("Karan Malhotra", "Finance Influencer", "english", "Gurgaon"),
        ("Nalini Venkat", "Financial Advisor", "telugu", "Hyderabad"),
        ("Rohit Srivastava", "MFD", "hindi", "Varanasi"),
        ("Pooja Desai", "Insurance Agent", "gujarati", "Surat"),
        ("Aditya Bose", "Finance Influencer", "bengali", "Kolkata"),
        ("Lavanya Pillai", "MFD", "english", "Thiruvananthapuram"),
        ("Yusuf Khan", "Financial Advisor", "hinglish", "Bhopal"),
        ("Swati Mishra", "Insurance Agent", "hindi", "Patna"),
    ]
    
    leads_data = []
    for i, (name, ltype, lang, city) in enumerate(names):
        phone_suffix = f"98{random.randint(10000000, 99999999)}"
        leads_data.append({
            "name": name,
            "phone": f"+91{phone_suffix}",
            "email": f"{name.lower().replace(' ', '.')}@email.com",
            "language": lang,
            "type": ltype,
            "city": city,
            "network_size": random.choice(["10-50", "50-100", "100-200", "200+"]),
            "source": random.choice(["social_media", "referral", "website", "campaign"])
        })
    
    created = bulk_create_leads(leads_data)
    return {"message": f"Seeded {len(created)} leads", "count": len(created)}

@router.patch("/{lead_id}")
def patch_lead(lead_id: str, updates: LeadUpdate):
    filtered = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not filtered:
        raise HTTPException(400, "No valid fields provided for update")
    updated = update_lead(lead_id, filtered)
    if not updated:
        raise HTTPException(404, "Lead not found")
    return updated
