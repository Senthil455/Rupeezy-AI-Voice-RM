# 🎙️ Rupeezy AI Voice RM
### Multilingual Lead Conversion Agent — AI for Bharat Hackathon, Theme 7

> Converts partner leads from **18% → 40%+ conversion rate** using an AI voice agent that speaks in Hindi, English, Hinglish, Tamil, Telugu, Marathi, Bengali, and Gujarati — 24/7, with zero queue delay.

---

## 🚀 Quick Start (3 Steps)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Anthropic API key (free tier works)

### Step 1 — Clone & Configure
```bash
git clone <repo>
cd rupeezy-ai

# Set your API key
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# OR create backend/.env file:
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > backend/.env
```

### Step 2 — One-Command Start
```bash
chmod +x start.sh
./start.sh
```

### Step 3 — Open Dashboard
```
http://localhost:5173
```

**API Docs:** `http://localhost:8000/docs`

---

## 🎯 What This System Does

| Problem | Our Solution |
|---------|-------------|
| Leads go cold (avg 3.6hr RM response) | AI calls within **< 5 minutes**, 24/7 |
| RM speaks 1–2 languages | Agent speaks **8 Indian languages** |
| 1 RM = 1 call at a time | Agent handles **unlimited parallel calls** |
| 18% conversion baseline | Target: **40%+ conversion** |
| No audit trail | Full transcript + summary for every call |

---

## 📁 Project Structure

```
rupeezy-ai/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point
│   ├── routes/
│   │   ├── agent.py          # Core AI agent endpoints
│   │   ├── leads.py          # Lead management CRUD
│   │   ├── conversations.py  # Conversation history
│   │   ├── analytics.py      # Dashboard analytics
│   │   └── whatsapp.py       # WhatsApp simulation
│   ├── models/
│   │   └── store.py          # JSON data store (swap for MongoDB)
│   ├── ai/
│   │   ├── prompts/
│   │   │   └── agent_prompt.py   # System prompts & templates
│   │   ├── logic/
│   │   │   └── conversation_engine.py  # State machine + LLM calls
│   │   └── scoring/
│   │       └── scorer.py     # Lead qualification engine
│   ├── services/
│   │   └── whatsapp.py       # WhatsApp message service
│   ├── data/                 # JSON data files (auto-created)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                 # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx           # Router + layout
│   │   ├── main.jsx          # Entry point
│   │   ├── index.css         # Global styles
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   └── ChatInterface.jsx   # AI conversation UI
│   │   │   └── shared/
│   │   │       └── index.jsx           # Reusable components
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # KPI dashboard
│   │   │   ├── AgentDemo.jsx           # Interactive demo
│   │   │   └── AllPages.jsx            # Other pages
│   │   ├── services/
│   │   │   └── api.js                  # Axios API layer
│   │   └── hooks/
│   │       └── useLeads.js             # Custom hooks
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docker-compose.yml        # Docker deployment
├── start.sh                  # One-command local start
└── README.md
```

---

## 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                          │
│  Dashboard · Agent Demo · Pipeline · Analytics · Handoff   │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (axios)
┌─────────────────────▼───────────────────────────────────────┐
│                   FASTAPI BACKEND                            │
│                                                             │
│  /api/agent/start-call   ──► Conversation Engine            │
│  /api/agent/send-message ──► LLM (Claude Sonnet)            │
│  /api/agent/end-call     ──► Scorer + Summary               │
│  /api/leads/             ──► Lead Management                │
│  /api/analytics/         ──► Dashboard Data                 │
│  /api/whatsapp/          ──► WhatsApp Simulation            │
└─────────┬───────────────────────────┬───────────────────────┘
          │                           │
┌─────────▼──────────┐    ┌──────────▼──────────────┐
│  Anthropic Claude   │    │   JSON Data Store        │
│  (LLM + Scoring)   │    │   (MongoDB-ready)         │
└────────────────────┘    └──────────────────────────┘
```

---

## 🔌 API Endpoints

### Agent (Core)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/start-call` | Start AI call with lead |
| POST | `/api/agent/send-message` | Send user message, get AI response |
| POST | `/api/agent/end-call` | End call, score lead, generate summary |

### Leads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads/` | List all leads |
| POST | `/api/leads/` | Create single lead |
| POST | `/api/leads/bulk` | Import batch |
| POST | `/api/leads/seed` | Seed 20 demo leads |
| PATCH | `/api/leads/{id}` | Update lead |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/snapshot` | KPI snapshot |
| GET | `/api/analytics/funnel` | Conversion funnel |
| GET | `/api/analytics/rm-queue` | Hot leads for RM |

### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/send` | Send (simulated) message |
| GET | `/api/whatsapp/log` | Message history |

---

## 🗣️ Supported Languages

| Language | Script | Status |
|----------|--------|--------|
| Hindi | Devanagari + Roman | ✅ Full |
| English | Latin | ✅ Full |
| Hinglish | Mixed | ✅ Full |
| Tamil | தமிழ் | ✅ Full |
| Telugu | తెలుగు | ✅ Full |
| Marathi | मराठी | ✅ Full |
| Bengali | বাংলা | ✅ Full |
| Gujarati | ગુજરાતી | ✅ Full |

---

## 📊 Lead Scoring Model

```
Score = Σ(signals)

Hot Signals   (+3 each): "interested", "sign up", "join", "ready", "haan"
Warm Signals  (+1 each): "maybe", "tell me more", "explain"
Cold Signals  (-3 each): "not interested", "remove", "stop"
Engagement    (+2):      > 3 exchanges
Questions     (+2 each): Lead asks clarifying questions  
Network mention (+2):    Mentions contacts / clients
Objection resolved (+1): Each handled objection

Thresholds:
  ≥ 8  → 🔥 HOT  (RM immediate handoff)
  4–7  → 🌡 WARM (WhatsApp + 48hr follow-up)
  < 4  → ❄ COLD  (nurture sequence)
```

---

## 🔁 Conversation State Machine

```
INIT → GREETING → PITCH → QUALIFICATION → OBJECTION_HANDLING → CLOSING → END
```

Each state drives context-aware LLM prompting. The agent never sounds scripted.

---

## ⚙️ Configuration

Edit `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...       # Required
ELEVENLABS_API_KEY=...             # Optional (production TTS)
META_WHATSAPP_TOKEN=...            # Optional (production WhatsApp)
```

---

## 🐳 Docker Deployment

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-your-key

# Start with Docker
docker-compose up --build

# Access at http://localhost:5173
```

---

## 🧪 Test the API

```bash
# 1. Seed demo leads
curl -X POST http://localhost:8000/api/leads/seed

# 2. Get a lead ID
curl http://localhost:8000/api/leads/

# 3. Start a call
curl -X POST http://localhost:8000/api/agent/start-call \
  -H "Content-Type: application/json" \
  -d '{"lead_id": "LEAD_ID_HERE", "preferred_language": "hindi"}'

# 4. Send a message
curl -X POST http://localhost:8000/api/agent/send-message \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "CONV_ID", "message": "मुझे बताइए इसके बारे में"}'

# 5. End the call
curl -X POST http://localhost:8000/api/agent/end-call \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "CONV_ID"}'
```

---

## 🏆 Hackathon Evaluation Coverage

| Criterion | Implementation |
|-----------|---------------|
| Problem Understanding | Structural failures analysis in agent prompts |
| Technical Innovation | LLM + state machine + multilingual scoring |
| Real-World Deployability | FastAPI + React, Docker-ready, API-first |
| Demo Quality | Live interactive chat, voice input, real scores |
| Scalability | Stateless API, JSON→MongoDB swap, horizontal scale |

---

## 🛣️ Production Roadmap

| Phase | Timeline | Milestones |
|-------|----------|------------|
| Hackathon MVP | Week 1 | Browser demo, simulated calls |
| Beta | Month 1 | Twilio integration, real calls |
| v1.0 | Month 3 | ElevenLabs TTS, 8 languages live |
| Scale | Month 6 | 10K leads/day, CRM integrations |

---

## 👥 Team

Built for **AI for Bharat Hackathon 2026** — Theme 7: AI Voice Agent for Partner Lead Conversion

---

## 📄 License

MIT — Open source for hackathon evaluation.
