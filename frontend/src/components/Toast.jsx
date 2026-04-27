import { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

let toastId = 0

const ICON = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
}

const ACCENT = {
  success: 'border-success/40 text-success',
  error:   'border-error/40 text-error',
  info:    'border-bone/20 text-bone-3',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => {
          const Icon = ICON[toast.type] || Info
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 bg-ink-2 border ${ACCENT[toast.type] || ACCENT.info} px-4 py-3 shadow-lg`}
              role="alert"
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="font-mono text-[12px] text-bone-2 flex-1 leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-bone-4 hover:text-bone transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
