import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageRefreshButton from '../../components/PageRefreshButton'
import { CheckCircle, Clock, Eye, Loader2 } from 'lucide-react'
import { puntoService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'
import OtFiltrosBar from '../../components/OtFiltrosBar'
import { unwrapList } from '../../utils/apiParse'
import { formatearObservacionCapataz } from '../../utils/observacionCapataz'
import { fechaActividadOt, formatearFechaHistorial } from '../../utils/formatTime'

function statusClass(estado?: string) {
  switch (estado) {
    case 'COMPLETADA':  return 'status-pill status-completada'
    case 'OBSERVADA':   return 'status-pill status-observada'
    case 'EN_PROGRESO': return 'status-pill status-progreso'
    case 'ANULADA':     return 'status-pill status-anulada'
    default:            return 'status-pill status-pendiente'
  }
}

export default function SupervisorHistorialPage() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroSgio, setFiltroSgio] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  const cargar = useCallback(() => {
    setLoading(true)
    setError('')
    puntoService.historialSupervisor({
      fecha: filtroFecha || undefined,
      sgio: filtroSgio || undefined,
      estado: filtroEstado || undefined,
    })
      .then(r => setOrdenes(unwrapList<OrdenTrabajo>(r.data)))
      .catch(() => {
        setOrdenes([])
        setError('No se pudo cargar el historial.')
      })
      .finally(() => setLoading(false))
  }, [filtroFecha, filtroSgio, filtroEstado])

  useEffect(() => { cargar() }, [cargar])

  const completadas = useMemo(() => {
    if (filtroEstado === 'COMPLETADA') return ordenes
    return ordenes.filter(o => o.estadoCodigo === 'COMPLETADA')
  }, [ordenes, filtroEstado])

  const observadas = useMemo(() => {
    if (filtroEstado === 'OBSERVADA') return ordenes
    return ordenes.filter(o => o.estadoCodigo === 'OBSERVADA')
  }, [ordenes, filtroEstado])

  const tituloTabla = filtroFecha
    ? `Historial del ${formatearFechaHistorial(`${filtroFecha}T12:00:00`, true)}`
    : 'Historial de OTs'

  const stats = [
    { label: 'Total registros', value: ordenes.length, icon: Clock, accent: 'border-l-sky-600', iconBg: 'bg-sky-50 border-sky-200 text-sky-700', estado: '' },
    { label: 'Completadas', value: completadas.length, icon: CheckCircle, accent: 'border-l-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', estado: 'COMPLETADA' },
    { label: 'Observadas', value: observadas.length, icon: Eye, accent: 'border-l-yellow-500', iconBg: 'bg-yellow-50 border-yellow-300 text-yellow-800', estado: 'OBSERVADA' },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Supervisor · Historial</p>
          <h1 className="page-title">Historial de OTs</h1>
          <p className="page-subtitle">
            Los totales y la tabla responden a los mismos filtros: fecha, código OT y estado.
          </p>
        </div>
        <PageRefreshButton onClick={cargar} loading={loading} />
      </div>

      <OtFiltrosBar
        sgio={filtroSgio}
        estado={filtroEstado}
        fecha={filtroFecha}
        showFecha
        onSgio={setFiltroSgio}
        onEstado={setFiltroEstado}
        onFecha={setFiltroFecha}
        onLimpiar={() => { setFiltroSgio(''); setFiltroEstado(''); setFiltroFecha('') }}
      />

      <div className="kpi-grid grid-cols-1 sm:grid-cols-3">
        {stats.map(s => {
          const Icon = s.icon
          const activo = filtroEstado === s.estado
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setFiltroEstado(activo ? '' : s.estado)}
              className={`kpi-tile border-l-4 ${s.accent} text-left hover:bg-slate-50/80 transition-colors cursor-pointer${activo ? ' ring-2 ring-[#1B4F72]/25' : ''}`}
            >
              <div className={`kpi-icon-box ${s.iconBg}`}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="kpi-value">{s.value}</p>
                <p className="kpi-label">{s.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      {loading ? (
        <div className="corp-card p-12 flex justify-center"><Loader2 size={24} className="animate-spin text-[#1B4F72]" /></div>
      ) : ordenes.length === 0 ? (
        <div className="corp-card p-12 text-center text-slate-400 text-sm">Sin registros para los filtros aplicados.</div>
      ) : (
        <div className="corp-card overflow-hidden">
          <div className="corp-card-header">
            <span>{tituloTabla}</span>
            <span className="badge-count">{ordenes.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  {['SGIO', 'Fecha', 'Capataz', 'Estado', 'Dirección', 'Observaciones', 'Acción'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenes.map(ot => (
                  <tr key={ot.idOt} className={ot.estadoCodigo === 'OBSERVADA' ? 'bg-yellow-50/50' : undefined}>
                    <td className="font-mono font-bold text-[#1B4F72] text-xs">{ot.sgio}</td>
                    <td className="text-slate-600 text-xs tabular-nums whitespace-nowrap">
                      {formatearFechaHistorial(fechaActividadOt(ot), Boolean(filtroFecha))}
                    </td>
                    <td className="text-sm text-slate-600">{ot.capatazNombre ?? 'Sin asignar'}</td>
                    <td><span className={statusClass(ot.estadoCodigo)}>{ot.estado ?? ot.estadoCodigo}</span></td>
                    <td className="max-w-[160px] truncate text-slate-500">{ot.direccion ?? '—'}</td>
                    <td className="max-w-[220px] text-xs whitespace-pre-wrap">
                      {formatearObservacionCapataz(ot.observacion) || '—'}
                    </td>
                    <td>
                      {ot.estadoCodigo === 'OBSERVADA' && (
                        <Link to={`/supervisor/alertas?ot=${ot.idOt}`} className="text-xs text-[#1B4F72] font-semibold hover:underline">
                          Ver en alertas
                        </Link>
                      )}
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
