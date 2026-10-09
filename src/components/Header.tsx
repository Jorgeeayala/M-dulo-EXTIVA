interface HeaderProps {
  onConfigClick: () => void
}

export default function Header({ onConfigClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex items-center gap-3">
        <span className="text-2xl filter drop-shadow-[0_0_8px_var(--accent)]">⚡</span>
        <div>
          <div className="font-mono text-xs font-semibold tracking-widest text-[var(--accent)]">
            MARANGATU PRO
          </div>
          <div className="font-mono text-[10px] tracking-wider text-[var(--text-muted)]">
            DNIT · Paraguay
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfigClick}
          className="flex items-center justify-center w-8 h-8 text-sm transition-all border rounded bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hi)] hover:text-[var(--text)]"
          title="Configuración"
        >
          ⚙
        </button>
      </div>
    </header>
  )
}
