/** Escala verde → amarillo → naranja → rojo, un color fijo por cada tiempo disponible. */
export const AVAILABLE_MINUTES = [5, 10, 15, 20, 30, 45, 60] as const
export const DEFAULT_MINUTES = [15, 30, 45, 60]

export const COLORS: Record<number, string> = {
  5: '#22c55e', 10: '#84cc16', 15: '#eab308', 20: '#f59e0b',
  30: '#f97316', 45: '#ef4444', 60: '#b91c1c',
}
export const colorFor = (min: number) => COLORS[min] ?? '#64748b'
