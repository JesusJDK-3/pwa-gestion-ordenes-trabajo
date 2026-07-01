/**
 * Mapa operativo Leaflet — OT georreferenciadas por estado de color.
 *
 * Usado por capataz (mis puntos), supervisor (monitoreo) y admin.
 * Solo muestra OT con coordenadas válidas y visibleEnMapa=true.
 * Popup permite ir a FormularioActividad para registrar trabajo.
 *
 * Colores: PENDIENTE rojo, EN_PROGRESO naranja, OBSERVADA amarillo, COMPLETADA verde.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { puntoService, puntoExtraService } from '../../services/api'
import { offlineDB } from '../../services/offlineDB'
import { useAuth } from '../../context/AuthContext'
import type { OrdenTrabajo, EstadoOt } from '../../types'
import PageRefreshButton from '../../components/PageRefreshButton'
import { ArrowRight, Clock, WifiOff, AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatTime'

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

const MAPA_ESTADOS: EstadoOt[] = ['PENDIENTE', 'EN_PROGRESO', 'OBSERVADA', 'COMPLETADA']

function parseLista(data: unknown): OrdenTrabajo[] {
  const raw = data as OrdenTrabajo[] | { data?: OrdenTrabajo[] }
  return Array.isArray(raw) ? raw : (raw?.data ?? [])
}

function unirParaMapa(activas: OrdenTrabajo[], completadas: OrdenTrabajo[]): OrdenTrabajo[] {
  const map = new Map<number, OrdenTrabajo>()
  for (const p of [...activas, ...completadas]) {
    if (p.estadoCodigo !== 'ANULADA') map.set(p.idOt, p)
  }
  return [...map.values()]
}

function tieneUbicacionEnMapa(ot: OrdenTrabajo) {
  return ot.latitud != null && ot.longitud != null && !ot.requiereCorreccionCoordenadas
}

function createIcon(estado: EstadoOt) {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;background:${ESTADO_COLORS[estado] ?? '#ef4444'};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
    className:  '',
  })
}

function FitBounds({ puntos, omitir }: { puntos: OrdenTrabajo[]; omitir?: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (omitir) return
    const valid = puntos.filter(p => p.latitud && p.longitud)
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(p => [p.latitud!, p.longitud!]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [puntos, map, omitir])
  return null
}

function FocusOt({ puntos, otId }: { puntos: OrdenTrabajo[]; otId: number | null }) {
  const map = useMap()
  useEffect(() => {
    if (!otId) return
    const p = puntos.find(x => x.idOt === otId)
    if (p?.latitud != null && p?.longitud != null) {
      map.flyTo([p.latitud, p.longitud], 16, { duration: 0.8 })
    }
  }, [puntos, otId, map])
  return null
}

export default function MapaPuntos() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const otFocus = Number(searchParams.get('ot')) || null
  const { user } = useAuth()
  const rol = user?.rol?.toLowerCase()
  const esMonitoreo = rol === 'supervisor' || rol === 'admin'
  const [puntos, setPuntos] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [desdeCache, setDesdeCache] = useState(false)
  const [cacheAt, setCacheAt] = useState<number | null>(null)
  const cacheKey = user?.email ?? 'capataz'

  const aplicarCache = useCallback(async () => {
  const meta = await offlineDB.obtenerPuntosCacheMeta(cacheKey)
  setPuntos(meta.puntos)
  setCacheAt(meta.cachedAt)
  setDesdeCache(true)
  }, [cacheKey])

  const cargar = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true)
    else setLoading(true)
    if (!esMonitoreo && !navigator.onLine) {
      await aplicarCache()
      setLoading(false)
      setRefreshing(false)
      return
    }
    try {
      let list: OrdenTrabajo[]
      if (esMonitoreo) {
        const r = await puntoService.mapaMonitoreo()
        list = parseLista(r.data)
      } else {
        const [rActivas, rCompletadas] = await Promise.all([
          puntoService.misPuntos(),
          puntoExtraService.misCompletadas(),
        ])
        list = unirParaMapa(parseLista(rActivas.data), parseLista(rCompletadas.data))
      }
      setPuntos(list)
      if (!esMonitoreo) {
        await offlineDB.guardarPuntosCache(cacheKey, list)
      }
      setDesdeCache(false)
      setCacheAt(Date.now())
    } catch {
      if (!esMonitoreo) await aplicarCache()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [cacheKey, esMonitoreo, aplicarCache])

  useEffect(() => { void cargar() }, [cargar])

  const activas      = puntos.filter(p => !['COMPLETADA', 'ANULADA'].includes(p.estadoCodigo ?? ''))
  const conUbicacion = puntos.filter(p => p.estadoCodigo !== 'ANULADA' && p.latitud != null && p.longitud != null)
  const sinUbicacion = activas.filter(p => p.latitud == null || p.longitud == null).length

  const enMapaPorEstado = MAPA_ESTADOS.map(estado => ({
    estado,
    label: ESTADO_LABELS[estado],
    color: ESTADO_COLORS[estado],
    count: conUbicacion.filter(p => (p.estadoCodigo ?? 'PENDIENTE') === estado).length,
  }))

  const otSeleccionada = otFocus != null ? puntos.find(p => p.idOt === otFocus) : undefined
  const otSinUbicacion = otFocus != null && (otSeleccionada == null || !tieneUbicacionEnMapa(otSeleccionada))
  const otEnMapa = otSeleccionada != null && tieneUbicacionEnMapa(otSeleccionada)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="h-[calc(100vh-200px)] bg-gray-200 rounded-2xl" />
    </div>
  )

  return (
    <div className="space-y-6 h-full">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">{esMonitoreo ? 'Monitoreo' : 'Operaciones de campo'} · Mapa</p>
          <h1 className="page-title">{esMonitoreo ? 'Mapa de monitoreo' : 'Mapa operativo'}</h1>
          {desdeCache && (
            <p className="text-xs text-amber-700 flex items-center gap-1 mt-1">
              <WifiOff size={12} />
              Datos desde caché local
              {cacheAt && (
                <span className="inline-flex items-center gap-0.5 text-amber-600/90">
                  · <Clock size={11} /> actualizado {formatRelativeTime(cacheAt)}
                </span>
              )}
            </p>
          )}
          <p className="page-subtitle">
            {conUbicacion.length === 0
              ? 'No hay OT con ubicación en el mapa'
              : `${conUbicacion.length} OT en el mapa`}
          </p>
        </div>
        <PageRefreshButton onClick={() => cargar(true)} loading={refreshing || loading} />
      </div>

      {otSinUbicacion && (
        <div className="alert-banner alert-error text-sm flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              La OT <strong className="font-mono">{otSeleccionada?.sgio ?? `#${otFocus}`}</strong> no se puede mostrar en el mapa:
              la ubicación está vacía, es inválida o pendiente de corrección por el supervisor.
            </span>
          </span>
          {!esMonitoreo && (
            <Link to="/capataz/alertas" className="btn-outline text-xs py-1.5 whitespace-nowrap">
              Ver detalle
            </Link>
          )}
        </div>
      )}

      {sinUbicacion > 0 && !otSinUbicacion && (
        <div className="alert-banner alert-warning text-sm flex flex-wrap items-center justify-between gap-2">
          <span>
            {sinUbicacion} OT activa{sinUbicacion !== 1 ? 's' : ''} sin ubicación en el mapa.
            El supervisor debe corregirlas en Georreferencia.
          </span>
          <Link to="/capataz/alertas" className="btn-outline text-xs py-1.5 whitespace-nowrap">
            Ver detalle
          </Link>
        </div>
      )}

      <div className="kpi-grid grid-cols-2 sm:grid-cols-4">
        {enMapaPorEstado.map(({ estado, label, color, count }) => (
          <div key={estado} className="kpi-tile border-l-4" style={{ borderLeftColor: color }}>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5 border-2 border-white shadow-sm"
              style={{ background: color }}
            />
            <div>
              <p className="kpi-value">{count}</p>
              <p className="kpi-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="corp-card overflow-hidden border-l-4 border-l-[#1B4F72]" style={{ height: 'calc(100vh - 320px)' }}>
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Leyenda del mapa</span>
          {enMapaPorEstado.map(({ estado, label, color }) => (
            <span key={estado} className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
        </div>
        <MapContainer center={[-12.046, -77.043]} zoom={12} style={{ height: 'calc(100% - 42px)', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <FitBounds puntos={conUbicacion} omitir={otEnMapa} />
          <FocusOt puntos={conUbicacion} otId={otEnMapa ? otFocus : null} />
          {conUbicacion.map(p => (
            <Marker
              key={p.idOt}
              position={[p.latitud!, p.longitud!]}
              icon={createIcon(p.estadoCodigo ?? 'PENDIENTE')}
              eventHandlers={otEnMapa && otFocus === p.idOt ? { add: e => { window.setTimeout(() => e.target.openPopup(), 400) } } : undefined}
            >
              <Popup>
                <div className="text-sm min-w-[200px] font-sans">
                  <p className="font-semibold text-gray-800 mb-1 font-mono">{p.sgio}</p>
                  <p className="text-gray-500 text-xs mb-2">{p.direccion ?? p.subactividad ?? '—'}</p>
                  {esMonitoreo && p.capatazNombre && (
                    <p className="text-xs text-slate-600 mb-2">Capataz: <strong>{p.capatazNombre}</strong></p>
                  )}
                  <span
                    className="inline-block text-xs px-2.5 py-1 rounded-full font-medium mb-3"
                    style={{
                      background: (ESTADO_COLORS[p.estadoCodigo ?? 'PENDIENTE'] ?? '#ef4444') + '22',
                      color: ESTADO_COLORS[p.estadoCodigo ?? 'PENDIENTE'] ?? '#ef4444'
                    }}
                  >
                    {p.estado ?? p.estadoCodigo}
                  </span>
                  {!esMonitoreo && p.estadoCodigo !== 'COMPLETADA' && p.estadoCodigo !== 'ANULADA' && (
                    <button
                      onClick={() => navigate(`/capataz/registrar/${p.idOt}`)}
                      className="btn-accent text-xs w-full py-2"
                    >
                      Registrar actividad
                      <ArrowRight size={12} />
                    </button>
                  )}
                  {!esMonitoreo && p.estadoCodigo === 'COMPLETADA' && (
                    <p className="text-xs text-emerald-700 font-medium">Trabajo finalizado en este punto.</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
