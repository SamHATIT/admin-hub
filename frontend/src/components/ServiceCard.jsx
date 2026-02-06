import { useState } from 'react'
import ActionButton from './ActionButton'
import Modal from './Modal'
import LogViewer from './LogViewer'
import { serviceAction } from '../services/api'
import { useToast } from './Toast'

const STATUS_CLASS = {
  up: 'status-up',
  down: 'status-down',
  unknown: 'status-unknown',
}

const STATUS_LABEL = {
  up: 'UP',
  down: 'DOWN',
  unknown: '...',
}

function ServiceCard({ service, details, onRefresh }) {
  const { addToast } = useToast()
  const [modal, setModal] = useState(null) // { action }
  const [actionLoading, setActionLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const {
    name, label, port, status, response_time_ms,
    actions = [], link, has_logs,
  } = service

  const allActions = [...actions, ...(has_logs ? ['logs'] : [])]

  const handleActionClick = (action) => {
    if (action === 'logs') {
      setShowLogs(true)
      return
    }
    setModal({ action })
  }

  const handleConfirm = async () => {
    const action = modal.action
    setActionLoading(true)
    try {
      const res = await serviceAction(name, action)
      const result = res.data.result
      if (result.success || result.return_code === 0) {
        addToast(`${label} : ${action} effectue avec succes`, 'success')
      } else {
        addToast(`${label} : ${result.stderr || 'Erreur inconnue'}`, 'error')
      }
    } catch (err) {
      addToast(
        `${label} : ${err.response?.data?.detail || err.message}`,
        'error'
      )
    } finally {
      setActionLoading(false)
      setModal(null)
      if (onRefresh) onRefresh()
    }
  }

  return (
    <>
      <div className={`service-card ${STATUS_CLASS[status] || 'status-unknown'}`}>
        <div className="card-header">
          <span className={`status-dot ${status}`} />
          <h3 className="card-title">{label}</h3>
          <span className="status-badge">{STATUS_LABEL[status] || '?'}</span>
        </div>

        {port && (
          <div className="card-meta">
            <span className="meta-port">Port {port}</span>
            {response_time_ms != null && (
              <span className="meta-latency">{response_time_ms}ms</span>
            )}
          </div>
        )}

        {details && <div className="card-details">{details}</div>}

        <div className="card-actions">
          {allActions.map((action) => (
            <ActionButton
              key={action}
              action={action}
              serviceLabel={label}
              port={port}
              onClick={handleActionClick}
              disabled={actionLoading}
            />
          ))}
        </div>

        {link && (
          <a
            className="card-link"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {'\uD83D\uDD17'} Ouvrir
          </a>
        )}
      </div>

      <Modal
        isOpen={!!modal}
        title={`Voulez-vous vraiment ${modal?.action} ${label} ?`}
        message="Cette action peut prendre 10-15 secondes."
        onConfirm={handleConfirm}
        onCancel={() => setModal(null)}
        loading={actionLoading}
      />

      {showLogs && (
        <LogViewer
          serviceName={name}
          serviceLabel={label}
          onClose={() => setShowLogs(false)}
        />
      )}
    </>
  )
}

export default ServiceCard
