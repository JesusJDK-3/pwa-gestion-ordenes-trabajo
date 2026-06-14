import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reporteService } from '../../services/api'
import PageRefreshButton from '../../components/PageRefreshButton'
import OtFiltrosBar from '../../components/OtFiltrosBar'
import { fechaLocalISO } from '../../utils/formatTime'
import {
  FolderKanban, BadgeCheck, UserCog, Activity,
  FileSpreadsheet, AlertTriangle, Eye, CheckCircle2, Calendar,
} from 'lucide-react'

interface DiarioItem {
  idOt?: number
  sgio: string
  estado: string
  direccion: string
  capataz: string
  observacion: string
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

type VistaTab = 'todas' | 'observadas' | 'sin-asignar' | 'activas'

function statusClass(estado?: string) {
  switch (estado) {
    case 'COMPLETADA':  return 'status-pill status-completada'
    case 'EN_PROGRESO': return 'status-pill status-progreso'
    case 'OBSERVADA':   return 'status-pill status-observada'
    case 'ANULADA':     return 'status-pill status-anulada'
    default:            return 'status-pill status-pendiente'
  }
}

export default function SupervisorDashboard() {
  const hoy = fechaLocalISO()
  const [diario, setDiario] = useState<DiarioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<VistaTab>('todas')
  const [filtroSgio, setFiltroSgio] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargar = useCallback((esRefresh = false) => {
    if (esRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    reporteService.diario(hoy)
      .then(r => {
        const d = r.data as { data?: DiarioData } | DiarioData
        setDiario(('data' in d && d.data) ? d.data : d as DiarioData)
      })
      .catch(() => {
        setDiario(null)
        setError('No se pudo cargar la actividad del día. Verifique la conexión.')
      })
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [hoy])

  useEffect(() => { cargar() }, [cargar])

  const detalle = diario?.detalle ?? []

  const filtrado = useMemo(() => {
    return detalle.filter(o => {
      if (filtroSgio && !(o.sgio ?? '').toUpperCase().includes(filtroSgio.trim().toUpperCase())) return false
      if (filtroEstado && o.estado !== filtroEstado) return false
      if (vista === 'observadas' && o.estado !== 'OBSERVADA') return false
      if (vista === 'activas' && !['PENDIENTE', 'EN_PROGRESO', 'OBSERVADA'].includes(o.estado)) return false
      if (vista === 'sin-asignar' && (o.capataz && o.capataz !== 'Sin asignar')) return false
      if (vista === 'sin-asignar' && o.estado !== 'PENDIENTE') return false
      return true
    })
  }, [detalle, filtroSgio, filtroEstado, vista])

  const observadas = useMemo(() => detalle.filter(o => o.estado === 'OBSERVADA'), [detalle])
  const sinAsignar = useMemo(() => detalle.filter(o => o.estado === 'PENDIENTE' && (!o.capataz || o.capataz === 'Sin asignar')), [detalle])

  if (loading && !diario) return <PageSkeleton />

  const kpis = [
    { label: 'Activas hoy',  value: diario?.totalActivos ?? 0, icon: Activity,      iconBg: 'bg-sky-50 border-sky-200 text-sky-700', accent: 'border-l-sky-600', tab: 'activas' as VistaTab },
    { label: 'Observadas',   value: diario?.observadas ?? 0,   icon: Eye,           iconBg: 'bg-yellow-50 border-yellow-300 text-yellow-800', accent: 'border-l-yellow-500', tab: 'observadas' as VistaTab },
    { label: 'En progreso',  value: diario?.enProgreso ?? 0,   icon: UserCog,       iconBg: 'bg-orange-50 border-orange-200 text-orange-700', accent: 'border-l-orange-500', tab: 'activas' as VistaTab },
    { label: 'Completadas',  value: diario?.completadas ?? 0, icon: BadgeCheck,    iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', accent: 'border-l-emerald-600', tab: 'todas' as VistaTab },
  ]

  const tabs: { id: VistaTab; label: string; count: number }[] = [
    { id: 'todas',       label: 'Todas hoy',   count: detalle.length },
    { id: 'observadas',  label: 'Observadas',  count: observadas.length },
    { id: 'sin-asignar', label: 'Sin capataz', count: sinAsignar.length },
    { id: 'activas',     label: 'En operación', count: detalle.filter(o => ['PENDIENTE','EN_PROGRESO','OBSERVADA'].includes(o.estado)).length },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Panel ejecutivo · Supervisor</p>
          <h1 className="page-title">Centro de control operativo</h1>
          <p className="page-subtitle">
            Actividad del día · {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <PageRefreshButton onClick={() => cargar(true)} loading={refreshing} />
          <Link to="/supervisor/cargar-ot" className="btn-primary">
            <FileSpreadsheet size={15} />
            Importar Excel
          </Link>
        </div>
      </div>

      {error && <div className="alert-banner alert-error text-sm">{error}</div>}

      <div className="corp-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">Resumen del día</p>
          <Link to="/supervisor/resumen-diario" className="text-xs text-[#1B4F72] hover:underline inline-flex items-center gap-1 font-medium">
            <Calendar size={12} />
            Ver resumen completo
          </Link>
        </div>
        <div className="kpi-grid">
          {kpis.map(k => {
            const Icon = k.icon
            return (
              <button
                key={k.label}
                type="button"
                onClick={() => setVista(k.tab)}
                className={`kpi-tile border-l-4 ${k.accent} text-left hover:bg-slate-50/80 transition-colors cursor-pointer`}
              >
                <div className={`kpi-icon-box ${k.iconBg}`}>
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="kpi-value">{k.value}</p>
                  <p className="kpi-label">{k.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {observadas.length > 0 && (
        <section className="corp-card border-2 border-yellow-400 overflow-hidden">
          <div className="corp-card-header bg-yellow-50 border-b border-yellow-200 py-3 flex-col items-start gap-1">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-yellow-900 font-bold">
                <AlertTriangle size={16} />
                OTs observadas hoy
              </span>
              <span className="badge-count bg-yellow-300 text-yellow-950 font-bold">{observadas.length}</span>
            </div>
            <p className="text-xs text-yellow-800/90 font-normal leading-snug">
              Reporte del día: OTs que siguen en estado Observada. Cerrar la alerta no las quita de aquí; desaparecen cuando el capataz las marque Completada.
            </p>
          </div>
          <div className="divide-y divide-yellow-100">
            {observadas.map(o => (
              <div key={o.sgio} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between bg-yellow-50/30">
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-bold text-[#1B4F72] text-sm">{o.sgio}</p>
                  <p className="text-xs text-slate-500 mt-1">{o.capataz} · {o.direccion}</p>
                  <p className="text-sm text-amber-950 mt-2 whitespace-pre-wrap bg-white border border-amber-200 rounded-lg px-3 py-2">
                    {o.observacion?.trim() || 'Sin observaciones del capataz.'}
                  </p>
                </div>
                <Link
                  to={o.idOt ? `/supervisor/alertas?ot=${o.idOt}` : '/supervisor/alertas'}
                  className="btn-secondary text-xs py-2 whitespace-nowrap flex-shrink-0 self-start"
                >
                  <Eye size={13} />
                  Ver en alertas
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {observadas.length === 0 && (
        <div className="corp-card border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} />
          Sin OTs observadas hoy.
        </div>
      )}

      <OtFiltrosBar
        sgio={filtroSgio}
        estado={filtroEstado}
        onSgio={setFiltroSgio}
        onEstado={setFiltroEstado}
        onLimpiar={() => { setFiltroSgio(''); setFiltroEstado('') }}
      />

      <div className="corp-card overflow-hidden">
        <div className="corp-card-header flex-col sm:flex-row gap-3 items-start sm:items-center">
          <span className="flex items-center gap-2">
            <FolderKanban size={14} />
            OTs con actividad hoy
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setVista(t.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                  vista === t.id
                    ? t.id === 'observadas' ? 'bg-yellow-300 text-yellow-950' : 'bg-[#1B4F72] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                {['SGIO', 'Capataz', 'Estado', 'Observaciones', 'Dirección'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Sin actividad registrada hoy para estos filtros.
                  </td>
                </tr>
              ) : filtrado.map(o => (
                <tr key={o.sgio} className={o.estado === 'OBSERVADA' ? 'bg-yellow-50/70' : undefined}>
                  <td className="font-mono font-bold text-[#1B4F72] text-xs">{o.sgio}</td>
                  <td className="text-sm text-slate-600">{o.capataz || 'Sin asignar'}</td>
                  <td><span className={statusClass(o.estado)}>{o.estado}</span></td>
                  <td className="max-w-xs text-xs line-clamp-2">{o.observacion?.trim() || '—'}</td>
                  <td className="max-w-[180px] truncate text-slate-500">{o.direccion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-72 bg-slate-200" />
      <div className="h-28 bg-white border border-slate-200" />
      <div className="h-80 bg-slate-200" />
    </div>
  )
}
