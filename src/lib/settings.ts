import { COLORS } from './colors'

export interface Settings {
  fillEnabled: boolean; fillOpacity: number
  borderEnabled: boolean; borderWeight: number; borderOpacity: number; borderDashed: boolean
  borderSameAsFill: boolean; borderColor: string
  colors: Record<number, string> // color de relleno por cada tiempo
  marker: { shape: 'pin' | 'circle' | 'ring'; size: number; color: string; border: string }
}

export const DEFAULT_SETTINGS: Settings = {
  fillEnabled: true, fillOpacity: 0.4,
  borderEnabled: true, borderWeight: 2, borderOpacity: 1, borderDashed: false,
  borderSameAsFill: true, borderColor: '#14213d',
  colors: { ...COLORS },
  marker: { shape: 'pin', size: 24, color: '#14213d', border: '#ffffff' },
}

const KEY = 'mapa-isocronas:settings'

const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)
const num = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)

/** Valida cada campo (tipo, rango, color #rrggbb, forma permitida): el contenido de localStorage no es de confianza. */
function sanitize(raw: any): Settings {
  const D = DEFAULT_SETTINGS, m = raw?.marker ?? {}
  return {
    fillEnabled: raw?.fillEnabled !== false, fillOpacity: num(raw?.fillOpacity, D.fillOpacity, 0, 1),
    borderEnabled: raw?.borderEnabled !== false, borderWeight: num(raw?.borderWeight, D.borderWeight, 0, 20),
    borderOpacity: num(raw?.borderOpacity, D.borderOpacity, 0, 1), borderDashed: raw?.borderDashed === true,
    borderSameAsFill: raw?.borderSameAsFill !== false, borderColor: isHex(raw?.borderColor) ? raw.borderColor : D.borderColor,
    colors: Object.fromEntries(Object.entries(D.colors).map(([k, v]) => [k, isHex(raw?.colors?.[k]) ? raw.colors[k] : v])) as Record<number, string>,
    marker: {
      shape: ['pin', 'circle', 'ring'].includes(m.shape) ? m.shape : D.marker.shape, size: num(m.size, D.marker.size, 8, 64),
      color: isHex(m.color) ? m.color : D.marker.color, border: isHex(m.border) ? m.border : D.marker.border,
    },
  }
}

/** Carga los ajustes guardados (validados) o los valores por defecto. */
export function loadSettings(): Settings {
  try { const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (raw) return sanitize(raw) } catch { /* ajustes corruptos: usar defaults */ }
  return DEFAULT_SETTINGS
}
export function saveSettings(s: Settings) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignorar */ } }
