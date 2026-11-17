import { useCallback, useState } from 'react'
import { fetchIsochrones, effectiveSeconds, type IsoCollection } from '../lib/ors'

export interface IsoLayer { minutes: number; feature: IsoCollection['features'][number] }

export function useIsochrones() {
  const [layers, setLayers] = useState<IsoLayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (origin: { lat: number; lng: number }, minutes: number[], speed: number) => {
    if (!minutes.length) { setError('Selecciona al menos un tiempo.'); return }
    setLoading(true); setError(null)
    try {
      const data = await fetchIsochrones(origin, minutes, speed)
      // Emparejamos cada feature con sus minutos pedidos y ordenamos de mayor a menor
      // para que las zonas pequeñas se pinten encima de las grandes.
      const byValue = new Map(minutes.map((m) => [effectiveSeconds(m, speed), m]))
      const out = data.features
        .map((f) => ({ minutes: byValue.get(f.properties.value) ?? Math.round(f.properties.value / 60), feature: f }))
        .sort((a, b) => b.minutes - a.minutes)
      setLayers(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }, [])

  const clear = useCallback(() => { setLayers([]); setError(null) }, [])
  return { layers, loading, error, calculate, clear }
}
