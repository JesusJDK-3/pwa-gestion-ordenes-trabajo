import { useEffect, useState } from 'react'
import { ordenService, puntoService } from '../../services/api'
import type { OrdenTrabajo, PuntoTrabajo, User } from '../../types'
import api from '../../services/api'
import type { ApiResponse } from '../../types'

export default function AsignarPuntos() {
  const [ordenes,   setOrdenes]   = useState<OrdenTrabajo[]>([])
  const [capataces, setCapataces] = useState<User[]>([])
  const [ordenId,   setOrdenId]   = useState<number | null>(null)
  const [puntos,    setPuntos]    = useState<PuntoTrabajo[]>([])
  const [saving,    setSaving]    = useState<Record<number, boolean>>({})
  const [filtro,    setFiltro]    = useState('')

  useEffect(() => {
    ordenService.listar().then(r => setOrdenes((r.data as ApiResponse<OrdenTrabajo[]>).data ?? []))
    api.get<ApiResponse<User[]>>('/usuarios').then(r => {
      const todos = r.data.data ?? []
      setCapataces(todos.filter(u => u.rol === 'CAPATAZ'))
    })
  }, [])

  useEffect(() => {
    if (!ordenId) return
    puntoService.todos({ ordenId }).then(r =>
      setPuntos((r.data as ApiResponse<PuntoTrabajo[]>).data ?? []))
  }, [ordenId])

  const handleAsignar = async (puntoId: number, capatazId: number) => {
    setSaving(s => ({ ...s, [puntoId]: true }))
    try {
      await puntoService.asignar(puntoId, capatazId)
      setPuntos(prev => prev.map(p => p.id === puntoId ? { ...p, capatazId } : p))
    } finally {
      setSaving(s => ({ ...s, [puntoId]: false }))
    }
  }

  const puntosFiltrados = filtro
    ? puntos.filter(p => p.estado === filtro)
    : puntos

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">Asignar Puntos a Capataces</h2>

      <div className="flex gap-3 flex-wrap">
        <select
          value={ordenId ?? ''}
          onChange={e => setOrdenId(e.target.value ? Number(e.target.value) : null)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
        >
          <option value="">Seleccionar orden…</option>
          {ordenes.map(o => (
            <option key={o.id} value={o.id}>{o.codigoOt} — {o.descripcion}</option>
          ))}
        </select>

        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
        >
          <option value="">Todos los estados</option>
          {['PENDIENTE','EN_PROGRESO','COMPLETADO','OBSERVADO'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {!ordenId ? (
        <p className="text-gray-400 text-sm py-8 text-center">Selecciona una orden para ver sus puntos.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                {['Descripción','Dirección','Estado','Capataz asignado','Acción'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {puntosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin puntos.</td></tr>
              ) : puntosFiltrados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{p.descripcion}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{p.direccion}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.capatazNombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={p.capatazId ?? ''}
                      onChange={e => handleAsignar(p.id, Number(e.target.value))}
                      disabled={saving[p.id]}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                    >
                      <option value="">Sin asignar</option>
                      {capataces.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] ?? 'bg-gray-100'}`}>
      {estado}
    </span>
  )
}
