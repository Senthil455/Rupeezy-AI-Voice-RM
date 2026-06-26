import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard.jsx'
import { AgentDemo } from './pages/AgentDemo.jsx'
import { LeadPipeline, Upload, Analytics, RMHandoff, ObjectionBank, Settings } from './pages/AllPages.jsx'
import { analyticsApi } from './services/api.js'
import { ToastProvider } from './components/shared/Toast.jsx'
import { LayoutDashboard, Users, Mic2, BarChart3, PhoneForwarded, Upload as UploadIcon, Settings as SettingsIcon, Shield, Zap, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent', icon: Mic2, label: 'AI Agent' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/upload', icon: UploadIcon, label: 'Import' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/handoff', icon: PhoneForwarded, label: 'Handoff' },
  { to: '/objections', icon: Shield, label: 'Objections' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
]

function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-sidebar z-50 flex flex-col">
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-sm text-white">Rupeezy</div>
          <div className="text-[10px] text-slate-500 tracking-wider">AI Voice RM</div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
          <span className="text-xs text-slate-400">All systems online</span>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleNav = () => { setCurrentPath(window.location.pathname); setMobileOpen(false) }
    window.addEventListener('popstate', handleNav)
    return () => window.removeEventListener('popstate', handleNav)
  }, [])

  const titles = {
    '/': 'Dashboard', '/agent': 'AI Agent', '/leads': 'Lead Pipeline',
    '/upload': 'Import Leads', '/analytics': 'Analytics',
    '/handoff': 'RM Handoff', '/objections': 'Objection Bank', '/settings': 'Settings',
  }
  const title = titles[currentPath] || 'Rupeezy'

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />

        <div className="flex-1 ml-60">
          <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-slate-400 hover:text-slate-600">
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <h1 className="font-display font-semibold text-lg text-slate-800">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                AI Online
              </div>
              <a href="/agent" className="btn-primary text-xs !py-1.5 !px-3">Live Demo</a>
            </div>
          </header>

          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agent" element={<AgentDemo />} />
              <Route path="/leads" element={<LeadPipeline />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/handoff" element={<RMHandoff />} />
              <Route path="/objections" element={<ObjectionBank />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
