import { useEffect, useState } from 'react'
import { ordenService, puntoService } from '../../services/api'
import type { OrdenTrabajo, User } from '../../types'
import api from '../../services/api'
import type { ApiResponse } from '../../types'
import { Filter, Loader2 } from 'lucide-react'

export default function AsignarPuntos() {
  const [ordenes,   setOrdenes]   = useState<OrdenTrabajo[]>([])
  const [capataces, setCapataces] = useState<User[]>([])
  const [ordenId,   setOrdenId]   = useState<number | null>(null)
  const [puntos,    setPuntos]    = useState<OrdenTrabajo[]>([])
  const [saving,    setSaving]    = useState<Record<number, boolean>>({})
  const [filtro,    setFiltro]    = useState('')

  useEffect(() => {
    ordenService.listar().then(r => {
      const d = r.data as any
      setOrdenes(Array.isArray(d) ? d : (d?.data ?? []))
    })
    api.get<ApiResponse<User[]>>('/usuarios').then(r => {
      const todos = r.data.data ?? []
      setCapataces(todos.filter(u => u.rol === 'capataz'))
    })
  }, [])

  useEffect(() => {
    if (!ordenId) return
    puntoService.todos({ ordenId }).then(r => {
      const data = (r.data as any)
      setPuntos(Array.isArray(data) ? data : (data?.data ?? []))
    })
  }, [ordenId])

  const handleAsignar = async (puntoId: number, capatazId: number) => {
    setSaving(s => ({ ...s, [puntoId]: true }))
    try {
      await puntoService.asignar(puntoId, capatazId)
      setPuntos(prev => prev.map(p => p.idOt === puntoId ? { ...p, capatazId } : p))
    } finally {
      setSaving(s => ({ ...s, [puntoId]: false }))
    }
  }

  const puntosFiltrados = filtro ? puntos.filter(p => p.estadoCodigo === filtro) : puntos

  const selectClass = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111] transition-all'

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Asignar Puntos a Capataces</h1>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona una orden para ver y asignar sus puntos</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 flex gap-3 flex-wrap items-center">
        <Filter size={16} className="text-gray-400" />
        <select
          value={ordenId ?? ''}
          onChange={e => setOrdenId(e.target.value ? Number(e.target.value) : null)}
          className={`flex-1 min-w-[200px] ${selectClass}`}
        >
          <option value="">Seleccionar orden de trabajo…</option>
          {ordenes.map(o => (
            <option key={o.idOt} value={o.idOt}>{o.sgio} — {o.subactividad ?? o.direccion ?? ''}</option>
          ))}
        </select>

        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          {['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'OBSERVADA', 'ANULADA'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {!ordenId ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Filter size={28} className="opacity-40" />
          </div>
          <p className="text-sm">Selecciona una orden para ver sus puntos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Puntos{filtro ? ` · ${filtro}` : ''}{' '}
              <span className="text-gray-400 font-normal text-sm">({puntosFiltrados.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  {['Descripción', 'Dirección', 'Estado', 'Capataz asignado', 'Acción'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {puntosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                      Sin puntos que coincidan con el filtro.
                    </td>
                  </tr>
                ) : puntosFiltrados.map(p => (
                  <tr key={p.idOt} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800 font-mono">{p.sgio}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{p.direccion ?? p.subactividad ?? '—'}</td>
                    <td className="px-5 py-3.5"><EstadoBadge estado={p.estadoCodigo ?? 'PENDIENTE'} /></td>
                    <td className="px-5 py-3.5 text-gray-600 text-[13px]">{p.capatazNombre ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={p.capatazId ?? ''}
                          onChange={e => handleAsignar(p.idOt!, Number(e.target.value))}
                          disabled={saving[p.idOt!]}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111] bg-white transition-all disabled:opacity-60"
                        >
                          <option value="">Sin asignar</option>
                          {capataces.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                        {saving[p.idOt!] && <Loader2 size={14} className="animate-spin text-[#CC1111]" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    PENDIENTE:   'bg-gray-100 text-gray-600',
    EN_PROGRESO: 'bg-orange-100 text-orange-700',
    COMPLETADO:  'bg-emerald-100 text-emerald-700',
    OBSERVADO:   'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[estado] ?? 'bg-gray-100'}`}>
      {estado}
    </span>
  )
}
