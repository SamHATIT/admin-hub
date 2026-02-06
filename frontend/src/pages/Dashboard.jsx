import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import RagCard from '../components/RagCard'
import ChangePasswordModal from '../components/ChangePasswordModal'
import DockerCard from '../components/DockerCard'
import {
  getServicesStatus,
  getN8nWorkflows,
  getOllamaModels,
  getGhostStats,
  getRagHealth,
  getDockerContainers,
} from '../services/api'
import { useToast } from '../components/Toast'

const SERVICE_ORDER = [
  'backend', 'frontend', 'n8n',
  'ollama', 'ghost', 'postgresql',
  'nginx',
]

const DETAILS_LINKS = {
  n8n: '/n8n',
  ollama: '/ollama',
}

function Dashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [services, setServices] = useState({})
  const [integrations, setIntegrations] = useState({
    n8n: null, ollama: null, ghost: null, rag: null, docker: null,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [forcedChangePwd, setForcedChangePwd] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(90)

  const fetchAll = useCallback(async () => {
    try {
      const statusRes = await getServicesStatus()
      const data = statusRes.data
      delete data._meta
      setServices(data)
    } catch {
      addToast('Impossible de charger les statuts', 'error')
    }

    const [n8n, ollama, ghost, rag, docker] = await Promise.allSettled([
      getN8nWorkflows(),
      getOllamaModels(),
      getGhostStats(),
      getRagHealth(),
      getDockerContainers(),
    ])

    setIntegrations({
      n8n: n8n.status === 'fulfilled' ? n8n.value.data : null,
      ollama: ollama.status === 'fulfilled' ? ollama.value.data : null,
      ghost: ghost.status === 'fulfilled' ? ghost.value.data : null,
      rag: rag.status === 'fulfilled' ? rag.value.data : null,
      docker: docker.status === 'fulfilled' ? docker.value.data : null,
    })
  }, [addToast])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/login')
      return
    }

    // Check password expiry from login response
    const expired = localStorage.getItem('password_expired') === 'true'
    const days = parseInt(localStorage.getItem('password_days_remaining') || '90', 10)
    setDaysRemaining(days)

    if (expired) {
      setForcedChangePwd(true)
      setShowChangePwd(true)
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
    localStorage.removeItem('password_expired')
    localStorage.removeItem('password_days_remaining')
    navigate('/login')
  }

  const handlePasswordChanged = (success) => {
    if (success) {
      setShowChangePwd(false)
      setForcedChangePwd(false)
      setDaysRemaining(90)
      localStorage.setItem('password_expired', 'false')
      localStorage.setItem('password_days_remaining', '90')
    } else if (!forcedChangePwd) {
      setShowChangePwd(false)
    }
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
            <p key={m.name} className="detail-sub">- {m.name}{m.size_display ? ` (${m.size_display})` : ''}</p>
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
      {daysRemaining <= 15 && daysRemaining > 0 && (
        <div className="pwd-warning-banner">
          {'\u26A0\uFE0F'} Votre mot de passe expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.{' '}
          <button className="pwd-warning-link" onClick={() => setShowChangePwd(true)}>
            Le renouveler maintenant
          </button>
        </div>
      )}

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
          <button
            className="btn btn-pwd"
            onClick={() => setShowChangePwd(true)}
            title="Changer le mot de passe"
          >
            {'\uD83D\uDD12'} Mot de passe
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
              detailsLink={DETAILS_LINKS[name]}
            />
          )
        })}
        <RagCard data={integrations.rag} />
        <DockerCard containers={integrations.docker?.containers} onRefresh={fetchAll} />
      </main>

      <ChangePasswordModal
        isOpen={showChangePwd}
        onClose={handlePasswordChanged}
        forced={forcedChangePwd}
      />
    </div>
  )
}

export default Dashboard
