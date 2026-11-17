import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson'

export type IsoCollection = FeatureCollection<Polygon | MultiPolygon, { value: number; area?: number }>

// Proxy que oculta la API key (ver api/ors.ts o worker/ors-worker.js)
const PROXY = import.meta.env.VITE_ORS_PROXY_URL ?? '/api/ors'
export type Profile = 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking'
export const PROFILES: Record<Profile, string> = {
  'driving-car': 'Coche', 'driving-hgv': 'Camión', 'cycling-regular': 'Bici', 'foot-walking': 'A pie',
}
const MAX_SECONDS = 3600 // límite de la app (y del plan gratuito de ORS)
export const BASE_SPEED = 80 // km/h de referencia

/**
 * ORS no admite "velocidad media" como parámetro: usa su propio perfil de red viaria.
 * Para ofrecer ese control, escalamos el tiempo pedido respecto a 80 km/h
 * (más velocidad ⇒ más segundos de alcance). Es una aproximación, no un cálculo exacto.
 */
export function effectiveSeconds(minutes: number, speedKmh: number): number {
  return Math.min(MAX_SECONDS, Math.round(minutes * 60 * (speedKmh / BASE_SPEED)))
}

export async function fetchIsochrones(
  origin: { lat: number; lng: number }, minutes: number[], speedKmh: number, token: string | null, profile: Profile = 'driving-car',
): Promise<{ data: IsoCollection; remaining: string | null }> {
  const res = await fetch(`${PROXY}?profile=${profile}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify({
      locations: [[origin.lng, origin.lat]], // ORS usa [lon, lat]
      range: minutes.map((m) => effectiveSeconds(m, speedKmh)),
    }),
  })
  if (res.status === 401) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.')
  if (res.status === 429) throw new Error('Has alcanzado el límite de 3 mapas diarios. Hazte Pro para uso ilimitado o vuelve mañana.')
  if (res.status === 502) throw new Error('API key de ORS inválida (configuración del servidor).')
  if (res.status === 503) throw new Error('OpenRouteService está saturado. Espera un momento.')
  if (res.status === 504) throw new Error('OpenRouteService está saturado o inestable ahora mismo (el fallo es de su servicio, no de tu punto). Reinténtalo en unos minutos o prueba con menos tiempos o un máximo menor (p. ej. 30–45 min).')
  if (!res.ok) {
    // El proxy devuelve { error, detail }: mostramos la causa real en lugar de suponerla
    const j = (await res.json().catch(() => null)) as { detail?: string; status?: number } | null
    const d = j?.detail ? ` Detalle: ${j.detail}` : ''
    throw new Error(res.status === 422
      ? `OpenRouteService no pudo calcular esta zona${j?.status === 404 ? ' (¿punto lejos de una carretera?)' : ''}.${d}`
      : `Error del servidor (${res.status}).${d}`)
  }
  const data = (await res.json()) as IsoCollection
  if (!data.features?.length) throw new Error('No hay resultados para este punto. Prueba con otro origen.')
  return { data, remaining: res.headers.get('X-Remaining') }
}

/** Mapas restantes hoy ("unlimited" para Pro), sin consumir cuota. */
export async function fetchQuota(token: string | null): Promise<string | null> {
  try {
    const r = await fetch(PROXY, { headers: { Authorization: `Bearer ${token ?? ''}` } })
    return r.ok ? ((await r.json()) as { remaining: string }).remaining : null
  } catch { return null }
}

/** Búsqueda simple con Nominatim, limitada a España. También acepta "lat, lon". */
export async function geocode(q: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (m) return { lat: +m[1], lng: +m[2], label: `${m[1]}, ${m[2]}` }
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(q)}`)
  const j = (await r.json()) as { lat: string; lon: string; display_name: string }[]
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon, label: j[0].display_name } : null
}
