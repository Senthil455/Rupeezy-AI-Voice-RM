#!/bin/bash
# start.sh — One-command startup for local development

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║     Rupeezy AI Voice RM — Starting Up        ║"
echo "║     Multilingual Lead Conversion Agent       ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Python
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}❌ Python 3 required. Install from python.org${NC}"
    exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
    echo -e "${RED}❌ Node.js required. Install from nodejs.org${NC}"
    exit 1
fi

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    if [ -f "backend/.env" ]; then
        export $(grep -v '^#' backend/.env | xargs)
    fi
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set."
        echo "    The agent will use fallback responses."
        echo "    Set it with: export ANTHROPIC_API_KEY=sk-ant-..."
        echo -e "${NC}"
    fi
fi

# Backend setup
echo -e "${GREEN}[1/4] Setting up backend...${NC}"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
mkdir -p data
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Start backend in background
echo -e "${GREEN}[2/4] Starting FastAPI backend on port 8000...${NC}"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

# Check backend health
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend healthy at http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend starting... (may take a moment)${NC}"
fi

# Seed demo data
echo -e "${GREEN}[3/4] Seeding demo leads...${NC}"
curl -s -X POST http://localhost:8000/api/leads/seed > /dev/null 2>&1 && \
    echo -e "${GREEN}✅ 20 demo leads seeded${NC}" || \
    echo -e "${YELLOW}⚠️  Could not seed leads (backend may still be starting)${NC}"

cd ../frontend

# Frontend setup
echo -e "${GREEN}[4/4] Setting up frontend...${NC}"
if [ ! -d "node_modules" ]; then
    npm install --silent
fi
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Rupeezy AI Voice RM is starting!${NC}"
echo ""
echo -e "  📊 Dashboard:    ${BLUE}http://localhost:5173${NC}"
echo -e "  🎙️  Agent Demo:   ${BLUE}http://localhost:5173/agent${NC}"
echo -e "  📋 API Docs:     ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop both servers${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Start frontend
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Stopped. Goodbye!${NC}"
}
trap cleanup INT TERM

wait
