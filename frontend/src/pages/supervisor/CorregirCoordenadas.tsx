import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { AlertCircle, CheckCircle2, Loader2, MapPin, Save } from 'lucide-react'
import { ordenService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'

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

export default function CorregirCoordenadas() {
  const [lista, setLista]       = useState<OrdenTrabajo[]>([])
  const [selected, setSelected] = useState<OrdenTrabajo | null>(null)
  const [lat, setLat]           = useState('')
  const [lng, setLng]           = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null)

  const cargar = () => {
    setLoading(true)
    ordenService.coordenadasPendientes()
      .then(r => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const seleccionar = (ot: OrdenTrabajo) => {
    setSelected(ot)
    setLat(ot.latitud != null ? String(ot.latitud) : '')
    setLng(ot.longitud != null ? String(ot.longitud) : '')
    setMsg(null)
  }

  const aplicarCoords = (nLat: number, nLng: number) => {
    setLat(nLat.toFixed(6))
    setLng(nLng.toFixed(6))
  }

  const guardar = async () => {
    if (!selected) return
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setMsg({ ok: false, text: 'Ingrese latitud y longitud numéricas válidas.' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const { data } = await ordenService.corregirCoordenadas(selected.idOt, latNum, lngNum)
      const body = data as { success?: boolean; message?: string }
      setMsg({ ok: true, text: body.message ?? 'Coordenadas guardadas correctamente.' })
      setLista(prev => prev.filter(o => o.idOt !== selected.idOt))
      setSelected(null)
      setLat('')
      setLng('')
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudieron guardar las coordenadas.'
      setMsg({ ok: false, text })
    } finally {
      setSaving(false)
    }
  }

  const mapCenter: [number, number] = selected?.latitud && selected?.longitud
    ? [selected.latitud, selected.longitud]
    : lat && lng && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng))
      ? [parseFloat(lat), parseFloat(lng)]
      : LIMA_CENTER

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Corregir coordenadas</h1>
          <p className="page-subtitle">
            OTs con ubicación inválida o pendiente de revisión tras la carga Excel
          </p>
        </div>
        <span className="badge-count">{lista.length} pendientes</span>
      </div>

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
              <div className="p-6 text-sm text-slate-500 text-center">
                No hay coordenadas pendientes de corrección.
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
                  {ot.mensajeCoordenadas && (
                    <p className="text-xs text-amber-700 mt-1 line-clamp-2">{ot.mensajeCoordenadas}</p>
                  )}
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
                    type="number"
                    step="any"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="corp-input"
                    placeholder="-12.046400"
                  />
                </div>
                <div>
                  <label className="corp-label">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="corp-input"
                    placeholder="-77.042800"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 px-4 pb-2">
                Haga clic en el mapa para ubicar el punto o edite los valores manualmente.
              </p>
              <div className="flex-1 min-h-[320px] relative">
                <MapContainer center={mapCenter} zoom={14} className="absolute inset-0 z-0" scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onPick={aplicarCoords} />
                  {lat && lng && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng)) && (
                    <Marker position={[parseFloat(lat), parseFloat(lng)]} />
                  )}
                </MapContainer>
              </div>
              <div className="p-4 border-t border-slate-100">
                <button type="button" onClick={guardar} disabled={saving} className="btn-primary w-full sm:w-auto">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar coordenadas
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[400px]">
              <MapPin size={40} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium">Seleccione una OT de la lista</p>
              <p className="text-xs mt-1">Para corregir su ubicación en el mapa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
