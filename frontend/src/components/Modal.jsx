function Modal({ title, message, onConfirm, onCancel, isOpen, loading }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-warning">{'\u26A0\uFE0F'}</span>
          <h3>Confirmer l'action</h3>
        </div>
        <div className="modal-body">
          <p className="modal-title">{title}</p>
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="btn btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                En cours...
              </>
            ) : (
              'Confirmer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
