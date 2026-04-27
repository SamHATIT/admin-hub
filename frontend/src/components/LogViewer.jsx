import { useState, useEffect, useRef } from 'react'
import { RefreshCw, X, Loader2 } from 'lucide-react'
import { serviceAction } from '../services/api'

function LogViewer({ serviceName, serviceLabel, onClose }) {
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { fetchLogs() }, [serviceName])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const fetchLogs = async () => {
    setLoading(true); setError(null)
    try {
      const res = await serviceAction(serviceName, 'logs')
      if (res.data.success) setLines(res.data.lines)
      else setError(res.data.error || 'Impossible de lire les logs')
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-ink-2 border border-brass/30 w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 p-5 border-b border-bone/10">
          <div>
            <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-1">Logs</p>
            <h3 className="font-serif italic text-2xl text-bone">{serviceLabel}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone border border-bone/10 hover:border-brass/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-bone-4 hover:text-bone transition-colors p-1"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-ink p-5 font-mono text-[11px] leading-[1.6]">
          {loading && (
            <p className="text-bone-3 italic flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Chargement…
            </p>
          )}
          {error && <p className="text-error">{error}</p>}
          {!loading && !error && lines.length === 0 && (
            <p className="text-bone-3 italic">Aucune ligne de log</p>
          )}
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-bone-4 tabular-nums select-none flex-shrink-0 w-10 text-right">{i + 1}</span>
              <span className="text-bone-2 whitespace-pre-wrap break-all">{line}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

export default LogViewer
