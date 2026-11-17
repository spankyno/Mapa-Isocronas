import { AVAILABLE_MINUTES } from '../lib/colors'
import { BASE_LAYERS, type BaseLayerId } from './Map'
import Legend from './Legend'
import SearchBox from './SearchBox'

interface Props {
  speed: number; setSpeed: (n: number) => void
  minutes: number[]; setMinutes: (m: number[]) => void
  base: BaseLayerId; setBase: (b: BaseLayerId) => void
  loading: boolean; error: string | null; hasOrigin: boolean
  onSearch: (p: { lat: number; lng: number }) => void
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

      <section><span className={label}>Buscar origen</span><SearchBox onFound={p.onSearch} /></section>

      <section>
        <label className={label} htmlFor="speed">Velocidad media: {p.speed} km/h</label>
        <input id="speed" type="range" min={40} max={120} step={5} value={p.speed}
          onChange={(e) => p.setSpeed(+e.target.value)} className="w-full accent-route" />
        <p className="mt-1 text-xs text-slate-500">Escala el alcance respecto a 80 km/h. Máximo: 60 min.</p>
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

      <section><span className={label}>Leyenda</span><Legend minutes={p.minutes} /></section>

      {p.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{p.error}</div>}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={p.onCalculate} disabled={!p.hasOrigin || p.loading}
          className="rounded-lg bg-route px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50">
          {p.loading ? 'Calculando…' : 'Calcular'}
        </button>
        <button onClick={p.onClear} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-50">Limpiar</button>
        <button onClick={p.onExport} className="col-span-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-slate-800">Exportar mapa (PNG)</button>
      </div>
    </div>
  )
}
