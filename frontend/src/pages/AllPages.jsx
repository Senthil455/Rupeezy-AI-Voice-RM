import { useState, useEffect } from 'react'
import { leadsApi, conversationsApi, analyticsApi } from '../services/api.js'
import { LeadBadge, ScoreRing } from '../components/shared/index.jsx'
import { Search, Phone, Upload as UploadIcon, Database, FileText, Plus, CheckCircle, MessageCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts'

export function LeadPipeline() {
  const [leads, setLeads] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [convs, setConvs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { leadsApi.getAll().then(d => { setLeads(d.leads || []); setLoading(false) }) }, [])
  useEffect(() => { if (selected) conversationsApi.getForLead(selected.id).then(d => setConvs(d.conversations || [])) }, [selected])

  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.id.includes(search)) return false
    return true
  })

  const tabs = [
    { key: 'all', label: `All (${leads.length})` },
    { key: 'hot', label: `Hot (${leads.filter(l=>l.status==='hot').length})` },
    { key: 'warm', label: `Warm (${leads.filter(l=>l.status==='warm').length})` },
    { key: 'cold', label: `Cold (${leads.filter(l=>l.status==='cold').length})` },
    { key: 'new', label: `New (${leads.filter(l=>l.status==='new').length})` },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${filter === t.key ? 'bg-white text-slate-800 shadow-sm border border-border' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 w-52 h-9" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={async () => { await leadsApi.seed(); const d = await leadsApi.getAll(); setLeads(d.leads || []) }} className="btn-ghost btn-sm">
            <Database size={13} /> Seed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 card p-0 overflow-hidden">
          {loading ? <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
          : filtered.length === 0 ? <div className="py-12 text-center text-slate-400 text-sm">No leads found</div>
          : <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Lead','Type','Language','Score','Status','Calls',''].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-400 p-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead.id} onClick={() => setSelected(lead)}
                      className={`border-b border-border/50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === lead.id ? 'bg-primary/5' : ''}`}>
                      <td className="p-4"><div className="text-sm font-medium text-slate-800">{lead.name}</div><div className="text-xs text-slate-400 mt-0.5">{lead.id}</div></td>
                      <td className="p-4 text-xs text-slate-500">{lead.type}</td>
                      <td className="p-4"><span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{lead.language}</span></td>
                      <td className="p-4"><ScoreRing score={lead.score || 0} label={lead.score_label || 'new'} size={36} /></td>
                      <td className="p-4"><LeadBadge label={lead.status} /></td>
                      <td className="p-4 text-sm text-slate-500">{lead.call_count || 0}</td>
                      <td className="p-4"><a href="/agent" className="text-xs font-medium text-primary hover:text-primary-700">Call &rarr;</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </div>

        <div>
          {selected ? (
            <div className="card space-y-4">
              <div><div className="font-display font-bold text-lg text-slate-800">{selected.name}</div><div className="text-slate-400 text-sm">{selected.type} &middot; {selected.city}</div></div>
              <div><LeadBadge label={selected.status} /></div>
              <div className="space-y-2 text-sm">
                {[['Phone', selected.phone],['Email', selected.email || '—'],['Language', selected.language],['Network', selected.network_size || '—'],['Source', selected.source || '—'],['Calls', selected.call_count || 0],['Score', selected.score || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-400">{k}</span><span className="text-slate-700">{v}</span></div>
                ))}
              </div>
              {selected.last_call_summary && (
                <div className="p-3 rounded-lg bg-slate-50 border border-border text-sm">
                  <div className="text-xs text-slate-400 mb-1">Last Call</div>
                  <div className="text-sm text-slate-600">{selected.last_call_summary}</div>
                </div>
              )}
              {selected.recommended_action && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-slate-400 mb-1">Recommended</div>
                  <div className="text-sm text-emerald-700 font-medium">{selected.recommended_action}</div>
                </div>
              )}
              {convs.length > 0 && (
                <div>
                  <div className="section-label">History ({convs.length})</div>
                  {convs.map(c => (
                    <div key={c.id} className="p-3 rounded-lg border border-border mb-2 text-sm bg-slate-50/50">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{new Date(c.started_at).toLocaleDateString()}</span>
                        <span>{Math.floor(c.duration_seconds/60)}m {c.duration_seconds%60}s</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{c.messages?.length || 0} msgs &middot; {c.language}</div>
                    </div>
                  ))}
                </div>
              )}
              <a href="/agent" className="btn-primary w-full text-center"><Phone size={14} className="inline mr-1.5" /> Call This Lead</a>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-40 text-slate-400 text-sm">Select a lead to view details</div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Upload() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [manual, setManual] = useState({ name:'', phone:'', email:'', language:'english', type:'MFD', city:'', network_size:'50-100', source:'manual' })

  const handleFileDrop = async (e) => {
    e.preventDefault()
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (!f) return; setFile(f); setStatus('uploading'); setProgress(0)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const text = ev.target.result; const lines = text.split('\n').filter(Boolean)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const rows = lines.slice(1).map(line => { const vals = line.split(','); return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() || ''])) })
        const leads = rows.filter(r => r.name && r.phone).map(r => ({ name: r.name, phone: r.phone, email: r.email || '', language: r.language || 'english', type: r.type || 'MFD', city: r.city || '', network_size: r.network_size || '', source: 'csv_upload' }))
        for (let i = 0; i <= 100; i += 10) { await new Promise(r => setTimeout(r, 60)); setProgress(i) }
        const res = await (await import('../services/api.js')).leadsApi.bulkCreate(leads); setResult(res); setStatus('done')
      } catch { setStatus('error') }
    }; reader.readAsText(f)
  }

  const handleManualAdd = async () => {
    try { await (await import('../services/api.js')).leadsApi.create(manual); setStatus('done'); setResult({ created: 1 }) } catch { setStatus('error') }
  }

  const handleSeed = async () => {
    setStatus('uploading'); setProgress(0)
    for (let i = 0; i <= 100; i += 5) { await new Promise(r => setTimeout(r, 40)); setProgress(i) }
    const res = await (await import('../services/api.js')).leadsApi.seed(); setResult(res); setStatus('done')
  }

  return (
    <div className="grid grid-cols-2 gap-6 animate-fade-in">
      <div className="space-y-5">
        <div className="card">
          <div className="section-label">CSV Upload</div>
          <div onDrop={handleFileDrop} onDragOver={e => e.preventDefault()} onClick={() => document.getElementById('csv-input').click()}
            className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-xl p-10 text-center cursor-pointer transition-colors bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <UploadIcon size={24} className="text-primary" />
            </div>
            <div className="text-sm text-slate-600 mb-1">Drop CSV file here or click to browse</div>
            <div className="text-xs text-slate-400">Required columns: name, phone</div>
            <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileDrop} />
          </div>
          {status === 'uploading' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-2"><span>Processing...</span><span>{progress}%</span></div>
              <div className="rounded-full h-1.5 bg-slate-200 overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          {status === 'done' && result && <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{result?.created || result?.count || 1} leads imported</div>}
          {status === 'error' && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">Upload failed. Check CSV format.</div>}
        </div>
        <div className="card">
          <div className="section-label">Demo Data</div>
          <p className="text-sm text-slate-500 mb-3">Instantly add 20 realistic Indian leads for demo.</p>
          <button onClick={handleSeed} className="btn-primary w-full"><Database size={14} /> Seed 20 Leads</button>
        </div>
      </div>
      <div className="space-y-5">
        <div className="card">
          <div className="section-label">Add Single Lead</div>
          <div className="space-y-3">
            {[['Name','name','text'],['Phone','phone','tel'],['Email','email','email'],['City','city','text']].map(([l,k,t]) => (
              <div key={k}><label className="text-xs text-slate-500 block mb-1">{l}</label><input className="input" type={t} value={manual[k]} onChange={e => setManual(m => ({...m, [k]: e.target.value}))} /></div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500 block mb-1">Language</label>
                <select className="input" value={manual.language} onChange={e => setManual(m => ({...m, language: e.target.value}))}>
                  {['english','hindi','hinglish','tamil','telugu','marathi','bengali','gujarati'].map(l => <option key={l}>{l}</option>)}
                </select></div>
              <div><label className="text-xs text-slate-500 block mb-1">Type</label>
                <select className="input" value={manual.type} onChange={e => setManual(m => ({...m, type: e.target.value}))}>
                  {['MFD','Financial Advisor','Insurance Agent','Finance Influencer'].map(t => <option key={t}>{t}</option>)}
                </select></div>
            </div>
            <button onClick={handleManualAdd} className="btn-primary w-full mt-1"><Plus size={14} /> Add Lead</button>
          </div>
        </div>
        <div className="card">
          <div className="section-label">CSV Format Guide</div>
          <div className="text-xs text-slate-500 space-y-1">
            <div>Required: <span className="text-primary font-medium">name</span>, <span className="text-primary font-medium">phone</span></div>
            <div>Optional: email, language, type, city, network_size, source</div>
          </div>
          <pre className="mt-3 p-3 rounded-lg bg-slate-50 border border-border text-xs text-slate-500 overflow-x-auto">
{`name,phone,email,language,type
Rajesh Kumar,+919876543210,r@email.com,hindi,MFD
Priya Shah,+919123456789,p@email.com,english,FA`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function Analytics() {
  const [snap, setSnap] = useState(null)
  const [funnel, setFunnel] = useState([])
  useEffect(() => { Promise.all([analyticsApi.snapshot(), analyticsApi.funnel()]).then(([s, f]) => { setSnap(s); setFunnel(f.stages || []) }) }, [])

  const langData = Object.entries(snap?.language_breakdown || {}).map(([k, v]) => ({ name: k, value: v }))
  const objData = Object.entries(snap?.objection_breakdown || {}).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v }))
  const trendData = [{day:'Apr 16',rate:22},{day:'Apr 17',rate:25},{day:'Apr 18',rate:28},{day:'Apr 19',rate:30},{day:'Apr 20',rate:31},{day:'Apr 21',rate:33},{day:'Apr 22',rate:34.2}]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {[
          ['Conversion Rate', `${snap?.conversion_rate ?? '—'}%`, '#059669', 'from 18% baseline'],
          ['Hot Leads', snap?.hot ?? '—', '#dc2626', 'RM handoff ready'],
          ['Warm Leads', snap?.warm ?? '—', '#d97706', 'WhatsApp sent'],
          ['Total Calls', snap?.total_conversations ?? '—', '#2563eb', 'Conversations logged'],
        ].map(([label, value, color, delta]) => (
          <div key={label} className="card">
            <div className="text-xs text-slate-400 mb-2">{label}</div>
            <div className="font-display font-bold text-2xl" style={{ color }}>{value}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L8.5 7H1.5L5 1.5Z" fill="currentColor" /></svg>
              {delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="section-label">Conversion Trend (7 Days)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[15, 40]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(v) => [`${v}%`, 'Conversion']} />
              <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-label">Language Breakdown</div>
          {langData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={langData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="value" radius={[3,3,0,0]}>
                  {langData.map((_, i) => <Cell key={i} fill={['#3b82f6','#f59e0b','#8b5cf6','#ef4444','#059669','#06b6d4','#f97316'][i%7]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-400 text-sm text-center py-10">No data yet</div>}
        </div>
      </div>

      {objData.length > 0 && (
        <div className="card">
          <div className="section-label">Objection Frequency</div>
          <div className="space-y-3 max-w-xl">
            {objData.map((o, i) => {
              const max = Math.max(...objData.map(x => x.value))
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-36 text-xs text-slate-500 text-right flex-shrink-0">{o.name}</div>
                  <div className="flex-1 rounded-full h-2 bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(o.value/max)*100}%` }} />
                  </div>
                  <div className="w-6 text-xs text-slate-500">{o.value}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function RMHandoff() {
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { analyticsApi.rmQueue().then(d => { setQueue(d.queue || []); setLoading(false) }) }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Hot leads ready for human follow-up</p>
        <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-600">{queue.length} lead{queue.length !== 1 ? 's' : ''} waiting</div>
      </div>
      {queue.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto mb-4 flex items-center justify-center"><FileText size={24} className="text-slate-400" /></div>
          <div className="text-sm">No hot leads yet. Run some calls to generate handoffs.</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-3">
            {queue.map(lead => (
              <div key={lead.id} onClick={() => setSelected(lead)}
                className={`card cursor-pointer transition-all ${selected?.id === lead.id ? 'ring-1 ring-primary/30 border-primary/30' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-amber-500 flex items-center justify-center text-white font-display font-bold flex-shrink-0">
                    {lead.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800">{lead.name} <LeadBadge label="hot" /></div>
                    <div className="text-xs text-slate-400 mt-0.5">{lead.type} &middot; {lead.language} &middot; {lead.city}</div>
                    {lead.last_call_summary && <div className="text-sm text-slate-600 mt-2">{lead.last_call_summary}</div>}
                    {lead.recommended_action && (
                      <div className="flex items-center gap-1 text-xs mt-1.5 text-emerald-600"><CheckCircle size={12} /> {lead.recommended_action}</div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="btn-primary btn-sm"><Phone size={12} /> Call</button>
                    <button className="btn-ghost btn-sm"><MessageCircle size={12} /> WA</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selected ? (
            <div className="card space-y-4">
              <div className="font-display font-bold text-lg text-slate-800">{selected.name}</div>
              <div className="space-y-3 text-sm">
                {[['Phone', selected.phone],['Type', selected.type],['Language', selected.language],['Network', selected.network_size || '—'],['Score', selected.score]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-400">{k}</span><span className="text-right text-slate-700 font-medium">{v}</span></div>
                ))}
              </div>
              {selected.whatsapp_message && (
                <div className="p-3 rounded-lg bg-slate-50 border border-border text-sm">
                  <div className="text-xs text-slate-400 mb-2 font-medium">WhatsApp Message</div>
                  <div className="text-sm text-slate-600 leading-relaxed">{selected.whatsapp_message}</div>
                </div>
              )}
              <div className="space-y-2">
                <button className="btn-primary w-full"><Phone size={14} /> Call Now</button>
                <button className="btn-ghost w-full"><MessageCircle size={14} /> Send WhatsApp</button>
                <button onClick={async () => {
                  await (await import('../services/api.js')).leadsApi.patch(selected.id, { status: 'converted' })
                  setQueue(q => q.filter(l => l.id !== selected.id)); setSelected(null)
                }} className="w-full py-2 rounded-lg text-sm font-medium transition-colors border-2 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                  <CheckCircle size={14} className="inline mr-1" /> Mark Converted
                </button>
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-40 text-slate-400 text-sm">Select a lead for details</div>
          )}
        </div>
      )}
    </div>
  )
}

const OBJECTIONS = [
  { id: 'broker', title: 'Already with another broker', trigger: '"Main pehle se X broker ke saath hoon" / "I already work with Zerodha"', resolutionRate: 72, strategy: 'Acknowledge their experience, then reframe around earnings gap',
    responses: { English: "That's great — means you already understand the business! But let me ask: are you getting 100% brokerage share and daily payouts? Most platforms cap you at 60-70% and pay monthly. You're leaving money on the table every single month.", Hindi: "यह तो बढ़िया है — इसका मतलब है आप business समझते हैं! लेकिन बताइए — क्या आपको 100% brokerage मिल रही है और daily payouts? ज़्यादातर platforms 60-70% देते हैं। आप हर महीने पैसे miss कर रहे हैं।", Hinglish: "That's great yaar — aap already business samajhte ho! But ek question: 100% brokerage mil rahi hai aur daily payouts? Most brokers 60-70% dete hain. Aap har mahine paisa miss kar rahe ho." } },
  { id: 'contacts', title: 'Not enough contacts', trigger: '"Mere paas zyada contacts nahi hain" / "I don\'t have many clients"', resolutionRate: 68, strategy: 'Normalize starting small, emphasize quality over quantity',
    responses: { English: "You don't need a thousand contacts to start. Many of our best partners started with just 10 trusted friends. Quality beats quantity. And Rupeezy gives you marketing tools, referral systems, and a dedicated RM to help you grow fast.", Hindi: "हज़ारों contacts की ज़रूरत नहीं है। हमारे best partners ने 10 trusted friends से शुरू किया था। Quality matters, quantity नहीं। और Rupeezy आपको marketing tools और support देता है।", Hinglish: "1000 contacts ki zaroorat nahi yaar. Top partners ne 10 friends se shuru kiya tha. Quality beats quantity. Aur Rupeezy ke tools se fast grow kar sakte ho." } },
  { id: 'support', title: 'Concerned about client support', trigger: '"Agar client ko issue hua toh?" / "Who handles support?"', resolutionRate: 61, strategy: 'Reassure with specific support infrastructure',
    responses: { English: "Your clients get 24/7 support via app, phone, and chat. As a partner, you get your own dedicated RM who's reachable anytime. Issues get escalated within 2 hours.", Hindi: "आपके clients को 24/7 support मिलता है — app, phone, chat सब पर। Partner के तौर पर आपको एक dedicated RM मिलता है। Issues 2 घंटे में resolve होती हैं।", Hinglish: "Clients ko 24/7 support milta hai — app, phone, chat sab pe. Tumhare liye ek dedicated RM hai. Issues 2 ghante mein solve hoti hain." } },
  { id: 'trust', title: 'Is Rupeezy trustworthy?', trigger: '"Kya Rupeezy safe hai?" / "How do I know this is legit?"', resolutionRate: 54, strategy: 'Lead with regulatory credentials',
    responses: { English: "Absolutely. Rupeezy is SEBI-registered and operates under NSE and BSE broker licenses — you can verify this on SEBI's website right now. Zero regulatory violations. 5 lakh+ investors trust us.", Hindi: "बिल्कुल! Rupeezy SEBI-registered है और NSE, BSE licensed broker है — अभी SEBI की website पर verify कर सकते हैं। कोई regulatory violation नहीं। 5 लाख+ investors trust करते हैं।", Hinglish: "Bilkul safe hai! SEBI-registered, NSE aur BSE licensed. Abhi SEBI website pe verify kar sakte ho. 5 lakh+ investors trust karte hain." } },
  { id: 'later', title: "I'll think about it", trigger: '"Sochta hoon" / "Baad mein call karo"', resolutionRate: 38, strategy: 'Respect their pace, reduce friction',
    responses: { English: "Of course, take your time. I'll send you everything on WhatsApp right now — the signup link, RISE Portal demo, and our commission calculator. It's zero cost to explore. Can I check back in 2 days?", Hindi: "बिल्कुल, सोचिए। मैं अभी WhatsApp पर सब भेज देती हूं — sign-up link, RISE Portal demo, commission calculator। Cost कुछ नहीं। 2 दिन में एक quick call ठीक रहेगी?", Hinglish: "Bilkul yaar, sochte raho. Main WhatsApp pe sab bhej deti hoon — link, RISE Portal demo, calculator. Zero cost. 2 din baad ek quick call chalega?" } }
]

export function ObjectionBank() {
  const [selected, setSelected] = useState(OBJECTIONS[0])
  const [activeLang, setActiveLang] = useState('English')

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-slate-400 text-sm">5 core objections with multilingual response strategies</p>
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2">
          {OBJECTIONS.map(obj => (
            <button key={obj.id} onClick={() => setSelected(obj)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected.id === obj.id ? 'bg-primary/5 border-primary/30' : 'bg-white border-border hover:border-slate-300'}`}>
              <div className="font-medium text-sm text-slate-800">{obj.title}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 rounded-full h-1.5 bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${obj.resolutionRate}%` }} />
                </div>
                <span className="text-xs text-emerald-600 font-medium">{obj.resolutionRate}%</span>
              </div>
            </button>
          ))}
        </div>
        <div className="col-span-2 card space-y-5">
          <div>
            <div className="font-display font-bold text-xl text-slate-800">{selected.title}</div>
            <div className="text-xs text-slate-500 mt-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-border inline-block">Trigger: {selected.trigger}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-border">
            <div className="text-xs text-slate-500 mb-2 font-medium">Strategy</div>
            <div className="text-sm text-slate-700">{selected.strategy}</div>
          </div>
          <div>
            <div className="flex gap-2 mb-4">
              {['English', 'Hindi', 'Hinglish'].map(lang => (
                <button key={lang} onClick={() => setActiveLang(lang)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all ${activeLang === lang ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-border">
              <div className="text-xs text-primary font-medium mb-3">Agent Response ({activeLang})</div>
              <div className="text-sm text-slate-700 leading-relaxed">{selected.responses[activeLang] || selected.responses.English}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 flex-shrink-0">Resolution rate:</div>
            <div className="flex-1 rounded-full h-2 bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selected.resolutionRate}%` }} />
            </div>
            <div className="text-sm text-emerald-600 font-semibold flex-shrink-0">{selected.resolutionRate}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Settings() {
  const [saved, setSaved] = useState(false)
  const [config, setConfig] = useState(() => {
    try { const stored = localStorage.getItem('rupeezy_settings'); if (stored) return JSON.parse(stored) } catch {}
    return { agentName: 'Priya', tone: 'professional_friendly', hotThreshold: 75, warmThreshold: 45, autoWhatsApp: true, callSchedule: 'always', maxAttempts: 3, llm: 'llama3-70b-8192', apiKey: '' }
  })

  const save = () => { localStorage.setItem('rupeezy_settings', JSON.stringify(config)); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {[
        { title: 'Agent Persona', fields: [
          { label: 'Agent Name', key: 'agentName', type: 'text' },
          { label: 'Tone', key: 'tone', type: 'select', options: [{v:'professional_friendly',l:'Professional & Friendly'},{v:'formal',l:'Formal'},{v:'casual',l:'Casual'}] },
        ]},
        { title: 'API Configuration', fields: [
          { label: 'LLM Model', key: 'llm', type: 'select', options: [{v:'llama3-70b-8192',l:'Llama 3 70B (Groq)'},{v:'llama3-8b-8192',l:'Llama 3 8B'},{v:'mixtral-8x7b-32768',l:'Mixtral 8x7B'}] },
          { label: 'Groq API Key', key: 'apiKey', type: 'password' },
        ]},
        { title: 'Call Settings', fields: [
          { label: 'Schedule', key: 'callSchedule', type: 'select', options: [{v:'always',l:'24/7'},{v:'business',l:'Business hours'}] },
          { label: 'Max Attempts', key: 'maxAttempts', type: 'select', options: [{v:3,l:'3'},{v:5,l:'5'},{v:7,l:'7'}] },
        ]}
      ].map(section => (
        <div key={section.title} className="card">
          <div className="section-label">{section.title}</div>
          <div className="space-y-4">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="text-sm text-slate-600 block mb-1.5">{field.label}</label>
                {field.type === 'select' ? (
                  <select className="input" value={config[field.key]} onChange={e => setConfig(c => ({...c, [field.key]: e.target.value}))}>
                    {field.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input className="input" type={field.type} value={config[field.key]} onChange={e => setConfig(c => ({...c, [field.key]: e.target.value}))} placeholder={field.type === 'password' ? 'sk-ant-...' : ''} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="card">
        <div className="section-label">Qualification Thresholds</div>
        <div className="space-y-5">
          {[{label:'Hot threshold',key:'hotThreshold',color:'#dc2626'},{label:'Warm threshold',key:'warmThreshold',color:'#d97706'}].map(t => (
            <div key={t.key}>
              <div className="flex justify-between text-sm mb-2"><span className="text-slate-600">{t.label}</span><span style={{color:t.color}} className="font-mono font-semibold">{config[t.key]}</span></div>
              <input type="range" min="30" max="95" value={config[t.key]} onChange={e => setConfig(c => ({...c, [t.key]: +e.target.value}))} className="w-full" style={{accentColor: t.color}} />
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="section-label">Integration Status</div>
        {[['LLM (Groq / Llama 3)', true],['STT (Whisper / Web Speech)', true],['TTS (Browser / ElevenLabs)', true],['WhatsApp Business API', false],['CRM Sync', false]].map(([name, connected]) => (
          <div key={name} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
            <span className="text-sm text-slate-600">{name}</span>
            <span className={`text-xs font-medium ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>{connected ? 'Connected' : 'Configure'}</span>
          </div>
        ))}
      </div>
      <button onClick={save} className="btn-primary px-8">{saved ? 'Saved!' : 'Save Settings'}</button>
    </div>
  )
}
