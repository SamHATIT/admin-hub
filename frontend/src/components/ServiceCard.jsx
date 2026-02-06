/**
 * ServiceCard component - Stub for P3 implementation.
 * Will display service status with action buttons.
 */
function ServiceCard({ name, status, port, actions, link }) {
  return (
    <div className="service-card">
      <h3>{name}</h3>
      <p>Port: {port}</p>
      <span className={`status ${status}`}>{status}</span>
    </div>
  )
}

export default ServiceCard
