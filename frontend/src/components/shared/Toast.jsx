import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div key={toast.id}
            className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-up"
            style={{
              background: toast.type === 'success' ? '#f0fdf4' : toast.type === 'error' ? '#fef2f2' : toast.type === 'warning' ? '#fffbeb' : '#eff6ff',
              borderColor: toast.type === 'success' ? '#bbf7d0' : toast.type === 'error' ? '#fecaca' : toast.type === 'warning' ? '#fde68a' : '#bfdbfe',
            }}>
            {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              : toast.type === 'error' ? <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              : toast.type === 'warning' ? <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
              : <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />}
            <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
