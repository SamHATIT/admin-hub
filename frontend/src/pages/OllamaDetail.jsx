import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Globe, Brain, Loader2,
  HardDrive, Trash2, CircleX, Download,
} from 'lucide-react'
import {
  getOllamaModels, getOllamaRunning, getOllamaMemory,
  ollamaUnload, ollamaDelete, ollamaPull,
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
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [pullName, setPullName] = useState('')
  const [pulling, setPulling] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [modelsRes, runningRes, memRes] = await Promise.allSettled([
        getOllamaModels(), getOllamaRunning(), getOllamaMemory(),
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

  const handleRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false) }

  const handleUnload = (name) => {
    setModal({
      title: `Décharger ${name} de la mémoire ?`,
      message: 'Le modèle sera retiré de la RAM mais restera sur le disque.',
      onConfirm: async () => {
        setActionLoading(true)
        try {
          const res = await ollamaUnload(name)
          if (res.data.success) addToast(`${name} déchargé de la mémoire`, 'success')
          else addToast(res.data.error || 'Erreur', 'error')
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
      message: 'Le modèle sera définitivement supprimé. Il faudra le retélécharger.',
      onConfirm: async () => {
        setActionLoading(true)
        try {
          const res = await ollamaDelete(name)
          if (res.data.success) addToast(`${name} supprimé`, 'success')
          else addToast(res.data.error || 'Erreur', 'error')
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
    addToast(`Téléchargement de ${pullName}…`, 'info')
    try {
      const res = await ollamaPull(pullName.trim())
      if (res.data.success) {
        addToast(`${pullName} téléchargé !`, 'success')
        setPullName('')
        fetchAll()
      } else {
        addToast(res.data.error || 'Erreur téléchargement', 'error')
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Erreur téléchargement', 'error')
    }
    setPulling(false)
  }

  const isModelLoaded = (name) => loaded.some((l) => l.name === name)

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return '—' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-brass animate-spin" />
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-3">
            Chargement Ollama…
          </p>
        </div>
      </div>
    )
  }

  const ramTone = !memory ? 'text-bone-4'
    : memory.usage_pct > 80 ? 'text-error'
    : memory.usage_pct > 60 ? 'text-warning' : 'text-success'

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
            <div className="flex items-center gap-2">
              <a
                href="https://ollama.digital-humans.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone border border-bone/10 hover:border-brass/40 transition-colors"
              >
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">Open WebUI</span>
              </a>
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
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Hero */}
        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-4 mb-3">
            № 03 · Ollama
          </p>
          <h1 className="font-serif italic text-4xl md:text-5xl text-bone leading-[1.05] mb-2">
            Local language models.
          </h1>
          <p className="font-mono text-[12px] text-bone-3 tabular-nums">
            {models.length} modèle{models.length > 1 ? 's' : ''} sur le disque · {loaded.length} chargé{loaded.length > 1 ? 's' : ''} en mémoire
          </p>
        </div>

        {/* RAM bar */}
        {memory && (
          <section className="bg-ink-2 border border-bone/10 p-6 mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">
                Mémoire serveur
              </p>
              <p className={`font-mono text-[12px] tabular-nums ${ramTone}`}>
                {memory.usage_pct}%
              </p>
            </div>
            <div className="h-px bg-bone/10 relative mb-3">
              <div
                className={`absolute left-0 top-0 h-px transition-all ${
                  memory.usage_pct > 80 ? 'bg-error' : memory.usage_pct > 60 ? 'bg-warning' : 'bg-brass'
                }`}
                style={{ width: `${memory.usage_pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">
              <span>Utilisé : <span className="text-bone-2 tabular-nums">{memory.used_display}</span></span>
              <span>Disponible : <span className="text-bone-2 tabular-nums">{memory.available_display}</span></span>
              <span>Total : <span className="text-bone-2 tabular-nums">{memory.total_display}</span></span>
            </div>
          </section>
        )}

        {/* Loaded in RAM */}
        <section className="mb-10">
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-brass mb-4">
            ◗ Chargés en mémoire ({loaded.length})
          </p>
          {loaded.length === 0 ? (
            <div className="bg-ink-2 border border-bone/10 p-6">
              <p className="font-mono text-[12px] text-bone-3 italic">
                Aucun modèle chargé en RAM. Ils sont chargés automatiquement lors d'une requête et déchargés après inactivité.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loaded.map((m) => (
                <div key={m.name} className="bg-ink-2 border border-brass/30 p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <Brain className="w-4 h-4 text-brass flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] tracking-eyebrow uppercase text-brass mb-1">
                        En mémoire
                      </p>
                      <h3 className="font-serif italic text-lg text-bone truncate">{m.name}</h3>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">RAM utilisée</span>
                      <span className="font-mono text-[12px] text-bone-2 tabular-nums">{m.size_display}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Processeur</span>
                      <span className="font-mono text-[12px] text-bone-2">{m.processor || 'cpu'}</span>
                    </div>
                    {m.expires_at && (
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Expire</span>
                        <span className="font-mono text-[11px] text-bone-3 tabular-nums">{formatDate(m.expires_at)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnload(m.name)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-eyebrow uppercase text-warning border border-warning/30 hover:bg-warning/10 transition-colors"
                  >
                    <CircleX className="w-3 h-3" />
                    Décharger de la RAM
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Disk models */}
        <section className="mb-10">
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-4">
            <HardDrive className="inline w-3 h-3 mr-1" />
            Sur le disque ({models.length})
          </p>
          {models.length === 0 ? (
            <div className="bg-ink-2 border border-bone/10 p-6">
              <p className="font-mono text-[12px] text-bone-3 italic">Aucun modèle local.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((m) => {
                const isLoaded = isModelLoaded(m.name)
                return (
                  <div
                    key={m.name}
                    className={`bg-ink-2 border ${isLoaded ? 'border-brass/30' : 'border-bone/10'} hover:border-brass/30 transition-colors p-5`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Brain className={`w-4 h-4 flex-shrink-0 mt-1 ${isLoaded ? 'text-brass' : 'text-bone-3'}`} />
                      <div className="min-w-0 flex-1">
                        {isLoaded && (
                          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-brass mb-1">
                            En mémoire
                          </p>
                        )}
                        <h3 className="font-serif italic text-lg text-bone truncate">{m.name}</h3>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Taille</span>
                        <span className="font-mono text-[12px] text-bone-2 tabular-nums">{m.size_display}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Modifié</span>
                        <span className="font-mono text-[11px] text-bone-3 tabular-nums">{formatDate(m.modified_at)}</span>
                      </div>
                      {m.digest && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Digest</span>
                          <span className="font-mono text-[10px] text-bone-3 truncate">{m.digest.slice(0, 12)}…</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoaded && (
                        <button
                          type="button"
                          onClick={() => handleUnload(m.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-eyebrow uppercase text-warning border border-warning/30 hover:bg-warning/10 transition-colors"
                        >
                          <CircleX className="w-3 h-3" />
                          Décharger
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(m.name)}
                        className={`${isLoaded ? '' : 'flex-1'} inline-flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-eyebrow uppercase text-error border border-error/30 hover:bg-error/10 transition-colors`}
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Pull a new model */}
        <section className="bg-ink-2 border border-bone/10 p-6">
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-1">
            <Download className="inline w-3 h-3 mr-1" />
            Télécharger un nouveau modèle
          </p>
          <h3 className="font-serif italic text-xl text-bone mb-4">
            Pull from registry
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={pullName}
              onChange={(e) => setPullName(e.target.value)}
              placeholder="ex: mistral, llama3.2, qwen2.5-coder…"
              disabled={pulling}
              className="flex-1 bg-ink-3 border border-bone/10 px-4 py-3 font-sans text-[14px] text-bone placeholder:text-bone-4 focus:border-brass focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={handlePull}
              disabled={!pullName.trim() || pulling}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brass text-ink font-mono text-[10px] tracking-cta uppercase hover:bg-brass-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pulling ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Téléchargement…</> : <><Download className="w-3.5 h-3.5" />Pull</>}
            </button>
          </div>
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mt-3">
            Le téléchargement peut prendre plusieurs minutes selon la taille
          </p>
        </section>
      </main>

      {/* Confirmation modal */}
      {modal && (
        <Modal
          isOpen={!!modal}
          title={modal.title}
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

export default OllamaDetail
