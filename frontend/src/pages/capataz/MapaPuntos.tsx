import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { puntoService } from '../../services/api'
import type { OrdenTrabajo, EstadoOt } from '../../types'
import { ArrowRight } from 'lucide-react'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const ESTADO_COLORS: Record<EstadoOt, string> = {
  PENDIENTE:   '#ef4444',
  EN_PROGRESO: '#f97316',
  COMPLETADA:  '#22c55e',
  OBSERVADA:   '#eab308',
  ANULADA:     '#6b7280',
}

const ESTADO_LABELS: Record<EstadoOt, string> = {
  PENDIENTE:   'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADA:  'Completada',
  OBSERVADA:   'Observada',
  ANULADA:     'Anulada',
}

function createIcon(estado: EstadoOt) {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;background:${ESTADO_COLORS[estado] ?? '#ef4444'};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
    className:  '',
  })
}

function FitBounds({ puntos }: { puntos: OrdenTrabajo[] }) {
  const map = useMap()
  useEffect(() => {
    const valid = puntos.filter(p => p.latitud && p.longitud)
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(p => [p.latitud!, p.longitud!]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [puntos, map])
  return null
}

export default function MapaPuntos() {
  const navigate = useNavigate()
  const [puntos,  setPuntos]  = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    puntoService.misPuntos()
      .then(r => {
        const data = (r.data as any)
        setPuntos(Array.isArray(data) ? data : (data?.data ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  const conUbicacion = puntos.filter(p => p.latitud && p.longitud)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="h-[calc(100vh-200px)] bg-gray-200 rounded-2xl" />
    </div>
  )

  return (
    <div className="space-y-4 h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Mapa de mis OTs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{conUbicacion.length} con ubicación de {puntos.length} total</p>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(ESTADO_COLORS) as [EstadoOt, string][]).map(([estado, color]) => (
            <span
              key={estado}
              className="flex items-center gap-1.5 text-xs bg-white rounded-xl px-3 py-1.5 shadow-card border border-gray-100 font-medium text-gray-600"
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              {ESTADO_LABELS[estado]}
            </span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200/60" style={{ height: 'calc(100vh - 200px)' }}>
        <MapContainer center={[-12.046, -77.043]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <FitBounds puntos={conUbicacion} />
          {conUbicacion.map(p => (
            <Marker key={p.idOt} position={[p.latitud!, p.longitud!]} icon={createIcon(p.estadoCodigo ?? 'PENDIENTE')}>
              <Popup>
                <div className="text-sm min-w-[200px] font-sans">
                  <p className="font-semibold text-gray-800 mb-1 font-mono">{p.sgio}</p>
                  <p className="text-gray-500 text-xs mb-2">{p.direccion ?? p.subactividad ?? '—'}</p>
                  <span
                    className="inline-block text-xs px-2.5 py-1 rounded-full font-medium mb-3"
                    style={{
                      background: (ESTADO_COLORS[p.estadoCodigo ?? 'PENDIENTE'] ?? '#ef4444') + '22',
                      color: ESTADO_COLORS[p.estadoCodigo ?? 'PENDIENTE'] ?? '#ef4444'
                    }}
                  >
                    {p.estado ?? p.estadoCodigo}
                  </span>
                  <button
                    onClick={() => navigate(`/capataz/registrar/${p.idOt}`)}
                    className="flex items-center justify-center gap-1.5 w-full text-xs bg-[#CC1111] hover:bg-[#AA0E0E] text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Registrar actividad
                    <ArrowRight size={12} />
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
