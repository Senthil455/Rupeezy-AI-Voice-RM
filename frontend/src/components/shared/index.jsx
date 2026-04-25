// src/components/shared/ScoreRing.jsx
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
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-bold text-sm" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

// src/components/shared/LeadBadge.jsx
export function LeadBadge({ label }) {
  const config = {
    hot: { cls: 'badge-hot', emoji: '🔥', text: 'Hot' },
    warm: { cls: 'badge-warm', emoji: '🌡', text: 'Warm' },
    cold: { cls: 'badge-cold', emoji: '❄', text: 'Cold' },
    new: { cls: 'badge-new', emoji: '✨', text: 'New' },
    calling: { cls: 'badge-calling', emoji: '📞', text: 'Calling' },
    converted: { cls: 'badge-hot', emoji: '✅', text: 'Converted' },
  }
  const c = config[label] || config.new
  return (
    <span className={c.cls}>
      {c.emoji} {c.text}
    </span>
  )
}

// src/components/shared/KpiCard.jsx
export function KpiCard({ label, value, delta, deltaUp, accentColor, icon }) {
  return (
    <div className="card relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accentColor }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-400 text-xs mb-2">{label}</div>
          <div className="font-display font-extrabold text-2xl" style={{ color: accentColor || 'white' }}>
            {value}
          </div>
          {delta && (
            <div className={`text-xs mt-1.5 ${deltaUp ? 'text-success' : 'text-red-400'}`}>
              {deltaUp ? '↑' : '↓'} {delta}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-60">{icon}</div>
        )}
      </div>
    </div>
  )
}

// src/components/shared/ProgressBar.jsx
export function ProgressBar({ value, max = 100, color = '#4f8cff', height = 6 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="bg-white/[0.06] rounded-full overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

// src/components/shared/VoiceVisualizer.jsx
export function VoiceVisualizer({ active = false }) {
  if (!active) return null
  return (
    <div className="flex items-center gap-[3px] h-6">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="voice-bar w-[3px] bg-accent rounded-full"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

// src/components/shared/PulseDot.jsx
export function PulseDot({ color = '#4cd97b' }) {
  return (
    <span
      className="pulse-dot inline-block w-2 h-2 rounded-full"
      style={{ background: color }}
    />
  )
}
