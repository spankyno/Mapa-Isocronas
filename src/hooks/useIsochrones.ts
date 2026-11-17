import { useCallback, useState } from 'react'
import { fetchIsochrones, effectiveSeconds, type IsoCollection } from '../lib/ors'

export interface IsoLayer { minutes: number; feature: IsoCollection['features'][number] }

export function useIsochrones(getToken: () => Promise<string | null>) {
  const [layers, setLayers] = useState<IsoLayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<string | null>(null) // mapas que quedan hoy

  const calculate = useCallback(async (origin: { lat: number; lng: number }, minutes: number[], speed: number) => {
    if (!minutes.length) { setError('Selecciona al menos un tiempo.'); return }
    setLoading(true); setError(null)
    try {
      const { data, remaining } = await fetchIsochrones(origin, minutes, speed, await getToken())
      if (remaining) setRemaining(remaining)
      // Emparejamos cada feature con sus minutos y ordenamos de mayor a menor (las pequeñas quedan encima).
      const byValue = new Map(minutes.map((m) => [effectiveSeconds(m, speed), m]))
      setLayers(data.features
        .map((f) => ({ minutes: byValue.get(f.properties.value) ?? Math.round(f.properties.value / 60), feature: f }))
        .sort((a, b) => b.minutes - a.minutes))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }, [getToken])

  const clear = useCallback(() => { setLayers([]); setError(null) }, [])
  return { layers, loading, error, remaining, setRemaining, calculate, clear }
}
