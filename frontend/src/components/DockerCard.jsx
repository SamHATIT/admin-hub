import { useState } from 'react'
import Modal from './Modal'
import { dockerAction } from '../services/api'
import { useToast } from './Toast'

const STATE_DOT = {
  running: 'up',
  exited: 'down',
  created: 'unknown',
  paused: 'unknown',
}

function DockerCard({ containers, onRefresh }) {
  const { addToast } = useToast()
  const [modal, setModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  if (!containers) {
    return (
      <div className="service-card status-unknown docker-card">
        <div className="card-header">
          <span className="status-dot unknown" />
          <h3 className="card-title">Docker</h3>
          <span className="status-badge">...</span>
        </div>
        <div className="card-details"><p>Chargement...</p></div>
      </div>
    )
  }

  const running = containers.filter((c) => c.state === 'running').length
  const total = containers.length
  const allUp = running === total

  const handleAction = (containerName, action) => {
    setModal({ containerName, action })
  }

  const handleConfirm = async () => {
    const { containerName, action } = modal
    setActionLoading(true)
    try {
      const res = await dockerAction(containerName, action)
      if (res.data.result.success) {
        addToast(`Docker ${action} ${containerName} : succes`, 'success')
      } else {
        addToast(`Docker ${containerName} : ${res.data.result.stderr || 'Erreur'}`, 'error')
      }
    } catch (err) {
      addToast(`Docker erreur : ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
      setModal(null)
      if (onRefresh) onRefresh()
    }
  }

  return (
    <>
      <div className={`service-card ${allUp ? 'status-up' : 'status-down'} docker-card`}>
        <div className="card-header">
          <span className={`status-dot ${allUp ? 'up' : 'down'}`} />
          <h3 className="card-title">{'\uD83D\uDC33'} Docker</h3>
          <span className="status-badge">{running}/{total}</span>
        </div>

        <div className="docker-containers">
          {containers.map((c) => (
            <div key={c.name} className={`docker-container-row ${c.state}`}>
              <div className="docker-row-top">
                <span className={`status-dot small ${STATE_DOT[c.state] || 'unknown'}`} />
                <span className="docker-name">{c.name}</span>
                <span className="docker-state-badge">{c.state}</span>
              </div>
              <div className="docker-row-meta">
                <span className="docker-image" title={c.image}>
                  {c.image.length > 30 ? '...' + c.image.slice(-27) : c.image}
                </span>
                {c.ports_display !== '-' && (
                  <span className="docker-ports">{c.ports_display}</span>
                )}
              </div>
              {c.state === 'running' && (
                <div className="docker-row-stats">
                  <span>CPU: {c.cpu}</span>
                  <span>RAM: {c.mem_usage}</span>
                  <span>({c.mem_pct})</span>
                </div>
              )}
              <div className="docker-row-actions">
                {c.state === 'running' ? (
                  <>
                    <button className="btn-mini btn-warning" onClick={() => handleAction(c.name, 'restart')} title="Restart">
                      {'\uD83D\uDD04'}
                    </button>
                    <button className="btn-mini btn-danger" onClick={() => handleAction(c.name, 'stop')} title="Stop">
                      {'\uD83D\uDED1'}
                    </button>
                  </>
                ) : (
                  <button className="btn-mini btn-success" onClick={() => handleAction(c.name, 'start')} title="Start">
                    {'\uD83D\uDE80'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card-meta">
          <span className="meta-port">{total} container{total > 1 ? 's' : ''}</span>
        </div>
      </div>

      <Modal
        isOpen={!!modal}
        title={`Docker : ${modal?.action} ${modal?.containerName} ?`}
        message="Cette action affecte le container Docker."
        onConfirm={handleConfirm}
        onCancel={() => setModal(null)}
        loading={actionLoading}
      />
    </>
  )
}

export default DockerCard
