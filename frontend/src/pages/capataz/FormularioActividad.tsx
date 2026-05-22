import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cuadrillaService, puntoService, registroService, safeInput } from '../../services/api'
import { offlineDB } from '../../services/offlineDB'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import { ACTIVIDADES } from '../../data/actividades'
import type { Actividad } from '../../types/kabj'
import type { EstadoOt, OrdenTrabajo } from '../../types'
import { ArrowLeft, WifiOff, CheckCircle2, AlertCircle, Loader2, Save, Info } from 'lucide-react'

const ACTIVIDADES_CAPATAZ: Actividad[] = ACTIVIDADES.filter(a => ['A1', 'A2'].includes(a.id))
const ACTIVIDADES_OPCIONES = ACTIVIDADES_CAPATAZ.length > 0 ? ACTIVIDADES_CAPATAZ : ACTIVIDADES

// Estados que puede asignar el capataz (NO puede Anular — eso es del supervisor/admin)
const ESTADOS_CAPATAZ: { value: string; label: string; color: string }[] = [
  { value: 'SIN_CAMBIO',  label: 'Sin cambio (mantener estado actual)', color: 'text-gray-500' },
  { value: 'EN_PROGRESO', label: 'En Progreso — trabajo iniciado',       color: 'text-orange-600' },
  { value: 'OBSERVADA',   label: 'Observada — requiere atención',        color: 'text-yellow-600' },
  { value: 'COMPLETADA',  label: 'Completada — trabajo finalizado',      color: 'text-emerald-600' },
]

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:   'bg-gray-100 text-gray-600',
  EN_PROGRESO: 'bg-orange-100 text-orange-700',
  OBSERVADA:   'bg-yellow-100 text-yellow-700',
  COMPLETADA:  'bg-emerald-100 text-emerald-700',
  ANULADA:     'bg-red-100 text-red-700',
}

export default function FormularioActividad() {
  const { puntoId }  = useParams<{ puntoId: string }>()
  const navigate     = useNavigate()
  const { isOnline, updatePendingCount } = useOfflineSync()

  const [punto,             setPunto]     = useState<OrdenTrabajo | null>(null)
  const [cuadrillaId,       setCuadrillaId] = useState<number | null>(null)
  const [cuadrillaNombre,   setCuadrillaNombre] = useState('')
  const [miembros,          setMiembros] = useState<Array<{ id: number; idTrabajador: number; dni?: string; nombres: string; apellidos: string; cargo?: string }>>([])
  const [asistenteId,       setAsistenteId] = useState<number | null>(null)
  const [nuevoTrabajador,   setNuevoTrabajador] = useState(false)
  const [asistenteDni,      setAsistenteDni] = useState('')
  const [asistenteNombres,  setAsistenteNombres] = useState('')
  const [asistenteApellidos,setAsistenteApellidos] = useState('')
  const [asistenteCargo,    setAsistenteCargo] = useState('')
  const [cargoEnCuadrilla,  setCargoEnCuadrilla] = useState('')
  const [actividadId,       setActividadId] = useState<string>(ACTIVIDADES_OPCIONES[0]?.id ?? '')
  const [subactividadId,    setSubactividadId] = useState<string>(ACTIVIDADES_OPCIONES[0]?.subactividades[0]?.id ?? '')
  const [nuevoEstado,       setEstado]    = useState('SIN_CAMBIO')
  const [observaciones,     setObs]       = useState('')
  const [fecha,             setFecha]     = useState(new Date().toISOString().slice(0, 10))
  const [loading,           setLoading]   = useState(false)
  const [loadingPunto,      setLoadingPunto] = useState(true)
  const [resultado,         setResultado] = useState<{ ok: boolean; msg: string; estadoActual?: string } | null>(null)

  useEffect(() => {
    if (!puntoId) return
    setLoadingPunto(true)
    puntoService.misPuntos()
      .then(r => {
        const data = (r.data as any)
        const todos: OrdenTrabajo[] = Array.isArray(data) ? data : (data?.data ?? [])
        const found = todos.find(p => p.idOt === Number(puntoId))
        setPunto(found ?? null)
      })
      .catch(() => {
        setPunto({ idOt: Number(puntoId), sgio: `OT #${puntoId}`, estadoCodigo: 'PENDIENTE', estado: 'Pendiente' })
      })
      .finally(() => setLoadingPunto(false))
  }, [puntoId])

  useEffect(() => {
    if (!isOnline) return

    cuadrillaService.obtener()
      .then(r => {
        const data = (r.data as any)?.data ?? {}
        setCuadrillaId(data.cuadrillaId ?? null)
        setCuadrillaNombre(data.nombre ?? '')
        setMiembros(Array.isArray(data.miembros) ? data.miembros : [])
      })
      .catch(() => {
        setCuadrillaId(null)
        setMiembros([])
      })
  }, [isOnline])

  // Sugerir automáticamente el estado según el estado actual de la OT
  useEffect(() => {
    if (!punto) return
    if (punto.estadoCodigo === 'PENDIENTE') {
      setEstado('EN_PROGRESO')  // Al empezar a registrar, moverla a En Progreso
    } else {
      setEstado('SIN_CAMBIO')
    }
  }, [punto])

  const actividadSeleccionada = ACTIVIDADES_OPCIONES.find(a => a.id === actividadId)
  const subactividadSeleccionada = actividadSeleccionada?.subactividades.find(s => s.id === subactividadId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!cuadrillaNombre.trim()) {
      setResultado({ ok: false, msg: 'La cuadrilla es obligatoria.' })
      return
    }
    if (!subactividadSeleccionada) {
      setResultado({ ok: false, msg: 'Selecciona una subactividad válida.' })
      return
    }
    if (!asistenteId && !nuevoTrabajador) {
      setResultado({ ok: false, msg: 'Selecciona un trabajador o agrega uno nuevo.' })
      return
    }
    if (nuevoTrabajador && (!asistenteNombres.trim() || !asistenteApellidos.trim())) {
      setResultado({ ok: false, msg: 'Ingresa nombre y apellidos del trabajador.' })
      return
    }
    if (!observaciones.trim()) {
      setResultado({ ok: false, msg: 'Las observaciones son obligatorias.' })
      return
    }
    setLoading(true)
    setResultado(null)

    const payload = {
      puntoId:           Number(puntoId),
      cuadrillaId:       cuadrillaId ?? undefined,
      cuadrillaNombre:   safeInput(cuadrillaNombre, 100),
      asistenteId:       asistenteId ?? undefined,
      asistenteDni:      safeInput(asistenteDni, 8),
      asistenteNombres:  safeInput(asistenteNombres, 100),
      asistenteApellidos:safeInput(asistenteApellidos, 100),
      asistenteCargo:    safeInput(asistenteCargo, 100),
      cargoEnCuadrilla:  safeInput(cargoEnCuadrilla, 100),
      actividad:         safeInput(actividadSeleccionada?.nombre ?? '', 100),
      subactividad:      safeInput(subactividadSeleccionada.nombre, 100),
      tipoActividad:     safeInput(`${actividadSeleccionada?.nombre ?? ''} / ${subactividadSeleccionada.nombre}`, 100),
      estado:            nuevoEstado === 'SIN_CAMBIO' ? undefined : nuevoEstado,
      observaciones:     safeInput(observaciones, 500),
      fechaRegistro:     fecha + ' 00:00:00',
      creadoOffline:     !isOnline,
    }

    try {
      if (isOnline) {
        const r = await registroService.crear(payload)
        const data = (r.data as any)
        const estadoActual = data?.data?.estadoActual ?? nuevoEstado
        setResultado({
          ok: true,
          msg: data?.message ?? 'Registro guardado exitosamente.',
          estadoActual,
        })
        // Actualizar el punto local con el nuevo estado
        if (estadoActual && estadoActual !== 'SIN_CAMBIO') {
          setPunto(prev => prev ? { ...prev, estadoCodigo: estadoActual as EstadoOt, estado: estadoActual } : prev)
        }
      } else {
        await offlineDB.guardar({ ...payload, estado: nuevoEstado })
        await updatePendingCount()
        setResultado({ ok: true, msg: 'Guardado offline. Se sincronizará al recuperar conexión.' })
      }
      setTimeout(() => navigate(-1), 2500)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar el registro.'
      setResultado({ ok: false, msg })
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
          <p className="text-sm text-gray-500">Documenta el trabajo realizado en la OT</p>
        </div>
      </div>

      {/* Offline alert */}
      {!isOnline && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
          <WifiOff size={16} className="flex-shrink-0" />
          Sin conexión — se guardará en el dispositivo
        </div>
      )}

      {/* Info de la OT */}
      {loadingPunto ? (
        <div className="bg-white rounded-2xl shadow-card p-4 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-100 rounded" />
        </div>
      ) : punto ? (
        <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-[#CC1111]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-800 font-mono text-[15px]">{punto.sgio}</p>
              {punto.direccion && <p className="text-sm text-gray-500 mt-0.5">{punto.direccion}</p>}
              {punto.subactividad && <p className="text-xs text-gray-400 mt-0.5">{punto.subactividad}</p>}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${ESTADO_BADGE[punto.estadoCodigo ?? 'PENDIENTE'] ?? 'bg-gray-100 text-gray-600'}`}>
              {punto.estadoCodigo ?? punto.estado}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-center text-sm text-amber-700">
          <Info size={16} className="flex-shrink-0" />
          No se encontró la OT. Verifica que esté asignada a tu usuario.
        </div>
      )}

      {/* Resultado */}
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
          <div>
            <p>{resultado.msg}</p>
            {resultado.ok && resultado.estadoActual && resultado.estadoActual !== 'SIN_CAMBIO' && (
              <p className="mt-0.5 text-xs opacity-80">
                Estado de la OT actualizado a: <strong>{resultado.estadoActual}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-5">

        {/* Cuadrilla */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cuadrilla</label>
          <input
            type="text"
            value={cuadrillaNombre}
            onChange={e => {
              setCuadrillaNombre(e.target.value)
              if (cuadrillaId !== null) {
                setCuadrillaId(null)
              }
            }}
            placeholder="Nombre o código de la cuadrilla"
            required
            className={inputClass}
          />
          {miembros.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Miembros registrados: {miembros.length}. Puedes seleccionar un trabajador existente o agregar uno nuevo.
            </p>
          )}
        </div>

        {/* Trabajador acompañante */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-gray-700">Trabajador que acompaña</label>
            <button
              type="button"
              onClick={() => {
                setNuevoTrabajador(prev => !prev)
                setAsistenteId(null)
                setAsistenteDni('')
                setAsistenteNombres('')
                setAsistenteApellidos('')
                setAsistenteCargo('')
              }}
              className="text-xs text-[#CC1111] hover:text-[#AA0E0E]"
            >
              {nuevoTrabajador ? 'Seleccionar existente' : 'Agregar nuevo trabajador'}
            </button>
          </div>
          {!nuevoTrabajador ? (
            <select
              value={asistenteId ?? ''}
              onChange={e => setAsistenteId(e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            >
              <option value="">Selecciona un trabajador</option>
              {miembros.map(miembro => (
                <option key={miembro.idTrabajador} value={miembro.idTrabajador}>
                  {miembro.nombres} {miembro.apellidos}{miembro.dni ? ` · ${miembro.dni}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">DNI</label>
                <input
                  type="text"
                  value={asistenteDni}
                  onChange={e => setAsistenteDni(e.target.value)}
                  placeholder="Ej. 12345678"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombres</label>
                <input
                  type="text"
                  value={asistenteNombres}
                  onChange={e => setAsistenteNombres(e.target.value)}
                  placeholder="Nombres del trabajador"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Apellidos</label>
                <input
                  type="text"
                  value={asistenteApellidos}
                  onChange={e => setAsistenteApellidos(e.target.value)}
                  placeholder="Apellidos del trabajador"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cargo</label>
                <input
                  type="text"
                  value={asistenteCargo}
                  onChange={e => setAsistenteCargo(e.target.value)}
                  placeholder="Cargo del trabajador"
                  className={inputClass}
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rol en la cuadrilla</label>
            <input
              type="text"
              value={cargoEnCuadrilla}
              onChange={e => setCargoEnCuadrilla(e.target.value)}
              placeholder="Ej. Técnico, Ayudante, Chofer"
              className={inputClass}
            />
          </div>
        </div>

        {/* Actividad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Actividad</label>
          <select
            value={actividadId}
            onChange={e => {
              setActividadId(e.target.value)
              const act = ACTIVIDADES_OPCIONES.find(a => a.id === e.target.value)
              setSubactividadId(act?.subactividades[0]?.id ?? '')
            }}
            className={inputClass}
          >
            {ACTIVIDADES_OPCIONES.map(act => (
              <option key={act.id} value={act.id}>{act.nombre}</option>
            ))}
          </select>
        </div>

        {/* Subactividad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subactividad</label>
          <select
            value={subactividadId}
            onChange={e => setSubactividadId(e.target.value)}
            className={inputClass}
            required
          >
            {actividadSeleccionada?.subactividades.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.nombre}</option>
            ))}
            {actividadSeleccionada?.subactividades.length === 0 && (
              <option value="">Sin subactividades disponibles</option>
            )}
          </select>
        </div>

        {/* Estado de la OT */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Actualizar estado de la OT
            <span className="text-xs font-normal text-gray-400 ml-1.5">(opcional)</span>
          </label>
          <select
            value={nuevoEstado}
            onChange={e => setEstado(e.target.value)}
            className={inputClass}
          >
            {ESTADOS_CAPATAZ.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {nuevoEstado === 'COMPLETADA' && (
            <div className="mt-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 space-y-0.5">
              <p className="flex items-center gap-1 font-semibold"><CheckCircle2 size={12} /> Cierre de OT</p>
              <p>Se validará que tengas observaciones registradas y que la OT esté en progreso.</p>
              <p>Al completar: desaparecerá del mapa operativo.</p>
            </div>
          )}
          {nuevoEstado === 'OBSERVADA' && (
            <p className="mt-1.5 text-xs text-yellow-600 flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <AlertCircle size={12} />
              El supervisor será notificado para revisar esta OT.
            </p>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Observaciones <span className="text-red-500">*</span>
          </label>
          <textarea
            value={observaciones}
            onChange={e => setObs(e.target.value)}
            rows={4}
            placeholder="Describe detalladamente el trabajo realizado, materiales usados, hallazgos, etc."
            required
            className={`${inputClass} resize-none`}
          />
          <p className="mt-1 text-xs text-gray-400">{observaciones.length}/500 caracteres</p>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha del trabajo</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputClass} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !observaciones.trim()}
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
