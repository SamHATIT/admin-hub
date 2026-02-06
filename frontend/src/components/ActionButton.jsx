const ACTION_CONFIG = {
  start:       { label: 'Demarrer',  icon: '\uD83D\uDE80', className: 'btn-start' },
  stop:        { label: 'Arreter',   icon: '\uD83D\uDED1', className: 'btn-stop' },
  restart:     { label: 'Redemarrer', icon: '\uD83D\uDD04', className: 'btn-restart' },
  logs:        { label: 'Logs',      icon: '\uD83D\uDCCB', className: 'btn-logs' },
  test_config: { label: 'Test Config', icon: '\u2705',      className: 'btn-test' },
}

const TOOLTIP_MAP = {
  start:       (label, port) => `Demarrer ${label} - Port ${port}`,
  stop:        (label, port) => `Arreter ${label} - Port ${port}`,
  restart:     (label, port) => `Redemarrer ${label} - Port ${port}`,
  logs:        (label) => `Voir les logs de ${label}`,
  test_config: (label) => `Tester la configuration ${label}`,
}

function ActionButton({ action, serviceLabel, port, onClick, disabled }) {
  const config = ACTION_CONFIG[action] || { label: action, icon: '', className: '' }
  const tooltipFn = TOOLTIP_MAP[action]
  const tooltip = tooltipFn ? tooltipFn(serviceLabel, port) : action

  return (
    <button
      className={`action-button ${config.className}`}
      onClick={() => onClick(action)}
      disabled={disabled}
      title={tooltip}
    >
      <span className="action-icon">{config.icon}</span>
      <span className="action-label">{config.label}</span>
    </button>
  )
}

export default ActionButton
