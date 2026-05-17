import { useEffect, useState } from 'react'
import { reporteService } from '../../services/api'
import type { ApiResponse, RegistroActividad } from '../../types'

type Tab = 'actividades' | 'reportes' | 'auditoria'

export default function AdminDashboard() {
  const [tab,       setTab]      = useState<Tab>('actividades')
  const [registros, setRegistros] = useState<RegistroActividad[]>([])
  const [loading,   setLoading]  = useState(true)

  const [mes,   setMes]   = useState(new Date().getMonth() + 1)
  const [anio,  setAnio]  = useState(new Date().getFullYear())
  const [reporte, setReporte] = useState<Record<string, unknown> | null>(null)

  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    reporteService.auditoria()
      .then(r => setRegistros((r.data as ApiResponse<RegistroActividad[]>).data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const fetchReporte = async () => {
    const r = await reporteService.mensual(mes, anio)
    setReporte((r.data as ApiResponse<Record<string, unknown>>).data)
  }

  const handleExport = async () => {
    const r = await reporteService.exportarExcel(exportDate)
    const url = URL.createObjectURL(new Blob([r.data as BlobPart]))
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${exportDate}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando…</div>

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">Panel de Administración</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['actividades', 'reportes', 'auditoria'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Actividades */}
      {tab === 'actividades' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                {['Punto','Capataz','Tipo','Observaciones','Fecha','Estado','Validado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registros.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin registros.</td></tr>
              ) : registros.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{r.descripcionPunto ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{r.capatazNombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r.tipoActividad}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.observaciones ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{r.fechaRegistro?.slice(0,16)}</td>
                  <td className="px-4 py-3">
                    {r.creadoOffline && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">Offline</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.validado ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.validado ? 'Sí' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reportes */}
      {tab === 'reportes' && (
        <div className="space-y-5 max-w-xl">
          {/* Reporte mensual */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Reporte mensual</h3>
            <div className="flex gap-2">
              <input type="number" value={mes} onChange={e => setMes(Number(e.target.value))}
                min={1} max={12} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={fetchReporte}
                className="bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#178060]">
                Ver reporte
              </button>
            </div>
            {reporte && (
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto">
                {JSON.stringify(reporte, null, 2)}
              </pre>
            )}
          </div>

          {/* Exportar Excel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Exportar Excel</h3>
            <div className="flex gap-2">
              <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" />
              <button onClick={handleExport}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 whitespace-nowrap">
                📥 Descargar .xlsx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auditoría */}
      {tab === 'auditoria' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Auditoría de registros ({registros.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                {['ID','Punto','Capataz','Tipo','Fecha','Offline','Sincronizado','Validado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registros.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 text-xs">
                  <td className="px-4 py-2 text-gray-400 font-mono">{r.id}</td>
                  <td className="px-4 py-2 text-gray-700 truncate max-w-[120px]">{r.descripcionPunto ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{r.capatazNombre ?? '—'}</td>
                  <td className="px-4 py-2">{r.tipoActividad}</td>
                  <td className="px-4 py-2 text-gray-500">{r.fechaRegistro?.slice(0,16)}</td>
                  <td className="px-4 py-2">{r.creadoOffline ? '✓' : '—'}</td>
                  <td className="px-4 py-2">{r.sincronizado ? '✓' : '⏳'}</td>
                  <td className="px-4 py-2">{r.validado ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
