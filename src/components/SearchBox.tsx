import { useState } from 'react'
import { geocode } from '../lib/ors'

interface Props { value: string; onChange: (v: string) => void; onFound: (p: { lat: number; lng: number; label: string }) => void }

// Campo controlado: App lo rellena al marcar en el mapa y lo vacía al limpiar.
export default function SearchBox({ value, onChange, onFound }: Props) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setBusy(true); setMsg(null)
    try {
      const p = await geocode(value)
      p ? onFound(p) : setMsg('No se encontró esa dirección.')
    } catch { setMsg('No se pudo buscar. Inténtalo de nuevo.') }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-1">
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Dirección o lat, lon"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-route focus:outline-none focus:ring-2 focus:ring-route/30" />
        <button disabled={busy} className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? '…' : 'Buscar'}</button>
      </div>
      {msg && <p className="text-xs text-red-600">{msg}</p>}
    </form>
  )
}
