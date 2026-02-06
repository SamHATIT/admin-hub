import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getN8nWorkflows, getN8nExecutions, toggleN8nWorkflow } from '../services/api'
import { useToast } from '../components/Toast'

function N8nDetail() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [workflows, setWorkflows] = useState([])
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null) // workflow id being toggled
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

  const handleToggle = async (wf) => {
    const newState = !wf.active
    setToggling(wf.id)
    try {
      await toggleN8nWorkflow(wf.id, newState)
      addToast(
        `${wf.name} : ${newState ? 'active' : 'desactive'}`,
        'success'
      )
      await fetchWorkflows()
    } catch (err) {
      addToast(
        `Erreur toggle ${wf.name} : ${err.response?.data?.detail || err.message}`,
        'error'
      )
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
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const activeCount = workflows.filter((w) => w.active).length

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-screen">
          <span className="spinner large" />
          <p>Chargement des workflows...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <header className="detail-header">
        <div className="detail-header-left">
          <Link to="/" className="back-link">{'\u2190'} Retour au dashboard</Link>
          <h1>N8N Workflows</h1>
          <p>{workflows.length} workflow{workflows.length > 1 ? 's' : ''} &middot; {activeCount} actif{activeCount > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-refresh" onClick={() => { setLoading(true); fetchWorkflows().finally(() => setLoading(false)) }}>
          {'\uD83D\uDD04'} Rafraichir
        </button>
      </header>

      <div className="detail-table-wrapper">
        <table className="detail-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Etat</th>
              <th>Derniere modification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.length === 0 && (
              <tr><td colSpan="4" className="table-empty">Aucun workflow trouve</td></tr>
            )}
            {workflows.map((wf) => (
              <>
                <tr key={wf.id} className={selectedWf === wf.id ? 'row-selected' : ''}>
                  <td>
                    <button
                      className="wf-name-btn"
                      onClick={() => handleSelectWorkflow(wf)}
                      title="Voir les dernieres executions"
                    >
                      {wf.name}
                      <span className="wf-expand">{selectedWf === wf.id ? '\u25B2' : '\u25BC'}</span>
                    </button>
                  </td>
                  <td>
                    <span className={`badge ${wf.active ? 'badge-active' : 'badge-inactive'}`}>
                      {wf.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="cell-date">{formatDate(wf.updated_at || wf.created_at)}</td>
                  <td>
                    <button
                      className={`toggle-btn ${wf.active ? 'toggle-off' : 'toggle-on'}`}
                      onClick={() => handleToggle(wf)}
                      disabled={toggling === wf.id}
                      title={wf.active ? 'Desactiver ce workflow' : 'Activer ce workflow'}
                    >
                      {toggling === wf.id ? (
                        <span className="spinner" />
                      ) : wf.active ? (
                        '\u23F8 Desactiver'
                      ) : (
                        '\u25B6 Activer'
                      )}
                    </button>
                  </td>
                </tr>
                {selectedWf === wf.id && (
                  <tr key={`${wf.id}-exec`} className="exec-row">
                    <td colSpan="4">
                      <div className="exec-panel">
                        <h4>Dernieres executions</h4>
                        {executions.length === 0 ? (
                          <p className="exec-empty">Aucune execution recente</p>
                        ) : (
                          <table className="exec-table">
                            <thead>
                              <tr>
                                <th>Statut</th>
                                <th>Debut</th>
                                <th>Fin</th>
                                <th>Duree</th>
                              </tr>
                            </thead>
                            <tbody>
                              {executions.map((ex) => {
                                const duration = ex.started_at && ex.finished_at
                                  ? Math.round((new Date(ex.finished_at) - new Date(ex.started_at)) / 1000)
                                  : null
                                return (
                                  <tr key={ex.id}>
                                    <td>
                                      <span className={`badge ${ex.status === 'success' ? 'badge-active' : ex.status === 'error' ? 'badge-error' : 'badge-inactive'}`}>
                                        {ex.status}
                                      </span>
                                    </td>
                                    <td className="cell-date">{formatDate(ex.started_at)}</td>
                                    <td className="cell-date">{formatDate(ex.finished_at)}</td>
                                    <td>{duration != null ? `${duration}s` : '-'}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default N8nDetail
