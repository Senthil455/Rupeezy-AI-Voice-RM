export function ScoreRing({ score = 0, label = 'cold', size = 64 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const colors = { hot: '#dc2626', warm: '#d97706', cold: '#0284c7', unscored: '#6366f1' }
  const color = colors[label] || colors.unscored

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-bold text-sm text-slate-700">{score}</span>
      </div>
    </div>
  )
}

const BADGE_CONFIG = {
  hot: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444', label: 'Hot' },
  warm: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', dot: '#f59e0b', label: 'Warm' },
  cold: { bg: '#f0f9ff', border: '#bae6fd', text: '#0284c7', dot: '#0ea5e9', label: 'Cold' },
  new: { bg: '#f5f3ff', border: '#ddd6fe', text: '#7c3aed', dot: '#8b5cf6', label: 'New' },
  calling: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', dot: '#3b82f6', label: 'Calling' },
  converted: { bg: '#f0fdf4', border: '#bbf7d0', text: '#059669', dot: '#10b981', label: 'Converted' },
}

export function LeadBadge({ label }) {
  const c = BADGE_CONFIG[label] || BADGE_CONFIG.new
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

export function KpiCard({ label, value, delta, deltaUp, accentColor, icon }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-400 mb-1">{label}</div>
          <div className="font-display font-bold text-2xl text-slate-800">{value}</div>
          {delta && (
            <div className={`flex items-center gap-1 text-xs mt-1.5 ${deltaUp ? 'text-emerald-600' : 'text-red-600'}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                {deltaUp
                  ? <path d="M5 1.5L8.5 7H1.5L5 1.5Z" fill="currentColor" />
                  : <path d="M5 8.5L1.5 3H8.5L5 8.5Z" fill="currentColor" />}
              </svg>
              {delta}
            </div>
          )}
        </div>
        {icon && <div className="text-slate-300 flex-shrink-0 ml-3">{icon}</div>}
      </div>
    </div>
  )
}

export function ProgressBar({ value, max = 100, color = '#2563eb', height = 6 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="rounded-full overflow-hidden bg-slate-100" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function VoiceVisualizer({ active = false }) {
  if (!active) return null
  return (
    <div className="flex items-center gap-[3px] h-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="voice-bar w-[2px] rounded-full bg-primary" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

export function PulseDot({ color = '#059669' }) {
  return <span className="pulse-dot inline-block w-2 h-2 rounded-full" style={{ background: color }} />
}
