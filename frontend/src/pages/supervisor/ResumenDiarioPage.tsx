import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { reporteService } from '../../services/api'
import { unwrapData } from '../../utils/apiParse'
import PageRefreshButton from '../../components/PageRefreshButton'
import { Activity, CheckCircle2, BarChart2, AlertTriangle, Download, Loader2 } from 'lucide-react'

interface DiarioItem {
  sgio: string
  estado: string
  direccion: string
  capataz: string
  observacion: string
  updatedAt: string
  subactividad?: string
}

interface DiarioData {
  fecha: string
  totalActivos: number
  completadas: number
  observadas: number
  enProgreso: number
  detalle: DiarioItem[]
}

export default function ResumenDiarioPage() {
  const [fechaDia, setFechaDia] = useState(new Date().toISOString().slice(0, 10))
  const [diario, setDiario] = useState<DiarioData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchDiario = useCallback((fecha = fechaDia) => {
    setLoading(true)
    setError('')
    reporteService.diario(fecha)
      .then(r => setDiario(unwrapData<DiarioData>(r.data)))
      .catch(() => {
        setDiario(null)
        setError('No se pudo cargar el resumen del día.')
      })
      .finally(() => setLoading(false))
  }, [fechaDia])

  useEffect(() => { fetchDiario(fechaDia) }, [fechaDia, fetchDiario])

  const exportarExcel = () => {
    if (!diario?.detalle?.length) return
    const ws = XLSX.utils.json_to_sheet(diario.detalle.map(d => ({
      'Código OT':    d.sgio,
      'Capataz':      d.capataz,
      'Punto':        d.direccion,
      'Estado':       d.estado,
      'Actividad':    d.subactividad ?? '',
      'Observación':  d.observacion,
      'Actualizado':  d.updatedAt ? d.updatedAt.slice(0, 19).replace('T', ' ') : '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen Diario')
    XLSX.writeFile(wb, `resumen-diario-${diario.fecha}.xlsx`)
  }

  const inputClass = 'corp-input py-2 w-auto'

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Supervisor · Reportes</p>
          <h1 className="page-title">Resumen diario</h1>
          <p className="page-subtitle">OTs con actividad en la fecha seleccionada. Al cambiar la fecha se actualiza automáticamente.</p>
        </div>
        <PageRefreshButton onClick={() => fetchDiario(fechaDia)} loading={loading} />
      </div>

      {error && <div className="alert-banner alert-error text-sm">{error}</div>}

      <div className="corp-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="corp-label">Fecha</label>
          <input type="date" value={fechaDia} onChange={e => setFechaDia(e.target.value)} className={inputClass} />
        </div>
        <button onClick={exportarExcel} disabled={!diario?.detalle?.length}
          className="btn-primary text-sm ml-auto disabled:opacity-50">
          <Download size={14} />
          Exportar Excel
        </button>
      </div>

      {diario && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Con actividad"   value={diario.totalActivos} icon={<Activity size={16} className="text-gray-400" />} />
          <KpiCard label="Completadas"     value={diario.completadas}  icon={<CheckCircle2 size={16} className="text-emerald-500" />} color="text-emerald-700" bg="bg-emerald-50" />
          <KpiCard label="En progreso"     value={diario.enProgreso}   icon={<BarChart2 size={16} className="text-orange-500" />} color="text-orange-700" bg="bg-orange-50" />
          <KpiCard label="Observadas"      value={diario.observadas}   icon={<AlertTriangle size={16} className="text-yellow-500" />} color="text-yellow-700" bg="bg-yellow-50" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Detalle del {fechaDia}
            {diario && <span className="text-gray-400 font-normal text-sm ml-2">({diario.detalle?.length ?? 0} registros)</span>}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                {['Código OT', 'Capataz', 'Punto', 'Estado', 'Actividad', 'Observación'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 size={20} className="animate-spin mx-auto text-[#CC1111]" /></td></tr>
              ) : !diario?.detalle?.length ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">Sin actividad en esta fecha.</td></tr>
              ) : diario.detalle.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#CC1111] text-[13px]">{d.sgio}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-[13px]">{d.capataz || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">{d.direccion || '—'}</td>
                  <td className="px-5 py-3.5">
                    <EstadoBadge estado={d.estado} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-[140px] truncate text-[12px]">{d.subactividad || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate text-[12px]">{d.observacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const cls =
    estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700' :
    estado === 'EN_PROGRESO' ? 'bg-orange-100 text-orange-700' :
    estado === 'OBSERVADA' ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{estado || '—'}</span>
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
