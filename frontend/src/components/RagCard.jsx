import { Database } from 'lucide-react'

function RagCard({ data }) {
  const isUnknown = !data
  const isHealthy = data?.healthy === true

  const dot = isUnknown ? 'bg-bone-4' : (isHealthy ? 'bg-success' : 'bg-error')
  const txt = isUnknown ? 'text-bone-4' : (isHealthy ? 'text-success' : 'text-error')
  const lbl = isUnknown ? '…' : (isHealthy ? 'OK' : 'ERR')

  return (
    <div className="bg-ink-2 border border-bone/10 hover:border-brass/30 transition-colors">
      <div className="flex items-center justify-between gap-3 p-5 border-b border-bone/5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
          <Database className="w-3.5 h-3.5 text-brass flex-shrink-0" />
          <h3 className="font-serif italic text-lg text-bone truncate">RAG ChromaDB</h3>
        </div>
        <span className={`font-mono text-[10px] tracking-eyebrow uppercase ${txt} flex-shrink-0`}>
          {lbl}
        </span>
      </div>

      <div className="px-5 py-4 space-y-2">
        {isUnknown ? (
          <p className="font-mono text-[11px] text-bone-3 italic">Chargement…</p>
        ) : (
          <>
            {data.chunks != null && (
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Chunks</span>
                <span className="font-mono text-[12px] text-bone tabular-nums">{Number(data.chunks).toLocaleString()}</span>
              </div>
            )}
            {data.db_size_display && (
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Taille DB</span>
                <span className="font-mono text-[12px] text-bone-2">{data.db_size_display}</span>
              </div>
            )}
            {data.dir_size_display && (
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">Total</span>
                <span className="font-mono text-[12px] text-bone-2">{data.dir_size_display}</span>
              </div>
            )}
            {data.error && (
              <p className="font-mono text-[11px] text-error pt-2">{data.error}</p>
            )}
          </>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-bone/5 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4">
        Monitoring uniquement
      </div>
    </div>
  )
}

export default RagCard
