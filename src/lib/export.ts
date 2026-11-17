import html2canvas from 'html2canvas'
import type { Map as LMap } from 'leaflet'
import type { IsoLayer } from '../hooks/useIsochrones'
import type { Settings } from './settings'

export interface ExportCtx { layers: IsoLayer[]; origin: { lat: number; lng: number } | null; profile: string; profileLabel: string; settings: Settings }
export interface VisualOpts { title: string; legend: boolean; scale: boolean }

export function download(name: string, data: string | Blob, mime = 'text/plain') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: mime }))
  a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Leyenda: tiempos ordenados de menor a mayor con su color. */
const legendItems = (c: ExportCtx) => [...c.layers].sort((a, b) => a.minutes - b.minutes).map((l) => ({ label: `hasta ${l.minutes} min`, color: c.settings.colors[l.minutes] }))
const polysOf = (l: IsoLayer) => (l.feature.geometry.type === 'Polygon' ? [l.feature.geometry.coordinates] : l.feature.geometry.coordinates)
const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)

// ---------- GeoJSON (WGS84, EPSG:4326). Orden: de mayor a menor, como se pintan en un SIG ----------
export function toGeoJSON(c: ExportCtx) {
  return {
    type: 'FeatureCollection', name: 'isocronas',
    features: [
      ...c.layers.map((l) => ({ type: 'Feature', geometry: l.feature.geometry,
        properties: { minutos: l.minutes, perfil: c.profileLabel, color: c.settings.colors[l.minutes], area_m2: l.feature.properties.area ?? null } })),
      ...(c.origin ? [{ type: 'Feature', properties: { tipo: 'origen' }, geometry: { type: 'Point', coordinates: [c.origin.lng, c.origin.lat] } }] : []),
    ],
  }
}

// ---------- KML (Google Earth / QGIS). Los colores van en formato aabbggrr ----------
const kmlColor = (hex: string, alpha: number) => Math.round(alpha * 255).toString(16).padStart(2, '0') + hex.slice(5, 7) + hex.slice(3, 5) + hex.slice(1, 3)
const ring = (r: number[][]) => r.map((p) => `${p[0]},${p[1]},0`).join(' ')
const kmlPoly = (rings: number[][][]) => `<Polygon><outerBoundaryIs><LinearRing><coordinates>${ring(rings[0])}</coordinates></LinearRing></outerBoundaryIs>` +
  rings.slice(1).map((h) => `<innerBoundaryIs><LinearRing><coordinates>${ring(h)}</coordinates></LinearRing></innerBoundaryIs>`).join('') + '</Polygon>'

export function toKML(c: ExportCtx) {
  const s = c.settings
  const marks = c.layers.map((l) => {
    const col = s.colors[l.minutes], line = s.borderSameAsFill ? col : s.borderColor
    const polys = polysOf(l).map(kmlPoly)
    return `<Placemark><name>hasta ${l.minutes} min</name><description>${esc(c.profileLabel)}</description>
<Style><PolyStyle><color>${kmlColor(col, s.fillOpacity)}</color><fill>${s.fillEnabled ? 1 : 0}</fill><outline>${s.borderEnabled ? 1 : 0}</outline></PolyStyle>
<LineStyle><color>${kmlColor(line, s.borderOpacity)}</color><width>${s.borderWeight}</width></LineStyle></Style>
${polys.length > 1 ? `<MultiGeometry>${polys.join('')}</MultiGeometry>` : polys[0]}</Placemark>`
  }).join('\n')
  const o = c.origin ? `<Placemark><name>Origen</name><Point><coordinates>${c.origin.lng},${c.origin.lat},0</coordinates></Point></Placemark>` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Isócronas · ${esc(c.profileLabel)}</name>\n${marks}\n${o}</Document></kml>`
}

// ---------- SVG (proyección Web Mercator EPSG:3857, sin mapa base) ----------
export function toSVG(c: ExportCtx, o: Pick<VisualOpts, 'title' | 'legend'>) {
  const s = c.settings
  const P = (lng: number, lat: number) => [(lng * Math.PI) / 180, Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))]
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  c.layers.forEach((l) => polysOf(l).forEach((p) => p[0].forEach(([lng, lat]) => {
    const [x, y] = P(lng, lat); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  })))
  const W = 1000, pad = 30, k = (W - 2 * pad) / (x1 - x0), top = pad + (o.title ? 50 : 0), H = Math.round(top + (y1 - y0) * k + pad)
  const xy = (lng: number, lat: number) => { const [x, y] = P(lng, lat); return [pad + (x - x0) * k, top + (y1 - y) * k] }
  const d = (rings: number[][][]) => rings.map((r) => 'M' + r.map(([lng, lat]) => xy(lng, lat).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join('')
  const paths = c.layers.map((l) => {
    const col = s.colors[l.minutes]
    return `<path d="${polysOf(l).map(d).join('')}" fill-rule="evenodd" fill="${s.fillEnabled ? col : 'none'}" fill-opacity="${s.fillOpacity}" stroke="${s.borderEnabled ? (s.borderSameAsFill ? col : s.borderColor) : 'none'}" stroke-width="${s.borderWeight}" stroke-opacity="${s.borderOpacity}"${s.borderDashed ? ' stroke-dasharray="8 6"' : ''}><title>hasta ${l.minutes} min</title></path>`
  }).join('\n')
  const org = c.origin ? (([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.marker.size / 3}" fill="${s.marker.color}" stroke="${s.marker.border}" stroke-width="3"/>`)(xy(c.origin.lng, c.origin.lat)) : ''
  const items = legendItems(c), lh = items.length * 22 + 16
  const legend = o.legend ? `<g font-size="13"><rect x="${pad}" y="${H - pad - lh}" width="150" height="${lh}" rx="10" fill="#fff" fill-opacity=".92"/>` +
    items.map((it, i) => `<rect x="${pad + 12}" y="${H - pad - lh + 12 + i * 22}" width="14" height="14" rx="3" fill="${it.color}"/><text x="${pad + 34}" y="${H - pad - lh + 24 + i * 22}" fill="#14213d">${it.label}</text>`).join('') + '</g>' : ''
  const title = o.title ? `<text x="${pad}" y="${pad + 24}" font-size="24" font-weight="700" fill="#14213d">${esc(o.title)}</text>` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui, sans-serif">
<desc>Isócronas (${esc(c.profileLabel)}). Proyección EPSG:3857. Extensión WGS84 del contenido no incluida; usa GeoJSON/KML para georreferenciar.</desc>
<rect width="${W}" height="${H}" fill="#f8fafc"/>${title}\n${paths}\n${org}${legend}</svg>`
}

// ---------- PNG: captura del mapa + título, leyenda y escala dibujados encima ----------
export async function toPNG(el: HTMLElement, map: LMap | null, c: ExportCtx, o: VisualOpts): Promise<Blob> {
  const shot = await html2canvas(el, { useCORS: true, backgroundColor: null, ignoreElements: (e) => e.classList.contains('leaflet-control-zoom') })
  const f = shot.width / el.clientWidth, W = el.clientWidth, H = el.clientHeight
  const g = shot.getContext('2d')!
  g.scale(f, f); g.textBaseline = 'top'
  const font = (w: number, px: number) => (g.font = `${w} ${px}px "Instrument Sans", system-ui, sans-serif`)
  const box = (x: number, y: number, w: number, h: number) => { g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill() }

  if (o.title) { font(700, 20); const w = g.measureText(o.title).width; box(16, 16, w + 28, 42); g.fillStyle = '#14213d'; g.fillText(o.title, 30, 27) }

  const items = legendItems(c)
  if (o.legend && items.length) {
    font(500, 13); const h = items.length * 22 + 16, w = Math.max(...items.map((i) => g.measureText(i.label).width)) + 50, y = H - h - 16
    box(16, y, w, h)
    items.forEach((it, i) => { g.globalAlpha = 0.85; g.fillStyle = it.color; g.fillRect(28, y + 12 + i * 22, 14, 14); g.globalAlpha = 1; g.fillStyle = '#14213d'; g.fillText(it.label, 50, y + 12 + i * 22) })
  }

  if (o.scale && map) {
    // metros por píxel en la latitud del centro (Web Mercator)
    const mpp = (40075016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (256 * 2 ** map.getZoom())
    const target = mpp * 140, pow = 10 ** Math.floor(Math.log10(target))
    const nice = [5, 2, 1].map((k) => k * pow).find((v) => v <= target) ?? pow
    const px = nice / mpp, label = nice >= 1000 ? `${nice / 1000} km` : `${nice} m`, x = W - px - 32, y = H - 48
    box(x - 12, y - 28, px + 24, 46); g.strokeStyle = '#14213d'; g.lineWidth = 2
    g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x, y + 8); g.lineTo(x + px, y + 8); g.lineTo(x + px, y - 4); g.stroke()
    font(600, 12); g.fillStyle = '#14213d'; g.fillText(label, x, y - 20)
  }
  return new Promise((res, rej) => shot.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo generar la imagen'))), 'image/png'))
}
