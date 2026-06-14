import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { AlertCircle, CheckCircle2, Loader2, MapPin, Save } from 'lucide-react'
import { ordenService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'
import { unwrapList, unwrapData } from '../../utils/apiParse'
import { normalizarCoordsPeru, parseCoordInput } from '../../utils/coordsPeru'
import PageRefreshButton from '../../components/PageRefreshButton'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428]

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapFlyTo({ lat, lng, otId }: { lat: number; lng: number; otId: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.4 })
  }, [otId, lat, lng, map])
  return null
}

export default function CorregirCoordenadas() {
  const [searchParams] = useSearchParams()
  const otFocus = Number(searchParams.get('ot') || 0) || null

  const [lista, setLista]       = useState<OrdenTrabajo[]>([])
  const [selected, setSelected] = useState<OrdenTrabajo | null>(null)
  const [lat, setLat]           = useState('')
  const [lng, setLng]           = useState('')
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null)

  const cargar = useCallback(() => {
    setLoading(true)
    setLoadError('')
    ordenService.coordenadasPendientes()
      .then(r => setLista(unwrapList<OrdenTrabajo>(r.data)))
      .catch(() => {
        setLoadError('No se pudieron cargar las OTs pendientes de georreferencia.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback((ot: OrdenTrabajo) => {
    setSelected(ot)
    setMsg(null)
    if (ot.latitud != null && ot.longitud != null) {
      const { lat: la, lng: lo } = normalizarCoordsPeru(Number(ot.latitud), Number(ot.longitud))
      setLat(la.toFixed(6))
      setLng(lo.toFixed(6))
    } else {
      setLat(String(LIMA_CENTER[0]))
      setLng(String(LIMA_CENTER[1]))
    }
  }, [])

  useEffect(() => {
    if (!otFocus || lista.length === 0) return
    const ot = lista.find(o => o.idOt === otFocus)
    if (ot && selected?.idOt !== otFocus) seleccionar(ot)
  }, [otFocus, lista, selected?.idOt, seleccionar])

  const aplicarCoords = (nLat: number, nLng: number) => {
    setLat(nLat.toFixed(6))
    setLng(nLng.toFixed(6))
  }

  const guardar = async () => {
    if (!selected) return
    const latNum = parseCoordInput(lat)
    const lngNum = parseCoordInput(lng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setMsg({ ok: false, text: 'Ingrese latitud y longitud válidas (ej. 12.04 y 77.04).' })
      return
    }
    const { lat: latNorm, lng: lngNorm } = normalizarCoordsPeru(latNum, lngNum)
    setLat(latNorm.toFixed(6))
    setLng(lngNorm.toFixed(6))

    setSaving(true)
    setMsg(null)
    try {
      const { data } = await ordenService.corregirCoordenadas(selected.idOt, latNorm, lngNorm)
      unwrapData<OrdenTrabajo>(data)
      const restantes = lista.filter(o => o.idOt !== selected.idOt)
      setLista(restantes)
      setMsg({
        ok: true,
        text: `OT ${selected.sgio} guardada: ${latNorm.toFixed(4)}, ${lngNorm.toFixed(4)}`,
      })
      if (restantes.length > 0) {
        seleccionar(restantes[0])
      } else {
        setSelected(null)
        setLat('')
        setLng('')
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setMsg({
        ok: false,
        text: ax.response?.data?.message ?? 'No se pudieron guardar las coordenadas.',
      })
    } finally {
      setSaving(false)
    }
  }

  const markerPos = useMemo((): [number, number] | null => {
    const la = parseCoordInput(lat)
    const lo = parseCoordInput(lng)
    if (Number.isNaN(la) || Number.isNaN(lo)) return null
    return [la, lo]
  }, [lat, lng])

  const mapCenter = useMemo((): [number, number] => {
    if (markerPos) return markerPos
    return LIMA_CENTER
  }, [markerPos])

  return (
    <div className="space-y-5">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Supervisor · Georreferencia</p>
          <h1 className="page-title">Corregir coordenadas</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="badge-count">{lista.length} pendientes</span>
          <PageRefreshButton onClick={cargar} loading={loading} />
        </div>
      </div>

      {loadError && (
        <div className="alert-banner alert-error text-sm">{loadError}</div>
      )}

      {msg && (
        <div className={`alert-banner ${msg.ok ? 'alert-success' : 'alert-error'}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 min-h-[520px]">
        <div className="corp-card overflow-hidden flex flex-col">
          <div className="corp-card-header">
            <MapPin size={15} />
            Órdenes pendientes
          </div>
          <div className="flex-1 overflow-y-auto max-h-[480px]">
            {loading ? (
              <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Cargando…
              </div>
            ) : lista.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 text-center space-y-2">
                <MapPin size={28} className="mx-auto text-slate-300" />
                <p className="font-medium text-slate-600">No hay coordenadas pendientes</p>
              </div>
            ) : (
              lista.map(ot => (
                <button
                  key={ot.idOt}
                  type="button"
                  onClick={() => seleccionar(ot)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
                    selected?.idOt === ot.idOt ? 'bg-slate-50 border-l-4 border-l-[#0F4C81]' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-800 font-mono">{ot.sgio}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{ot.direccion ?? 'Sin dirección'}</p>
                  <p className="text-xs text-amber-700 mt-1">Sin ubicación en mapa</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="corp-card p-0 overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="corp-card-header justify-between">
                <span className="font-mono">{selected.sgio}</span>
                <span className="text-xs text-slate-500">{selected.distrito ?? selected.localidad}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-100">
                <div>
                  <label className="corp-label">Latitud</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="corp-input"
                    placeholder="12.0464"
                  />
                </div>
                <div>
                  <label className="corp-label">Longitud</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="corp-input"
                    placeholder="77.0428"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 px-4 pb-2">
                1) Clic en el mapa donde va el punto · 2) Guardar. Use 12.04 y 77.04 (con o sin signo menos).
              </p>
              <div className="h-[360px] w-full border-t border-slate-100">
                <MapContainer
                  key={selected.idOt}
                  center={mapCenter}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapFlyTo lat={mapCenter[0]} lng={mapCenter[1]} otId={selected.idOt} />
                  <MapClickHandler onPick={aplicarCoords} />
                  {markerPos && <Marker position={markerPos} />}
                </MapContainer>
              </div>
              <div className="p-4 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => aplicarCoords(LIMA_CENTER[0], LIMA_CENTER[1])}
                  className="btn-outline text-sm"
                >
                  Centrar en Lima
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving || !lat.trim() || !lng.trim()}
                  className="btn-primary sm:ml-auto min-w-[180px]"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar coordenadas
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[400px]">
              <MapPin size={40} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium">Seleccione una OT de la lista</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
