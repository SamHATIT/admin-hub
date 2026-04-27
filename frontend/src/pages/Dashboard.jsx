import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw, Lock, LogOut, Loader2, AlertTriangle,
  ExternalLink, Workflow, Bot, FileText, Activity, Layers,
} from 'lucide-react'
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
  getDhWorkers,
  getDhExecutionsActive,
  getDhBudget,
  getDhAgentsHealth,
} from '../services/api'
import { useToast } from '../components/Toast'

// Top grid — application services
const MAIN_SERVICES = ['backend', 'frontend', 'n8n', 'ollama', 'ghost', 'postgresql']
const INFRA_SERVICE = 'nginx'
const DETAILS_LINKS = { n8n: '/n8n', ollama: '/ollama' }

// External link to Digital Humans platform (current console runs on console.digital-humans.fr,
// the platform itself is on / via nginx :80 - cf. A5 deployment).
const PLATFORM_URL = 'https://digital-humans.fr'   // production future
const PLATFORM_FALLBACK = 'http://72.61.161.222'   // current studio preview
const AGENT_TESTER_PATH = '/agent-tester'

function Dashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [services, setServices] = useState({})
  const [integrations, setIntegrations] = useState({
    n8n: null, ollama: null, ghost: null, rag: null, docker: null,
  })
  const [dh, setDh] = useState({
    workers: null, executions: null, budget: null, agents: null,
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

    const [n8n, ollama, ghost, rag, docker, workers, executions, budget, agents] = await Promise.allSettled([
      getN8nWorkflows(),
      getOllamaModels(),
      getGhostStats(),
      getRagHealth(),
      getDockerContainers(),
      getDhWorkers(),
      getDhExecutionsActive(),
      getDhBudget(),
      getDhAgentsHealth(),
    ])

    setIntegrations({
      n8n:    n8n.status === 'fulfilled' ? n8n.value.data : null,
      ollama: ollama.status === 'fulfilled' ? ollama.value.data : null,
      ghost:  ghost.status === 'fulfilled' ? ghost.value.data : null,
      rag:    rag.status === 'fulfilled' ? rag.value.data : null,
      docker: docker.status === 'fulfilled' ? docker.value.data : null,
    })
    setDh({
      workers:    workers.status === 'fulfilled' ? workers.value.data : null,
      executions: executions.status === 'fulfilled' ? executions.value.data : null,
      budget:     budget.status === 'fulfilled' ? budget.value.data : null,
      agents:     agents.status === 'fulfilled' ? agents.value.data : null,
    })
  }, [addToast])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { navigate('/login'); return }

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
    addToast('Statuts rafraîchis', 'success')
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

  // Build per-service detail block
  const buildDetails = (name) => {
    if (name === 'n8n' && integrations.n8n) {
      const workflows = integrations.n8n.workflows || []
      const active = workflows.filter((w) => w.active).length
      return (
        <>
          <p>{workflows.length} workflow{workflows.length > 1 ? 's' : ''}</p>
          <p className="text-bone-4">{active} actif{active > 1 ? 's' : ''}</p>
        </>
      )
    }
    if (name === 'ollama' && integrations.ollama) {
      const models = integrations.ollama.models || []
      return (
        <>
          <p>{models.length} modèle{models.length > 1 ? 's' : ''}</p>
          {models.slice(0, 2).map((m) => (
            <p key={m.name} className="text-bone-4 truncate">· {m.name}{m.size_display ? ` (${m.size_display})` : ''}</p>
          ))}
        </>
      )
    }
    if (name === 'ghost' && integrations.ghost) {
      const g = integrations.ghost
      return (
        <>
          {g.published != null && <p>{g.published} articles</p>}
          {g.drafts != null && <p className="text-bone-4">{g.drafts} brouillons</p>}
        </>
      )
    }
    if (name === 'backend' && dh.budget) {
      return (
        <>
          {dh.budget.used != null && <p>Crédits dépensés : <span className="text-bone tabular-nums">{Number(dh.budget.used).toLocaleString()}</span></p>}
          {dh.executions?.count != null && <p className="text-bone-4">{dh.executions.count} exécution{dh.executions.count > 1 ? 's' : ''} en cours</p>}
        </>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-brass animate-spin" />
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-3">
            Chargement de la console…
          </p>
        </div>
      </div>
    )
  }

  const nginxSvc = services[INFRA_SERVICE]

  return (
    <div className="min-h-screen flex flex-col bg-ink text-bone">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-ink-2/95 backdrop-blur-md border-b border-brass/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex flex-col leading-tight">
              <span className="font-serif italic text-xl text-bone">Digital · Humans</span>
              <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Console · Admin Hub</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone border border-bone/10 hover:border-brass/40 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Rafraîchir</span>
              </button>
              <button
                type="button"
                onClick={() => setShowChangePwd(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone border border-bone/10 hover:border-brass/40 transition-colors"
                title="Changer le mot de passe"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Mot de passe</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-cta uppercase text-bone-4 hover:text-error transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Pwd warning banner */}
      {daysRemaining <= 15 && daysRemaining > 0 && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 font-mono text-[11px] text-warning">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Votre mot de passe expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
              <button
                type="button"
                onClick={() => setShowChangePwd(true)}
                className="ml-2 underline hover:text-bone transition-colors"
              >
                Le renouveler maintenant
              </button>
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Hero */}
        <div className="mb-10">
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-4 mb-3">
            № 01 · Console
          </p>
          <h1 className="font-serif italic text-4xl md:text-5xl text-bone leading-[1.05] mb-3">
            Backstage of the studio.
          </h1>
          <p className="font-mono text-[12px] text-bone-3 max-w-2xl">
            Status, logs and actions for every service the eleven agents depend on.
          </p>
        </div>

        {/* Digital Humans focus card — featured at top, links to platform */}
        <DhFocusCard
          dh={dh}
          serviceBackend={services.backend}
          platformUrl={PLATFORM_URL}
          platformFallback={PLATFORM_FALLBACK}
          agentTesterPath={AGENT_TESTER_PATH}
        />

        {/* Application services grid */}
        <section className="mb-12">
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-4">
            Application services
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAIN_SERVICES.map((name) => {
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
          </div>
        </section>

        {/* Infrastructure */}
        <section>
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-4">
            Infrastructure
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DockerCard containers={integrations.docker?.containers} onRefresh={fetchAll} />
            </div>
            <div className="space-y-4">
              {nginxSvc && (
                <ServiceCard service={nginxSvc} details={null} onRefresh={fetchAll} />
              )}
              <RagCard data={integrations.rag} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-bone/10 px-4 sm:px-6 lg:px-8 py-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">
          <p>© MMXXVI · Samhatit Consulting</p>
          <p>Console · v6.1 · A6 sprint</p>
        </div>
      </footer>

      <ChangePasswordModal
        isOpen={showChangePwd}
        onClose={handlePasswordChanged}
        forced={forcedChangePwd}
      />
    </div>
  )
}

// ── Featured DH card — links to platform + agent tester ──
function DhFocusCard({ dh, serviceBackend, platformUrl, platformFallback, agentTesterPath }) {
  // Resolve external base URL — use the same host the user is on (so they keep their session)
  // For now, use the legacy fallback since prod isn't switched yet.
  const platformBase = (typeof window !== 'undefined' && window.location.hostname.includes('digital-humans.fr'))
    ? platformUrl : platformFallback

  const backendUp = serviceBackend?.status === 'up'
  const workers = dh.workers
  const executions = dh.executions
  const agents = dh.agents
  const budget = dh.budget

  return (
    <section className="mb-12 bg-ink-2 border border-brass/30 relative overflow-hidden">
      {/* Diagonal linework background */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(135deg, var(--brass) 0 1px, transparent 1px 60px)',
      }} />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left — title + actions */}
        <div className="p-6 lg:p-7 border-b lg:border-b-0 lg:border-r border-bone/10 flex flex-col justify-between min-h-[260px]">
          <div>
            <p className="font-mono text-[10px] tracking-eyebrow uppercase text-brass mb-3">
              ◗ Spotlight · Digital Humans Studio
            </p>
            <h2 className="font-serif italic text-3xl md:text-4xl text-bone leading-[1.05] mb-3">
              The eleven agents — at a glance.
            </h2>
            <p className="font-mono text-[12px] text-bone-3 leading-relaxed max-w-xl">
              Backend, frontend and the SDS / BUILD pipeline. Open the platform itself, or jump straight to the agent tester.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <a
              href={platformBase}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brass text-ink font-mono text-[10px] tracking-cta uppercase hover:bg-brass-2 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Open platform
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`${platformBase}${agentTesterPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent text-bone-2 border border-bone/20 hover:border-brass/40 hover:text-bone font-mono text-[10px] tracking-cta uppercase transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              Agent tester
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right — live metrics */}
        <div className="p-6 lg:p-7 grid grid-cols-2 gap-x-6 gap-y-5 content-start">
          <Metric
            label="Backend"
            value={backendUp ? 'UP' : 'DOWN'}
            tone={backendUp ? 'success' : 'error'}
            icon={<Activity className="w-3 h-3" />}
          />
          <Metric
            label="Workers ARQ"
            value={workers?.count != null ? String(workers.count) : '—'}
            sub={workers?.healthy != null ? (workers.healthy ? 'healthy' : 'degraded') : null}
            tone={workers?.healthy === false ? 'warning' : 'default'}
            icon={<Workflow className="w-3 h-3" />}
          />
          <Metric
            label="Exécutions actives"
            value={executions?.count != null ? String(executions.count) : '—'}
            sub={executions?.last_started ? `last : ${executions.last_started}` : null}
            icon={<FileText className="w-3 h-3" />}
          />
          <Metric
            label="Budget utilisé"
            value={budget?.used != null ? Number(budget.used).toLocaleString() : '—'}
            sub={budget?.window ? budget.window : null}
            icon={<Activity className="w-3 h-3" />}
          />
          <Metric
            label="Agents en bonne santé"
            value={agents?.healthy_count != null && agents?.total_count != null
              ? `${agents.healthy_count}/${agents.total_count}`
              : '—'}
            tone={agents?.healthy_count === agents?.total_count ? 'success' : 'warning'}
            icon={<Bot className="w-3 h-3" />}
            wide
          />
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, sub, tone = 'default', icon, wide }) {
  const toneClass = {
    default: 'text-bone',
    success: 'text-success',
    warning: 'text-warning',
    error:   'text-error',
  }[tone]

  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-1.5 flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </p>
      <p className={`font-serif italic text-2xl ${toneClass} tabular-nums leading-none`}>
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[10px] text-bone-4 mt-1 truncate">{sub}</p>
      )}
    </div>
  )
}

export default Dashboard
