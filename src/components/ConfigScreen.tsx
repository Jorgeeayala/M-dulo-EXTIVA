import { useState } from 'react'
import { Config } from '../types'

interface ConfigScreenProps {
  config: Config
  onBack: () => void
  onSave: (config: Config) => void
  onClearData: () => void
}

export default function ConfigScreen({ config, onBack, onSave, onClearData }: ConfigScreenProps) {
  const [autologin, setAutologin] = useState(config.autologin)
  const [delay, setDelay] = useState(config.delay)
  const [prefix, setPrefix] = useState(config.prefix)

  const handleSave = () => {
    onSave({ autologin, delay, prefix })
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
          CONFIGURACIÓN
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
          <label className="text-xs text-[var(--text)] flex-1">
            Login automático al abrir Marangatu
          </label>
          <label className="relative inline-block w-10 h-5 flex-shrink-0">
            <input
              type="checkbox"
              checked={autologin}
              onChange={(e) => setAutologin(e.target.checked)}
              className="opacity-0 w-0 h-0 peer"
            />
            <span className="absolute inset-0 bg-[var(--bg-input)] border border-[var(--border)] rounded-full cursor-pointer transition-all peer-checked:bg-[var(--accent)]/15 peer-checked:border-[var(--accent)] before:absolute before:content-[''] before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-[var(--text-dim)] before:rounded-full before:transition-all peer-checked:before:translate-x-5 peer-checked:before:bg-[var(--accent)]"></span>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
          <label className="text-xs text-[var(--text)] flex-1">
            Delay entre descargas (segundos)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value) || 2)}
            className="w-20 px-3 py-1.5 text-xs text-right font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
          <label className="text-xs text-[var(--text)] flex-1">
            Prefijo de carpeta en descargas
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="IVA"
            className="w-20 px-3 py-1.5 text-xs text-right font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2.5 mb-5 bg-[var(--accent)] text-black rounded font-mono text-xs font-semibold tracking-wide hover:bg-[#19e8ff] hover:shadow-[0_0_16px_rgba(0,212,255,0.35)] active:scale-[0.98] transition-all"
      >
        Guardar configuración
      </button>

      <div className="pt-4 mt-5 border-t border-[var(--red)]/20">
        <div className="font-mono text-[10px] text-[var(--red)] mb-3 uppercase tracking-widest">
          Zona peligrosa
        </div>
        <button
          onClick={onClearData}
          className="w-full px-4 py-2 border rounded border-[var(--red)] text-[var(--red)] bg-transparent hover:bg-[var(--red)]/10 transition-all text-xs"
        >
          Borrar todos los datos
        </button>
      </div>
    </section>
  )
}
