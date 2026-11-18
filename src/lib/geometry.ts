import polygonClipping from 'polygon-clipping'
import type { IsoLayer } from '../hooks/useIsochrones'

/** polygons: cada isócrona es el área completa y se superponen. rings (arandelas): cada una empieza donde acaba la anterior. */
export type DrawMode = 'polygons' | 'rings'

export interface Shape { minutes: number; label: string; coordinates: number[][][][]; area?: number } // siempre MultiPolygon

export const rangeLabel = (mode: DrawMode, min: number, prev?: number) => (mode === 'rings' ? `${prev ?? 0}–${min} min` : `hasta ${min} min`)

const multi = (g: IsoLayer['feature']['geometry']) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)

/**
 * Geometrías a dibujar/exportar, de mayor a menor (las pequeñas quedan encima).
 * En modo arandelas: isócrona_i − isócrona_(i−1) (diferencia geométrica real, con huecos).
 */
export function buildShapes(layers: IsoLayer[], mode: DrawMode): Shape[] {
  const asc = [...layers].sort((a, b) => a.minutes - b.minutes)
  return asc.map((l, i): Shape => {
    const prev = asc[i - 1]
    let coordinates = multi(l.feature.geometry) as number[][][][]
    if (mode === 'rings' && prev) {
      try { coordinates = polygonClipping.difference(coordinates as any, multi(prev.feature.geometry) as any) as number[][][][] }
      catch { /* si falla el recorte se deja el polígono completo */ }
    }
    return { minutes: l.minutes, label: rangeLabel(mode, l.minutes, prev?.minutes), coordinates, area: l.feature.properties.area }
  }).reverse()
}
