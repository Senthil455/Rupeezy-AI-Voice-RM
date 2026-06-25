import { useState, useEffect } from 'react'
import { leadsApi } from '../services/api.js'
import ChatInterface from '../components/chat/ChatInterface.jsx'
import { LeadBadge } from '../components/shared/index.jsx'
import { Plus, RefreshCcw } from 'lucide-react'

const LANGUAGES = ['english', 'hindi', 'hinglish', 'tamil', 'telugu', 'marathi', 'bengali', 'gujarati']
const LEAD_TYPES = ['MFD', 'Financial Advisor', 'Insurance Agent', 'Finance Influencer']

export function AgentDemo() {
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [customMode, setCustomMode] = useState(false)
  const [custom, setCustom] = useState({ name: 'Rajesh Kumar', language: 'hindi', type: 'MFD', phone: '+919876543210', email: '', city: 'Delhi', network_size: '50-100', source: 'demo' })
  const [callResult, setCallResult] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    leadsApi.getAll().then(d => setLeads(d.leads || [])).catch(() => {})
  }, [])

  const handleCreateCustom = async () => {
    setCreating(true)
    try {
      const lead = await leadsApi.create(custom)
      setSelectedLead(lead)
      setCustomMode(false)
      setLeads(prev => [lead, ...prev])
    } catch (e) {
      alert('Failed to create lead. Make sure the backend is running.')
    } finally {
      setCreating(false)
    }
  }

  const handleCallEnd = (result) => {
    setCallResult(result)
    setLeads(prev => prev.map(l => l.id === selectedLead?.id
      ? { ...l, status: result.score?.label, score: result.score?.score, score_label: result.score?.label }
      : l
    ))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">Agent Demo</h2>
          <p className="text-slate-400 text-sm mt-1">Simulate a live AI call with any lead in your pipeline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCustomMode(!customMode)} className="btn-ghost text-sm">
            <Plus size={14} />
            {customMode ? 'Cancel' : 'Custom Lead'}
          </button>
          <button onClick={async () => { await leadsApi.seed(); const d = await leadsApi.getAll(); setLeads(d.leads || []) }}
            className="btn-ghost text-sm">
            <RefreshCcw size={14} />
            Seed Leads
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-3">
          {customMode ? (
            <div className="card space-y-3">
              <div className="section-label">Create Custom Lead</div>
              {[
                ['Name', 'name', 'text'],
                ['Phone', 'phone', 'text'],
                ['Email', 'email', 'email'],
                ['City', 'city', 'text'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 block mb-1">{label}</label>
                  <input className="input" type={type} value={custom[key]} onChange={e => setCustom(c => ({ ...c, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Language</label>
                <select className="input" value={custom.language} onChange={e => setCustom(c => ({ ...c, language: e.target.value }))}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Type</label>
                <select className="input" value={custom.type} onChange={e => setCustom(c => ({ ...c, type: e.target.value }))}>
                  {LEAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Network Size</label>
                <select className="input" value={custom.network_size} onChange={e => setCustom(c => ({ ...c, network_size: e.target.value }))}>
                  {['10-50', '50-100', '100-200', '200+'].map(s => <option key={s} value={s}>{s} clients</option>)}
                </select>
              </div>
              <button onClick={handleCreateCustom} disabled={creating} className="btn-primary w-full mt-2">
                {creating ? 'Creating...' : 'Start with this lead'}
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="section-label">Select Lead</div>
              {leads.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-4">
                  No leads. Seed some or create a custom lead.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {leads.slice(0, 30).map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); setCallResult(null) }}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                        selectedLead?.id === lead.id
                          ? 'bg-accent/10 border-accent/30 text-white'
                          : 'bg-white/[0.02] border-white/[0.05] text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.08]'
                      }`}
                    >
                      <div className="font-medium">{lead.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">{lead.type}</span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500">{lead.language}</span>
                        <div className="ml-auto"><LeadBadge label={lead.status} /></div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedLead && (
            <div className="card">
              <div className="section-label">Selected Lead</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="font-medium">{selectedLead.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span>{selectedLead.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Language</span>
                  <span>{selectedLead.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network</span>
                  <span>{selectedLead.network_size || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">City</span>
                  <span>{selectedLead.city || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {callResult && (
            <div className={`card border ${
              callResult.lead_status === 'hot' ? 'border-red-500/30' :
              callResult.lead_status === 'warm' ? 'border-amber-500/30' :
              'border-teal-500/30'
            }`}>
              <div className="section-label">Call Complete</div>
              <div className="text-sm space-y-2">
                <div className="font-semibold text-base">
                  <LeadBadge label={callResult.lead_status} />
                </div>
                <div className="text-slate-400">{callResult.action?.message}</div>
                <div className="text-xs text-slate-500 mt-2">{callResult.summary?.recommended_action}</div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <ChatInterface
            lead={selectedLead}
            onCallEnd={handleCallEnd}
            onCallStart={() => setCallResult(null)}
          />
        </div>
      </div>
    </div>
  )
}
