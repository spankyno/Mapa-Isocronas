import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import Map, { type BaseLayerId } from './components/Map'
import Sidebar from './components/Sidebar'
import { useIsochrones } from './hooks/useIsochrones'
import { DEFAULT_MINUTES } from './lib/colors'

type LatLng = { lat: number; lng: number }

export default function App() {
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [speed, setSpeed] = useState(80)
  const [minutes, setMinutes] = useState<number[]>(DEFAULT_MINUTES)
  const [base, setBase] = useState<BaseLayerId>('carto')
  const [drawer, setDrawer] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const { layers, loading, error, calculate, clear } = useIsochrones()

  // Colocar origen (clic o búsqueda) ⇒ calcula automáticamente.
  const pick = (p: LatLng) => { setOrigin(p); calculate(p, minutes, speed) }
  const run = () => origin && calculate(origin, minutes, speed)
  const reset = () => { setOrigin(null); clear() }

  // Cierra el drawer móvil al empezar a calcular para ver el resultado.
  useEffect(() => { if (loading) setDrawer(false) }, [loading])

  async function exportPng() {
    if (!mapRef.current) return
    const canvas = await html2canvas(mapRef.current, { useCORS: true, backgroundColor: null })
    const a = document.createElement('a')
    a.download = 'mapa-isocronas.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  const sidebar = (
    <Sidebar speed={speed} setSpeed={setSpeed} minutes={minutes} setMinutes={setMinutes} base={base} setBase={setBase}
      loading={loading} error={error} hasOrigin={!!origin} onSearch={pick} onCalculate={run} onClear={reset} onExport={exportPng} />
  )

  return (
    <div className="flex h-full">
      <aside className="hidden w-96 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block">{sidebar}</aside>

      <main className="relative flex-1">
        <Map ref={mapRef} origin={origin} layers={layers} base={base} onPick={pick} />

        {loading && (
          <div className="absolute inset-x-0 top-4 z-[1000] mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Calculando isócronas…
          </div>
        )}

        {/* Móvil: botón + drawer inferior */}
        <button onClick={() => setDrawer(true)}
          className="absolute bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-ink px-5 py-3 font-semibold text-white shadow-lg md:hidden">
          Opciones
        </button>
        {drawer && (
          <div className="fixed inset-0 z-[2000] md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
              <button onClick={() => setDrawer(false)} aria-label="Cerrar" className="mx-auto mt-2 block h-1.5 w-12 rounded-full bg-slate-300" />
              {sidebar}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
