import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Search } from 'lucide-react'
import ActionButton from './ActionButton'
import Modal from './Modal'
import LogViewer from './LogViewer'
import { serviceAction } from '../services/api'
import { useToast } from './Toast'

const STATUS_DOT = {
  up:      'bg-success',
  down:    'bg-error',
  unknown: 'bg-bone-4',
}

const STATUS_LABEL = {
  up:      'UP',
  down:    'DOWN',
  unknown: '…',
}

const STATUS_TEXT = {
  up:      'text-success',
  down:    'text-error',
  unknown: 'text-bone-4',
}

function ServiceCard({ service, details, onRefresh, detailsLink }) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [modal, setModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const {
    name, label, port, status, response_time_ms,
    actions = [], link, has_logs,
  } = service

  const allActions = [...actions, ...(has_logs ? ['logs'] : [])]

  const handleActionClick = (action) => {
    if (action === 'logs') { setShowLogs(true); return }
    setModal({ action })
  }

  const handleConfirm = async () => {
    const action = modal.action
    setActionLoading(true)
    try {
      const res = await serviceAction(name, action)
      const result = res.data.result
      if (result.success || result.return_code === 0) {
        addToast(`${label} : ${action} effectué`, 'success')
      } else {
        addToast(`${label} : ${result.stderr || 'Erreur inconnue'}`, 'error')
      }
    } catch (err) {
      addToast(`${label} : ${err.response?.data?.detail || err.message}`, 'error')
    } finally {
      setActionLoading(false)
      setModal(null)
      if (onRefresh) onRefresh()
    }
  }

  const dot = STATUS_DOT[status] || STATUS_DOT.unknown
  const txt = STATUS_TEXT[status] || STATUS_TEXT.unknown

  return (
    <>
      <div className="bg-ink-2 border border-bone/10 hover:border-brass/30 transition-colors flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-bone/5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
            <h3 className="font-serif italic text-lg text-bone truncate">{label}</h3>
          </div>
          <span className={`font-mono text-[10px] tracking-eyebrow uppercase ${txt} flex-shrink-0`}>
            {STATUS_LABEL[status] || '?'}
          </span>
        </div>

        {/* Meta line */}
        {(port || response_time_ms != null) && (
          <div className="px-5 py-2.5 flex items-center gap-4 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 border-b border-bone/5">
            {port && <span>Port {port}</span>}
            {response_time_ms != null && <span className="tabular-nums">{response_time_ms} ms</span>}
          </div>
        )}

        {/* Details */}
        {details && (
          <div className="px-5 py-3 font-mono text-[11px] text-bone-3 leading-relaxed border-b border-bone/5 [&>p]:mb-1 [&>p:last-child]:mb-0">
            {details}
          </div>
        )}

        {/* Actions */}
        <div className="flex-1 px-5 py-3 flex flex-wrap gap-2">
          {allActions.map((action) => (
            <ActionButton
              key={action}
              action={action}
              onClick={handleActionClick}
              disabled={actionLoading}
            />
          ))}
        </div>

        {/* Footer links */}
        {(detailsLink || link) && (
          <div className="px-5 py-3 border-t border-bone/5 flex items-center gap-4">
            {detailsLink && (
              <button
                type="button"
                onClick={() => navigate(detailsLink)}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 hover:text-brass transition-colors"
              >
                <Search className="w-3 h-3" />
                Détails
              </button>
            )}
            {link && (
              status === 'up' ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 ml-auto font-mono text-[10px] tracking-eyebrow uppercase text-brass hover:text-bone transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ouvrir
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 ml-auto font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 cursor-not-allowed" title="Service arrêté">
                  <ExternalLink className="w-3 h-3" />
                  Ouvrir
                </span>
              )
            )}
          </div>
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
