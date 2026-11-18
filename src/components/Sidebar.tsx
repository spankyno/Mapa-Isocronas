import { AVAILABLE_MINUTES } from '../lib/colors'
import { PROFILES, type Profile } from '../lib/ors'
import type { DrawMode } from '../lib/geometry'
import { BASE_LAYERS, type BaseLayerId } from './Map'
import Legend from './Legend'
import SearchBox from './SearchBox'

interface Props {
  query: string; setQuery: (s: string) => void
  profile: Profile; setProfile: (p: Profile) => void
  mode: DrawMode; setMode: (m: DrawMode) => void
  onPickMode: () => void; onSettings: () => void
  minutes: number[]; setMinutes: (m: number[]) => void
  base: BaseLayerId; setBase: (b: BaseLayerId) => void
  loading: boolean; error: string | null; hasOrigin: boolean
  onSearch: (p: { lat: number; lng: number; label: string }) => void
  onCalculate: () => void; onClear: () => void; onExport: () => void
}

const label = 'mb-2 block text-sm font-semibold'

export default function Sidebar(p: Props) {
  const toggle = (m: number) =>
    p.setMinutes(p.minutes.includes(m) ? p.minutes.filter((x) => x !== m) : [...p.minutes, m].sort((a, b) => a - b))

  return (
    <div className="space-y-6 p-5">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Mapa Isocronas</h1>
        <p className="mt-1 text-sm text-slate-600">Haz clic en el mapa para ver hasta dónde llegas conduciendo.</p>
      </header>

      <section className="space-y-2"><span className={label}>Origen</span>
        <SearchBox value={p.query} onChange={p.setQuery} onFound={p.onSearch} />
        <button onClick={p.onPickMode} className="w-full rounded-lg border border-route py-2 text-sm font-semibold text-route hover:bg-teal-50">Marcar en el mapa</button>
      </section>

      <section>
        <span className={label}>Medio de transporte</span>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.entries(PROFILES) as [Profile, string][]).map(([id, name]) => (
            <label key={id} className={`cursor-pointer rounded-lg border px-1 py-2 text-center text-sm transition focus-within:ring-2 focus-within:ring-route/40 ${p.profile === id ? 'border-route bg-route text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
              <input type="radio" name="profile" className="sr-only" checked={p.profile === id} onChange={() => p.setProfile(id)} />{name}
            </label>
          ))}
        </div>
      </section>

      <section>
        <span className={label}>Tiempos</span>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_MINUTES.map((m) => (
            <label key={m} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition focus-within:ring-2 focus-within:ring-route/40 ${p.minutes.includes(m) ? 'border-route bg-route text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
              <input type="checkbox" className="sr-only" checked={p.minutes.includes(m)} onChange={() => toggle(m)} />
              {m} min
            </label>
          ))}
        </div>
      </section>

      <section>
        <label className={label} htmlFor="base">Mapa base</label>
        <select id="base" value={p.base} onChange={(e) => p.setBase(e.target.value as BaseLayerId)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          {Object.entries(BASE_LAYERS).map(([id, l]) => <option key={id} value={id}>{l.name}</option>)}
        </select>
      </section>

      <section>
        <span className={label}>Trazado</span>
        <div className="grid grid-cols-2 gap-1.5">
          {([['polygons', 'Polígonos'], ['rings', 'Arandelas']] as [DrawMode, string][]).map(([id, name]) => (
            <label key={id} className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-sm transition focus-within:ring-2 focus-within:ring-route/40 ${p.mode === id ? 'border-route bg-route text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
              <input type="radio" name="mode" className="sr-only" checked={p.mode === id} onChange={() => p.setMode(id)} />{name}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">{p.mode === 'rings' ? 'Cada franja empieza donde termina la anterior.' : 'Cada isócrona cubre toda el área desde el origen.'}</p>
      </section>

      <section><span className={label}>Leyenda</span><Legend minutes={p.minutes} mode={p.mode} /></section>

      {p.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{p.error}</div>}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={p.onCalculate} disabled={!p.hasOrigin || p.loading}
          className="rounded-lg bg-route px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50">
          {p.loading ? 'Calculando…' : 'Calcular'}
        </button>
        <button onClick={p.onClear} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-50">Limpiar</button>
        <button onClick={p.onExport} className="col-span-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-slate-800">Exportar…</button>
        <button onClick={p.onSettings} className="col-span-2 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-50">Configuración</button>
      </div>
    </div>
  )
}
