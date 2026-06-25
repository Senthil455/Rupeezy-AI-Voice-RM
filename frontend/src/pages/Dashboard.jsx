import { useEffect, useState } from 'react'
import { analyticsApi, leadsApi } from '../services/api.js'
import { KpiCard, LeadBadge, ProgressBar } from '../components/shared/index.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, Zap, TrendingUp, Clock, Flame } from 'lucide-react'

function EmptyState({ onSeed }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-panel border border-white/[0.07] flex items-center justify-center mb-5">
        <Users size={28} className="text-slate-500" />
      </div>
      <div className="text-slate-300 font-semibold text-lg mb-1">No leads yet</div>
      <div className="text-slate-500 text-sm mb-6">Seed demo data to get started</div>
      <button onClick={onSeed} className="btn-primary">
        Seed 20 Demo Leads
      </button>
    </div>
  )
}

export function Dashboard() {
  const [snap, setSnap] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.snapshot(),
      analyticsApi.funnel(),
      leadsApi.getAll(),
    ]).then(([s, f, l]) => {
      setSnap(s)
      setFunnel(f.stages || [])
      setRecentLeads((l.leads || []).slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading dashboard...</div>
  )

  if (!snap?.total_leads) return <EmptyState onSeed={() => leadsApi.seed().then(() => window.location.reload())} />

  const langData = Object.entries(snap.language_breakdown || {}).map(([k, v]) => ({ name: k, value: v }))

  const kpiIcon = (el) => <span className="text-xl">{el}</span>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Leads" value={snap.total_leads} icon={<Users size={20} />} accentColor="#4f8cff" />
        <KpiCard label="Hot Leads" value={snap.hot} icon={<Flame size={20} />} accentColor="#ff5c5c" delta="RM handoff ready" deltaUp />
        <KpiCard label="Warm Leads" value={snap.warm} icon={<TrendingUp size={20} />} accentColor="#ffb830" delta="WhatsApp queued" deltaUp />
        <KpiCard label="Conversion Rate" value={`${snap.conversion_rate}%`} icon={<Zap size={20} />} accentColor="#4cd97b" delta="vs 18% baseline" deltaUp />
        <KpiCard label="Avg Response" value="<5 min" icon={<Clock size={20} />} accentColor="#7c5cfc" delta="9× faster than RM" deltaUp />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card col-span-2">
          <div className="section-label">Conversion Funnel</div>
          <div className="space-y-3">
            {funnel.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 text-xs text-slate-400 text-right flex-shrink-0">{stage.stage}</div>
                <div className="flex-1">
                  <ProgressBar value={stage.pct} max={100} color={['#4f8cff','#7c5cfc','#ffb830','#ff5c5c','#4cd97b'][i]} />
                </div>
                <div className="w-10 text-xs text-right text-slate-500">{stage.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-label">Language Distribution</div>
          {langData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={langData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#141929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {langData.map((_, i) => (
                    <Cell key={i} fill={['#4f8cff','#ffb830','#7c5cfc','#ff5c5c','#4cd97b','#5ce8d4','#f4845a'][i % 7]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-500 text-sm text-center py-8">No data yet</div>}
        </div>
      </div>

      <div className="card">
        <div className="section-label">Recent Leads</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Name','Type','Language','Status','Score',''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4 whitespace-nowrap uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(lead => (
                <tr key={lead.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.015] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="text-sm font-medium">{lead.name}</div>
                    <div className="text-xs text-slate-500">{lead.id}</div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-400">{lead.type}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-slate-400 bg-white/[0.04] px-2 py-1 rounded-md">{lead.language}</span>
                  </td>
                  <td className="py-3 pr-4"><LeadBadge label={lead.status} /></td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-display font-bold" style={{
                      color: lead.score_label === 'hot' ? '#ff5c5c'
                        : lead.score_label === 'warm' ? '#ffb830'
                        : '#5ce8d4'
                    }}>
                      {lead.score || '—'}
                    </span>
                  </td>
                  <td className="py-3">
                    <a href="/agent" className="text-xs text-accent hover:text-blue-300 transition-colors">
                      Call &rarr;
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
