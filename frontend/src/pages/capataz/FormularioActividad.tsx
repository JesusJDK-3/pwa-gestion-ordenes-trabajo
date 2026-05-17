import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { puntoService, registroService } from '../../services/api'
import { offlineDB } from '../../services/offlineDB'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import type { ApiResponse, PuntoTrabajo } from '../../types'

const TIPOS = ['Inspección', 'Mantenimiento', 'Reparación', 'Instalación', 'Completado', 'Observado', 'Otro']

export default function FormularioActividad() {
  const { puntoId }  = useParams<{ puntoId: string }>()
  const navigate     = useNavigate()
  const { isOnline, updatePendingCount } = useOfflineSync()

  const [punto,       setPunto]       = useState<PuntoTrabajo | null>(null)
  const [tipoActividad, setTipo]      = useState('Inspección')
  const [observaciones, setObs]       = useState('')
  const [fecha,         setFecha]     = useState(new Date().toISOString().slice(0, 10))
  const [adicional,     setAdicional] = useState('')
  const [loading,       setLoading]   = useState(false)
  const [resultado,     setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!puntoId) return
    puntoService.todos({ ordenId: undefined })
      .then(r => {
        const todos = (r.data as ApiResponse<PuntoTrabajo[]>).data ?? []
        const found = todos.find(p => p.id === Number(puntoId))
        setPunto(found ?? null)
      })
      .catch(() => {
        // offline: construct minimal punto from ID
        setPunto({ id: Number(puntoId), descripcion: `Punto #${puntoId}`, direccion: '', latitud: 0, longitud: 0, estado: 'EN_PROGRESO', ordenId: null, codigoOt: null })
      })
  }, [puntoId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResultado(null)

    const payload = {
      puntoId: Number(puntoId),
      tipoActividad,
      observaciones,
      fechaRegistro: fecha + ' 00:00:00',
      datosAdicionales: adicional || undefined,
      creadoOffline: !isOnline,
    }

    try {
      if (isOnline) {
        await registroService.crear(payload)
        setResultado({ ok: true, msg: '✅ Registro guardado exitosamente.' })
      } else {
        await offlineDB.guardar(payload)
        await updatePendingCount()
        setResultado({ ok: true, msg: '📵 Guardado offline. Se sincronizará al recuperar conexión.' })
      }
      setTimeout(() => navigate(-1), 2000)
    } catch {
      setResultado({ ok: false, msg: '❌ Error al guardar el registro.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="text-xl font-bold text-gray-800">Registrar Actividad</h2>
      </div>

      {!isOnline && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
          📵 Sin conexión — se guardará en el dispositivo
        </div>
      )}

      {punto && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-gray-800">{punto.descripcion}</p>
          <p className="text-sm text-gray-500 mt-1">{punto.direccion}</p>
          <span className="inline-block mt-2 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Estado: {punto.estado}
          </span>
        </div>
      )}

      {resultado && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          resultado.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                       : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {resultado.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de actividad</label>
          <select
            value={tipoActividad}
            onChange={e => setTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
          >
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={e => setObs(e.target.value)}
            rows={3}
            placeholder="Describe lo realizado…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Datos adicionales (opcional)</label>
          <input
            type="text"
            value={adicional}
            onChange={e => setAdicional(e.target.value)}
            placeholder="Ej: materiales usados, número de serie…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#178060] disabled:bg-green-200 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Guardando…' : (isOnline ? 'Guardar registro' : '💾 Guardar offline')}
        </button>
      </form>
    </div>
  )
}
