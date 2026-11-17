import { useState } from 'react'
import type { Map as LMap } from 'leaflet'
import type { IsoLayer } from '../hooks/useIsochrones'
import { PROFILES, type Profile } from '../lib/ors'
import type { Settings } from '../lib/settings'
import { download, toGeoJSON, toKML, toPNG, toSVG, type ExportCtx } from '../lib/export'

interface Props {
  layers: IsoLayer[]; origin: { lat: number; lng: number } | null; profile: Profile; settings: Settings
  mapEl: HTMLDivElement | null; map: LMap | null; onClose: () => void
}

export default function ExportModal({ layers, origin, profile, settings, mapEl, map, onClose }: Props) {
  const [title, setTitle] = useState(`Isócronas · ${PROFILES[profile]}`)
  const [showTitle, setShowTitle] = useState(true)
  const [legend, setLegend] = useState(true)
  const [scale, setScale] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const ctx: ExportCtx = { layers, origin, profile, profileLabel: PROFILES[profile], settings }
  const name = `mapa-isocronas-${profile}`
  const has = layers.length > 0
  const t = showTitle ? title.trim() : ''

  async function run(kind: 'png' | 'geojson' | 'kml' | 'svg') {
    setBusy(true); setErr(null)
    try {
      if (kind === 'png') { if (!mapEl) throw new Error('El mapa no está listo'); download(`${name}.png`, await toPNG(mapEl, map, ctx, { title: t, legend, scale })) }
      if (kind === 'geojson') download(`${name}.geojson`, JSON.stringify(toGeoJSON(ctx)), 'application/geo+json')
      if (kind === 'kml') download(`${name}.kml`, toKML(ctx), 'application/vnd.google-earth.kml+xml')
      if (kind === 'svg') download(`${name}.svg`, toSVG(ctx, { title: t, legend }), 'image/svg+xml')
    } catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo exportar') }
    finally { setBusy(false) }
  }

  const check = (label: string, v: boolean, fn: (b: boolean) => void) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v} onChange={(e) => fn(e.target.checked)} className="h-4 w-4 accent-route" />{label}</label>)
  const btn = 'rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-40'

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/25 md:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Exportar" onClick={(e) => e.stopPropagation()} className="w-full space-y-5 rounded-t-2xl bg-white p-5 shadow-2xl md:max-w-md md:rounded-2xl">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Exportar</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">Cerrar</button></div>

        <section className="space-y-2">
          <h3 className="text-sm font-bold">Elementos (PNG y SVG)</h3>
          {check('Título', showTitle, setShowTitle)}
          {showTitle && <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />}
          {check('Leyenda', legend, setLegend)}
          {check('Escala (solo PNG)', scale, setScale)}
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button disabled={busy} onClick={() => run('png')} className={`${btn} col-span-2 bg-ink text-white`}>{busy ? 'Generando…' : 'Imagen PNG'}</button>
          <button disabled={busy || !has} onClick={() => run('geojson')} className={`${btn} border border-slate-300`}>GeoJSON</button>
          <button disabled={busy || !has} onClick={() => run('kml')} className={`${btn} border border-slate-300`}>KML</button>
          <button disabled={busy || !has} onClick={() => run('svg')} className={`${btn} col-span-2 border border-slate-300`}>SVG</button>
        </section>
        <p className="text-xs text-slate-500">GeoJSON y KML van georreferenciados (WGS84) y se abren en QGIS o Google Earth. Los vectoriales requieren haber calculado isócronas.</p>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      </div>
    </div>
  )
}
