import { useState } from 'react'
import { Cliente } from '../types'

interface ClientesScreenProps {
  clientes: Cliente[]
  onBack: () => void
  onAddCliente: (cliente: Cliente) => void
  onDeleteCliente: (id: string) => void
}

export default function ClientesScreen({ 
  clientes, 
  onBack, 
  onAddCliente, 
  onDeleteCliente 
}: ClientesScreenProps) {
  const [showForm, setShowForm] = useState(false)
  const [newRuc, setNewRuc] = useState('')
  const [newNombre, setNewNombre] = useState('')

  const handleSave = () => {
    if (!newRuc.trim() || !newNombre.trim()) return

    onAddCliente({
      id: '',
      ruc: newRuc.trim(),
      nombre: newNombre.trim()
    })

    setNewRuc('')
    setNewNombre('')
    setShowForm(false)
  }

  const handleCancel = () => {
    setNewRuc('')
    setNewNombre('')
    setShowForm(false)
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
          MIS CLIENTES
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto mb-3 space-y-2">
        {clientes.length === 0 ? (
          <div className="py-12 text-xs text-center text-[var(--text-dim)]">
            No hay clientes guardados
          </div>
        ) : (
          clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="flex items-center justify-between px-3 py-2.5 border rounded bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border-hi)] transition-all"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-[var(--text)]">{cliente.nombre}</div>
                <div className="text-[10px] font-mono text-[var(--text-muted)]">{cliente.ruc}</div>
              </div>
              <button
                onClick={() => onDeleteCliente(cliente.id)}
                className="px-2 py-1 text-sm transition-all rounded text-[var(--text-dim)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-2 border rounded border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-[var(--accent)]/10 transition-all text-xs font-mono"
        >
          ＋ Agregar cliente
        </button>
      ) : (
        <div className="pt-4 mt-1 border-t border-[var(--border)]">
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              RUC
            </label>
            <input
              type="text"
              value={newRuc}
              onChange={(e) => setNewRuc(e.target.value)}
              placeholder="12345678-9"
              className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Nombre / Razón Social
            </label>
            <input
              type="text"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Empresa S.A."
              className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-xs border rounded border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hi)] hover:text-[var(--text)] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold bg-[var(--accent)] text-black rounded hover:bg-[#19e8ff] transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
