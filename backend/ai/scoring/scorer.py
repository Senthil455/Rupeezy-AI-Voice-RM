"""
ai/scoring/scorer.py
Lead qualification scoring engine
"""

import re
from typing import Dict, List, Tuple

# ─── SIGNAL DEFINITIONS ────────────────────────────────────────────────────

HOT_SIGNALS = [
    "interested", "sign up", "join", "register", "start", "when can i",
    "how do i", "sign me", "ready", "let's do it", "definitely",
    "absolutely", "yes", "sure", "sounds good", "great", "amazing",
    # Hindi/Hinglish signals
    "karunga", "karna hai", "join karna", "haan", "bilkul", "zaroor",
    "shuru karte", "batao", "kitna milega",
]

WARM_SIGNALS = [
    "maybe", "perhaps", "think about", "consider", "interesting",
    "tell me more", "how does it work", "what about", "explain",
    "thoda", "sochta", "dekhta", "batao aur", "samjhao",
]

COLD_SIGNALS = [
    "not interested", "no thanks", "please don't", "remove", "stop calling",
    "busy", "not now", "never", "don't want", "waste of time",
    "nahi chahiye", "mat karo", "bandh karo", "nahin",
]

OBJECTION_KEYWORDS = {
    "already_with_broker": [
        "already", "another broker", "other broker", "zerodha", "groww",
        "upstox", "angel", "hdfc securities", "icici", "current broker",
        "pehle se", "dusra broker"
    ],
    "not_enough_contacts": [
        "contacts", "network", "clients", "people", "connections", "friends",
        "nahi hai", "kam hai", "thode", "not many"
    ],
    "support_concern": [
        "support", "help", "issue", "problem", "complaint", "service",
        "client issue", "who handles"
    ],
    "trust_concern": [
        "trust", "trustworthy", "safe", "real", "genuine", "scam",
        "fraud", "legit", "registered", "sebi", "reliable"
    ],
    "think_about_it": [
        "think", "later", "call back", "tomorrow", "next week",
        "not sure", "maybe", "sochta hoon", "baad mein"
    ]
}


class LeadScorer:
    """Scores leads based on conversation signals"""
    
    def __init__(self):
        self.scores_map = {
            "hot_signal": 3,
            "warm_signal": 1,
            "cold_signal": -3,
            "engagement_bonus": 2,     # > 3 exchanges
            "question_asked": 2,
            "objection_resolved": 1,
            "network_mentioned": 2,
            "dismissive_response": -1,
        }
    
    def analyze_message(self, text: str) -> Dict:
        """Analyze a single message for signals"""
        lower = text.lower().strip()
        
        result = {
            "hot_signals": [],
            "warm_signals": [],
            "cold_signals": [],
            "objections": [],
            "is_question": "?" in text,
            "is_dismissive": len(text.split()) <= 2,
            "has_network_mention": any(kw in lower for kw in ["clients", "contacts", "network", "people", "investors"])
        }
        
        for sig in HOT_SIGNALS:
            if sig in lower:
                result["hot_signals"].append(sig)
        
        for sig in WARM_SIGNALS:
            if sig in lower:
                result["warm_signals"].append(sig)
        
        for sig in COLD_SIGNALS:
            if sig in lower:
                result["cold_signals"].append(sig)
        
        for obj_key, keywords in OBJECTION_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                result["objections"].append(obj_key)
        
        return result
    
    def score_conversation(self, messages: List[Dict]) -> Dict:
        """Score full conversation and return qualification result"""
        
        user_messages = [m for m in messages if m["role"] == "user"]
        total_exchanges = len(user_messages)
        
        score = 0
        all_hot_signals = []
        all_cold_signals = []
        all_objections = []
        all_warm_signals = []
        
        for msg in user_messages:
            analysis = self.analyze_message(msg["content"])
            
            score += len(analysis["hot_signals"]) * self.scores_map["hot_signal"]
            score += len(analysis["warm_signals"]) * self.scores_map["warm_signal"]
            score += len(analysis["cold_signals"]) * self.scores_map["cold_signal"]
            
            if analysis["is_question"]:
                score += self.scores_map["question_asked"]
            
            if analysis["has_network_mention"]:
                score += self.scores_map["network_mentioned"]
            
            if analysis["is_dismissive"] and not analysis["hot_signals"]:
                score += self.scores_map["dismissive_response"]
            
            all_hot_signals.extend(analysis["hot_signals"])
            all_cold_signals.extend(analysis["cold_signals"])
            all_objections.extend(analysis["objections"])
            all_warm_signals.extend(analysis["warm_signals"])
        
        # Engagement bonus
        if total_exchanges >= 3:
            score += self.scores_map["engagement_bonus"]
        
        # Count agent's resolved objections (rough heuristic)
        agent_messages = [m for m in messages if m["role"] == "agent"]
        objections_resolved = min(len(all_objections), len(agent_messages) - 1)
        score += objections_resolved * self.scores_map["objection_resolved"]
        
        # Determine label
        if score >= 8:
            label = "hot"
        elif score >= 4:
            label = "warm"
        else:
            label = "cold"
        
        # Normalize sub-scores 0-100
        interest = min(100, max(0, (score + 5) * 7))
        readiness = min(100, len(all_hot_signals) * 20)
        network = min(100, 50 + (20 if any("clients" in s or "network" in s for s in all_hot_signals + all_warm_signals) else 0))
        engagement = min(100, total_exchanges * 15)
        
        return {
            "score": score,
            "label": label,
            "interest_level": interest,
            "readiness": readiness,
            "network_signal": network,
            "engagement_quality": engagement,
            "objections_detected": list(set(all_objections)),
            "objections_resolved": list(set(all_objections[:objections_resolved])),
            "buying_signals": list(set(all_hot_signals)),
            "rejection_signals": list(set(all_cold_signals)),
            "total_exchanges": total_exchanges,
            "reasoning": self._generate_reasoning(score, label, all_hot_signals, all_cold_signals)
        }
    
    def _generate_reasoning(self, score: int, label: str, hot: list, cold: list) -> str:
        if label == "hot":
            return f"Strong interest signals detected ({', '.join(hot[:2]) if hot else 'positive engagement'}). High conversion probability."
        elif label == "warm":
            return "Moderate interest shown. Lead needs follow-up and nurturing before conversion."
        else:
            return f"Low engagement or rejection signals present. Recommend cold nurture sequence."
    
    def detect_language(self, text: str) -> str:
        """Heuristic language detection (production would use FastText/LangDetect)"""
        text_lower = text.lower()
        
        # Hindi/Devanagari characters
        if any('\u0900' <= c <= '\u097F' for c in text):
            return "hindi"
        
        # Common Hindi words in Latin script
        hindi_markers = ["haan", "nahi", "kya", "hai", "hoon", "karo", "bilkul", 
                        "acha", "theek", "samajh", "batao", "kyun", "mujhe", "aapko",
                        "abhi", "karunga", "sochta", "yaar", "bhai"]
        english_markers = ["the", "is", "are", "would", "could", "should", "have", "can"]
        
        hindi_count = sum(1 for w in hindi_markers if w in text_lower.split())
        english_count = sum(1 for w in english_markers if w in text_lower.split())
        
        if hindi_count > 0 and english_count > 0:
            return "hinglish"
        elif hindi_count > 0:
            return "hindi"
        elif english_count > 0:
            return "english"
        
        return "english"  # default


# Singleton instance
scorer = LeadScorer()
