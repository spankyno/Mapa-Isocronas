import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import Map, { type BaseLayerId } from './components/Map'
import Sidebar from './components/Sidebar'
import SettingsModal from './components/SettingsModal'
import { useIsochrones } from './hooks/useIsochrones'
import { DEFAULT_MINUTES } from './lib/colors'
import { BASE_SPEED } from './lib/ors'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './lib/settings'

type LatLng = { lat: number; lng: number }

export default function App() {
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [query, setQuery] = useState('') // texto del buscador (se sincroniza con el origen)
  const [minutes, setMinutes] = useState<number[]>(DEFAULT_MINUTES)
  const [base, setBase] = useState<BaseLayerId>('osm') // OSM por defecto
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [hint, setHint] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const { layers, loading, error, calculate, clear } = useIsochrones()

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => { if (loading) setDrawer(false) }, [loading])

  // Fijar origen (clic, arrastre o búsqueda) ⇒ actualiza el texto y calcula.
  const pick = (p: LatLng, label?: string) => {
    setOrigin(p); setQuery(label ?? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`)
    calculate(p, minutes, BASE_SPEED)
  }
  const reset = () => { setOrigin(null); setQuery(''); clear() } // elimina origen y texto
  const markOnMap = () => { setDrawer(false); setHint(true); setTimeout(() => setHint(false), 4000) }

  async function exportPng() {
    if (!mapRef.current) return
    const canvas = await html2canvas(mapRef.current, { useCORS: true, backgroundColor: null })
    const a = document.createElement('a')
    a.download = 'mapa-isocronas.png'; a.href = canvas.toDataURL('image/png'); a.click()
  }

  const sidebar = (
    <Sidebar query={query} setQuery={setQuery} minutes={minutes} setMinutes={setMinutes} base={base} setBase={setBase}
      loading={loading} error={error} hasOrigin={!!origin} onSearch={(p) => pick(p, p.label)} onPickMode={markOnMap}
      onCalculate={() => origin && calculate(origin, minutes, BASE_SPEED)} onClear={reset} onExport={exportPng}
      onSettings={() => { setDrawer(false); setSettingsOpen(true) }} />
  )

  return (
    <div className="flex h-full">
      <aside className="hidden w-96 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block">{sidebar}</aside>
      <main className="relative flex-1">
        <Map ref={mapRef} origin={origin} layers={layers} base={base} settings={settings} onPick={pick} />

        {(!origin || hint) && !loading && (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] mx-auto w-fit rounded-full bg-white px-4 py-2 text-sm font-medium shadow-lg">
            {origin ? 'Haz clic en el mapa para mover el origen' : 'Haz clic en el mapa para marcar el origen'}
          </div>
        )}
        {loading && (
          <div className="absolute inset-x-0 top-4 z-[1000] mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Calculando isócronas…
          </div>
        )}

        <button onClick={() => setDrawer(true)}
          className="absolute bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-ink px-5 py-3 font-semibold text-white shadow-lg md:hidden">Opciones</button>
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
      {settingsOpen && <SettingsModal s={settings} onChange={setSettings} onReset={() => setSettings(DEFAULT_SETTINGS)} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
