import { useState } from 'react'
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
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
      onClose(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du changement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={forced ? undefined : () => onClose(false)}>
      <div className="modal-content change-pwd-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{forced ? '\u26A0\uFE0F Mot de passe expiré' : '\uD83D\uDD12 Changer le mot de passe'}</h2>
        {forced && (
          <p className="pwd-expired-notice">
            Votre mot de passe a expiré (plus de 90 jours). Veuillez le renouveler pour continuer.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="old-pwd">Mot de passe actuel</label>
            <input
              id="old-pwd"
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-pwd">Nouveau mot de passe</label>
            <input
              id="new-pwd"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-pwd">Confirmer le nouveau mot de passe</label>
            <input
              id="confirm-pwd"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="pwd-error">{error}</p>}
          <div className="modal-actions">
            {!forced && (
              <button type="button" className="btn btn-cancel" onClick={() => onClose(false)}>
                Annuler
              </button>
            )}
            <button type="submit" className="btn btn-confirm" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Modification...</>
              ) : (
                'Confirmer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
