import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { alertaService, ordenService } from '../../services/api'
import type { Alerta, OrdenTrabajo } from '../../types'

export default function SupervisorDashboard() {
  const [ordenes, setOrdenes]   = useState<OrdenTrabajo[]>([])
  const [alertas, setAlertas]   = useState<Alerta[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([ordenService.listar(), alertaService.listar()])
      .then(([oRes, aRes]) => {
        setOrdenes((oRes.data as { data: OrdenTrabajo[] }).data ?? [])
        setAlertas((aRes.data as { data: Alerta[] }).data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const totalPuntos    = ordenes.reduce((s, o) => s + (o.puntos?.length ?? 0), 0)
  const completados    = ordenes.reduce((s, o) => s + (o.puntos?.filter(p => p.estado === 'COMPLETADO').length ?? 0), 0)

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Cargando…</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard Supervisor</h2>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Órdenes activas',  value: ordenes.filter(o => o.estado === 'ACTIVA').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Total puntos',     value: totalPuntos, color: 'bg-gray-50 text-gray-700' },
          { label: 'Completados',      value: completados, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Alertas',          value: alertas.length, color: 'bg-red-50 text-red-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm mt-1 opacity-75">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Órdenes recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Órdenes de trabajo</h3>
          <Link to="/supervisor/cargar-ot" className="text-sm text-[#1D9E75] hover:underline">
            + Cargar Excel
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              {['Código', 'Descripción', 'Fecha', 'Estado', 'Puntos'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ordenes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin órdenes. Carga un Excel.</td></tr>
            ) : ordenes.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-[#1D9E75]">{o.codigoOt}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{o.descripcion}</td>
                <td className="px-4 py-3 text-gray-500">{o.fechaCarga}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    o.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>{o.estado}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{o.puntos?.length ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-red-800 mb-3">⚠️ Alertas pendientes ({alertas.length})</h3>
          <ul className="space-y-1.5">
            {alertas.slice(0, 5).map(a => (
              <li key={a.id} className="text-sm text-red-700">• {a.mensaje}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
