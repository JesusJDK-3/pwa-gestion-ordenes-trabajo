import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { puntoService, usuarioService } from '../../services/api'
import type { OrdenTrabajo, User } from '../../types'
import PageRefreshButton from '../../components/PageRefreshButton'
import {
  Filter, Loader2, Lock, AlertTriangle, CheckCircle2, UserCheck, Ban, Eye,
} from 'lucide-react'
import { unwrapList } from '../../utils/apiParse'
import { formatearFechaHistorial, fechaLocalISO } from '../../utils/formatTime'

const inputClass = 'corp-input text-sm py-2'

type EstadoFiltro = '' | 'PENDIENTE' | 'EN_PROGRESO' | 'OBSERVADA' | 'COMPLETADA' | 'ANULADA'
type MsgScope = 'asignar' | 'accion'

interface OtMsg {
  id: number
  ok: boolean
  txt: string
  scope: MsgScope
}

// Estados donde el supervisor PUEDE asignar capataz
const ESTADOS_EDITABLES = ['PENDIENTE', 'EN_PROGRESO', 'OBSERVADA']
// Estados donde la OT está cerrada — solo lectura
const ESTADOS_FINALES   = ['COMPLETADA', 'ANULADA']

const BADGE: Record<string, string> = {
  PENDIENTE:   'status-pill status-pendiente',
  EN_PROGRESO: 'status-pill status-progreso',
  OBSERVADA:   'status-pill status-observada',
  COMPLETADA:  'status-pill status-completada',
  ANULADA:     'status-pill status-anulada',
}

const FILTROS: { value: EstadoFiltro; label: string; accent: string; iconBg: string }[] = [
  { value: '', label: 'Todas', accent: 'border-l-slate-500', iconBg: 'bg-slate-50 border-slate-200 text-slate-600' },
  { value: 'PENDIENTE', label: 'Pendiente', accent: 'border-l-slate-400', iconBg: 'bg-slate-50 border-slate-200 text-slate-600' },
  { value: 'EN_PROGRESO', label: 'En progreso', accent: 'border-l-amber-500', iconBg: 'bg-amber-50 border-amber-200 text-amber-700' },
  { value: 'OBSERVADA', label: 'Observada', accent: 'border-l-yellow-500', iconBg: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  { value: 'COMPLETADA', label: 'Completada', accent: 'border-l-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: 'ANULADA', label: 'Anulada', accent: 'border-l-red-500', iconBg: 'bg-red-50 border-red-200 text-red-700' },
]

function esOtDelDia(ot: OrdenTrabajo, dia: string): boolean {
  const fechas = [ot.fechaProgramada, ot.updatedAt, ot.createdAt, ot.fechaInicio, ot.fechaFin]
  return fechas.some(f => f != null && f.slice(0, 10) === dia)
}

function fechaVisibleOt(ot: OrdenTrabajo): string | undefined {
  return ot.fechaProgramada ?? ot.createdAt
}

export default function AsignarPuntos() {
  const [todas,     setTodas]     = useState<OrdenTrabajo[]>([])
  const [capataces, setCapataces] = useState<User[]>([])
  const [filtro,    setFiltro]    = useState<EstadoFiltro>('PENDIENTE')
  const [fechaDia,  setFechaDia]  = useState(fechaLocalISO)
  const [saving,    setSaving]    = useState<Record<number, boolean>>({})
  const [anulando,  setAnulando]  = useState<Record<number, boolean>>({})
  const [msg,       setMsg]       = useState<OtMsg | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [fechaAjustada, setFechaAjustada] = useState(false)

  const cargar = useCallback(() => {
    setLoadError('')
    setLoading(true)
    Promise.all([
      puntoService.todos(),
      usuarioService.listar(),
    ]).then(([otsRes, usrRes]) => {
      setTodas(unwrapList<OrdenTrabajo>(otsRes.data))
      const todos = unwrapList<User>(usrRes.data)
      setCapataces(todos.filter(u => u.rol?.toLowerCase() === 'capataz' && u.id > 0))
    }).catch(() => {
      setLoadError('No se pudieron cargar las OTs o los capataces. Verifique la conexión.')
      setTodas([])
      setCapataces([])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Si hoy no hay OT pero sí hay importación reciente, mostrar el día de carga del Excel
  useEffect(() => {
    if (loading || fechaAjustada || todas.length === 0) return
    const pendientes = todas.filter(o => o.estadoCodigo === 'PENDIENTE')
    if (pendientes.length === 0) return
    const enFecha = pendientes.filter(o => esOtDelDia(o, fechaDia)).length
    if (enFecha > 0) return
    const fechasImport = [...new Set(
      pendientes.map(o => o.createdAt?.slice(0, 10)).filter((f): f is string => !!f),
    )].sort().reverse()
    if (fechasImport[0]) {
      setFechaDia(fechasImport[0])
      setFechaAjustada(true)
    }
  }, [loading, todas, fechaDia, fechaAjustada])

  const delDia = useMemo(
    () => todas.filter(o => esOtDelDia(o, fechaDia)),
    [todas, fechaDia],
  )

  const etiquetaFecha = useMemo(
    () => formatearFechaHistorial(`${fechaDia}T12:00:00`, true),
    [fechaDia],
  )

  const mostradas = filtro ? delDia.filter(p => p.estadoCodigo === filtro) : delDia

  const fechasConPendientes = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of todas) {
      if (o.estadoCodigo !== 'PENDIENTE') continue
      const f = o.createdAt?.slice(0, 10)
      if (!f) continue
      map.set(f, (map.get(f) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [todas])

  const totalPendientes = useMemo(
    () => todas.filter(o => o.estadoCodigo === 'PENDIENTE').length,
    [todas],
  )

  const handleAsignar = async (puntoId: number, capatazId: number, capatazActual?: number) => {
    if (!capatazId || capatazId <= 0) return
    if (capatazActual === capatazId) return

    setSaving(s => ({ ...s, [puntoId]: true }))
    setMsg(null)
    try {
      await puntoService.asignar(puntoId, capatazId)
      const capNombre = capataces.find(c => c.id === capatazId)?.nombre ?? ''
      setTodas(prev =>
        prev.map(p => p.idOt === puntoId
          ? { ...p, capatazId, capatazNombre: capNombre, updatedAt: new Date().toISOString() }
          : p)
      )
      setMsg({ id: puntoId, ok: true, txt: 'Capataz asignado correctamente.', scope: 'asignar' })
    } catch (err: any) {
      const txt = err?.response?.data?.message ?? 'Error al asignar capataz.'
      setMsg({ id: puntoId, ok: false, txt, scope: 'asignar' })
    } finally {
      setSaving(s => ({ ...s, [puntoId]: false }))
    }
  }

  const handleAnular = async (ot: OrdenTrabajo) => {
    if (!confirm(`¿Seguro que deseas ANULAR la OT ${ot.sgio}? Esta acción no se puede deshacer.`)) return
    setAnulando(s => ({ ...s, [ot.idOt]: true }))
    setMsg(null)
    try {
      await puntoService.cambiarEstado(ot.idOt, 'ANULADA')
      setTodas(prev =>
        prev.map(p => p.idOt === ot.idOt ? { ...p, estadoCodigo: 'ANULADA', estado: 'Anulada' } : p)
      )
      setMsg({ id: ot.idOt, ok: true, txt: `OT ${ot.sgio} anulada.`, scope: 'accion' })
    } catch (err: any) {
      const txt = err?.response?.data?.message ?? 'Error al anular OT.'
      setMsg({ id: ot.idOt, ok: false, txt, scope: 'accion' })
    } finally {
      setAnulando(s => ({ ...s, [ot.idOt]: false }))
    }
  }

  // Contadores rápidos para los filtros
  const conteo: Record<string, number> = {}
  for (const ot of delDia) {
    const c = ot.estadoCodigo ?? 'PENDIENTE'
    conteo[c] = (conteo[c] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Operaciones · Supervisor</p>
          <h1 className="page-title">Asignación de cuadrillas</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <div>
            <label className="corp-label">Día</label>
            <input
              type="date"
              value={fechaDia}
              onChange={e => setFechaDia(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="self-end">
            <PageRefreshButton onClick={cargar} loading={loading} />
          </div>
        </div>
      </div>

      {loadError && <div className="alert-banner alert-error text-sm">{loadError}</div>}

      {!loading && totalPendientes > 0 && mostradas.length === 0 && (
        <div className="alert-banner alert-warning text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>
            Hay <strong>{totalPendientes}</strong> OT pendientes del Excel, pero ninguna para el día{' '}
            <strong>{etiquetaFecha}</strong>. Cambie la fecha arriba
            {fechasConPendientes.length > 0 && (
              <>
                {' '}o use:{' '}
                {fechasConPendientes.slice(0, 3).map(([f, n]) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFechaDia(f)}
                    className="underline font-semibold mx-1"
                  >
                    {formatearFechaHistorial(`${f}T12:00:00`, true)} ({n})
                  </button>
                ))}
              </>
            )}
          </span>
        </div>
      )}

      <div className="kpi-grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {FILTROS.map(({ value, label, accent }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setFiltro(value)}
            className={`kpi-tile-btn ${accent} ${filtro === value ? 'kpi-tile-btn-active' : ''}`}
          >
            <div>
              <p className="kpi-value text-2xl">{value === '' ? delDia.length : (conteo[value] ?? 0)}</p>
              <p className="kpi-label">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="corp-card p-12 flex items-center justify-center gap-3 text-slate-400 text-sm">
          <Loader2 size={20} className="animate-spin text-[#1B4F72]" />
          Cargando órdenes de trabajo…
        </div>
      ) : mostradas.length === 0 ? (
        <div className="corp-card p-12 text-center text-slate-400">
          <Filter size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {totalPendientes === 0
              ? 'No hay OT pendientes. Importe el Excel en Cargar OT.'
              : 'No hay OT para el estado y día seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="corp-card overflow-hidden">
          <div className="corp-card-header">
            <span>Órdenes de trabajo · {etiquetaFecha}</span>
            <span className="badge-count">{mostradas.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  {['OT / SGIO', 'Fecha', 'Dirección', 'Estado', 'Capataz', 'Asignar', 'Acciones'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mostradas.map(ot => {
                  const esEditable = ESTADOS_EDITABLES.includes(ot.estadoCodigo ?? '')
                  const esFinal    = ESTADOS_FINALES.includes(ot.estadoCodigo ?? '')
                  const isAnulando = anulando[ot.idOt]
                  const isSaving   = saving[ot.idOt]
                  const esMsgAsignar = msg?.id === ot.idOt && msg.scope === 'asignar'
                  const esMsgAccion  = msg?.id === ot.idOt && msg.scope === 'accion'

                  return (
                    <tr
                      key={ot.idOt}
                      className={esFinal ? 'opacity-70' : ''}
                    >
                      <td>
                        <span className="font-mono font-bold text-[#1B4F72] text-xs">{ot.sgio}</span>
                        {ot.subactividad && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{ot.subactividad}</p>
                        )}
                      </td>
                      <td className="text-[13px] whitespace-nowrap">
                        <span className={
                          fechaVisibleOt(ot)?.slice(0, 10) === fechaDia
                            ? 'font-semibold text-[#1B4F72]'
                            : 'text-slate-500'
                        }>
                          {formatearFechaHistorial(fechaVisibleOt(ot), true)}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate text-slate-500">{ot.direccion ?? '—'}</td>
                      <td>
                        <span className={BADGE[ot.estadoCodigo ?? 'PENDIENTE'] ?? 'status-pill status-pendiente'}>
                          {ot.estadoCodigo ?? 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="text-slate-600 text-[13px]">
                        {ot.capatazNombre
                          ? <span className="flex items-center gap-1"><UserCheck size={13} className="text-emerald-500" />{ot.capatazNombre}</span>
                          : <span className="text-slate-400 italic text-xs">Sin asignar</span>
                        }
                      </td>
                      <td>
                        {esFinal ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Lock size={12} />
                            {ot.estadoCodigo === 'ANULADA' ? 'OT anulada' : 'OT completada'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={ot.capatazId ?? ''}
                              onChange={e => {
                                const id = Number(e.target.value)
                                if (id > 0) handleAsignar(ot.idOt, id, ot.capatazId)
                              }}
                              disabled={isSaving || !esEditable}
                              className="corp-input text-xs py-1.5 max-w-[160px] disabled:opacity-50"
                            >
                              <option value="">Sin asignar</option>
                              {capataces.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}{c.username ? ` (${c.username})` : ''}
                                </option>
                              ))}
                            </select>
                            {isSaving && <Loader2 size={14} className="animate-spin text-[#1B4F72]" />}
                          </div>
                        )}
                        {esMsgAsignar && (
                          <p className={`mt-1 text-[11px] font-medium ${msg!.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                            {msg!.txt}
                          </p>
                        )}
                      </td>
                      <td>
                        {!esFinal && (
                          <button
                            onClick={() => handleAnular(ot)}
                            disabled={isAnulando}
                            title="Anular esta OT"
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                          >
                            {isAnulando
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Ban size={12} />
                            }
                            Anular
                          </button>
                        )}
                        {ot.estadoCodigo === 'OBSERVADA' && (
                          <div className="mt-1 space-y-1">
                            <p className="flex items-center gap-1.5 text-xs text-amber-700">
                              <AlertTriangle size={12} />
                              Requiere atención en campo
                            </p>
                            <Link
                              to={`/supervisor/alertas?ot=${ot.idOt}`}
                              className="inline-flex items-center gap-1 text-xs text-[#1B4F72] hover:underline"
                            >
                              <Eye size={12} />
                              Ver en alertas
                            </Link>
                          </div>
                        )}
                        {esMsgAccion && (
                          <p className={`mt-1 text-[11px] font-medium ${msg!.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                            {msg!.txt}
                          </p>
                        )}
                        {ot.estadoCodigo === 'COMPLETADA' && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle2 size={12} />
                            Finalizada
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
