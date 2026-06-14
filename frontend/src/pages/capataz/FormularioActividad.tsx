import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { configService, ordenService, puntoService, registroService, safeInput, trabajadorService, VALIDACION_FOTOS_URL } from '../../services/api'
import { offlineDB } from '../../services/offlineDB'
import { useOfflineSync } from '../../context/OfflineSyncContext'
import { useAuth } from '../../context/AuthContext'
import { ACTIVIDADES } from '../../data/actividades'
import type { Actividad } from '../../types/kabj'
import type { EstadoOt, OrdenTrabajo } from '../../types'
import { unwrapList } from '../../utils/apiParse'
import { ArrowLeft, WifiOff, CheckCircle2, AlertCircle, Loader2, Save, Info, ExternalLink, Camera, RefreshCw, Plus } from 'lucide-react'

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
  const { isOnline, pendingCount, syncing, syncPending, updatePendingCount } = useOfflineSync()
  const { user } = useAuth()
  const cacheKey = user?.email ?? 'capataz'

  const [punto,             setPunto]     = useState<OrdenTrabajo | null>(null)
  const [miembros,          setMiembros] = useState<Array<{ idTrabajador: number; dni?: string; nombres: string; apellidos: string; cargo?: string }>>([])
  const [asistenteIds,      setAsistenteIds] = useState<number[]>([])
  const [nuevoAsistenteId,  setNuevoAsistenteId] = useState<number | null>(null)
  const [nuevoDni,          setNuevoDni] = useState('')
  const [nuevoNombres,      setNuevoNombres] = useState('')
  const [nuevoApellidos,    setNuevoApellidos] = useState('')
  const [guardandoAyudante, setGuardandoAyudante] = useState(false)
  const [errorAyudante,     setErrorAyudante] = useState('')
  const [actividadId,       setActividadId] = useState<string>(ACTIVIDADES_OPCIONES[0]?.id ?? '')
  const [subactividadId,    setSubactividadId] = useState<string>(ACTIVIDADES_OPCIONES[0]?.subactividades[0]?.id ?? '')
  const [nuevoEstado,       setEstado]    = useState('SIN_CAMBIO')
  const [observaciones,     setObs]       = useState('')
  const [fecha,             setFecha]     = useState(new Date().toISOString().slice(0, 10))
  const [presionPsi,         setPresionPsi] = useState('')
  const [cloroPpm,           setCloroPpm] = useState('')
  const [horaInicioPurgado,  setHoraInicioPurgado] = useState('')
  const [horaFinPurgado,     setHoraFinPurgado] = useState('')
  const [obsPurgado,         setObsPurgado] = useState('')
  const [loading,           setLoading]   = useState(false)
  const [loadingPunto,      setLoadingPunto] = useState(true)
  const [errorPunto,        setErrorPunto]   = useState('')
  const [resultado,         setResultado] = useState<{ ok: boolean; msg: string; estadoActual?: string } | null>(null)
  const [validacionFotosUrl, setValidacionFotosUrl] = useState(VALIDACION_FOTOS_URL)
  const [bloqueadaFotos, setBloqueadaFotos] = useState(false)
  const [fotosConfirmadas, setFotosConfirmadas] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (resultado) {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [resultado])

  useEffect(() => {
    configService.publica()
      .then(r => {
        if (r.data?.validacionFotosUrl) setValidacionFotosUrl(r.data.validacionFotosUrl)
      })
      .catch(() => {})
  }, [])

  const irValidacionFotos = () => {
    window.open(validacionFotosUrl, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (!puntoId) return
    const id = Number(puntoId)
    setLoadingPunto(true)
    setErrorPunto('')
    puntoService.misPuntos()
      .then(async r => {
        const todos = unwrapList<OrdenTrabajo>(r.data)
        let found = todos.find(p => p.idOt === id) ?? null
        if (!found) {
          try {
            const det = await ordenService.detalle(id)
            found = (det.data as OrdenTrabajo) ?? null
          } catch {
            found = null
          }
        }
        if (!found) {
          const cached = await offlineDB.obtenerPuntosCache(cacheKey)
          found = cached.find(p => p.idOt === id) ?? null
        }
        setPunto(found)
        if (!found) setErrorPunto('No se encontró la OT solicitada.')
      })
      .catch(async () => {
        const cached = await offlineDB.obtenerPuntosCache(cacheKey)
        const found = cached.find(p => p.idOt === id) ?? null
        setPunto(found)
        setErrorPunto(found ? '' : 'Error al cargar la OT. Verifique su conexión.')
      })
      .finally(() => setLoadingPunto(false))

    ordenService.validacionFoto(id)
      .then(r => {
        const d = (r.data as { data?: { bloqueada?: boolean } })?.data
        setBloqueadaFotos(Boolean(d?.bloqueada))
      })
      .catch(() => setBloqueadaFotos(false))
  }, [puntoId, cacheKey])

  useEffect(() => {
    if (!isOnline) return

    trabajadorService.listar()
      .then(r => setMiembros(unwrapList(r.data)))
      .catch(() => {
        setMiembros([])
      })
  }, [isOnline])

  // Cargar datos guardados en localStorage para esta OT
  useEffect(() => {
    if (!puntoId) return
    const saved = localStorage.getItem(`form-ot-${puntoId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAsistenteIds(parsed.asistenteIds || [])
        setActividadId((parsed.actividadId || ACTIVIDADES_OPCIONES[0]?.id) ?? '')
        setSubactividadId((parsed.subactividadId || ACTIVIDADES_OPCIONES[0]?.subactividades[0]?.id) ?? '')
        setEstado(parsed.nuevoEstado || 'SIN_CAMBIO')
        setObs(parsed.observaciones || '')
        setFecha(parsed.fecha || new Date().toISOString().slice(0, 10))
        setFotosConfirmadas(Boolean(parsed.fotosConfirmadas))
      } catch (e) {
        // Ignorar si hay error al parsear
      }
    }
  }, [puntoId])

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (!puntoId) return
    const dataToSave = {
      asistenteIds,
      actividadId,
      subactividadId,
      nuevoEstado,
      observaciones,
      fecha,
      fotosConfirmadas,
    }
    localStorage.setItem(`form-ot-${puntoId}`, JSON.stringify(dataToSave))
  }, [puntoId, asistenteIds, actividadId, subactividadId, nuevoEstado, observaciones, fecha, fotosConfirmadas])

  // Limpiar localStorage cuando se envíe el formulario exitosamente
  const limpiarFormulario = () => {
    if (puntoId) {
      localStorage.removeItem(`form-ot-${puntoId}`)
    }
  }

  const otCerrada = (estado?: string) =>
    estado === 'COMPLETADA' || estado === 'ANULADA'

  const prepararNuevaNota = () => {
    setResultado(null)
    setObs('')
    setAsistenteIds([])
    setNuevoAsistenteId(null)
    setFecha(new Date().toISOString().slice(0, 10))
    const codigo = punto?.estadoCodigo ?? 'PENDIENTE'
    setEstado(codigo === 'PENDIENTE' ? 'EN_PROGRESO' : 'SIN_CAMBIO')
    setActividadId(ACTIVIDADES_OPCIONES[0]?.id ?? '')
    setSubactividadId(ACTIVIDADES_OPCIONES[0]?.subactividades[0]?.id ?? '')
    setFotosConfirmadas(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAgregarOtraNota = () => {
    if (otCerrada(punto?.estadoCodigo)) return
    prepararNuevaNota()
  }

  // Sugerir estado solo con conexión (offline: solo notas, HU06). No pisar borrador guardado.
  useEffect(() => {
    if (!punto || !isOnline) return
    const saved = localStorage.getItem(`form-ot-${puntoId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { nuevoEstado?: string; observaciones?: string }
        if (parsed.nuevoEstado && parsed.nuevoEstado !== 'SIN_CAMBIO') return
        if (parsed.observaciones?.trim()) return
      } catch { /* ignore */ }
    }
    if (punto.estadoCodigo === 'PENDIENTE') {
      setEstado('EN_PROGRESO')
    } else {
      setEstado('SIN_CAMBIO')
    }
  }, [punto, isOnline, puntoId])

  useEffect(() => {
    if (isOnline) return
    setEstado('SIN_CAMBIO')
    setFotosConfirmadas(false)
  }, [isOnline])

  const actividadSeleccionada = ACTIVIDADES_OPCIONES.find(a => a.id === actividadId)
  const subactividadSeleccionada = actividadSeleccionada?.subactividades.find(s => s.id === subactividadId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!punto) {
      setResultado({ ok: false, msg: 'No se encontró la OT asignada. Vuelva al mapa e intente de nuevo.' })
      return
    }
    if (!subactividadSeleccionada) {
      setResultado({ ok: false, msg: 'Selecciona una subactividad válida.' })
      return
    }
    if (nuevoEstado === 'OBSERVADA' && !observaciones.trim()) {
      setResultado({ ok: false, msg: 'Las observaciones son obligatorias cuando el estado es OBSERVADA.' })
      return
    }
    if (!isOnline && nuevoEstado !== 'SIN_CAMBIO') {
      setResultado({
        ok: false,
        msg: 'Sin conexión solo puede guardar las notas del trabajo. Con internet podrá subir fotos y completar la OT.',
      })
      return
    }
    if (nuevoEstado === 'COMPLETADA') {
      if (!observaciones.trim()) {
        setResultado({ ok: false, msg: 'Debe registrar observaciones antes de completar la OT.' })
        return
      }
      if (!fotosConfirmadas) {
        setResultado({ ok: false, msg: 'Debe confirmar que subió las evidencias en S COMAS antes de completar la OT.' })
        return
      }
      if (bloqueadaFotos) {
        setResultado({ ok: false, msg: 'No puedes cerrar este punto, faltan evidencias requeridas' })
        return
      }
    }

    const estadoEnvio = isOnline
      ? (nuevoEstado === 'SIN_CAMBIO' ? undefined : nuevoEstado)
      : undefined

    setLoading(true)
    setResultado(null)

    const clientOpUuid = crypto.randomUUID()

    const payload: Record<string, unknown> = {
      clientOpUuid,
      puntoId:           Number(puntoId),
      actividad:         safeInput(actividadSeleccionada?.nombre ?? '', 100),
      subactividad:      safeInput(subactividadSeleccionada.nombre, 100),
      tipoActividad:     safeInput(`${actividadSeleccionada?.nombre ?? ''} / ${subactividadSeleccionada.nombre}`, 100),
      estado:            estadoEnvio,
      observaciones:     safeInput(observaciones, 500),
      fechaRegistro:     fecha + ' 00:00:00',
      creadoOffline:     !isOnline,
    }

    payload.asistenteIds = asistenteIds.length > 0 ? asistenteIds : undefined

    if (actividadId === 'A1' && isOnline) {
      const purgado: Record<string, unknown> = {}
      if (presionPsi.trim()) purgado.presionPsiHidrante = Number(presionPsi)
      if (cloroPpm.trim()) purgado.medicionCloroPpm = Number(cloroPpm)
      if (horaInicioPurgado) purgado.tiempoInicioPurgado = `${fecha}T${horaInicioPurgado}:00`
      if (horaFinPurgado) purgado.tiempoFinPurgado = `${fecha}T${horaFinPurgado}:00`
      if (obsPurgado.trim()) purgado.observaciones = safeInput(obsPurgado, 500)
      if (Object.keys(purgado).length > 0) payload.purgado = purgado
    }

    try {
      if (isOnline) {
        const r = await registroService.crear(payload)
        const body = r.data as {
          success?: boolean
          message?: string
          data?: { estadoActual?: string; estadoAnterior?: string }
        }
        if (body.success === false) {
          throw new Error(body.message ?? 'No se pudo guardar el registro.')
        }
        const estadoActual = body.data?.estadoActual
          ?? (nuevoEstado === 'SIN_CAMBIO' ? punto.estadoCodigo : nuevoEstado)
        setResultado({
          ok: true,
          msg: body.message
            ?? (nuevoEstado === 'COMPLETADA'
              ? 'Registro guardado correctamente. La OT quedó completada.'
              : 'Registro guardado correctamente.'),
          estadoActual,
        })
        if (estadoActual && estadoActual !== 'SIN_CAMBIO') {
          setPunto(prev => prev ? { ...prev, estadoCodigo: estadoActual as EstadoOt, estado: estadoActual } : prev)
        }
      } else {
        await offlineDB.guardarActividad({
          ...payload,
          puntoId: Number(puntoId),
          estado: 'SIN_CAMBIO',
          observaciones: safeInput(observaciones, 500),
          fechaRegistro: fecha + ' 00:00:00',
          creadoOffline: true,
          clientOpUuid,
          sincronizado: false,
          asistenteIds,
          actividad: safeInput(actividadSeleccionada?.nombre ?? '', 100),
          subactividad: safeInput(subactividadSeleccionada.nombre, 100),
          tipoActividad: safeInput(`${actividadSeleccionada?.nombre ?? ''} / ${subactividadSeleccionada.nombre}`, 100),
        })
        await updatePendingCount()
        setResultado({
          ok: true,
          msg: 'Notas guardadas en el dispositivo. Al tener internet: sincronice, suba fotos en S COMAS y complete la OT.',
          estadoActual: punto.estadoCodigo,
        })
      }
      limpiarFormulario()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Error al guardar el registro.')
      setResultado({ ok: false, msg })
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarAsistente = () => {
    if (nuevoAsistenteId == null) return
    if (!asistenteIds.includes(nuevoAsistenteId)) {
      setAsistenteIds(prev => [...prev, nuevoAsistenteId])
    }
    setNuevoAsistenteId(null)
  }

  const handleEliminarAsistente = (id: number) => {
    setAsistenteIds(prev => prev.filter(item => item !== id))
  }

  const handleCrearAyudante = async () => {
    const dni = safeInput(nuevoDni, 20).trim()
    const nombres = safeInput(nuevoNombres, 80).trim()
    const apellidos = safeInput(nuevoApellidos, 80).trim()

    if (!dni && (!nombres || !apellidos)) {
      setErrorAyudante('Indique DNI o nombres y apellidos.')
      return
    }

    setGuardandoAyudante(true)
    setErrorAyudante('')
    try {
      const r = await trabajadorService.crear({ dni: dni || undefined, nombres, apellidos })
      const creado = (r.data as { data?: { idTrabajador: number; dni?: string; nombres: string; apellidos: string; cargo?: string } })?.data
      if (!creado?.idTrabajador) throw new Error('No se pudo registrar el ayudante.')

      setMiembros(prev => {
        if (prev.some(m => m.idTrabajador === creado.idTrabajador)) return prev
        return [...prev, creado]
      })
      setAsistenteIds(prev => prev.includes(creado.idTrabajador) ? prev : [...prev, creado.idTrabajador])
      setNuevoDni('')
      setNuevoNombres('')
      setNuevoApellidos('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Error al registrar ayudante.')
      setErrorAyudante(msg)
    } finally {
      setGuardandoAyudante(false)
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
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          <WifiOff size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sin conexión — modo registro de notas</p>
            <p className="mt-0.5 text-red-600/90">Guarde el trabajo realizado. Las fotos y el cierre de la OT se hacen cuando haya internet.</p>
          </div>
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl px-4 py-3 text-sm">
          <span>{pendingCount} actividad{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''} de sincronizar</span>
          <button
            type="button"
            onClick={() => syncPending()}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
        </div>
      )}

      {/* Info de la OT */}
      {loadingPunto ? (
        <div className="bg-white rounded-2xl shadow-card p-4 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-100 rounded" />
        </div>
      ) : punto ? (
        <div className="corp-card p-4 border-l-4 border-l-[#1B4F72]">
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
          {errorPunto || 'No se encontró la OT. Verifica que esté asignada a tu usuario.'}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="corp-card p-6 space-y-5">

        {!resultado?.ok && (
        <>
        {/* Ayudantes */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Ayudantes <span className="font-normal text-gray-400">(opcional)</span></label>
              <p className="text-xs text-gray-500 mt-0.5">Registre aquí quién apoyó en esta OT. Si trabajó solo, puede dejarlo vacío.</p>
            </div>
            <Link to="/capataz/ayudantes" className="text-xs text-[#1B4F72] hover:underline whitespace-nowrap pt-0.5">
              Ver historial
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {asistenteIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {miembros
                  .filter(miembro => asistenteIds.includes(miembro.idTrabajador))
                  .map(miembro => (
                    <button
                      key={miembro.idTrabajador}
                      type="button"
                      onClick={() => handleEliminarAsistente(miembro.idTrabajador)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      {miembro.nombres} {miembro.apellidos}
                      <span className="text-slate-500">×</span>
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin ayudantes seleccionados.</p>
            )}
          </div>

          {isOnline && miembros.some(m => !asistenteIds.includes(m.idTrabajador)) && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                value={nuevoAsistenteId ?? ''}
                onChange={e => setNuevoAsistenteId(e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">Seleccionar ayudante ya registrado…</option>
                {miembros
                  .filter(miembro => !asistenteIds.includes(miembro.idTrabajador))
                  .map(miembro => (
                    <option key={miembro.idTrabajador} value={miembro.idTrabajador}>
                      {miembro.nombres} {miembro.apellidos}{miembro.dni ? ` · ${miembro.dni}` : ''}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAgregarAsistente}
                disabled={!nuevoAsistenteId}
                className="btn-primary text-sm py-2 disabled:opacity-50"
              >
                Añadir
              </button>
            </div>
          )}

          {isOnline ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">Registrar nuevo ayudante</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={nuevoDni}
                  onChange={e => setNuevoDni(e.target.value)}
                  placeholder="DNI (opcional)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={nuevoNombres}
                  onChange={e => setNuevoNombres(e.target.value)}
                  placeholder="Nombres"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={nuevoApellidos}
                  onChange={e => setNuevoApellidos(e.target.value)}
                  placeholder="Apellidos"
                  className={inputClass}
                />
              </div>
              {errorAyudante && <p className="text-xs text-red-600">{errorAyudante}</p>}
              <button
                type="button"
                onClick={handleCrearAyudante}
                disabled={guardandoAyudante}
                className="btn-outline text-sm inline-flex disabled:opacity-50"
              >
                {guardandoAyudante ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {guardandoAyudante ? 'Guardando…' : 'Registrar y añadir a esta OT'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Sin conexión: no puede registrar ayudantes nuevos. Guarde el resto del formulario y complete el apoyo cuando tenga internet.
            </p>
          )}
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

        {actividadId === 'A1' && isOnline && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-[#1B4F72]">Datos de purgado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Presión (PSI)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={presionPsi}
                  onChange={e => setPresionPsi(e.target.value)}
                  className={inputClass}
                  placeholder="Ej. 1.25"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cloro (PPM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cloroPpm}
                  onChange={e => setCloroPpm(e.target.value)}
                  className={inputClass}
                  placeholder="Ej. 0.8"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inicio purgado</label>
                <input
                  type="time"
                  value={horaInicioPurgado}
                  onChange={e => setHoraInicioPurgado(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fin purgado</label>
                <input
                  type="time"
                  value={horaFinPurgado}
                  onChange={e => setHoraFinPurgado(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notas técnicas del purgado</label>
              <textarea
                value={obsPurgado}
                onChange={e => setObsPurgado(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Turbidez, válvula, presión final…"
              />
            </div>
          </div>
        )}

        {/* Estado de la OT — solo con conexión */}
        {isOnline ? (
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
              <p className="mt-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-start gap-1">
                <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" />
                Solo puede completar si ya subió las evidencias en S COMAS y la OT está en progreso u observada.
                Al guardar, quedará completada y se verá en verde en el mapa.
              </p>
            )}
            {nuevoEstado === 'OBSERVADA' && (
              <p className="mt-1.5 text-xs text-yellow-700 flex items-start gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                Use este estado si hay un problema en campo (por ejemplo, faltan fotos en S COMAS).
                El supervisor verá la alerta. Cuando suba las evidencias en S COMAS, vuelva y marque la OT como completada.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
            El estado de la OT no se cambia sin conexión. Sus notas se sincronizarán y luego podrá subir fotos y completarla.
          </p>
        )}

        {/* Observaciones - solo si estado es OBSERVADA */}
        {nuevoEstado === 'OBSERVADA' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Observaciones <span className="text-red-500">*</span>
            </label>
            <textarea
              value={observaciones}
              onChange={e => setObs(e.target.value)}
              rows={4}
              placeholder="Ej.: trabajo realizado pero faltan fotos en S COMAS; medidor dañado; acceso bloqueado…"
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400">{observaciones.length}/500 caracteres</p>
          </div>
        )}

        {/* Notas generales - cuando NO es OBSERVADA */}
        {nuevoEstado !== 'OBSERVADA' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notas (opcional)</label>
            <textarea
              value={observaciones}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Anota cualquier detalle relevante del trabajo (opcional)..."
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400">{observaciones.length}/500 caracteres</p>
          </div>
        )}

        {/* Evidencias fotográficas — solo con conexión */}
        {isOnline && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-[#0F4C81] flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700">Evidencias fotográficas</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Las fotos se suben en el portal externo S COMAS. Si aún no las tiene, marque la OT como
              <strong> Observada</strong> y explique el motivo. Para cerrar la OT, suba las evidencias y luego elija
              <strong> Completada</strong> confirmando el envío.
            </p>
            {bloqueadaFotos && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                Faltan evidencias requeridas. Corrija en S COMAS antes de completar la OT.
              </p>
            )}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fotosConfirmadas}
                onChange={e => setFotosConfirmadas(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#0F4C81] focus:ring-[#0F4C81]/30"
              />
              <span className="text-sm text-gray-700">
                Confirmo que subí las evidencias en S COMAS
                {nuevoEstado === 'COMPLETADA' && <span className="text-red-500"> *</span>}
              </span>
            </label>
            <button
              type="button"
              onClick={irValidacionFotos}
              className="text-xs text-[#0F4C81] hover:text-[#0D3F6B] font-medium inline-flex items-center gap-1"
            >
              <ExternalLink size={12} />
              Abrir portal S COMAS
            </button>
          </div>
        )}

        {/* Fecha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha del trabajo</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputClass} />
        </div>
        </>
        )}

        {/* Confirmación / error al guardar */}
        <div ref={feedbackRef}>
          {resultado?.ok ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 text-center space-y-3">
              <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
              <p className="text-lg font-bold text-emerald-800">¡Registro guardado!</p>
              <p className="text-sm text-emerald-700">{resultado.msg}</p>
              {resultado.estadoActual && resultado.estadoActual !== 'SIN_CAMBIO' && (
                <p className="text-xs text-emerald-600">
                  Estado de la OT: <strong>{resultado.estadoActual}</strong>
                </p>
              )}
              {!isOnline && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Pendiente de sincronizar cuando haya internet.
                </p>
              )}
              {otCerrada(resultado.estadoActual) ? (
                <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                  Esta OT quedó cerrada en campo. No puede agregar más notas aquí.
                  Si hubo un error grave, informe al supervisor.
                </p>
              ) : (
                <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                  Puede agregar otra nota en la misma OT. Se sumará al registro anterior, no lo reemplaza.
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/capataz/mapa')}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
                >
                  Volver al mapa
                </button>
                {!otCerrada(resultado.estadoActual) && (
                  <button
                    type="button"
                    onClick={handleAgregarOtraNota}
                    className="inline-flex items-center justify-center gap-2 border-2 border-emerald-600 text-emerald-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-100/50"
                  >
                    <Plus size={14} />
                    Agregar otra nota
                  </button>
                )}
              </div>
            </div>
          ) : resultado ? (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No se pudo guardar</p>
                <p className="mt-0.5">{resultado.msg}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Submit */}
        {!resultado?.ok && (
        <button
          type="submit"
          disabled={loading || !punto || (nuevoEstado === 'OBSERVADA' && !observaciones.trim()) || (nuevoEstado === 'COMPLETADA' && !fotosConfirmadas)}
          className="w-full flex items-center justify-center gap-2 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Guardando registro…</>
            : <><Save size={16} /> {isOnline ? 'Guardar registro' : 'Guardar notas offline'}</>
          }
        </button>
        )}
      </form>
    </div>
  )
}
