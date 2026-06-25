import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Mic2, BarChart3,
  PhoneForwarded, Upload, Settings, Zap, Shield
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent', icon: Mic2, label: 'Agent Demo' },
  { to: '/leads', icon: Users, label: 'Lead Pipeline' },
  { to: '/upload', icon: Upload, label: 'Upload Leads' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/handoff', icon: PhoneForwarded, label: 'RM Handoff' },
  { to: '/objections', icon: Shield, label: 'Objection Bank' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ stats }) {
  const location = useLocation()

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-surface border-r border-white/[0.06] flex flex-col z-50">
      <div className="p-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-white">Rupeezy</div>
            <div className="text-[10px] text-slate-500 tracking-wider uppercase">AI Voice RM</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            <Icon size={16} strokeWidth={location.pathname === to ? 2.5 : 1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(76, 217, 123, 0.06)', border: '1px solid rgba(76, 217, 123, 0.12)' }}>
            <div className="font-display font-bold text-lg text-success">
              {stats?.conversion_rate ?? '—'}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Conv. Rate</div>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(79, 140, 255, 0.06)', border: '1px solid rgba(79, 140, 255, 0.12)' }}>
            <div className="font-display font-bold text-lg text-white">
              {stats?.total_leads ?? '—'}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Leads</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
