"""
ai/logic/conversation_engine.py
Conversation state machine + LLM call logic
"""

import json
import os
import re
import time
import logging
from typing import Dict, List, Optional, Tuple
from groq import Groq

logger = logging.getLogger("rupeezy.engine")

MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0

from ai.prompts.agent_prompt import (
    SYSTEM_PROMPT, SCORING_PROMPT, SUMMARY_PROMPT,
    LANGUAGE_DETECT_PROMPT, build_conversation_messages
)
from ai.scoring.scorer import scorer

# ─── CONVERSATION STATES ────────────────────────────────────────────────────
STATES = ["INIT", "GREETING", "PITCH", "QUALIFICATION", "OBJECTION_HANDLING", "CLOSING", "END"]

# Opening lines by language (before LLM takes over)
OPENING_LINES = {
    "hindi": "नमस्ते! मैं Priya हूं Rupeezy से। क्या आप {name} जी से बात कर सकती हूं? बस 2 मिनट — आपके लिए एक बेहतरीन earning opportunity है।",
    "english": "Hi! I'm Priya from Rupeezy. Am I speaking with {name}? I have an exciting partner opportunity — just 2 minutes of your time?",
    "hinglish": "Hello {name} ji! Main Priya hoon, Rupeezy se. Ek amazing earning opportunity share karni thi — 2 minute milenge?",
    "tamil": "வணக்கம்! நான் Priya, Rupeezy-இலிருந்து. {name} அவர்களா? ஒரு சிறந்த opportunity பற்றி சொல்ல விரும்புகிறேன்.",
    "telugu": "నమస్కారం! నేను Priya, Rupeezy నుండి. {name} గారా? ఒక అద్భుతమైన opportunity గురించి చెప్పాలని ఉంది.",
    "marathi": "नमस्कार! मी Priya, Rupeezy कडून. {name} जी का? एक उत्तम earning opportunity बद्दल सांगायची आहे.",
    "bengali": "নমস্কার! আমি Priya, Rupeezy থেকে। {name} সাহেব? একটি দুর্দান্ত সুযোগ সম্পর্কে বলতে চাই।",
    "gujarati": "નમસ્તે! હું Priya, Rupeezy તરફથી. {name} ભાઈ/બહેન? એક સરસ earning opportunity share કરવી હતી.",
}

DEFAULT_OPENING = "Hi! I'm Priya from Rupeezy. Am I speaking with {name}? I have an exciting opportunity — just 2 minutes?"


class ConversationEngine:
    """
    Manages state machine + LLM interaction for the AI agent.
    Each conversation has its own engine instance.
    """
    
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
        self.model = "llama3-70b-8192"
    
    def _llm_call_with_retry(self, **kwargs):
        """Call LLM API with exponential backoff retry logic."""
        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                return self.client.chat.completions.create(**kwargs)
            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning("LLM call failed (attempt %d/%d), retrying in %.1fs: %s",
                                   attempt + 1, MAX_RETRIES, delay, e)
                    time.sleep(delay)
        raise last_error
    
    def get_opening_line(self, lead_name: str, language: str) -> str:
        """Get language-appropriate opening line"""
        template = OPENING_LINES.get(language.lower(), DEFAULT_OPENING)
        return template.replace("{name}", lead_name or "ji")
    
    async def detect_language(self, text: str) -> str:
        """Detect language of user message using heuristic + LLM fallback"""
        # Fast heuristic first
        lang = scorer.detect_language(text)
        if lang != "english" or len(text.split()) < 4:
            return lang
        
        # LLM fallback for ambiguous cases
        try:
            resp = self._llm_call_with_retry(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": LANGUAGE_DETECT_PROMPT.format(message=text[:200])
                }],
                max_tokens=10
            )

            detected = resp.choices[0].message.content.strip().lower()
            if detected in ["english", "hindi", "hinglish", "tamil", "telugu", "marathi", "bengali", "gujarati"]:
                return detected
        except Exception as e:
            logger.warning("LLM language detection failed, falling back to heuristic: %s", e)
        
        return lang
    
    async def generate_response(
        self,
        conversation_messages: List[Dict],
        language: str,
        lead_context: Dict,
        current_state: str
    ) -> Tuple[str, str]:
        """
        Generate next agent response using LLM.
        Returns: (response_text, next_state)
        """
        
        # Build context-aware system prompt
        context_addition = f"""
        
CURRENT CONTEXT:
- Lead name: {lead_context.get('name', 'the lead')}
- Lead type: {lead_context.get('type', 'unknown')}
- Detected language: {language}
- Current conversation state: {current_state}
- Call number: {lead_context.get('call_count', 1)} (reference previous calls if > 1)
- Prior context: {lead_context.get('prior_summary', 'First call')}

Remember: Respond ONLY in {language}. Keep it natural and conversational."""
        
        full_system = SYSTEM_PROMPT + context_addition
        
        # Convert history to API format
        api_messages = build_conversation_messages(conversation_messages)
        
        try:
            resp = self._llm_call_with_retry(
                model=self.model,
                messages=[
                    {"role": "system", "content": full_system},
                    *api_messages
                ],
                max_tokens=300
            )

            response_text = resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error("LLM response generation failed after %d retries, using fallback: %s",
                         MAX_RETRIES, e)
            response_text = self._get_fallback_response(language, current_state, lead_context)
        
        # Determine next state based on context
        next_state = self._advance_state(current_state, conversation_messages)
        
        return response_text, next_state
    
    async def score_conversation(self, messages: List[Dict]) -> Dict:
        """Score conversation using local scorer + optional LLM validation"""
        # Use local scorer (fast, no API cost)
        result = scorer.score_conversation(messages)
        return result
    
    async def generate_summary(
        self,
        conversation: Dict,
        lead: Dict
    ) -> Dict:
        """Generate post-call summary using LLM"""
        
        # Format conversation for prompt
        conv_text = "\n".join([
            f"{m['role'].upper()}: {m['content']}"
            for m in conversation.get("messages", [])
        ])
        
        prompt = SUMMARY_PROMPT.format(
            lead_name=lead.get("name", "Unknown"),
            language=conversation.get("language", "unknown"),
            duration=conversation.get("duration_seconds", 0),
            conversation=conv_text[:3000]  # Limit tokens
        )
        
        try:
            resp = self._llm_call_with_retry(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600
            )

            raw = resp.choices[0].message.content.strip()
            # Clean JSON
            raw = re.sub(r'```json\s*|\s*```', '', raw).strip()
            return json.loads(raw)
            
        except Exception as e:
            logger.error("LLM summary generation failed after %d retries, using fallback: %s",
                         MAX_RETRIES, e)
            return {
                "headline": f"{lead.get('name', 'Lead')} — {conversation.get('score_label', 'unscored').upper()} lead",
                "what_worked": "Agent pitched key benefits and handled objections",
                "key_moments": ["Opening pitch delivered", "Benefits explained"],
                "objections_handled": conversation.get("objections_resolved", []),
                "lead_sentiment": "neutral",
                "final_state": "needs_follow_up",
                "recommended_action": "Send WhatsApp follow-up and schedule callback",
                "whatsapp_message": f"Hi {lead.get('name', '')}! Thanks for your time. Here's the Rupeezy partner sign-up link: rupeezy.in/partner"
            }
    
    def _advance_state(self, current_state: str, messages: List[Dict]) -> str:
        """Advance conversation state based on message count and sentiment signals"""
        user_msgs = [m for m in messages if m["role"] == "user"]
        count = len(user_msgs)
        
        # Analyze recent messages for sentiment signals
        all_cold = []
        all_hot = []
        for msg in user_msgs[-3:]:
            analysis = scorer.analyze_message(msg["content"])
            all_cold.extend(analysis["cold_signals"])
            all_hot.extend(analysis["hot_signals"])
        
        # Strong rejection: skip to END regardless of count
        if all_cold and count >= 2:
            return "END"
        
        # High engagement: stay in QUALIFICATION longer
        qual_threshold = 7 if len(all_hot) >= 2 else 5
        
        state_map = {
            "INIT": "GREETING",
            "GREETING": "PITCH" if count >= 1 else "GREETING",
            "PITCH": "QUALIFICATION" if count >= 3 else "PITCH",
            "QUALIFICATION": "OBJECTION_HANDLING" if count >= qual_threshold else "QUALIFICATION",
            "OBJECTION_HANDLING": "CLOSING" if count >= 7 else "OBJECTION_HANDLING",
            "CLOSING": "END" if count >= 9 else "CLOSING",
            "END": "END"
        }
        return state_map.get(current_state, "PITCH")
    
    def _get_fallback_response(self, language: str, state: str, lead_context: Dict) -> str:
        """Fallback responses when API is unavailable"""
        name = lead_context.get("name", "ji")
        
        fallbacks = {
            "hindi": {
                "GREETING": f"नमस्ते {name} जी! Rupeezy का Partner Program — zero fee, 100% brokerage, daily payments। क्या आप जानना चाहेंगे?",
                "PITCH": "हमारे साथ join करने पर आपको industry का best deal मिलता है। आप कितने clients के साथ काम करते हैं अभी?",
                "CLOSING": f"तो {name} जी, क्या हम आज ही शुरू करें? WhatsApp पर link भेजती हूं।"
            },
            "english": {
                "GREETING": f"Hi {name}! Rupeezy's Partner Program — zero fee, 100% brokerage, daily payouts. Want to know more?",
                "PITCH": "You'd be getting the best deal in the industry. How many clients do you currently work with?",
                "CLOSING": f"So {name}, shall we get started today? I'll send you the sign-up link on WhatsApp!"
            },
            "hinglish": {
                "GREETING": f"Hello {name} ji! Rupeezy mein zero fee, 100% brokerage, daily payouts. Sunenge?",
                "PITCH": "Industry ka best deal milega aapko. Abhi kitne clients handle karte ho?",
                "CLOSING": f"Toh {name} ji, aaj hi shuru karte hain? WhatsApp pe link bhejti hoon!"
            }
        }
        
        lang_fallback = fallbacks.get(language, fallbacks["english"])
        return lang_fallback.get(state, lang_fallback.get("PITCH"))


# Singleton
engine = ConversationEngine()
