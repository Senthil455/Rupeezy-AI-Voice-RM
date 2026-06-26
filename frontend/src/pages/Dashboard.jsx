import { useEffect, useState } from 'react'
import { analyticsApi, leadsApi } from '../services/api.js'
import { KpiCard, LeadBadge, ProgressBar } from '../components/shared/index.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, Zap, TrendingUp, Clock, Flame } from 'lucide-react'

function EmptyState({ onSeed }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-border flex items-center justify-center mb-4">
        <Users size={26} className="text-slate-400" />
      </div>
      <div className="text-slate-800 font-semibold text-lg mb-1">No leads yet</div>
      <div className="text-slate-400 text-sm mb-6">Seed demo data to explore the dashboard</div>
      <button onClick={onSeed} className="btn-primary">Seed 20 Demo Leads</button>
    </div>
  )
}

export function Dashboard() {
  const [snap, setSnap] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.snapshot(), analyticsApi.funnel(), leadsApi.getAll()])
      .then(([s, f, l]) => { setSnap(s); setFunnel(f.stages || []); setRecentLeads((l.leads || []).slice(0, 5)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
  if (!snap?.total_leads) return <EmptyState onSeed={() => leadsApi.seed().then(() => window.location.reload())} />

  const langData = Object.entries(snap.language_breakdown || {}).map(([k, v]) => ({ name: k, value: v }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Leads" value={snap.total_leads} icon={<Users size={20} />} />
        <KpiCard label="Hot Leads" value={snap.hot} icon={<Flame size={20} />} delta="RM handoff ready" deltaUp />
        <KpiCard label="Warm Leads" value={snap.warm} icon={<TrendingUp size={20} />} delta="WhatsApp queued" deltaUp />
        <KpiCard label="Conversion Rate" value={`${snap.conversion_rate}%`} icon={<Zap size={20} />} delta="vs 18% baseline" deltaUp />
        <KpiCard label="Avg Response" value="<5 min" icon={<Clock size={20} />} delta="9x faster" deltaUp />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card col-span-2">
          <div className="section-label">Conversion Funnel</div>
          <div className="space-y-3">
            {funnel.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 text-xs text-slate-400 text-right flex-shrink-0">{stage.stage}</div>
                <div className="flex-1">
                  <ProgressBar value={stage.pct} max={100} color={['#3b82f6','#8b5cf6','#f59e0b','#ef4444','#059669'][i]} />
                </div>
                <div className="w-10 text-xs text-right text-slate-400">{stage.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-label">Languages</div>
          {langData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={langData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="value" radius={[3,3,0,0]}>
                  {langData.map((_, i) => <Cell key={i} fill={['#3b82f6','#f59e0b','#8b5cf6','#ef4444','#059669','#06b6d4','#f97316'][i % 7]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-400 text-sm text-center py-8">No data</div>}
        </div>
      </div>

      <div className="card">
        <div className="section-label">Recent Leads</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Name','Type','Language','Status','Score',''].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-400 pb-3 pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLeads.map(lead => (
              <tr key={lead.id} className="border-b border-border/50 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4">
                  <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                  <div className="text-xs text-slate-400">{lead.id}</div>
                </td>
                <td className="py-3 pr-4 text-xs text-slate-500">{lead.type}</td>
                <td className="py-3 pr-4"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{lead.language}</span></td>
                <td className="py-3 pr-4"><LeadBadge label={lead.status} /></td>
                <td className="py-3 pr-4 font-display font-bold text-sm" style={{
                  color: lead.score_label === 'hot' ? '#dc2626' : lead.score_label === 'warm' ? '#d97706' : '#0284c7'
                }}>{lead.score || '—'}</td>
                <td className="py-3"><a href="/agent" className="text-xs font-medium text-primary hover:text-primary-700">Call &rarr;</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
