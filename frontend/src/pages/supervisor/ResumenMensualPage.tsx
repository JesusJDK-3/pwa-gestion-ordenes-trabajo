import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { reporteService } from '../../services/api'
import PageRefreshButton from '../../components/PageRefreshButton'
import { Activity, Briefcase, CheckCircle2, BarChart2, Download, Loader2 } from 'lucide-react'

interface MensualData {
  mes: number
  anio: number
  periodo: string
  completadas: number
  creadas: number
  pendientes: number
  porCapataz: Record<string, number>
  porSemana?: Record<string, number>
}

export default function ResumenMensualPage() {
  const [mesSel, setMesSel] = useState(new Date().getMonth() + 1)
  const [anioSel, setAnioSel] = useState(new Date().getFullYear())
  const [mensual, setMensual] = useState<MensualData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMensual = useCallback((m = mesSel, a = anioSel) => {
    setLoading(true)
    reporteService.mensual(m, a)
      .then(r => {
        const d = r.data as { data?: MensualData } | MensualData
        setMensual(('data' in d && d.data) ? d.data : d as MensualData)
      })
      .finally(() => setLoading(false))
  }, [mesSel, anioSel])

  useEffect(() => { fetchMensual(mesSel, anioSel) }, [mesSel, anioSel, fetchMensual])

  const exportarExcel = () => {
    if (!mensual) return
    const resumen = [
      { Concepto: 'Período', Valor: mensual.periodo },
      { Concepto: 'OTs creadas', Valor: mensual.creadas },
      { Concepto: 'Completadas', Valor: mensual.completadas },
      { Concepto: 'Pendientes', Valor: mensual.pendientes },
    ]
    const porCap = Object.entries(mensual.porCapataz).map(([cap, cnt]) => ({
      Capataz: cap, 'OTs completadas': cnt,
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porCap), 'Por Capataz')
    XLSX.writeFile(wb, `resumen-mensual-${mensual.anio}-${String(mensual.mes).padStart(2, '0')}.xlsx`)
  }

  const inputClass = 'corp-input py-2 w-auto'

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Supervisor · Reportes</p>
          <h1 className="page-title">Resumen mensual</h1>
          <p className="page-subtitle">OTs completadas en el mes. Al cambiar mes o año se actualiza automáticamente.</p>
        </div>
        <PageRefreshButton onClick={() => fetchMensual(mesSel, anioSel)} loading={loading} />
      </div>

      <div className="corp-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="corp-label">Mes</label>
          <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))} className={inputClass}>
            {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
              .map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="corp-label">Año</label>
          <input type="number" value={anioSel} onChange={e => setAnioSel(Number(e.target.value))}
            min={2020} max={2030} className={`${inputClass} w-24`} />
        </div>
        <button onClick={exportarExcel} disabled={!mensual}
          className="btn-primary text-sm ml-auto disabled:opacity-50">
          <Download size={14} />
          Exportar Excel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#CC1111]" /></div>
      ) : mensual ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="OTs creadas" value={mensual.creadas} icon={<Briefcase size={16} className="text-gray-400" />} />
            <KpiCard label="Completadas" value={mensual.completadas} icon={<CheckCircle2 size={16} className="text-emerald-500" />} color="text-emerald-700" bg="bg-emerald-50" />
            <KpiCard label="Pendientes" value={mensual.pendientes} icon={<Activity size={16} className="text-orange-500" />} color="text-orange-700" bg="bg-orange-50" />
            <KpiCard label="Tasa completado"
              value={mensual.creadas > 0 ? Math.round((mensual.completadas / mensual.creadas) * 100) : 0}
              icon={<BarChart2 size={16} className="text-blue-500" />} color="text-blue-700" bg="bg-blue-50" />
          </div>

              {mensual.porSemana && Object.keys(mensual.porSemana).length > 0 && (
                <div className="bg-white rounded-2xl shadow-card p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">OT completadas por semana del mes</h3>
                  <div className="flex items-end gap-3 h-40">
                    {Object.entries(mensual.porSemana).map(([sem, cnt]) => {
                      const max = Math.max(...Object.values(mensual.porSemana!), 1)
                      const h = Math.round((cnt / max) * 100)
                      return (
                        <div key={sem} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-gray-700">{cnt}</span>
                          <div className="w-full bg-[#CC1111] rounded-t" style={{ height: `${Math.max(h, 4)}%` }} />
                          <span className="text-[10px] text-gray-500">Sem {sem}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {Object.keys(mensual.porCapataz).length > 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Completadas por capataz</h3>
              <div className="space-y-3">
                {Object.entries(mensual.porCapataz)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cap, cnt]) => {
                    const max = Math.max(...Object.values(mensual.porCapataz))
                    const pct = max > 0 ? Math.round((cnt / max) * 100) : 0
                    return (
                      <div key={cap} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-40 truncate flex-shrink-0">{cap}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-[#CC1111]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-800 w-6 text-right flex-shrink-0">{cnt}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
              Sin OTs completadas en este período.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
          Selecciona mes y año para consultar.
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon, color = 'text-gray-700', bg = 'bg-gray-50' }: {
  label: string; value: number; icon: React.ReactNode; color?: string; bg?: string
}) {
  return (
    <div className={`${bg} rounded-2xl p-4 shadow-card`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
