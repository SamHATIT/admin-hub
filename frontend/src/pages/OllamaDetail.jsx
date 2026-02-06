import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getOllamaModels } from '../services/api'
import { useToast } from '../components/Toast'

function OllamaDetail() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchModels = useCallback(async () => {
    try {
      const res = await getOllamaModels()
      setModels(res.data.models || [])
    } catch {
      addToast('Impossible de charger les modeles Ollama', 'error')
    }
  }, [addToast])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { navigate('/login'); return }
    setLoading(true)
    fetchModels().finally(() => setLoading(false))
  }, [fetchModels, navigate])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-screen">
          <span className="spinner large" />
          <p>Chargement des modeles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <header className="detail-header">
        <div className="detail-header-left">
          <Link to="/" className="back-link">{'\u2190'} Retour au dashboard</Link>
          <h1>Ollama - Modeles LLM</h1>
          <p>{models.length} modele{models.length > 1 ? 's' : ''} installe{models.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-refresh" onClick={() => { setLoading(true); fetchModels().finally(() => setLoading(false)) }}>
          {'\uD83D\uDD04'} Rafraichir
        </button>
      </header>

      <div className="detail-table-wrapper">
        <table className="detail-table">
          <thead>
            <tr>
              <th>Modele</th>
              <th>Taille</th>
              <th>Derniere modification</th>
              <th>Digest</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 && (
              <tr><td colSpan="4" className="table-empty">Aucun modele trouve</td></tr>
            )}
            {models.map((m) => (
              <tr key={m.name || m.model}>
                <td>
                  <div className="model-name">
                    <span className="model-icon">{'\uD83E\uDDE0'}</span>
                    <div>
                      <strong>{m.name || m.model}</strong>
                      {m.name !== m.model && m.model && (
                        <span className="model-alias">{m.model}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="model-size">{m.size_display || '-'}</span>
                </td>
                <td className="cell-date">{formatDate(m.modified_at)}</td>
                <td>
                  <span className="model-digest" title={m.digest}>
                    {m.digest ? m.digest.substring(0, 12) + '...' : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OllamaDetail
