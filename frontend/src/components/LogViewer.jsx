import { useState, useEffect, useRef } from 'react'
import { serviceAction } from '../services/api'

function LogViewer({ serviceName, serviceLabel, onClose }) {
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchLogs()
  }, [serviceName])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lines])

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await serviceAction(serviceName, 'logs')
      if (res.data.success) {
        setLines(res.data.lines)
      } else {
        setError(res.data.error || 'Impossible de lire les logs')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="log-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="log-header">
          <h3>Logs - {serviceLabel}</h3>
          <div className="log-actions">
            <button className="btn btn-cancel" onClick={fetchLogs} disabled={loading}>
              {'\uD83D\uDD04'} Rafraichir
            </button>
            <button className="btn btn-cancel" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
        <div className="log-content">
          {loading && <p className="log-loading">Chargement...</p>}
          {error && <p className="log-error">{error}</p>}
          {!loading && !error && lines.length === 0 && (
            <p className="log-empty">Aucune ligne de log</p>
          )}
          {lines.map((line, i) => (
            <div key={i} className="log-line">
              <span className="log-num">{i + 1}</span>
              <span className="log-text">{line}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

export default LogViewer
