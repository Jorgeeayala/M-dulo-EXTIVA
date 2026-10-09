import { Cliente, Config } from '../types'

interface ProgressScreenProps {
  cliente: Cliente | null
  progress: {
    current: number
    total: number
    items: Array<{ periodo: string; status: 'pending' | 'downloading' | 'done' | 'error' }>
  }
  config: Config
  onCancel: () => void
}

export default function ProgressScreen({ cliente, progress, config, onCancel }: ProgressScreenProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✅'
      case 'downloading': return '⬇️'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'done': return 'text-[var(--green)]'
      case 'downloading': return 'text-[var(--accent)]'
      case 'error': return 'text-[var(--red)]'
      default: return 'text-[var(--text-dim)]'
    }
  }

  return (
    <section className="p-4 max-w-2xl mx-auto animate-fade-in">
      <div className="font-mono text-[10px] font-semibold tracking-widest text-[var(--text-muted)] mb-4 uppercase">
        DESCARGANDO...
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-muted)]">
        <span>Cliente:</span>
        <strong className="font-mono text-[var(--text)]">
          {cliente?.nombre || cliente?.ruc || '—'}
        </strong>
      </div>

      <div className="h-1 mb-2 overflow-hidden rounded-sm bg-[var(--bg-input)]">
        <div
          className="h-full transition-all duration-500 bg-gradient-to-r from-[var(--accent)] to-[var(--green)] shadow-[0_0_8px_rgba(0,212,255,0.4)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mb-3 text-[11px] font-mono text-[var(--text-muted)]">
        {progress.current} de {progress.total}
      </div>

      <div className="max-h-[300px] overflow-y-auto mb-4 space-y-1.5">
        {progress.items.map((item, idx) => {
          const [mes, anio] = item.periodo.split('/')
          const filename = `${config.prefix}_${anio}_${mes}_${cliente?.nombre || 'CLIENTE'}.pdf`
          
          return (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-2 border rounded bg-[var(--bg-card)] border-[var(--border)]"
            >
              <span className="text-sm">{getStatusIcon(item.status)}</span>
              <span className={`text-[10px] font-mono flex-1 truncate ${getStatusClass(item.status)}`}>
                {filename}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-xs border rounded border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hi)] hover:text-[var(--text)] transition-all"
        >
          Cancelar
        </button>
      </div>
    </section>
  )
}
