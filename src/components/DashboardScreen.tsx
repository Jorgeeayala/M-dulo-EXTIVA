interface DashboardScreenProps {
  onToolClick: (tool: string) => void
  onLogout: () => void
  onClientesClick: () => void
}

export default function DashboardScreen({ 
  onToolClick, 
  onLogout,
  onClientesClick 
}: DashboardScreenProps) {
  const tools = [
    { id: 'iva', icon: '📄', name: 'Formularios IVA', desc: 'Descargar últimos meses', disabled: false },
    { id: 'ire', icon: '📊', name: 'Declaraciones IRE', desc: 'Próximamente', disabled: true },
    { id: 'comp', icon: '🧾', name: 'Comprobantes', desc: 'Próximamente', disabled: true },
    { id: 'cuenta', icon: '👤', name: 'Cuenta Corriente', desc: 'Próximamente', disabled: true },
  ]

  return (
    <section className="p-4 max-w-2xl mx-auto animate-fade-in">
      <div className="font-mono text-[10px] font-semibold tracking-widest text-[var(--text-muted)] mb-4 uppercase">
        HERRAMIENTAS
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => !tool.disabled && onToolClick(tool.id)}
            disabled={tool.disabled}
            className={`relative p-4 border rounded-lg transition-all text-center flex flex-col items-center gap-2 ${
              tool.disabled
                ? 'opacity-45 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border)]'
                : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,212,255,0.12)]'
            }`}
          >
            <div className="text-2xl">{tool.icon}</div>
            <div className="text-[11px] font-semibold text-[var(--text)]">{tool.name}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{tool.desc}</div>
            {tool.disabled && (
              <div className="absolute top-2 right-2 bg-[var(--border)] text-[var(--text-dim)] text-[9px] px-1.5 py-0.5 rounded font-mono">
                Pronto
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-between">
        <button
          onClick={onLogout}
          className="flex-1 px-3 py-2 text-xs border rounded border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hi)] hover:text-[var(--text)] transition-all"
        >
          ← Cerrar sesión
        </button>
        <button
          onClick={onClientesClick}
          className="flex-1 px-3 py-2 text-xs border rounded border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hi)] hover:text-[var(--text)] transition-all"
        >
          Clientes ▸
        </button>
      </div>
    </section>
  )
}
