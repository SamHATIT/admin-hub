import { useState } from 'react'
import { Container, Play, Square, RotateCw } from 'lucide-react'
import Modal from './Modal'
import { dockerAction } from '../services/api'
import { useToast } from './Toast'

const STATE_DOT = {
  running: 'bg-success',
  exited:  'bg-error',
  created: 'bg-bone-4',
  paused:  'bg-warning',
}

const STATE_TEXT = {
  running: 'text-success',
  exited:  'text-error',
  created: 'text-bone-4',
  paused:  'text-warning',
}

function DockerCard({ containers, onRefresh }) {
  const { addToast } = useToast()
  const [modal, setModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  if (!containers) {
    return (
      <div className="bg-ink-2 border border-bone/10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Container className="w-4 h-4 text-bone-4" />
          <h3 className="font-serif italic text-lg text-bone-3">Docker</h3>
          <span className="ml-auto font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">…</span>
        </div>
        <p className="font-mono text-[11px] text-bone-3 italic">Chargement…</p>
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
        addToast(`Docker ${action} ${containerName} : succès`, 'success')
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
      <div className="bg-ink-2 border border-bone/10 hover:border-brass/30 transition-colors">
        <div className="flex items-center justify-between gap-3 p-5 border-b border-bone/5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`w-2 h-2 rounded-full ${allUp ? 'bg-success' : 'bg-error'} flex-shrink-0`} />
            <Container className="w-3.5 h-3.5 text-brass flex-shrink-0" />
            <h3 className="font-serif italic text-lg text-bone truncate">Docker</h3>
          </div>
          <span className={`font-mono text-[10px] tracking-eyebrow uppercase tabular-nums ${allUp ? 'text-success' : 'text-warning'}`}>
            {running}/{total}
          </span>
        </div>

        <div className="divide-y divide-bone/5">
          {containers.map((c) => (
            <div key={c.name} className="px-5 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[c.state] || 'bg-bone-4'} flex-shrink-0`} />
                <span className="font-serif italic text-[15px] text-bone truncate flex-1">{c.name}</span>
                <span className={`font-mono text-[10px] tracking-eyebrow uppercase ${STATE_TEXT[c.state] || 'text-bone-4'} flex-shrink-0`}>
                  {c.state}
                </span>
              </div>
              <div className="font-mono text-[10px] text-bone-4 mb-1 truncate" title={c.image}>
                {c.image.length > 36 ? '…' + c.image.slice(-33) : c.image}
                {c.ports_display && c.ports_display !== '-' && (
                  <span className="ml-2 text-bone-3">· {c.ports_display}</span>
                )}
              </div>
              {c.state === 'running' && (
                <div className="font-mono text-[10px] text-bone-3 tabular-nums mb-2">
                  CPU {c.cpu} · RAM {c.mem_usage} ({c.mem_pct})
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {c.state === 'running' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction(c.name, 'restart')}
                      title="Restart"
                      className="inline-flex items-center justify-center w-7 h-7 text-warning border border-warning/30 hover:bg-warning/10 transition-colors"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(c.name, 'stop')}
                      title="Stop"
                      className="inline-flex items-center justify-center w-7 h-7 text-error border border-error/30 hover:bg-error/10 transition-colors"
                    >
                      <Square className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction(c.name, 'start')}
                    title="Start"
                    className="inline-flex items-center justify-center w-7 h-7 text-success border border-success/30 hover:bg-success/10 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-2.5 border-t border-bone/5 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">
          {total} container{total > 1 ? 's' : ''}
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
