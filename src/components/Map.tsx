import { forwardRef, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { IsoLayer } from '../hooks/useIsochrones'
import { colorFor } from '../lib/colors'

export type BaseLayerId = 'osm' | 'esri' | 'pnoa' | 'carto'

export const BASE_LAYERS: Record<BaseLayerId, { name: string; url: string; attribution: string; maxZoom: number }> = {
  osm: { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap', maxZoom: 19 },
  esri: { name: 'Esri Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri, Maxar', maxZoom: 18 },
  pnoa: { name: 'PNOA (IGN)', url: 'https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}', attribution: '© IGN España', maxZoom: 19 },
  carto: { name: 'CartoDB Positron', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap © CARTO', maxZoom: 20 },
}

// Marcador CSS (divIcon): evita problemas con los PNG por defecto de Leaflet en Vite.
const pin = L.divIcon({ className: '', html: '<div class="origin-pin"></div>', iconSize: [22, 22], iconAnchor: [11, 22] })

function ClickHandler({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/** Encuadra la isócrona más grande cuando llegan resultados. */
function FitBounds({ layers }: { layers: IsoLayer[] }) {
  const map = useMap()
  useEffect(() => {
    if (layers.length) map.fitBounds(L.geoJSON(layers[0].feature).getBounds(), { padding: [40, 40] })
  }, [layers, map])
  return null
}

interface Props {
  origin: { lat: number; lng: number } | null
  layers: IsoLayer[]
  base: BaseLayerId
  onPick: (p: { lat: number; lng: number }) => void
}

// El ref apunta al contenedor que captura html2canvas.
// crossOrigin="anonymous" permite exportar los tiles sin "tainted canvas".
const Map = forwardRef<HTMLDivElement, Props>(({ origin, layers, base, onPick }, ref) => {
  const b = BASE_LAYERS[base]
  return (
    <div ref={ref} className="h-full w-full">
      <MapContainer center={[40.4, -3.7]} zoom={6} minZoom={5} className="h-full w-full">
        <TileLayer key={base} url={b.url} attribution={b.attribution} maxZoom={b.maxZoom} crossOrigin="anonymous" />
        {layers.map((l) => (
          <GeoJSON key={`${l.minutes}-${l.feature.properties.value}-${l.feature.geometry.type}-${JSON.stringify(l.feature.geometry.coordinates[0]?.[0])}`}
            data={l.feature}
            style={{ color: colorFor(l.minutes), weight: 2, fillColor: colorFor(l.minutes), fillOpacity: 0.4 }} />
        ))}
        {origin && <Marker position={[origin.lat, origin.lng]} icon={pin} />}
        <ClickHandler onPick={onPick} />
        <FitBounds layers={layers} />
      </MapContainer>
    </div>
  )
})
export default Map
