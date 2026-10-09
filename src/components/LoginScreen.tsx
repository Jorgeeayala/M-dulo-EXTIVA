import { useState } from 'react'

interface LoginScreenProps {
  savedCredentials: { usuario: string; clave: string }
  onLogin: (usuario: string, clave: string, remember: boolean) => void
  onSessionActive: () => void
  isLoggedIn: boolean
}

export default function LoginScreen({ 
  savedCredentials, 
  onLogin, 
  onSessionActive,
  isLoggedIn 
}: LoginScreenProps) {
  const [usuario, setUsuario] = useState(savedCredentials.usuario)
  const [clave, setClave] = useState(savedCredentials.clave)
  const [remember, setRemember] = useState(!!savedCredentials.usuario)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(usuario, clave, remember)
  }

  return (
    <section className="p-4 max-w-md mx-auto animate-fade-in">
      <div className="font-mono text-[10px] font-semibold tracking-widest text-[var(--text-muted)] mb-4 uppercase">
        ACCESO AL SISTEMA
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Usuario
          </label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="RUC o usuario Marangatu"
            className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Clave
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              👁
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-3.5 h-3.5 accent-[var(--accent)]"
          />
          <label htmlFor="remember" className="text-xs text-[var(--text-muted)] cursor-pointer">
            Recordar credenciales
          </label>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-[var(--accent)] text-black rounded font-mono text-xs font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-[#19e8ff] hover:shadow-[0_0_16px_rgba(0,212,255,0.35)] active:scale-[0.98] transition-all"
        >
          <span>Ingresar a Marangatu</span>
          <span className="opacity-70">→</span>
        </button>
      </form>

      <div className="relative my-3 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]"></div>
        </div>
        <div className="relative inline-block px-2 text-[11px] text-[var(--text-dim)] bg-[var(--bg)]">
          o
        </div>
      </div>

      {isLoggedIn && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 mb-2 border rounded bg-[var(--green)]/10 border-[var(--green)]/20">
            <span className="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)] animate-pulse-dot"></span>
            <span className="text-xs text-[var(--green)]">Sesión activa en Marangatu</span>
          </div>

          <button
            onClick={onSessionActive}
            className="w-full px-4 py-2 border rounded border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-[var(--accent)]/10 transition-all text-xs font-mono"
          >
            Ir al Panel de Herramientas →
          </button>
        </>
      )}
    </section>
  )
}
