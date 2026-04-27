import { useState, useEffect, useCallback, Fragment } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Loader2, Play, Pause,
} from 'lucide-react'
import { getN8nWorkflows, getN8nExecutions, toggleN8nWorkflow } from '../services/api'
import { useToast } from '../components/Toast'

function N8nDetail() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [workflows, setWorkflows] = useState([])
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [selectedWf, setSelectedWf] = useState(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await getN8nWorkflows()
      setWorkflows(res.data.workflows || [])
    } catch {
      addToast('Impossible de charger les workflows N8N', 'error')
    }
  }, [addToast])

  const fetchExecutions = useCallback(async (workflowId) => {
    try {
      const res = await getN8nExecutions(workflowId, 10)
      setExecutions(res.data.executions || [])
    } catch {
      setExecutions([])
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { navigate('/login'); return }
    setLoading(true)
    fetchWorkflows().finally(() => setLoading(false))
  }, [fetchWorkflows, navigate])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWorkflows()
    setRefreshing(false)
  }

  const handleToggle = async (wf) => {
    const newState = !wf.active
    setToggling(wf.id)
    try {
      await toggleN8nWorkflow(wf.id, newState)
      addToast(`${wf.name} : ${newState ? 'activé' : 'désactivé'}`, 'success')
      await fetchWorkflows()
    } catch (err) {
      addToast(`Erreur toggle ${wf.name} : ${err.response?.data?.detail || err.message}`, 'error')
    } finally {
      setToggling(null)
    }
  }

  const handleSelectWorkflow = (wf) => {
    if (selectedWf === wf.id) {
      setSelectedWf(null)
      setExecutions([])
    } else {
      setSelectedWf(wf.id)
      fetchExecutions(wf.id)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return dateStr }
  }

  const activeCount = workflows.filter((w) => w.active).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-brass animate-spin" />
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-3">
            Chargement des workflows…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink text-bone">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-ink-2/95 backdrop-blur-md border-b border-brass/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 hover:text-brass transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Console
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone border border-bone/10 hover:border-brass/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Rafraîchir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Hero */}
        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-4 mb-3">
            № 02 · N8N
          </p>
          <h1 className="font-serif italic text-4xl md:text-5xl text-bone leading-[1.05] mb-2">
            Workflows.
          </h1>
          <p className="font-mono text-[12px] text-bone-3 tabular-nums">
            {workflows.length} workflow{workflows.length > 1 ? 's' : ''} · {activeCount} actif{activeCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        <div className="bg-ink-2 border border-bone/10 overflow-hidden">
          {workflows.length === 0 ? (
            <p className="font-mono text-[12px] text-bone-3 italic p-8 text-center">
              Aucun workflow trouvé
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-bone/10">
                  <th className="text-left px-5 py-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">Nom</th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">État</th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal hidden md:table-cell">Modifié</th>
                  <th className="text-right px-5 py-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => (
                  <Fragment key={wf.id}>
                    <tr className={`border-b border-bone/5 hover:bg-ink-3/40 transition-colors ${selectedWf === wf.id ? 'bg-ink-3/40' : ''}`}>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleSelectWorkflow(wf)}
                          className="inline-flex items-center gap-2 font-serif italic text-[15px] text-bone hover:text-brass transition-colors text-left"
                        >
                          <span>{wf.name}</span>
                          {selectedWf === wf.id ? <ChevronUp className="w-3 h-3 text-bone-4 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-bone-4 flex-shrink-0" />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-eyebrow uppercase ${wf.active ? 'text-success' : 'text-bone-4'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${wf.active ? 'bg-success' : 'bg-bone-4'}`} />
                          {wf.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-bone-3 tabular-nums hidden md:table-cell">
                        {formatDate(wf.updated_at || wf.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggle(wf)}
                          disabled={toggling === wf.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-eyebrow uppercase border transition-colors disabled:opacity-50 ${
                            wf.active
                              ? 'text-warning border-warning/30 hover:bg-warning/10'
                              : 'text-success border-success/30 hover:bg-success/10'
                          }`}
                        >
                          {toggling === wf.id ? <Loader2 className="w-3 h-3 animate-spin" />
                            : wf.active ? <><Pause className="w-3 h-3" />Désactiver</>
                            : <><Play className="w-3 h-3" />Activer</>}
                        </button>
                      </td>
                    </tr>
                    {selectedWf === wf.id && (
                      <tr className="bg-ink/40 border-b border-bone/5">
                        <td colSpan={4} className="px-5 py-5">
                          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-brass mb-3">
                            Dernières exécutions
                          </p>
                          {executions.length === 0 ? (
                            <p className="font-mono text-[11px] text-bone-3 italic">
                              Aucune exécution récente
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-bone/10">
                                    <th className="text-left py-2 px-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">Statut</th>
                                    <th className="text-left py-2 px-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">Début</th>
                                    <th className="text-left py-2 px-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">Fin</th>
                                    <th className="text-right py-2 px-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 font-normal">Durée</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {executions.map((ex) => {
                                    const duration = ex.started_at && ex.finished_at
                                      ? Math.round((new Date(ex.finished_at) - new Date(ex.started_at)) / 1000)
                                      : null
                                    const tone = ex.status === 'success' ? 'text-success' : ex.status === 'error' ? 'text-error' : 'text-bone-4'
                                    const dot = ex.status === 'success' ? 'bg-success' : ex.status === 'error' ? 'bg-error' : 'bg-bone-4'
                                    return (
                                      <tr key={ex.id} className="border-b border-bone/5 last:border-0">
                                        <td className="py-2 px-3">
                                          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-eyebrow uppercase ${tone}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                            {ex.status}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[11px] text-bone-3 tabular-nums">{formatDate(ex.started_at)}</td>
                                        <td className="py-2 px-3 font-mono text-[11px] text-bone-3 tabular-nums">{formatDate(ex.finished_at)}</td>
                                        <td className="py-2 px-3 text-right font-mono text-[11px] text-bone-2 tabular-nums">
                                          {duration != null ? `${duration}s` : '—'}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

export default N8nDetail
