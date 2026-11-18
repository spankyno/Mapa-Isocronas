import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { type BaseLayerId } from './components/Map'
import Sidebar from './components/Sidebar'
import SettingsModal from './components/SettingsModal'
import { useIsochrones } from './hooks/useIsochrones'
import { DEFAULT_MINUTES } from './lib/colors'
import Landing from './components/Landing'
import Footer from './components/Footer'
import Privacy from './components/Privacy'
import { BASE_SPEED, fetchQuota, type Profile } from './lib/ors'
import ExportModal from './components/ExportModal'
import { buildShapes, type DrawMode } from './lib/geometry'
import type { Map as LMap } from 'leaflet'
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/react'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './lib/settings'

type LatLng = { lat: number; lng: number }

function Tool() {
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [query, setQuery] = useState('') // texto del buscador (se sincroniza con el origen)
  const [minutes, setMinutes] = useState<number[]>(DEFAULT_MINUTES)
  const [base, setBase] = useState<BaseLayerId>('osm') // OSM por defecto
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [profile, setProfile] = useState<Profile>('driving-car') // coche por defecto
  const [mode, setMode] = useState<DrawMode>('polygons') // trazado: polígonos superpuestos o arandelas
  const [exportOpen, setExportOpen] = useState(false)
  const leafletRef = useRef<LMap | null>(null)
  const [picking, setPicking] = useState(false) // true solo tras pulsar "Marcar en el mapa"
  const mapRef = useRef<HTMLDivElement>(null)
  const { getToken } = useAuth()
  const { layers, loading, error, remaining, resultProfile, setRemaining, calculate, clear } = useIsochrones(getToken)
  const shapes = useMemo(() => buildShapes(layers, mode), [layers, mode])

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && setPicking(false); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [])
  useEffect(() => { getToken().then(fetchQuota).then((r) => r && setRemaining(r)).catch(() => {}) }, [getToken, setRemaining])
  useEffect(() => { if (loading) setDrawer(false) }, [loading])

  // Fijar origen (clic, arrastre o búsqueda) ⇒ actualiza el texto y calcula.
  const pick = (p: LatLng, label?: string) => {
    setPicking(false)
    setOrigin(p); setQuery(label ?? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`)
    calculate(p, minutes, BASE_SPEED, profile)
  }
  const reset = () => { setPicking(false); setOrigin(null); setQuery(''); clear() } // elimina origen y texto
  const markOnMap = () => { setDrawer(false); setPicking((v) => !v) }


  const sidebar = (
    <Sidebar query={query} setQuery={setQuery} profile={profile} setProfile={setProfile} mode={mode} setMode={setMode} minutes={minutes} setMinutes={setMinutes} base={base} setBase={setBase}
      loading={loading} error={error} hasOrigin={!!origin} onSearch={(p) => pick(p, p.label)} onPickMode={markOnMap}
      onCalculate={() => origin && calculate(origin, minutes, BASE_SPEED, profile)} onClear={reset} onExport={() => { setDrawer(false); setExportOpen(true) }}
      onSettings={() => { setDrawer(false); setSettingsOpen(true) }} />
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
      <aside className="hidden w-96 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block">{sidebar}</aside>
      <main className="relative flex-1">
        <Map ref={mapRef} origin={origin} layers={layers} shapes={shapes} mode={mode} base={base} settings={settings} picking={picking} leafletRef={leafletRef} onPick={pick} />

        {/* Cuenta y cuota diaria */}
        <div className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-white py-1.5 pl-3 pr-1.5 text-sm font-medium shadow-lg">
          {remaining && <span>{remaining === 'unlimited' ? 'Pro · ilimitado' : `${remaining} ${remaining === '1' ? 'mapa' : 'mapas'} hoy`}</span>}
          <UserButton />
        </div>

        {picking && !loading && (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] mx-auto w-fit rounded-full bg-white px-4 py-2 text-sm font-medium shadow-lg">
            {origin ? 'Haz clic en el mapa para mover el origen' : 'Haz clic en el mapa para marcar el origen'} (Esc para cancelar)
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
      </div>
      <Footer />
      {exportOpen && <ExportModal shapes={shapes} mode={mode} origin={origin} profile={resultProfile} settings={settings} mapEl={mapRef.current} map={leafletRef.current} onClose={() => setExportOpen(false)} />}
      {settingsOpen && <SettingsModal s={settings} onChange={setSettings} onReset={() => setSettings(DEFAULT_SETTINGS)} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function useHash() {
  const [h, setH] = useState(window.location.hash)
  useEffect(() => { const f = () => setH(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  return h
}

/** Landing para anónimos, herramienta para registrados (el servidor lo vuelve a comprobar). La política es pública. */
export default function App() {
  const hash = useHash()
  const { isSignedIn } = useAuth()
  if (hash === '#privacidad') return <Privacy />
  if (hash === '#acerca') return <Landing signedIn={!!isSignedIn} /> // "Acerca de": visible para todos
  return (
    <>
      <Show when="signed-out"><Landing /></Show>
      <Show when="signed-in"><Tool /></Show>
    </>
  )
}
