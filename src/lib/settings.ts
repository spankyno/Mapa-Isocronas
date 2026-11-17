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

/** Carga ajustes guardados (localStorage) mezclados con los valores por defecto. */
export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw) return { ...DEFAULT_SETTINGS, ...raw, colors: { ...COLORS, ...raw.colors }, marker: { ...DEFAULT_SETTINGS.marker, ...raw.marker } }
  } catch { /* ajustes corruptos: usar defaults */ }
  return DEFAULT_SETTINGS
}
export function saveSettings(s: Settings) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignorar */ } }
