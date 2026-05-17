import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { puntoService } from '../../services/api'
import type { ApiResponse, EstadoPunto, PuntoTrabajo } from '../../types'

// Fix Leaflet default marker icon en bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const ESTADO_COLORS: Record<EstadoPunto, string> = {
  PENDIENTE:   '#ef4444',
  EN_PROGRESO: '#f97316',
  COMPLETADO:  '#22c55e',
  OBSERVADO:   '#eab308',
}

function createIcon(estado: EstadoPunto) {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;background:${ESTADO_COLORS[estado]};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.4)"></div>`,
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
    className:  '',
  })
}

function FitBounds({ puntos }: { puntos: PuntoTrabajo[] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length > 0) {
      const bounds = L.latLngBounds(puntos.map(p => [p.latitud, p.longitud]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [puntos, map])
  return null
}

export default function MapaPuntos() {
  const navigate = useNavigate()
  const [puntos,  setPuntos]  = useState<PuntoTrabajo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    puntoService.misPuntos()
      .then(r => setPuntos((r.data as ApiResponse<PuntoTrabajo[]>).data ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando mapa…</div>

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Mapa de mis puntos</h2>
        {/* Leyenda */}
        <div className="flex gap-3 text-xs flex-wrap">
          {(Object.entries(ESTADO_COLORS) as [EstadoPunto, string][]).map(([estado, color]) => (
            <span key={estado} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: color }} />
              {estado}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200" style={{ height: 'calc(100vh - 200px)' }}>
        <MapContainer
          center={[-12.046, -77.043]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <FitBounds puntos={puntos} />
          {puntos.map(p => (
            <Marker
              key={p.id}
              position={[p.latitud, p.longitud]}
              icon={createIcon(p.estado)}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-semibold text-gray-800 mb-1">{p.descripcion}</p>
                  <p className="text-gray-500 text-xs mb-2">{p.direccion}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium`}
                    style={{ background: ESTADO_COLORS[p.estado] + '22', color: ESTADO_COLORS[p.estado] }}>
                    {p.estado}
                  </span>
                  <button
                    onClick={() => navigate(`/capataz/registrar/${p.id}`)}
                    className="block w-full mt-3 text-center text-xs bg-[#1D9E75] text-white py-1.5 rounded-lg font-medium hover:bg-[#178060]"
                  >
                    Registrar actividad
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
