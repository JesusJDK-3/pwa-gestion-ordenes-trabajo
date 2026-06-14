import { useCallback, useEffect, useRef, useState } from 'react'
import { puntoService } from '../../services/api'
import PageRefreshButton from '../../components/PageRefreshButton'
import { Briefcase, CheckCircle2, Clock, Loader2 } from 'lucide-react'

interface CapatazResumen {
  capataz: string
  asignadas: number
  completadasHoy: number
  pendientes: number
  pctAvance: number
}

export default function SeguimientoPage() {
  const [data, setData] = useState<CapatazResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback((esRefresh = false) => {
    if (esRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    puntoService.seguimientoResumen()
      .then(r => {
        const raw = r.data as { data?: CapatazResumen[] } | CapatazResumen[]
        const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
        setData(list)
      })
      .catch(() => setError('No se pudo cargar el seguimiento en vivo.'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(() => fetchData(true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchData])

  if (loading && data.length === 0) return (
    <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#1B4F72]" /></div>
  )

  const totAsignadas = data.reduce((s, c) => s + c.asignadas, 0)
  const totCompletadas = data.reduce((s, c) => s + c.completadasHoy, 0)
  const totPendientes = data.reduce((s, c) => s + c.pendientes, 0)

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Seguimiento · Supervisor</p>
          <h1 className="page-title">Monitoreo en vivo</h1>
          <p className="page-subtitle">OT completadas hoy por capataz · actualización automática cada 30 s</p>
        </div>
        <PageRefreshButton onClick={() => fetchData(true)} loading={refreshing} />
      </div>

      {error && <div className="alert-banner alert-error text-sm">{error}</div>}

      <div className="kpi-grid grid-cols-1 sm:grid-cols-3">
        <div className="kpi-tile border-l-4 border-l-sky-600">
          <div className="kpi-icon-box bg-sky-50 border-sky-200 text-sky-700">
            <Briefcase size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value">{totAsignadas}</p>
            <p className="kpi-label">OT asignadas</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-emerald-600">
          <div className="kpi-icon-box bg-emerald-50 border-emerald-200 text-emerald-700">
            <CheckCircle2 size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value">{totCompletadas}</p>
            <p className="kpi-label">Completadas hoy</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-amber-500">
          <div className="kpi-icon-box bg-amber-50 border-amber-200 text-amber-700">
            <Clock size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value">{totPendientes}</p>
            <p className="kpi-label">Pendientes</p>
          </div>
        </div>
      </div>

      <div className="corp-card overflow-hidden">
        <div className="corp-card-header">
          <span>Avance por capataz</span>
          <span className="badge-count">{data.length} capataces</span>
        </div>
        {data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Sin datos de seguimiento activos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  {['Capataz', 'Asignadas', 'Completadas hoy', 'Pendientes', 'Avance %'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.capataz}>
                    <td className="font-medium text-slate-800">{c.capataz}</td>
                    <td className="tabular-nums">{c.asignadas}</td>
                    <td className="tabular-nums text-emerald-700 font-semibold">{c.completadasHoy}</td>
                    <td className="tabular-nums text-amber-700">{c.pendientes}</td>
                    <td className="tabular-nums">{c.pctAvance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
