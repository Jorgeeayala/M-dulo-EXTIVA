import { Cliente, Config } from '../types'

interface IvaScreenProps {
  clientes: Cliente[]
  selectedCliente: Cliente | null
  onSelectCliente: (cliente: Cliente | null) => void
  onAddCliente: () => void
  onBack: () => void
  mesesSeleccionados: number | 'custom'
  onMesesChange: (meses: number | 'custom') => void
  rangoCustom: { desde: string; hasta: string }
  onRangoChange: (rango: { desde: string; hasta: string }) => void
  getMesesList: () => Array<{ anio: number; mes: number }>
  config: Config
  onStartDownload: () => void
  mesesNombres: string[]
}

export default function IvaScreen({
  clientes,
  selectedCliente,
  onSelectCliente,
  onAddCliente,
  onBack,
  mesesSeleccionados,
  onMesesChange,
  rangoCustom,
  onRangoChange,
  getMesesList,
  config,
  onStartDownload,
  mesesNombres
}: IvaScreenProps) {
  const meses = getMesesList()

  // Establecer rango personalizado por defecto
  const setDefaultCustomRange = () => {
    const now = new Date()
    const hastaDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const desdeDate = new Date(hastaDate.getFullYear(), hastaDate.getMonth() - 2, 1)

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    onRangoChange({
      hasta: fmt(hastaDate),
      desde: fmt(desdeDate)
    })
  }

  const handleMesesTabClick = (value: number | 'custom') => {
    onMesesChange(value)
    if (value === 'custom' && !rangoCustom.desde) {
      setDefaultCustomRange()
    }
  }

  return (
    <section className="p-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Volver
        </button>
        <div className="font-mono text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
          FORMULARIOS IVA
        </div>
      </div>

      {/* Selector de cliente */}
      <div className="mb-3">
        <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
          Cliente
        </label>
        <div className="flex gap-2">
          <select
            value={selectedCliente?.id || ''}
            onChange={(e) => {
              const cliente = clientes.find(c => c.id === e.target.value)
              onSelectCliente(cliente || null)
            }}
            className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="">— Seleccionar cliente —</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.ruc})
              </option>
            ))}
          </select>
          <button
            onClick={onAddCliente}
            className="w-8 h-8 flex items-center justify-center text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text-muted)] hover:border-[var(--border-hi)] hover:text-[var(--text)] transition-all"
            title="Agregar cliente"
          >
            ＋
          </button>
        </div>
      </div>

      {/* Info del cliente seleccionado */}
      {selectedCliente && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 border rounded bg-[var(--accent)]/5 border-[var(--accent)]/15">
          <span className="text-[11px] font-mono text-[var(--accent)]">{selectedCliente.ruc}</span>
          <span className="text-[11px] text-[var(--text-muted)] truncate">{selectedCliente.nombre}</span>
        </div>
      )}

      {/* Selector de períodos */}
      <div className="mb-3">
        <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
          Períodos a descargar
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Último', value: 1 },
            { label: '3 meses', value: 3 },
            { label: '6 meses', value: 6 },
            { label: 'Personalizado', value: 'custom' as const }
          ].map(({ label, value }) => (
            <button
              key={String(value)}
              onClick={() => handleMesesTabClick(value)}
              className={`px-3 py-1.5 text-[11px] font-mono border rounded transition-all ${
                mesesSeleccionados === value
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/8'
                  : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-input)] hover:border-[var(--accent)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rango personalizado */}
      {mesesSeleccionados === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Desde
            </label>
            <input
              type="month"
              value={rangoCustom.desde}
              onChange={(e) => onRangoChange({ ...rangoCustom, desde: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Hasta
            </label>
            <input
              type="month"
              value={rangoCustom.hasta}
              onChange={(e) => onRangoChange({ ...rangoCustom, hasta: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
        </div>
      )}

      {/* Preview de meses */}
      <div className="mb-3">
        <div className="text-[10px] font-mono text-[var(--text-muted)] mb-2 uppercase tracking-wider">
          Se descargarán:
        </div>
        <div className="flex flex-wrap gap-2 min-h-[24px]">
          {meses.length === 0 ? (
            <span className="px-3 py-1 text-[10px] text-[var(--text-dim)] border border-[var(--border)] rounded-full">
              Sin períodos seleccionados
            </span>
          ) : (
            meses.map(({ anio, mes }) => (
              <span
                key={`${anio}-${mes}`}
                className="px-3 py-1 text-[10px] font-mono font-medium bg-[var(--accent)]/12 border border-[var(--accent)]/30 text-[var(--accent)] rounded-full"
              >
                {mesesNombres[mes - 1]} {anio}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Preview de nombre de archivo */}
      <div className="mb-4">
        <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
          Formato de nombre de archivo
        </label>
        <div className="px-3 py-2 mb-1 border rounded bg-[var(--bg-input)] border-[var(--border)]">
          <span className="text-[11px] font-mono text-[var(--green)]">
            {config.prefix}_{new Date().getFullYear()}_01_{selectedCliente?.nombre || 'CLIENTE'}.pdf
          </span>
        </div>
        <div className="text-[10px] text-[var(--text-dim)]">
          Los archivos se guardarán en tu carpeta de Descargas
        </div>
      </div>

      {/* Botón de descarga */}
      <button
        onClick={onStartDownload}
        className="w-full px-4 py-2.5 bg-[var(--accent)] text-black rounded font-mono text-xs font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-[#19e8ff] hover:shadow-[0_0_16px_rgba(0,212,255,0.35)] active:scale-[0.98] transition-all"
      >
        <span className="text-sm">⬇</span>
        <span>Descargar formularios</span>
      </button>
    </section>
  )
}
