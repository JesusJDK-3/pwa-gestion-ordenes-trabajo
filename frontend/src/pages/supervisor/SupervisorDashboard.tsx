import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { alertaService, ordenService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'
import { BarChart3, MapPin, CheckCircle2, AlertTriangle, Upload } from 'lucide-react'

export default function SupervisorDashboard() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([ordenService.listar(), alertaService.listar()])
      .then(([oRes, aRes]) => {
        const oData = (oRes.data as any)
        setOrdenes(Array.isArray(oData) ? oData : (oData?.data ?? []))
        const aData = (aRes.data as any)
        setAlertas(Array.isArray(aData) ? aData : (aData?.data ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  const activas    = ordenes.filter(o => !['COMPLETADA','ANULADA'].includes(o.estadoCodigo ?? ''))
  const completadas = ordenes.filter(o => o.estadoCodigo === 'COMPLETADA')

  if (loading) return <PageSkeleton />

  const kpis = [
    { label: 'OTs activas',    value: activas.length,     icon: BarChart3,     bg: 'bg-blue-50',    icon_color: 'text-blue-600',    value_color: 'text-blue-700' },
    { label: 'Total OTs',      value: ordenes.length,     icon: MapPin,        bg: 'bg-gray-50',    icon_color: 'text-gray-500',    value_color: 'text-gray-700' },
    { label: 'Completadas',    value: completadas.length, icon: CheckCircle2,  bg: 'bg-emerald-50', icon_color: 'text-emerald-600', value_color: 'text-emerald-700' },
    { label: 'Alertas',        value: alertas.length,     icon: AlertTriangle, bg: 'bg-red-50',     icon_color: 'text-[#CC1111]',   value_color: 'text-[#CC1111]' },
  ]

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Dashboard Supervisor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general de las operaciones</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`rounded-2xl p-5 ${k.bg} shadow-card`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={k.icon_color} />
              </div>
              <p className={`text-3xl font-bold ${k.value_color}`}>{k.value}</p>
              <p className="text-sm text-gray-500 mt-1">{k.label}</p>
            </div>
          )
        })}
      </div>

      {/* Órdenes recientes */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Órdenes de trabajo</h2>
          <Link
            to="/supervisor/cargar-ot"
            className="flex items-center gap-1.5 text-sm text-[#CC1111] hover:text-[#AA0E0E] font-medium transition-colors"
          >
            <Upload size={14} />
            Cargar Excel
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                {['SGIO', 'Subactividad', 'Capataz', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ordenes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    <Upload size={32} className="mx-auto mb-2 opacity-30" />
                    Sin órdenes. Carga un archivo Excel.
                  </td>
                </tr>
              ) : ordenes.map(o => (
                <tr key={o.idOt} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#CC1111] text-[13px]">{o.sgio}</td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{o.subactividad ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-[13px]">{o.capatazNombre ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      o.estadoCodigo === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700'
                      : o.estadoCodigo === 'EN_PROGRESO' ? 'bg-orange-100 text-orange-700'
                      : o.estadoCodigo === 'ANULADA' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{o.estado ?? o.estadoCodigo}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-[13px]">
                    {o.fechaProgramada ?? o.createdAt?.slice(0,10) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-[#CC1111]" />
            <h3 className="font-semibold text-red-800">Alertas pendientes ({alertas.length})</h3>
          </div>
          <ul className="space-y-2">
            {alertas.slice(0, 5).map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#CC1111] flex-shrink-0" />
                {a.mensaje ?? JSON.stringify(a)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )
}
