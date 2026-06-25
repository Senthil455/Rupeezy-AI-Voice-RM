export function ScoreRing({ score = 0, label = 'cold', size = 64 }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  const colors = {
    hot: '#ff5c5c',
    warm: '#ffb830',
    cold: '#5ce8d4',
    unscored: '#4f8cff'
  }
  const color = colors[label] || colors.unscored

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-bold text-sm" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

const BADGE_CONFIG = {
  hot: { bg: 'rgba(255, 92, 92, 0.1)', border: 'rgba(255, 92, 92, 0.25)', text: '#ff5c5c', dot: '#ff5c5c', label: 'Hot' },
  warm: { bg: 'rgba(255, 184, 48, 0.1)', border: 'rgba(255, 184, 48, 0.25)', text: '#ffb830', dot: '#ffb830', label: 'Warm' },
  cold: { bg: 'rgba(92, 232, 212, 0.1)', border: 'rgba(92, 232, 212, 0.25)', text: '#5ce8d4', dot: '#5ce8d4', label: 'Cold' },
  new: { bg: 'rgba(79, 140, 255, 0.1)', border: 'rgba(79, 140, 255, 0.25)', text: '#4f8cff', dot: '#4f8cff', label: 'New' },
  calling: { bg: 'rgba(124, 92, 252, 0.1)', border: 'rgba(124, 92, 252, 0.25)', text: '#7c5cfc', dot: '#7c5cfc', label: 'Calling' },
  converted: { bg: 'rgba(76, 217, 123, 0.1)', border: 'rgba(76, 217, 123, 0.25)', text: '#4cd97b', dot: '#4cd97b', label: 'Converted' },
}

export function LeadBadge({ label }) {
  const c = BADGE_CONFIG[label] || BADGE_CONFIG.new
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

export function KpiCard({ label, value, delta, deltaUp, accentColor, icon }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5"
      style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
          <div className="font-display font-bold text-2xl mt-1.5" style={{ color: accentColor || '#fff' }}>
            {value}
          </div>
          {delta && (
            <div className="flex items-center gap-1 text-xs mt-2" style={{ color: deltaUp ? '#4cd97b' : '#ff5c5c' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                {deltaUp
                  ? <path d="M5 1.5L8.5 7H1.5L5 1.5Z" fill="currentColor" />
                  : <path d="M5 8.5L1.5 3H8.5L5 8.5Z" fill="currentColor" />
                }
              </svg>
              {delta}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-lg flex-shrink-0 ml-3" style={{ opacity: 0.3 }}>{icon}</div>
        )}
      </div>
    </div>
  )
}

export function ProgressBar({ value, max = 100, color = '#4f8cff', height = 6 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

export function VoiceVisualizer({ active = false }) {
  if (!active) return null
  return (
    <div className="flex items-center gap-[3px] h-6">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="voice-bar w-[3px] rounded-full"
          style={{ background: 'var(--color-accent)', animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

export function PulseDot({ color = '#4cd97b' }) {
  return (
    <span
      className="pulse-dot inline-block w-2 h-2 rounded-full"
      style={{ background: color }}
    />
  )
}
