import { useEffect, useState } from 'react'
import { reporteService } from '../../services/api'
import type { ApiResponse, RegistroActividad } from '../../types'
import { Activity, BarChart2, ClipboardList, Download, Loader2 } from 'lucide-react'

type Tab = 'actividades' | 'reportes' | 'auditoria'

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'actividades', label: 'Actividades',  icon: Activity },
  { id: 'reportes',    label: 'Reportes',     icon: BarChart2 },
  { id: 'auditoria',   label: 'Auditoría',    icon: ClipboardList },
]

export default function AdminDashboard() {
  const [tab,       setTab]      = useState<Tab>('actividades')
  const [registros, setRegistros] = useState<RegistroActividad[]>([])
  const [loading,   setLoading]  = useState(true)

  const [mes,    setMes]    = useState(new Date().getMonth() + 1)
  const [anio,   setAnio]   = useState(new Date().getFullYear())
  const [reporte, setReporte] = useState<Record<string, unknown> | null>(null)
  const [loadingReporte, setLoadingReporte] = useState(false)

  const [exportDate,    setExportDate]    = useState(new Date().toISOString().slice(0, 10))
  const [loadingExport, setLoadingExport] = useState(false)

  useEffect(() => {
    reporteService.auditoria()
      .then(r => setRegistros((r.data as ApiResponse<RegistroActividad[]>).data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const fetchReporte = async () => {
    setLoadingReporte(true)
    try {
      const r = await reporteService.mensual(mes, anio)
      setReporte((r.data as ApiResponse<Record<string, unknown>>).data)
    } finally {
      setLoadingReporte(false)
    }
  }

  const handleExport = async () => {
    setLoadingExport(true)
    try {
      const r = await reporteService.exportarExcel(exportDate)
      const url = URL.createObjectURL(new Blob([r.data as BlobPart]))
      const a = document.createElement('a')
      a.href = url; a.download = `reporte-${exportDate}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoadingExport(false)
    }
  }

  if (loading) return <PageSkeleton />

  const inputClass = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111] transition-all bg-white'

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión de registros, reportes y auditoría del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 w-fit shadow-card border border-gray-100">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-[#CC1111] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Actividades ─────────────────────────────────────────── */}
      {tab === 'actividades' && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Registros de actividad{' '}
              <span className="text-gray-400 font-normal text-sm">({registros.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  {['Punto', 'Capataz', 'Tipo', 'Observaciones', 'Fecha', 'Estado', 'Validado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">Sin registros.</td>
                  </tr>
                ) : registros.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-700 max-w-[140px] truncate">{r.descripcionPunto ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-700">{r.capatazNombre ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{r.tipoActividad}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[140px] truncate">{r.observaciones ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">{r.fechaRegistro?.slice(0, 16)}</td>
                    <td className="px-5 py-3.5">
                      {r.creadoOffline && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg">Offline</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.validado ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.validado ? 'Validado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reportes ────────────────────────────────────────────── */}
      {tab === 'reportes' && (
        <div className="space-y-4 max-w-2xl">

          {/* Reporte mensual */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Reporte mensual</h2>
              <p className="text-sm text-gray-500 mt-0.5">Consulta el resumen de operaciones por mes</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input type="number" value={mes} onChange={e => setMes(Number(e.target.value))}
                min={1} max={12} placeholder="Mes"
                className={`w-20 ${inputClass}`} />
              <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))}
                placeholder="Año"
                className={`w-28 ${inputClass}`} />
              <button
                onClick={fetchReporte}
                disabled={loadingReporte}
                className="flex items-center gap-2 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:bg-gray-200 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {loadingReporte ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                {loadingReporte ? 'Consultando…' : 'Ver reporte'}
              </button>
            </div>
            {reporte && (
              <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto border border-gray-100 max-h-64">
                {JSON.stringify(reporte, null, 2)}
              </pre>
            )}
          </div>

          {/* Exportar Excel */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Exportar Excel</h2>
              <p className="text-sm text-gray-500 mt-0.5">Descarga el reporte de actividades de una fecha</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)}
                className={`flex-1 min-w-[140px] ${inputClass}`} />
              <button
                onClick={handleExport}
                disabled={loadingExport}
                className="flex items-center gap-2 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:bg-gray-200 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
              >
                {loadingExport ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {loadingExport ? 'Generando…' : 'Descargar .xlsx'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auditoría ───────────────────────────────────────────── */}
      {tab === 'auditoria' && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Auditoría de registros{' '}
              <span className="text-gray-400 font-normal text-sm">({registros.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  {['ID', 'Punto', 'Capataz', 'Tipo', 'Fecha', 'Offline', 'Sincronizado', 'Validado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registros.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors text-xs">
                    <td className="px-5 py-3 text-gray-400 font-mono">{r.id}</td>
                    <td className="px-5 py-3 text-gray-700 truncate max-w-[120px]">{r.descripcionPunto ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{r.capatazNombre ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.tipoActividad}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{r.fechaRegistro?.slice(0, 16)}</td>
                    <td className="px-5 py-3">
                      {r.creadoOffline
                        ? <span className="text-amber-600 font-semibold">✓</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {r.sincronizado
                        ? <span className="text-emerald-600 font-semibold">✓</span>
                        : <span className="text-orange-400">⏳</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {r.validado
                        ? <span className="text-emerald-600 font-semibold">✓</span>
                        : <span className="text-gray-300">—</span>
                      }
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

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-gray-200 rounded-lg" />
      <div className="h-12 w-64 bg-gray-200 rounded-2xl" />
      <div className="h-72 bg-gray-200 rounded-2xl" />
    </div>
  )
}
