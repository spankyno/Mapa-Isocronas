import { forwardRef, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { IsoLayer } from '../hooks/useIsochrones'
import type { Settings } from '../lib/settings'

export type BaseLayerId = 'osm' | 'esri' | 'pnoa' | 'carto'
type Base = { name: string; url: string; attribution: string; maxZoom: number }

// CARTO exige API key: se sirve a través de /api/carto (la clave queda en el servidor).

export const BASE_LAYERS: Record<BaseLayerId, Base> = {
  osm: { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap', maxZoom: 19 },
  esri: { name: 'Esri Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri, Maxar', maxZoom: 18 },
  pnoa: { name: 'PNOA (IGN)', url: 'https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}', attribution: '© IGN España', maxZoom: 19 },
  carto: { name: 'CartoDB Positron', url: '/api/carto?z={z}&x={x}&y={y}', attribution: '© OpenStreetMap © CARTO', maxZoom: 19 },
}

/** Icono del origen según los ajustes (forma, tamaño y colores). */
function makeIcon(m: Settings['marker']) {
  const s = m.size
  const base = `width:${s}px;height:${s}px;box-shadow:0 2px 6px rgba(0,0,0,.4);`
  const styles = {
    pin: `${base}border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${m.color};border:3px solid ${m.border};`,
    circle: `${base}border-radius:50%;background:${m.color};border:3px solid ${m.border};`,
    ring: `${base}border-radius:50%;background:transparent;border:${Math.max(3, s / 6)}px solid ${m.color};outline:2px solid ${m.border};`,
  }
  return L.divIcon({ className: '', html: `<div style="${styles[m.shape]}"></div>`, iconSize: [s, s], iconAnchor: m.shape === 'pin' ? [s / 2, s] : [s / 2, s / 2] })
}

function ClickHandler({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function FitBounds({ layers }: { layers: IsoLayer[] }) {
  const map = useMap()
  useEffect(() => { if (layers.length) map.fitBounds(L.geoJSON(layers[0].feature).getBounds(), { padding: [40, 40] }) }, [layers, map])
  return null
}

interface Props {
  origin: { lat: number; lng: number } | null
  layers: IsoLayer[]; base: BaseLayerId; settings: Settings
  onPick: (p: { lat: number; lng: number }) => void
}

// El ref apunta al contenedor que captura html2canvas.
const Map = forwardRef<HTMLDivElement, Props>(({ origin, layers, base, settings: s, onPick }, ref) => {
  const b = BASE_LAYERS[base]
  const styleKey = JSON.stringify(s) // fuerza redibujar polígonos al cambiar ajustes
  return (
    <div ref={ref} className="h-full w-full">
      <MapContainer center={[40.4, -3.7]} zoom={6} minZoom={5} doubleClickZoom={false} className="h-full w-full">
        <TileLayer key={base} url={b.url} attribution={b.attribution} maxZoom={b.maxZoom} crossOrigin="anonymous" />
        {layers.map((l) => (
          <GeoJSON key={`${origin?.lat}-${origin?.lng}-${l.minutes}-${styleKey}`} data={l.feature}
            style={{
              fill: s.fillEnabled, fillColor: s.colors[l.minutes], fillOpacity: s.fillOpacity,
              stroke: s.borderEnabled, weight: s.borderWeight, opacity: s.borderOpacity,
              color: s.borderSameAsFill ? s.colors[l.minutes] : s.borderColor, dashArray: s.borderDashed ? '8 6' : undefined,
            }} />
        ))}
        {/* Marcador arrastrable: al soltarlo se recalcula desde la nueva posición */}
        {origin && <Marker key={JSON.stringify(s.marker)} position={[origin.lat, origin.lng]} icon={makeIcon(s.marker)} draggable
          eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); onPick({ lat: ll.lat, lng: ll.lng }) } }} />}
        <ClickHandler onPick={onPick} />
        <FitBounds layers={layers} />
      </MapContainer>
    </div>
  )
})
export default Map
