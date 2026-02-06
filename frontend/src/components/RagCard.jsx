function RagCard({ data }) {
  if (!data) {
    return (
      <div className="service-card status-unknown">
        <div className="card-header">
          <span className="status-dot unknown" />
          <h3 className="card-title">RAG ChromaDB</h3>
          <span className="status-badge">...</span>
        </div>
        <div className="card-details">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  const isHealthy = data.healthy === true

  return (
    <div className={`service-card ${isHealthy ? 'status-up' : 'status-down'}`}>
      <div className="card-header">
        <span className={`status-dot ${isHealthy ? 'up' : 'down'}`} />
        <h3 className="card-title">RAG ChromaDB</h3>
        <span className="status-badge">{isHealthy ? 'OK' : 'ERR'}</span>
      </div>
      <div className="card-details">
        {data.chunks != null && (
          <p>{Number(data.chunks).toLocaleString()} chunks</p>
        )}
        {data.db_size_display && <p>Taille : {data.db_size_display}</p>}
        {data.dir_size_display && <p>Total : {data.dir_size_display}</p>}
        {data.error && <p className="detail-error">{data.error}</p>}
      </div>
      <div className="card-meta">
        <span className="meta-port">Monitoring uniquement</span>
      </div>
    </div>
  )
}

export default RagCard
