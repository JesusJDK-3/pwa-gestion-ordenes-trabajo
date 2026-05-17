import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { puntoService, registroService } from '../../services/api'
import { offlineDB } from '../../services/offlineDB'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import type { OrdenTrabajo } from '../../types'
import { ArrowLeft, WifiOff, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react'

const TIPOS = ['Inspección', 'Mantenimiento', 'Reparación', 'Instalación', 'Completado', 'Observado', 'Otro']

export default function FormularioActividad() {
  const { puntoId }  = useParams<{ puntoId: string }>()
  const navigate     = useNavigate()
  const { isOnline, updatePendingCount } = useOfflineSync()

  const [punto,         setPunto]   = useState<OrdenTrabajo | null>(null)
  const [tipoActividad, setTipo]    = useState('Inspección')
  const [observaciones, setObs]     = useState('')
  const [fecha,         setFecha]   = useState(new Date().toISOString().slice(0, 10))
  const [adicional,     setAdicional] = useState('')
  const [loading,       setLoading] = useState(false)
  const [resultado,     setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!puntoId) return
    puntoService.misPuntos()
      .then(r => {
        const data = (r.data as any)
        const todos: OrdenTrabajo[] = Array.isArray(data) ? data : (data?.data ?? [])
        const found = todos.find(p => p.idOt === Number(puntoId))
        setPunto(found ?? null)
      })
      .catch(() => {
        setPunto({ idOt: Number(puntoId), sgio: `OT #${puntoId}`, estadoCodigo: 'EN_PROGRESO', estado: 'En Progreso' })
      })
  }, [puntoId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setResultado(null)

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
        setResultado({ ok: true, msg: 'Registro guardado exitosamente.' })
      } else {
        await offlineDB.guardar(payload)
        await updatePendingCount()
        setResultado({ ok: true, msg: 'Guardado offline. Se sincronizará al recuperar conexión.' })
      }
      setTimeout(() => navigate(-1), 2000)
    } catch {
      setResultado({ ok: false, msg: 'Error al guardar el registro.' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111] transition-all bg-white'

  return (
    <div className="max-w-xl space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all bg-white shadow-card"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Registrar Actividad</h1>
          <p className="text-sm text-gray-500">Documenta el trabajo realizado en el punto</p>
        </div>
      </div>

      {/* Offline alert */}
      {!isOnline && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
          <WifiOff size={16} className="flex-shrink-0" />
          Sin conexión — se guardará en el dispositivo
        </div>
      )}

      {/* Punto info */}
      {punto && (
        <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-[#CC1111]">
          <p className="font-semibold text-gray-800 font-mono">{punto.sgio}</p>
          {punto.direccion && <p className="text-sm text-gray-500 mt-0.5">{punto.direccion}</p>}
          {punto.subactividad && <p className="text-xs text-gray-400 mt-0.5">{punto.subactividad}</p>}
          <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            Estado: {punto.estado ?? punto.estadoCodigo}
          </span>
        </div>
      )}

      {/* Result */}
      {resultado && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
          resultado.ok
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {resultado.ok
            ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            : <AlertCircle  size={16} className="mt-0.5 flex-shrink-0" />
          }
          {resultado.msg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-5">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de actividad</label>
          <select value={tipoActividad} onChange={e => setTipo(e.target.value)} className={inputClass}>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={e => setObs(e.target.value)}
            rows={3}
            placeholder="Describe lo realizado…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Datos adicionales <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={adicional}
            onChange={e => setAdicional(e.target.value)}
            placeholder="Ej: materiales usados, número de serie…"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
            : <><Save size={16} /> {isOnline ? 'Guardar registro' : 'Guardar offline'}</>
          }
        </button>
      </form>
    </div>
  )
}
