import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getOllamaModels, getOllamaRunning, getOllamaMemory, ollamaUnload, ollamaDelete, ollamaPull } from '../services/api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

function OllamaDetail() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [models, setModels] = useState([])
  const [loaded, setLoaded] = useState([])
  const [memory, setMemory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [pullName, setPullName] = useState('')
  const [pulling, setPulling] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [modelsRes, runningRes, memRes] = await Promise.allSettled([
        getOllamaModels(),
        getOllamaRunning(),
        getOllamaMemory(),
      ])
      if (modelsRes.status === 'fulfilled') setModels(modelsRes.value.data.models || [])
      if (runningRes.status === 'fulfilled') setLoaded(runningRes.value.data.loaded || [])
      if (memRes.status === 'fulfilled') setMemory(memRes.value.data)
    } catch {
      addToast('Erreur chargement Ollama', 'error')
    }
  }, [addToast])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { navigate('/login'); return }
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll, navigate])

  const loadedNames = new Set(loaded.map(m => m.name))

  const handleUnload = (name) => {
    setModal({ type: 'unload', name, title: `Decharger ${name} de la RAM ?`, message: 'Le modele sera retire de la memoire. Il restera sur le disque.' })
  }

  const handleDelete = (name) => {
    setModal({ type: 'delete', name, title: `Supprimer ${name} du disque ?`, message: 'Le modele sera supprime definitivement. Il faudra le re-telecharger.' })
  }

  const handleConfirm = async () => {
    const { type, name } = modal
    setActionLoading(true)
    try {
      if (type === 'unload') {
        const res = await ollamaUnload(name)
        addToast(res.data.message || 'Modele decharge', 'success')
      } else if (type === 'delete') {
        // Unload first if loaded
        if (loadedNames.has(name)) await ollamaUnload(name)
        const res = await ollamaDelete(name)
        if (res.data.success) {
          addToast(res.data.message || 'Modele supprime', 'success')
        } else {
          addToast(res.data.error || 'Erreur suppression', 'error')
        }
      }
    } catch (err) {
      addToast(err.response?.data?.detail || err.message, 'error')
    } finally {
      setActionLoading(false)
      setModal(null)
      fetchAll()
    }
  }

  const handlePull = async (e) => {
    e.preventDefault()
    if (!pullName.trim()) return
    setPulling(true)
    addToast(`Telechargement de ${pullName} en cours...`, 'success')
    try {
      const res = await ollamaPull(pullName.trim())
      if (res.data.success) {
        addToast(res.data.message || 'Modele telecharge', 'success')
        setPullName('')
      } else {
        addToast(res.data.error || 'Erreur', 'error')
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Timeout ou erreur', 'error')
    } finally {
      setPulling(false)
      fetchAll()
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-screen">
          <span className="spinner large" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <header className="detail-header">
        <div className="detail-header-left">
          <Link to="/" className="back-link">{'\u2190'} Retour au dashboard</Link>
          <h1>Ollama - Gestion LLM</h1>
          <p>{models.length} modele{models.length > 1 ? 's' : ''} sur disque {'\u00B7'} {loaded.length} charge{loaded.length > 1 ? 's' : ''} en RAM</p>
        </div>
        <div className="detail-header-actions">
          <a href="http://72.61.161.222:3200" target="_blank" rel="noopener noreferrer" className="btn btn-openwebui">
            {'\uD83D\uDCAC'} Open WebUI
          </a>
          <button className="btn btn-refresh" onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)) }}>
            {'\uD83D\uDD04'} Rafraichir
          </button>
        </div>
      </header>

      {/* RAM Usage */}
      {memory && (
        <div className="ollama-memory-section">
          <h2>Memoire Serveur</h2>
          <div className="memory-bar-container">
            <div className="memory-bar">
              <div className="memory-bar-fill" style={{ width: `${memory.usage_pct}%` }} />
            </div>
            <div className="memory-labels">
              <span>Utilise : {memory.used_display} ({memory.usage_pct}%)</span>
              <span>Disponible : {memory.available_display}</span>
              <span>Total : {memory.total_display}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loaded in RAM */}
      <div className="ollama-section">
        <h2>{'\uD83D\uDFE2'} Charges en memoire ({loaded.length})</h2>
        {loaded.length === 0 ? (
          <p className="ollama-empty">Aucun modele charge en RAM. La memoire est libre.</p>
        ) : (
          <div className="ollama-loaded-grid">
            {loaded.map((m) => (
              <div key={m.name} className="ollama-loaded-card">
                <div className="loaded-top">
                  <span className="model-icon">{'\uD83E\uDDE0'}</span>
                  <strong>{m.name}</strong>
                  <span className="loaded-size">{m.size_display}</span>
                </div>
                <div className="loaded-meta">
                  <span>Processeur : {m.processor}</span>
                  {m.expires_at && <span>Expire : {formatDate(m.expires_at)}</span>}
                </div>
                <button className="btn btn-unload" onClick={() => handleUnload(m.name)}>
                  {'\u23CF\uFE0F'} Decharger de la RAM
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Downloaded models */}
      <div className="ollama-section">
        <h2>{'\uD83D\uDCBE'} Modeles sur disque ({models.length})</h2>
        <div className="detail-table-wrapper">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Modele</th>
                <th>Taille</th>
                <th>Modifie</th>
                <th>En RAM</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.length === 0 && (
                <tr><td colSpan="5" className="table-empty">Aucun modele trouve</td></tr>
              )}
              {models.map((m) => {
                const isLoaded = loadedNames.has(m.name)
                return (
                  <tr key={m.name}>
                    <td>
                      <div className="model-name">
                        <span className="model-icon">{'\uD83E\uDDE0'}</span>
                        <strong>{m.name}</strong>
                      </div>
                    </td>
                    <td><span className="model-size">{m.size_display}</span></td>
                    <td className="cell-date">{formatDate(m.modified_at)}</td>
                    <td>
                      {isLoaded ? (
                        <span className="ram-badge loaded">{'\uD83D\uDFE2'} Oui</span>
                      ) : (
                        <span className="ram-badge not-loaded">{'\u26AA'} Non</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {isLoaded && (
                          <button className="btn-mini btn-warning" onClick={() => handleUnload(m.name)} title="Decharger de la RAM">
                            {'\u23CF\uFE0F'}
                          </button>
                        )}
                        <button className="btn-mini btn-danger" onClick={() => handleDelete(m.name)} title="Supprimer du disque">
                          {'\uD83D\uDDD1\uFE0F'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pull new model */}
      <div className="ollama-section">
        <h2>{'\u2B07\uFE0F'} Telecharger un modele</h2>
        <form className="pull-form" onSubmit={handlePull}>
          <input
            type="text"
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            placeholder="Ex: llama3.2, phi3, gemma2:2b..."
            className="pull-input"
            disabled={pulling}
          />
          <button type="submit" className="btn btn-confirm" disabled={pulling || !pullName.trim()}>
            {pulling ? <><span className="spinner" /> Telechargement...</> : <>{'\u2B07\uFE0F'} Telecharger</>}
          </button>
        </form>
        <p className="pull-hint">
          Voir les modeles disponibles sur <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">ollama.com/library</a>
        </p>
      </div>

      <Modal
        isOpen={!!modal}
        title={modal?.title || ''}
        message={modal?.message || ''}
        onConfirm={handleConfirm}
        onCancel={() => setModal(null)}
        loading={actionLoading}
      />
    </div>
  )
}

export default OllamaDetail
