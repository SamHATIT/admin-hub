import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  getOllamaModels,
  getOllamaRunning,
  getOllamaMemory,
  ollamaUnload,
  ollamaDelete,
  ollamaPull,
} from '../services/api'
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

  const handleUnload = (name) => {
    setModal({
      title: `Decharger ${name} de la memoire ?`,
      message: 'Le modele sera retire de la RAM mais restera sur le disque.',
      onConfirm: async () => {
        setActionLoading(true)
        try {
          const res = await ollamaUnload(name)
          if (res.data.success) {
            addToast(`${name} decharge de la memoire`, 'success')
          } else {
            addToast(res.data.error || 'Erreur', 'error')
          }
        } catch (err) {
          addToast(err.response?.data?.detail || 'Erreur', 'error')
        }
        setActionLoading(false)
        setModal(null)
        fetchAll()
      },
    })
  }

  const handleDelete = (name) => {
    setModal({
      title: `Supprimer ${name} du disque ?`,
      message: 'Le modele sera definitivement supprime. Il faudra le retelecharger si besoin.',
      onConfirm: async () => {
        setActionLoading(true)
        try {
          const res = await ollamaDelete(name)
          if (res.data.success) {
            addToast(`${name} supprime`, 'success')
          } else {
            addToast(res.data.error || 'Erreur', 'error')
          }
        } catch (err) {
          addToast(err.response?.data?.detail || 'Erreur', 'error')
        }
        setActionLoading(false)
        setModal(null)
        fetchAll()
      },
    })
  }

  const handlePull = async () => {
    if (!pullName.trim()) return
    setPulling(true)
    addToast(`Telechargement de ${pullName} en cours...`, 'success')
    try {
      const res = await ollamaPull(pullName.trim())
      if (res.data.success) {
        addToast(`${pullName} telecharge avec succes !`, 'success')
        setPullName('')
        fetchAll()
      } else {
        addToast(res.data.error || 'Erreur telechargement', 'error')
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Erreur telechargement', 'error')
    }
    setPulling(false)
  }

  const isModelLoaded = (name) => loaded.some((l) => l.name === name)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-screen">
          <span className="spinner large" />
          <p>Chargement Ollama...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <header className="detail-header">
        <div className="detail-header-left">
          <Link to="/" className="back-link">{'\u2190'} Retour au dashboard</Link>
          <h1>Ollama - Gestion des LLM</h1>
          <p>{models.length} modele{models.length > 1 ? 's' : ''} sur le disque {'\u00B7'} {loaded.length} charge{loaded.length > 1 ? 's' : ''} en memoire</p>
        </div>
        <div className="detail-header-actions">
          <a href="https://ollama.digital-humans.fr" target="_blank" rel="noopener noreferrer" className="btn btn-open-webui">
            {'\uD83C\uDF10'} Open WebUI
          </a>
          <button className="btn btn-refresh" onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)) }}>
            {'\uD83D\uDD04'} Rafraichir
          </button>
        </div>
      </header>

      {/* RAM Usage */}
      {memory && (
        <div className="ollama-ram-section">
          <h2>Memoire Serveur</h2>
          <div className="ram-bar-container">
            <div className="ram-bar">
              <div className="ram-bar-used" style={{ width: `${memory.usage_pct}%` }} />
            </div>
            <div className="ram-stats">
              <span>Utilise : {memory.used_display}</span>
              <span>Disponible : {memory.available_display}</span>
              <span>Total : {memory.total_display}</span>
              <span className={`ram-pct ${memory.usage_pct > 80 ? 'danger' : memory.usage_pct > 60 ? 'warning' : 'ok'}`}>
                {memory.usage_pct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loaded in RAM */}
      <div className="ollama-section">
        <h2>{'\uD83D\uDFE2'} Modeles charges en memoire ({loaded.length})</h2>
        {loaded.length === 0 ? (
          <div className="ollama-empty">
            <p>Aucun modele charge en RAM. Les modeles sont charges automatiquement lors d'une requete et se dechargent apres inactivite.</p>
          </div>
        ) : (
          <div className="ollama-cards">
            {loaded.map((m) => (
              <div key={m.name} className="ollama-model-card loaded">
                <div className="model-card-header">
                  <span className="model-icon-lg">{'\uD83E\uDDE0'}</span>
                  <div>
                    <strong>{m.name}</strong>
                    <span className="model-badge badge-loaded">EN MEMOIRE</span>
                  </div>
                </div>
                <div className="model-card-stats">
                  <div className="stat">
                    <span className="stat-label">RAM utilisee</span>
                    <span className="stat-value">{m.size_display}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Processeur</span>
                    <span className="stat-value">{m.processor || 'cpu'}</span>
                  </div>
                  {m.expires_at && (
                    <div className="stat">
                      <span className="stat-label">Expire</span>
                      <span className="stat-value">{formatDate(m.expires_at)}</span>
                    </div>
                  )}
                </div>
                <button className="btn btn-unload" onClick={() => handleUnload(m.name)}>
                  {'\u23CF\uFE0F'} Decharger de la RAM
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Downloaded Models */}
      <div className="ollama-section">
        <h2>{'\uD83D\uDCBE'} Modeles sur le disque ({models.length})</h2>
        <div className="ollama-cards">
          {models.map((m) => {
            const isLoaded = isModelLoaded(m.name)
            return (
              <div key={m.name} className={`ollama-model-card ${isLoaded ? 'active' : ''}`}>
                <div className="model-card-header">
                  <span className="model-icon-lg">{'\uD83E\uDDE0'}</span>
                  <div>
                    <strong>{m.name}</strong>
                    {isLoaded && <span className="model-badge badge-loaded">EN MEMOIRE</span>}
                  </div>
                </div>
                <div className="model-card-stats">
                  <div className="stat">
                    <span className="stat-label">Taille disque</span>
                    <span className="stat-value">{m.size_display}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Modifie</span>
                    <span className="stat-value">{formatDate(m.modified_at)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Digest</span>
                    <span className="stat-value mono">{m.digest || '-'}</span>
                  </div>
                </div>
                <div className="model-card-actions">
                  {isLoaded && (
                    <button className="btn btn-unload" onClick={() => handleUnload(m.name)}>
                      {'\u23CF\uFE0F'} Decharger
                    </button>
                  )}
                  <button className="btn btn-delete-model" onClick={() => handleDelete(m.name)}>
                    {'\uD83D\uDDD1\uFE0F'} Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pull new model */}
      <div className="ollama-section">
        <h2>{'\u2B07\uFE0F'} Telecharger un modele</h2>
        <div className="pull-form">
          <input
            type="text"
            className="pull-input"
            placeholder="Nom du modele (ex: llama3, codellama, phi3...)"
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePull()}
            disabled={pulling}
          />
          <button className="btn btn-pull" onClick={handlePull} disabled={pulling || !pullName.trim()}>
            {pulling ? (
              <><span className="spinner" /> Telechargement...</>
            ) : (
              <>{'\u2B07\uFE0F'} Telecharger</>
            )}
          </button>
        </div>
        <p className="pull-hint">
          Catalogue complet : <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">ollama.com/library</a>
        </p>
      </div>

      <Modal
        isOpen={!!modal}
        title={modal?.title || ''}
        message={modal?.message || ''}
        onConfirm={modal?.onConfirm}
        onCancel={() => setModal(null)}
        loading={actionLoading}
      />
    </div>
  )
}

export default OllamaDetail
