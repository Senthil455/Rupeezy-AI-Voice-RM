// src/components/chat/ChatInterface.jsx
import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, PhoneOff, Phone, RefreshCcw } from 'lucide-react'
import { VoiceVisualizer, LeadBadge, ScoreRing, ProgressBar } from '../shared/index.jsx'

function TypingIndicator() {
  return (
    <div className="msg-in flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
      <div className="bg-panel border border-white/[0.07] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0,1,2].map(i => (
            <span key={i} className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full block" style={{ animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isAgent = msg.role === 'agent'
  return (
    <div className={`msg-in flex gap-2.5 items-end ${isAgent ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
        isAgent ? 'bg-gradient-to-br from-accent to-accent2' : 'bg-white/[0.08] border border-white/[0.1]'
      }`}>
        {isAgent ? '🤖' : '😊'}
      </div>
      <div className={`max-w-[78%] ${isAgent ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAgent
            ? 'bg-panel border border-white/[0.07] rounded-bl-sm text-slate-200'
            : 'bg-accent/20 border border-accent/25 rounded-br-sm text-slate-100'
        }`}>
          {msg.content}
        </div>
        <div className={`text-[10px] text-slate-600 mt-1 ${isAgent ? '' : 'text-right'}`}>
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function ScorePanel({ score }) {
  if (!score) return (
    <div className="text-center py-4 text-slate-500 text-sm">
      Score will appear during the call
    </div>
  )

  const colors = { hot: '#ff5c5c', warm: '#ffb830', cold: '#5ce8d4' }
  const color = colors[score.label] || '#4f8cff'
  const avg = Math.round((score.interest_level + score.readiness + score.network_signal + score.engagement_quality) / 4)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ScoreRing score={avg} label={score.label} />
        <div>
          <div className="font-display font-bold text-base" style={{ color }}>
            {{ hot: '🔥 Hot', warm: '🌡 Warm', cold: '❄ Cold' }[score.label] || 'Scoring...'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{score.reasoning || 'Analyzing conversation...'}</div>
        </div>
      </div>
      {[
        ['Interest', score.interest_level, '#ff5c5c'],
        ['Readiness', score.readiness, '#4f8cff'],
        ['Network', score.network_signal, '#7c5cfc'],
        ['Engagement', score.engagement_quality, '#4cd97b'],
      ].map(([label, val, col]) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{label}</span><span>{val}%</span>
          </div>
          <ProgressBar value={val} color={col} />
        </div>
      ))}
    </div>
  )
}

export default function ChatInterface({ lead, onCallEnd, onCallStart }) {
  const [input, setInput] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Import hook
  const [conv, setConv] = useState({
    convId: null, messages: [], state: 'INIT', language: 'english',
    score: null, summary: null, isActive: false, isTyping: false, callDuration: 0
  })
  const timerRef = useRef(null)

  useEffect(() => {
    if (conv.isActive) {
      timerRef.current = setInterval(() => {
        setConv(c => ({ ...c, callDuration: c.callDuration + 1 }))
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [conv.isActive])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv.messages, conv.isTyping])

  const addMsg = (role, content) => {
    setConv(c => ({
      ...c,
      messages: [...c.messages, { id: Date.now() + Math.random(), role, content, timestamp: new Date().toISOString() }]
    }))
  }

  const handleStartCall = async () => {
    if (!lead) return
    try {
      const { agentApi } = await import('../../services/api.js')
      setConv(c => ({ ...c, messages: [], isActive: true, summary: null, score: null, state: 'GREETING', callDuration: 0 }))
      const result = await agentApi.startCall(lead.id, lead.language)
      setConv(c => ({
        ...c,
        convId: result.conversation_id,
        language: result.language,
        messages: [{ id: Date.now(), role: 'agent', content: result.opening_message, timestamp: new Date().toISOString() }]
      }))
      onCallStart?.()
    } catch (e) {
      console.error('Start call failed:', e)
      setConv(c => ({ ...c, isActive: false }))
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !conv.isActive || !conv.convId) return
    setInput('')
    addMsg('user', text)
    setConv(c => ({ ...c, isTyping: true }))
    try {
      const { agentApi } = await import('../../services/api.js')
      const result = await agentApi.sendMessage(conv.convId, text)
      setConv(c => ({
        ...c,
        isTyping: false,
        state: result.state,
        language: result.language,
        score: result.quick_score || c.score,
        messages: [...c.messages, { id: Date.now(), role: 'agent', content: result.response, timestamp: new Date().toISOString() }]
      }))
    } catch (e) {
      setConv(c => ({ ...c, isTyping: false }))
    }
  }

  const handleEndCall = async () => {
    if (!conv.convId) return
    setConv(c => ({ ...c, isActive: false, isTyping: false }))
    try {
      const { agentApi } = await import('../../services/api.js')
      const result = await agentApi.endCall(conv.convId)
      setConv(c => ({ ...c, score: result.score, summary: result.summary, state: 'END' }))
      onCallEnd?.(result)
    } catch (e) {
      console.error('End call failed:', e)
    }
  }

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser. Please use Chrome.')
      return
    }
    const rec = new SpeechRecognition()
    const langMap = {
      hindi: 'hi-IN', english: 'en-IN', tamil: 'ta-IN',
      telugu: 'te-IN', bengali: 'bn-IN', gujarati: 'gu-IN',
      marathi: 'mr-IN', hinglish: 'en-IN'
    }
    rec.lang = langMap[conv.language] || 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setVoiceActive(false)
    }
    rec.onerror = () => setVoiceActive(false)
    rec.onend = () => setVoiceActive(false)
    rec.start()
    setRecognition(rec)
    setVoiceActive(true)
  }

  const stopVoice = () => {
    recognition?.stop()
    setVoiceActive(false)
  }

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className="flex gap-5 h-full">
      {/* Main Chat */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-lg flex-shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Priya — Rupeezy AI Agent</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              {conv.isActive ? (
                <>
                  <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Live · {formatDuration(conv.callDuration)} · {conv.language}
                </>
              ) : (
                conv.state === 'END' ? '✅ Call ended' : 'Ready to call'
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conv.isActive && <VoiceVisualizer active />}
            {lead && !conv.isActive && conv.state !== 'END' && (
              <button onClick={handleStartCall} className="btn-primary flex items-center gap-1.5 text-xs">
                <Phone size={14} /> Start Call
              </button>
            )}
            {conv.isActive && (
              <button onClick={handleEndCall} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                <PhoneOff size={14} /> End
              </button>
            )}
            {conv.state === 'END' && (
              <button onClick={() => setConv(c => ({ ...c, state: 'INIT', messages: [], convId: null, summary: null, score: null }))}
                className="btn-ghost text-xs flex items-center gap-1.5">
                <RefreshCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '380px' }}>
          {conv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm text-center">
              <div className="text-3xl mb-3">🎙️</div>
              {lead
                ? `Click "Start Call" to begin the AI conversation with ${lead.name}`
                : 'Select a lead from the pipeline to start a call'}
            </div>
          ) : (
            conv.messages.map(msg => <Message key={msg.id} msg={msg} />)
          )}
          {conv.isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/[0.06] flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={conv.isActive ? 'Type your response as the lead...' : 'Start a call first'}
            disabled={!conv.isActive}
            className="input flex-1"
          />
          <button
            onClick={voiceActive ? stopVoice : startVoice}
            disabled={!conv.isActive}
            className={`p-2.5 rounded-xl border text-sm transition-colors ${
              voiceActive
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200'
            } disabled:opacity-40`}
            title={voiceActive ? 'Stop listening' : 'Voice input (Chrome)'}
          >
            {voiceActive ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={handleSend}
            disabled={!conv.isActive || !input.trim()}
            className="btn-primary p-2.5 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Score Panel */}
      <div className="w-64 flex flex-col gap-4 flex-shrink-0">
        <div className="card">
          <div className="section-label">Lead Score</div>
          <ScorePanel score={conv.score} />
        </div>

        {/* Objections */}
        {conv.score?.objections_detected?.length > 0 && (
          <div className="card">
            <div className="section-label">Objections Detected</div>
            <div className="space-y-1.5">
              {conv.score.objections_detected.map(obj => (
                <div key={obj} className="flex items-center gap-2 text-xs">
                  <span className="text-success">✅</span>
                  <span className="text-slate-300">{obj.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary (post-call) */}
        {conv.summary && (
          <div className="card">
            <div className="section-label">Post-Call Summary</div>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-sm text-white">{conv.summary.headline}</div>
              <div><span className="text-slate-500">Action: </span>{conv.summary.recommended_action}</div>
              <div className="mt-3 p-2.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                <div className="text-slate-500 mb-1">📱 WhatsApp</div>
                <div className="text-xs leading-relaxed">{conv.summary.whatsapp_message}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
