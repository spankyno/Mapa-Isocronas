import { AVAILABLE_MINUTES } from '../lib/colors'
import type { Settings } from '../lib/settings'

interface Props { s: Settings; onChange: (s: Settings) => void; onReset: () => void; onClose: () => void }

const row = 'flex items-center justify-between gap-3 text-sm'
const h = 'mb-3 text-sm font-bold'

export default function SettingsModal({ s, onChange, onReset, onClose }: Props) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...s, [k]: v })
  const setMarker = (v: Partial<Settings['marker']>) => onChange({ ...s, marker: { ...s.marker, ...v } })

  // Helpers (funciones, no componentes, para no remontar inputs al escribir)
  const range = (label: string, value: number, min: number, max: number, step: number, fn: (n: number) => void) => (
    <label className={row}><span className="w-36">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => fn(+e.target.value)} className="flex-1 accent-route" />
      <span className="w-10 text-right tabular-nums">{value}</span></label>)
  const check = (label: string, value: boolean, fn: (b: boolean) => void) => (
    <label className={row}><span>{label}</span><input type="checkbox" checked={value} onChange={(e) => fn(e.target.checked)} className="h-4 w-4 accent-route" /></label>)
  const color = (label: string, value: string, fn: (c: string) => void) => (
    <label className={row}><span>{label}</span><input type="color" value={value} onChange={(e) => fn(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-slate-300" /></label>)

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/25 md:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Configuración" onClick={(e) => e.stopPropagation()}
        className="max-h-[90%] w-full space-y-6 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl md:max-w-lg md:rounded-2xl">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Configuración</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">Cerrar</button></div>

        <section className="space-y-3"><h3 className={h}>Relleno de las isócronas</h3>
          {check('Mostrar relleno', s.fillEnabled, (v) => set('fillEnabled', v))}
          {range('Transparencia', s.fillOpacity, 0.05, 1, 0.05, (v) => set('fillOpacity', v))}
        </section>

        <section className="space-y-3"><h3 className={h}>Borde</h3>
          {check('Mostrar borde', s.borderEnabled, (v) => set('borderEnabled', v))}
          {range('Grosor (px)', s.borderWeight, 1, 8, 0.5, (v) => set('borderWeight', v))}
          {range('Opacidad', s.borderOpacity, 0.1, 1, 0.05, (v) => set('borderOpacity', v))}
          {check('Línea discontinua', s.borderDashed, (v) => set('borderDashed', v))}
          {check('Mismo color que el relleno', s.borderSameAsFill, (v) => set('borderSameAsFill', v))}
          {!s.borderSameAsFill && color('Color del borde', s.borderColor, (v) => set('borderColor', v))}
        </section>

        <section className="space-y-3"><h3 className={h}>Color por tiempo</h3>
          {AVAILABLE_MINUTES.map((m) => color(`${m} min`, s.colors[m], (v) => set('colors', { ...s.colors, [m]: v })))}
        </section>

        <section className="space-y-3"><h3 className={h}>Marcador de origen</h3>
          <label className={row}><span>Forma</span>
            <select value={s.marker.shape} onChange={(e) => setMarker({ shape: e.target.value as Settings['marker']['shape'] })}
              className="rounded-lg border border-slate-300 px-2 py-1.5">
              <option value="pin">Chincheta</option><option value="circle">Círculo</option><option value="ring">Anillo</option>
            </select></label>
          {range('Tamaño (px)', s.marker.size, 12, 56, 2, (v) => setMarker({ size: v }))}
          {color('Color', s.marker.color, (v) => setMarker({ color: v }))}
          {color('Borde', s.marker.border, (v) => setMarker({ border: v }))}
        </section>

        <button onClick={onReset} className="w-full rounded-lg border border-slate-300 py-2.5 font-semibold hover:bg-slate-50">Restablecer valores</button>
      </div>
    </div>
  )
}
