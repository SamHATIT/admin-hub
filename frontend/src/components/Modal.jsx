import { AlertTriangle, Loader2 } from 'lucide-react'

function Modal({ title, message, onConfirm, onCancel, isOpen, loading, confirmLabel, cancelLabel }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-ink-2 border border-brass/30 max-w-md w-full"
      >
        <div className="flex items-center gap-3 p-5 border-b border-bone/10">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">
            Confirmer l'action
          </p>
        </div>
        <div className="p-5 space-y-3">
          <p className="font-serif italic text-xl text-bone leading-tight">{title}</p>
          {message && <p className="font-mono text-[12px] text-bone-3 leading-relaxed">{message}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-bone/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 font-mono text-[10px] tracking-cta uppercase text-bone-3 hover:text-bone disabled:opacity-50 transition-colors"
          >
            {cancelLabel || 'Annuler'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brass text-ink font-mono text-[10px] tracking-cta uppercase hover:bg-brass-2 transition-colors disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />En cours…</> : (confirmLabel || 'Confirmer')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
