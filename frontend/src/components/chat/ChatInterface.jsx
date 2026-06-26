import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, PhoneOff, Phone, RefreshCcw, Bot, User, MessageSquare } from 'lucide-react'
import { VoiceVisualizer, LeadBadge, ScoreRing, ProgressBar } from '../shared/index.jsx'

function TypingIndicator() {
  return (
    <div className="msg-in flex gap-2.5 items-end">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Bot size={15} className="text-primary" />
      </div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-slate-100">
        <div className="flex gap-1.5 items-center h-4">
          {[0,1,2].map(i => (
            <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full block bg-slate-400" style={{ animationDelay: `${i*0.15}s` }} />
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
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isAgent ? 'bg-primary/10' : 'bg-slate-100'}`}>
        {isAgent ? <Bot size={15} className="text-primary" /> : <User size={15} className="text-slate-500" />}
      </div>
      <div className={`max-w-[78%] ${isAgent ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-2.5 text-sm leading-relaxed ${
          isAgent
            ? 'rounded-2xl rounded-bl-sm bg-slate-50 border border-border text-slate-700'
            : 'rounded-2xl rounded-br-sm bg-primary text-white'
        }`}>
          {msg.content}
        </div>
        <div className={`text-[10px] mt-1 text-slate-400 ${isAgent ? '' : 'text-right'}`}>
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function ScorePanel({ score }) {
  if (!score) return <div className="text-center py-4 text-slate-400 text-sm">Score appears during the call</div>

  const colors = { hot: '#dc2626', warm: '#d97706', cold: '#0284c7' }
  const color = colors[score.label] || '#6366f1'
  const avg = Math.round((score.interest_level + score.readiness + score.network_signal + score.engagement_quality) / 4)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ScoreRing score={avg} label={score.label} />
        <div>
          <div className="font-semibold text-sm text-slate-800">
            {{ hot: 'Hot', warm: 'Warm', cold: 'Cold' }[score.label] || 'Scoring...'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{score.reasoning || 'Analyzing...'}</div>
        </div>
      </div>
      {[
        ['Interest', score.interest_level, '#dc2626'],
        ['Readiness', score.readiness, '#2563eb'],
        ['Network', score.network_signal, '#7c3aed'],
        ['Engagement', score.engagement_quality, '#059669'],
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

  const [conv, setConv] = useState({
    convId: null, messages: [], state: 'INIT', language: 'english',
    score: null, summary: null, isActive: false, isTyping: false, callDuration: 0
  })
  const timerRef = useRef(null)

  useEffect(() => {
    if (conv.isActive) { timerRef.current = setInterval(() => setConv(c => ({ ...c, callDuration: c.callDuration + 1 })), 1000) }
    else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [conv.isActive])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conv.messages, conv.isTyping])

  const addMsg = (role, content) => setConv(c => ({ ...c, messages: [...c.messages, { id: Date.now() + Math.random(), role, content, timestamp: new Date().toISOString() }] }))

  const handleStartCall = async () => {
    if (!lead) return
    try {
      const { agentApi } = await import('../../services/api.js')
      setConv(c => ({ ...c, messages: [], isActive: true, summary: null, score: null, state: 'GREETING', callDuration: 0 }))
      const result = await agentApi.startCall(lead.id, lead.language)
      setConv(c => ({ ...c, convId: result.conversation_id, language: result.language, messages: [{ id: Date.now(), role: 'agent', content: result.opening_message, timestamp: new Date().toISOString() }] }))
      onCallStart?.()
    } catch (e) { console.error(e); setConv(c => ({ ...c, isActive: false })) }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !conv.isActive || !conv.convId) return
    setInput(''); addMsg('user', text)
    setConv(c => ({ ...c, isTyping: true }))
    try {
      const { agentApi } = await import('../../services/api.js')
      const result = await agentApi.sendMessage(conv.convId, text)
      setConv(c => ({ ...c, isTyping: false, state: result.state, language: result.language, score: result.quick_score || c.score, messages: [...c.messages, { id: Date.now(), role: 'agent', content: result.response, timestamp: new Date().toISOString() }] }))
    } catch (e) { setConv(c => ({ ...c, isTyping: false })) }
  }

  const handleEndCall = async () => {
    if (!conv.convId) return
    setConv(c => ({ ...c, isActive: false, isTyping: false }))
    try {
      const { agentApi } = await import('../../services/api.js')
      const result = await agentApi.endCall(conv.convId)
      setConv(c => ({ ...c, score: result.score, summary: result.summary, state: 'END' }))
      onCallEnd?.(result)
    } catch (e) { console.error(e) }
  }

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Voice input not supported. Use Chrome.'); return }
    const rec = new SpeechRecognition()
    const langMap = { hindi: 'hi-IN', english: 'en-IN', tamil: 'ta-IN', telugu: 'te-IN', bengali: 'bn-IN', gujarati: 'gu-IN', marathi: 'mr-IN', hinglish: 'en-IN' }
    rec.lang = langMap[conv.language] || 'en-IN'
    rec.continuous = false; rec.interimResults = false
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setVoiceActive(false) }
    rec.onerror = () => setVoiceActive(false); rec.onend = () => setVoiceActive(false)
    rec.start(); setRecognition(rec); setVoiceActive(true)
  }

  const stopVoice = () => { recognition?.stop(); setVoiceActive(false) }

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div className="flex gap-5 h-full">
      <div className="flex-1 flex flex-col card p-0 overflow-hidden min-h-0">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800">Priya — AI Agent</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              {conv.isActive ? (
                <><span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live &middot; {fmt(conv.callDuration)} &middot; {conv.language}</>
              ) : conv.state === 'END' ? 'Call ended' : 'Ready to call'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conv.isActive && <VoiceVisualizer active />}
            {lead && !conv.isActive && conv.state !== 'END' && (
              <button onClick={handleStartCall} className="btn-primary text-xs !py-1.5"><Phone size={13} /> Call</button>
            )}
            {conv.isActive && (
              <button onClick={handleEndCall} className="btn-sm border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                <PhoneOff size={13} /> End
              </button>
            )}
            {conv.state === 'END' && (
              <button onClick={() => setConv(c => ({ ...c, state: 'INIT', messages: [], convId: null, summary: null, score: null }))} className="btn-ghost btn-sm">
                <RefreshCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/50" style={{ maxHeight: '360px' }}>
          {conv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <MessageSquare size={20} className="text-slate-400" />
              </div>
              {lead ? `Click "Call" to start with ${lead.name}` : 'Select a lead first'}
            </div>
          ) : conv.messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {conv.isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <div className="px-4 h-14 border-t border-border flex gap-2 items-center bg-white">
          <input ref={useRef(null)} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={conv.isActive ? 'Type as the lead...' : 'Start a call first'} disabled={!conv.isActive} className="input flex-1 h-9 text-sm" />
          <button onClick={voiceActive ? stopVoice : startVoice} disabled={!conv.isActive}
            className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${voiceActive ? 'bg-red-50 border-red-200 text-red-500' : 'border-border text-slate-400 hover:text-slate-600 hover:bg-slate-50'} disabled:opacity-40`}>
            {voiceActive ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button onClick={handleSend} disabled={!conv.isActive || !input.trim()}
            className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-700 transition-colors">
            <Send size={15} />
          </button>
        </div>
      </div>

      <div className="w-60 flex flex-col gap-4 flex-shrink-0">
        <div className="card"><div className="section-label">Lead Score</div><ScorePanel score={conv.score} /></div>
        {conv.score?.objections_detected?.length > 0 && (
          <div className="card">
            <div className="section-label">Objections</div>
            <div className="space-y-1">
              {conv.score.objections_detected.map(obj => (
                <div key={obj} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {obj.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        )}
        {conv.summary && (
          <div className="card">
            <div className="section-label">Post-Call Summary</div>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-sm text-slate-800">{conv.summary.headline}</div>
              <div><span className="text-slate-400">Action: </span>{conv.summary.recommended_action}</div>
              <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-border text-xs leading-relaxed">
                <div className="text-slate-400 mb-1 font-medium">WhatsApp</div>
                <div className="text-slate-600">{conv.summary.whatsapp_message}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
