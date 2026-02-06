/**
 * Modal component - Stub for P3 implementation.
 * Will display confirmation dialog before destructive actions.
 */
function Modal({ title, message, onConfirm, onCancel, isOpen }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel}>Annuler</button>
          <button onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

export default Modal
