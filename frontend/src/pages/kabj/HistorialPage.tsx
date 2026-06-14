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

export default function HistorialPage() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroSgio, setFiltroSgio] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  const cargar = useCallback(() => {
    setLoading(true)
    setError('')
    puntoService.historialCapataz({
      fecha: filtroFecha || undefined,
      sgio: filtroSgio || undefined,
      estado: filtroEstado || undefined,
    })
      .then(r => setOrdenes(unwrapList<OrdenTrabajo>(r.data)))
      .catch(() => setError('No se pudo cargar el historial. Verifica tu conexión.'))
      .finally(() => setLoading(false))
  }, [filtroFecha, filtroSgio, filtroEstado])

  useEffect(() => { cargar() }, [cargar])

  const completadas = useMemo(() => ordenes.filter(o => o.estadoCodigo === 'COMPLETADA'), [ordenes])
  const observadas  = useMemo(() => ordenes.filter(o => o.estadoCodigo === 'OBSERVADA'), [ordenes])
  const conObs      = useMemo(() => ordenes.filter(o => o.observacion?.trim()), [ordenes])

  const stats = [
    { label: 'Total registros', value: ordenes.length, icon: Clock, accent: 'border-l-sky-600', iconBg: 'bg-sky-50 border-sky-200 text-sky-700', estado: '' },
    { label: 'Completadas', value: completadas.length, icon: CheckCircle, accent: 'border-l-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', estado: 'COMPLETADA' },
    { label: 'Observadas', value: observadas.length, icon: Eye, accent: 'border-l-yellow-500', iconBg: 'bg-yellow-50 border-yellow-300 text-yellow-800', estado: 'OBSERVADA' },
    { label: 'Con observaciones', value: conObs.length, icon: Eye, accent: 'border-l-violet-600', iconBg: 'bg-violet-50 border-violet-200 text-violet-700', estado: '__obs__' },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Operaciones de campo · Historial</p>
          <h1 className="page-title">Historial de OTs</h1>
          <p className="page-subtitle">
            Todas sus OTs ordenadas del cambio más reciente al más antiguo. Incluye completadas, observadas y pendientes.
          </p>
        </div>
        <PageRefreshButton onClick={cargar} loading={loading} />
      </div>

      <div className="kpi-grid grid-cols-2 xl:grid-cols-4">
        {stats.map(s => {
          const Icon = s.icon
          const esInfo = s.estado === '__obs__'
          const Tile = esInfo ? 'div' : 'button'
          return (
            <Tile
              key={s.label}
              type={esInfo ? undefined : 'button'}
              onClick={esInfo ? undefined : () => setFiltroEstado(filtroEstado === s.estado ? '' : s.estado)}
              className={`kpi-tile border-l-4 ${s.accent} text-left${esInfo ? '' : ' hover:bg-slate-50/80 transition-colors cursor-pointer'}`}
            >
              <div className={`kpi-icon-box ${s.iconBg}`}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="kpi-value">{s.value}</p>
                <p className="kpi-label">{s.label}</p>
              </div>
            </Tile>
          )
        })}
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

      {error && <div className="alert-banner alert-error">{error}</div>}

      {loading ? (
        <div className="corp-card p-12 flex items-center justify-center gap-3 text-slate-400 text-sm">
          <Loader2 size={20} className="animate-spin text-[#1B4F72]" />
          Cargando historial…
        </div>
      ) : ordenes.length === 0 ? (
        <div className="corp-card p-12 text-center text-slate-400">
          <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin registros para los filtros aplicados.</p>
        </div>
      ) : (
        <div className="corp-card overflow-hidden">
          <div className="corp-card-header">
            <span>Historial (más reciente primero)</span>
            <span className="badge-count">{ordenes.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  {['SGIO', 'Fecha', 'Estado', 'Ubicación', 'Observaciones', 'Acción'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenes.map(ot => (
                  <tr key={ot.idOt} className={ot.estadoCodigo === 'OBSERVADA' ? 'bg-yellow-50/50' : undefined}>
                    <td className="font-mono font-bold text-[#1B4F72] text-xs">{ot.sgio}</td>
                    <td className="text-slate-500 text-xs tabular-nums whitespace-nowrap">
                      {formatearFechaHistorial(fechaActividadOt(ot), Boolean(filtroFecha))}
                    </td>
                    <td>
                      <span className={statusClass(ot.estadoCodigo)}>
                        {ot.estado ?? ot.estadoCodigo}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate text-slate-500">{ot.direccion ?? '—'}</td>
                    <td className="max-w-[200px] text-xs text-slate-600 line-clamp-2">
                      {formatearObservacionCapataz(ot.observacion) || '—'}
                    </td>
                    <td>
                      {ot.estadoCodigo !== 'COMPLETADA' && ot.estadoCodigo !== 'ANULADA' ? (
                        <Link to={`/capataz/registrar/${ot.idOt}`} className="text-xs text-[#1B4F72] font-semibold hover:underline">
                          Registrar
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
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
