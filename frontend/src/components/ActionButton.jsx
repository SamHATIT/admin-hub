/**
 * ActionButton component - Stub for P3 implementation.
 * Will handle service actions with confirmation modal.
 */
function ActionButton({ label, action, onAction }) {
  return (
    <button className="action-button" onClick={() => onAction(action)}>
      {label}
    </button>
  )
}

export default ActionButton
