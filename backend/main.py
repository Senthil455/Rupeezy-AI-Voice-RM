"""
Rupeezy AI Voice RM — FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from routes.leads import router as leads_router
from routes.conversations import router as conv_router
from routes.analytics import router as analytics_router
from routes.agent import router as agent_router
from routes.whatsapp import router as wa_router

app = FastAPI(
    title="Rupeezy AI Voice RM",
    description="Multilingual AI Lead Conversion Agent for Rupeezy Partner Program",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(leads_router, prefix="/api/leads", tags=["Leads"])
app.include_router(conv_router, prefix="/api/conversations", tags=["Conversations"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(agent_router, prefix="/api/agent", tags=["Agent"])
app.include_router(wa_router, prefix="/api/whatsapp", tags=["WhatsApp"])

@app.get("/")
def root():
    return {"status": "ok", "service": "Rupeezy AI Voice RM", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
