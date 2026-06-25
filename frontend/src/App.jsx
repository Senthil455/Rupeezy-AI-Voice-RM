import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/shared/Sidebar.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { AgentDemo } from './pages/AgentDemo.jsx'
import { LeadPipeline } from './pages/AllPages.jsx'
import { Upload } from './pages/AllPages.jsx'
import { Analytics } from './pages/AllPages.jsx'
import { RMHandoff } from './pages/AllPages.jsx'
import { ObjectionBank } from './pages/AllPages.jsx'
import { Settings } from './pages/AllPages.jsx'
import { analyticsApi } from './services/api.js'

function TopBar({ title }) {
  return (
    <div className="h-14 bg-surface border-b border-white/[0.06] flex items-center px-6 sticky top-0 z-40">
      <div className="font-display font-semibold text-sm text-slate-300">{title}</div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-green-400/80 bg-green-500/8 px-3 py-1.5 rounded-lg border border-green-500/15"
          style={{ background: 'rgba(76, 217, 123, 0.08)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot inline-block" />
          Agent Active
        </div>
        <div
          className="text-xs text-accent px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 border border-accent/20 hover:bg-accent/10"
          style={{ background: 'rgba(79, 140, 255, 0.06)' }}
          onClick={() => window.location.href = '/agent'}
        >
          Live Demo
        </div>
      </div>
    </div>
  )
}

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/agent': 'Agent Demo',
  '/leads': 'Lead Pipeline',
  '/upload': 'Upload Leads',
  '/analytics': 'Analytics',
  '/handoff': 'RM Handoff',
  '/objections': 'Objection Bank',
  '/settings': 'Settings',
}

export default function App() {
  const [stats, setStats] = useState(null)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    analyticsApi.snapshot().then(setStats).catch(() => {})
    const interval = setInterval(() => {
      analyticsApi.snapshot().then(setStats).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleNav = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handleNav)
    return () => window.removeEventListener('popstate', handleNav)
  }, [])

  const title = PAGE_TITLES[currentPath] || 'Rupeezy'

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg">
        <Sidebar stats={stats} />
        <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
          <TopBar title={title} />
          <main className="flex-1 p-6 overflow-y-auto">
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
