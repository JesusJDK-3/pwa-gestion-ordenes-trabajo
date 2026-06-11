import { useEffect, useState } from 'react'
import { puntoService } from '../../services/api'
import api from '../../services/api'
import type { OrdenTrabajo, User, ApiResponse } from '../../types'
import {
  Filter, Loader2, Lock, AlertTriangle, CheckCircle2, UserCheck, Ban
} from 'lucide-react'

type EstadoFiltro = '' | 'PENDIENTE' | 'EN_PROGRESO' | 'OBSERVADA' | 'COMPLETADA' | 'ANULADA'

// Estados donde el supervisor PUEDE asignar capataz
const ESTADOS_EDITABLES = ['PENDIENTE', 'EN_PROGRESO', 'OBSERVADA']
// Estados donde la OT está cerrada — solo lectura
const ESTADOS_FINALES   = ['COMPLETADA', 'ANULADA']

const BADGE: Record<string, string> = {
  PENDIENTE:   'bg-gray-100 text-gray-600',
  EN_PROGRESO: 'bg-orange-100 text-orange-700',
  OBSERVADA:   'bg-yellow-100 text-yellow-700',
  COMPLETADA:  'bg-emerald-100 text-emerald-700',
  ANULADA:     'bg-red-100 text-red-700',
}

export default function AsignarPuntos() {
  const [todas,     setTodas]     = useState<OrdenTrabajo[]>([])
  const [capataces, setCapataces] = useState<User[]>([])
  const [filtro,    setFiltro]    = useState<EstadoFiltro>('PENDIENTE')
  const [saving,    setSaving]    = useState<Record<number, boolean>>({})
  const [anulando,  setAnulando]  = useState<Record<number, boolean>>({})
  const [msg,       setMsg]       = useState<{ id: number; ok: boolean; txt: string } | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      puntoService.todos(),
      api.get<ApiResponse<User[]>>('/usuarios'),
    ]).then(([otsRes, usrRes]) => {
      const d = otsRes.data as any
      setTodas(Array.isArray(d) ? d : (d?.data ?? []))

      const todos = usrRes.data.data ?? []
      setCapataces(todos.filter((u: User) => u.rol === 'capataz'))
    }).finally(() => setLoading(false))
  }, [])

  const mostradas = filtro ? todas.filter(p => p.estadoCodigo === filtro) : todas

  const handleAsignar = async (puntoId: number, capatazId: number) => {
    // Bloquear inmediatamente en el estado local para feedback
    setSaving(s => ({ ...s, [puntoId]: true }))
    setMsg(null)
    try {
      await puntoService.asignar(puntoId, capatazId)
      const capNombre = capataces.find(c => c.id === capatazId)?.nombre ?? ''
      setTodas(prev =>
        prev.map(p => p.idOt === puntoId ? { ...p, capatazId, capatazNombre: capNombre } : p)
      )
      setMsg({ id: puntoId, ok: true, txt: 'Capataz asignado correctamente.' })
    } catch (err: any) {
      const txt = err?.response?.data?.message ?? 'Error al asignar capataz.'
      setMsg({ id: puntoId, ok: false, txt })
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
      setMsg({ id: ot.idOt, ok: true, txt: `OT ${ot.sgio} anulada.` })
    } catch (err: any) {
      const txt = err?.response?.data?.message ?? 'Error al anular OT.'
      setMsg({ id: ot.idOt, ok: false, txt })
    } finally {
      setAnulando(s => ({ ...s, [ot.idOt]: false }))
    }
  }

  // Contadores rápidos para los filtros
  const conteo: Record<string, number> = {}
  for (const ot of todas) {
    const c = ot.estadoCodigo ?? 'PENDIENTE'
    conteo[c] = (conteo[c] ?? 0) + 1
  }

  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Asignar Capataces a OTs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gestiona la asignación de capataces. Las OTs completadas o anuladas no se pueden modificar.
        </p>
      </div>

      {/* Chips de filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {([
          { value: '' as EstadoFiltro,          label: 'Todas',       color: 'bg-gray-100 text-gray-700 border-gray-200' },
          { value: 'PENDIENTE' as EstadoFiltro, label: 'Pendiente',   color: 'bg-gray-50  text-gray-600 border-gray-200' },
          { value: 'EN_PROGRESO' as EstadoFiltro, label: 'En Progreso', color: 'bg-orange-50 text-orange-700 border-orange-200' },
          { value: 'OBSERVADA' as EstadoFiltro, label: 'Observada',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { value: 'COMPLETADA' as EstadoFiltro,label: 'Completada',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { value: 'ANULADA' as EstadoFiltro,   label: 'Anulada',    color: 'bg-red-50 text-red-700 border-red-200' },
        ] as const).map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${color}
              ${filtro === value ? 'ring-2 ring-offset-1 ring-[#CC1111]/30 scale-[1.05]' : 'opacity-70 hover:opacity-100'}`}
          >
            {label}
            {value !== '' && conteo[value] != null
              ? <span className="ml-1.5 opacity-60">({conteo[value]})</span>
              : null}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <Filter size={12} />
          {mostradas.length} resultado{mostradas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-card p-12 flex items-center justify-center gap-3 text-gray-400 text-sm">
          <Loader2 size={20} className="animate-spin text-[#CC1111]" />
          Cargando órdenes de trabajo…
        </div>
      ) : mostradas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
          <Filter size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay OTs con el estado seleccionado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-semibold">OT / SGIO</th>
                  <th className="px-5 py-3 text-left font-semibold">Dirección</th>
                  <th className="px-5 py-3 text-left font-semibold">Estado</th>
                  <th className="px-5 py-3 text-left font-semibold">Capataz asignado</th>
                  <th className="px-5 py-3 text-left font-semibold">Asignar capataz</th>
                  <th className="px-5 py-3 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mostradas.map(ot => {
                  const esEditable = ESTADOS_EDITABLES.includes(ot.estadoCodigo ?? '')
                  const esFinal    = ESTADOS_FINALES.includes(ot.estadoCodigo ?? '')
                  const isAnulando = anulando[ot.idOt]
                  const isSaving   = saving[ot.idOt]
                  const esMsgOt    = msg?.id === ot.idOt

                  return (
                    <tr
                      key={ot.idOt}
                      className={`transition-colors ${esFinal ? 'bg-gray-50/60 opacity-70' : 'hover:bg-gray-50/40'}`}
                    >
                      {/* SGIO */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-800 font-mono">{ot.sgio}</span>
                        {ot.subactividad && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{ot.subactividad}</p>
                        )}
                      </td>

                      {/* Dirección */}
                      <td className="px-5 py-3.5 text-gray-500 text-[13px] max-w-[200px]">
                        <span className="line-clamp-2">{ot.direccion ?? '—'}</span>
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${BADGE[ot.estadoCodigo ?? 'PENDIENTE'] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ot.estadoCodigo ?? 'PENDIENTE'}
                        </span>
                      </td>

                      {/* Capataz actual */}
                      <td className="px-5 py-3.5 text-gray-600 text-[13px]">
                        {ot.capatazNombre
                          ? <span className="flex items-center gap-1"><UserCheck size={13} className="text-emerald-500" />{ot.capatazNombre}</span>
                          : <span className="text-gray-300 italic text-xs">Sin asignar</span>
                        }
                      </td>

                      {/* Selector de asignación */}
                      <td className="px-5 py-3.5">
                        {esFinal ? (
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Lock size={12} />
                            {ot.estadoCodigo === 'ANULADA' ? 'OT anulada' : 'OT completada'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={ot.capatazId ?? ''}
                              onChange={e => handleAsignar(ot.idOt, Number(e.target.value))}
                              disabled={isSaving || !esEditable}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111] bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Sin asignar</option>
                              {capataces.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                            {isSaving && <Loader2 size={14} className="animate-spin text-[#CC1111]" />}
                          </div>
                        )}
                        {esMsgOt && (
                          <p className={`mt-1 text-[11px] font-medium ${msg!.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                            {msg!.txt}
                          </p>
                        )}
                      </td>

                      {/* Acciones supervisor */}
                      <td className="px-5 py-3.5">
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
                          <button
                            onClick={() => handleAsignar(ot.idOt, ot.capatazId ?? 0)}
                            className="flex items-center gap-1.5 text-xs text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 px-2.5 py-1.5 rounded-lg transition-all mt-1"
                            title="Esta OT requiere atención"
                          >
                            <AlertTriangle size={12} />
                            Observada
                          </button>
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
