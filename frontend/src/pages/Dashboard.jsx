import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import RagCard from '../components/RagCard'
import {
  getServicesStatus,
  getN8nWorkflows,
  getOllamaModels,
  getGhostStats,
  getRagHealth,
} from '../services/api'
import { useToast } from '../components/Toast'

// Order of services in the grid (matches pitch layout)
const SERVICE_ORDER = [
  'backend', 'frontend', 'n8n',
  'ollama', 'ghost', 'postgresql',
  'nginx',
]

function Dashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [services, setServices] = useState({})
  const [integrations, setIntegrations] = useState({
    n8n: null, ollama: null, ghost: null, rag: null,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const statusRes = await getServicesStatus()
      const data = statusRes.data
      delete data._meta
      setServices(data)
    } catch {
      addToast('Impossible de charger les statuts', 'error')
    }

    // Fetch integrations in parallel, don't block on failures
    const [n8n, ollama, ghost, rag] = await Promise.allSettled([
      getN8nWorkflows(),
      getOllamaModels(),
      getGhostStats(),
      getRagHealth(),
    ])

    setIntegrations({
      n8n: n8n.status === 'fulfilled' ? n8n.value.data : null,
      ollama: ollama.status === 'fulfilled' ? ollama.value.data : null,
      ghost: ghost.status === 'fulfilled' ? ghost.value.data : null,
      rag: rag.status === 'fulfilled' ? rag.value.data : null,
    })
  }, [addToast])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll, navigate])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
    addToast('Statuts rafraichis', 'success')
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  const buildDetails = (name) => {
    if (name === 'n8n' && integrations.n8n) {
      const wf = integrations.n8n
      const workflows = wf.workflows || []
      const active = workflows.filter((w) => w.active).length
      return (
        <div>
          <p>{workflows.length} workflow{workflows.length > 1 ? 's' : ''}</p>
          <p>{active} actif{active > 1 ? 's' : ''}</p>
        </div>
      )
    }
    if (name === 'ollama' && integrations.ollama) {
      const models = integrations.ollama.models || []
      return (
        <div>
          <p>{models.length} modele{models.length > 1 ? 's' : ''}</p>
          {models.slice(0, 3).map((m) => (
            <p key={m.name} className="detail-sub">- {m.name}{m.size ? ` (${m.size})` : ''}</p>
          ))}
        </div>
      )
    }
    if (name === 'ghost' && integrations.ghost) {
      const g = integrations.ghost
      return (
        <div>
          {g.published != null && <p>{g.published} articles</p>}
          {g.drafts != null && <p>{g.drafts} brouillons</p>}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-screen">
          <span className="spinner large" />
          <p>Chargement du hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Hub Admin Digital Humans</h1>
          <p>Interface centralisee de monitoring et controle</p>
        </div>
        <div className="header-right">
          <button
            className="btn btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Rafraichir tous les statuts"
          >
            {refreshing ? (
              <><span className="spinner" /> Rafraichissement...</>
            ) : (
              <>{'\uD83D\uDD04'} Rafraichir</>
            )}
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </header>

      <main className="services-grid">
        {SERVICE_ORDER.map((name) => {
          const svc = services[name]
          if (!svc) return null
          return (
            <ServiceCard
              key={name}
              service={svc}
              details={buildDetails(name)}
              onRefresh={fetchAll}
            />
          )
        })}
        <RagCard data={integrations.rag} />
      </main>
    </div>
  )
}

export default Dashboard
