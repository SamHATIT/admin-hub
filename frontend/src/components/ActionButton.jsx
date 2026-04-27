import { Play, Square, RotateCw, FileText, CheckCircle2 } from 'lucide-react'

const ACTION_CONFIG = {
  start:       { label: 'Start',      Icon: Play,        cls: 'text-success border-success/30 hover:bg-success/10' },
  stop:        { label: 'Stop',       Icon: Square,      cls: 'text-error border-error/30 hover:bg-error/10' },
  restart:     { label: 'Restart',    Icon: RotateCw,    cls: 'text-warning border-warning/30 hover:bg-warning/10' },
  logs:        { label: 'Logs',       Icon: FileText,    cls: 'text-bone-3 border-bone/20 hover:bg-ink-3' },
  test_config: { label: 'Test config',Icon: CheckCircle2,cls: 'text-bone-3 border-bone/20 hover:bg-ink-3' },
}

function ActionButton({ action, onClick, disabled }) {
  const cfg = ACTION_CONFIG[action] || { label: action, Icon: FileText, cls: 'text-bone-3 border-bone/20' }
  const { Icon } = cfg
  return (
    <button
      type="button"
      onClick={() => onClick(action)}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border ${cfg.cls} font-mono text-[10px] tracking-eyebrow uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon className="w-3 h-3" />
      <span>{cfg.label}</span>
    </button>
  )
}

export default ActionButton
