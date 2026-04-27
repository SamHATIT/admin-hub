import { useState } from 'react'
import { Lock, AlertTriangle, X, Loader2 } from 'lucide-react'
import { changePassword } from '../services/api'
import { useToast } from './Toast'

function ChangePasswordModal({ isOpen, onClose, forced }) {
  const { addToast } = useToast()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPwd.length < 4) {
      setError('Le nouveau mot de passe doit faire au moins 4 caractères')
      return
    }
    if (newPwd !== confirmPwd) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      await changePassword(oldPwd, newPwd)
      addToast('Mot de passe modifié avec succès', 'success')
      setOldPwd(''); setNewPwd(''); setConfirmPwd('')
      onClose(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du changement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4" onClick={forced ? undefined : () => onClose(false)}>
      <div onClick={(e) => e.stopPropagation()} className="bg-ink-2 border border-brass/30 max-w-md w-full">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-bone/10">
          <div className="flex items-start gap-3">
            {forced ? (
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
            ) : (
              <Lock className="w-4 h-4 text-brass mt-0.5" />
            )}
            <div>
              <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-1">
                {forced ? 'Sécurité' : 'Compte'}
              </p>
              <h3 className="font-serif italic text-xl text-bone">
                {forced ? 'Mot de passe expiré' : 'Changer le mot de passe'}
              </h3>
            </div>
          </div>
          {!forced && (
            <button type="button" onClick={() => onClose(false)} className="text-bone-4 hover:text-bone transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {forced && (
          <div className="px-5 py-3 border-b border-bone/10 bg-warning/5">
            <p className="font-mono text-[11px] text-bone-2 leading-relaxed">
              Votre mot de passe a expiré (plus de 90 jours). Veuillez le renouveler pour continuer.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="old-pwd" className="block font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 mb-2">
              Mot de passe actuel
            </label>
            <input
              id="old-pwd"
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-ink-3 border border-bone/10 px-4 py-3 font-sans text-[14px] text-bone focus:border-brass focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="new-pwd" className="block font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 mb-2">
              Nouveau mot de passe
            </label>
            <input
              id="new-pwd"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full bg-ink-3 border border-bone/10 px-4 py-3 font-sans text-[14px] text-bone focus:border-brass focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="confirm-pwd" className="block font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirm-pwd"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full bg-ink-3 border border-bone/10 px-4 py-3 font-sans text-[14px] text-bone focus:border-brass focus:outline-none transition-colors"
            />
          </div>
          {error && <p className="font-mono text-[11px] text-error">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            {!forced && (
              <button type="button" onClick={() => onClose(false)} className="px-4 py-2.5 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone transition-colors">
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brass text-ink font-mono text-[10px] tracking-cta uppercase hover:bg-brass-2 transition-colors disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Modification…</> : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
