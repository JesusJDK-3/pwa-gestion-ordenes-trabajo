import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { registroService } from '../../services/api'
import PageRefreshButton from '../../components/PageRefreshButton'
import { Loader2, ArrowLeft, HardHat, Filter } from 'lucide-react'

interface FilaApoyo {
  idOt: number
  sgio: string
  estado: string
  subactividad?: string
  fecha: string
  dni?: string
  nombres?: string
  apellidos?: string
  ayudante: string
}

function statusClass(estado?: string) {
  switch (estado) {
    case 'COMPLETADA':  return 'status-pill status-completada'
    case 'EN_PROGRESO': return 'status-pill status-progreso'
    case 'OBSERVADA':   return 'status-pill status-observada'
    case 'ANULADA':     return 'status-pill status-anulada'
    default:            return 'status-pill status-pendiente'
  }
}

export default function AyudantesPage() {
  const [filas, setFilas] = useState<FilaApoyo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroAyudante, setFiltroAyudante] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')

  const cargar = useCallback(() => {
    setLoading(true)
    setError('')
    registroService.historialApoyo()
      .then(r => {
        const data = (r.data as { data?: FilaApoyo[] })?.data ?? []
        setFilas(Array.isArray(data) ? data : [])
      })
      .catch(() => setError('No se pudo cargar el historial de apoyo.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const ayudantesUnicos = useMemo(() => {
    const nombres = new Set(filas.map(f => f.ayudante).filter(Boolean))
    return [...nombres].sort()
  }, [filas])

  const filtradas = useMemo(() => filas.filter(f => {
    if (filtroAyudante && f.ayudante !== filtroAyudante) return false
    if (filtroDesde && f.fecha && f.fecha < filtroDesde) return false
    return true
  }), [filas, filtroAyudante, filtroDesde])

  const otsConApoyo = useMemo(() => new Set(filas.map(f => f.idOt)).size, [filas])

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Link to="/capataz" className="btn-outline py-2 px-2.5 flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="page-breadcrumb">Operaciones de campo · Consulta</p>
            <h1 className="page-title">Apoyo en OT</h1>
            <p className="page-subtitle">
              Consulte en qué OT participó personal de apoyo y en qué fecha. El registro se hace al guardar el formulario de cada OT.
            </p>
          </div>
        </div>
        <PageRefreshButton onClick={cargar} loading={loading} />
      </div>

      <div className="kpi-grid grid-cols-1 sm:grid-cols-2">
        <div className="kpi-tile border-l-4 border-l-[#1B4F72]">
          <div className="kpi-icon-box bg-sky-50 border-sky-200 text-sky-700">
            <HardHat size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value">{otsConApoyo}</p>
            <p className="kpi-label">Órdenes con apoyo</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-amber-500">
          <div className="kpi-icon-box bg-amber-50 border-amber-200 text-amber-700">
            <Filter size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value">{ayudantesUnicos.length}</p>
            <p className="kpi-label">Personas que apoyaron</p>
          </div>
        </div>
      </div>

      <div className="corp-card p-4 space-y-3">
        <p className="corp-label mb-0">Filtros</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Persona</label>
            <select
              value={filtroAyudante}
              onChange={e => setFiltroAyudante(e.target.value)}
              className="corp-input text-sm py-1.5 max-w-[240px]"
            >
              <option value="">Todas las personas</option>
              {ayudantesUnicos.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Desde fecha</label>
            <input
              type="date"
              value={filtroDesde}
              onChange={e => setFiltroDesde(e.target.value)}
              className="corp-input text-sm py-1.5 max-w-[180px]"
            />
          </div>
          {(filtroAyudante || filtroDesde) && (
            <button
              type="button"
              onClick={() => { setFiltroAyudante(''); setFiltroDesde('') }}
              className="btn-outline text-xs py-1.5"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      {loading ? (
        <div className="corp-card p-12 flex justify-center text-slate-400">
          <Loader2 size={22} className="animate-spin text-[#1B4F72]" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="corp-card p-12 text-center text-slate-500 text-sm">
          <HardHat size={32} className="mx-auto mb-3 opacity-30" />
          <p>No hay registros de apoyo{filtroAyudante || filtroDesde ? ' con estos filtros' : ''}.</p>
          <p className="text-xs mt-2 text-slate-400">
            Al registrar una OT en campo, puede indicar ayudantes en el formulario de actividad.
          </p>
        </div>
      ) : (
        <div className="corp-card overflow-hidden">
          <div className="corp-card-header">
            <span>Historial de apoyo</span>
            <span className="badge-count">{filtradas.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  {['Fecha', 'SGIO', 'Persona que apoyó', 'DNI', 'Subactividad', 'Estado OT'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f, i) => (
                  <tr key={`${f.idOt}-${f.ayudante}-${i}`}>
                    <td className="text-slate-500 text-xs tabular-nums whitespace-nowrap">
                      {f.fecha
                        ? new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="font-mono font-bold text-[#1B4F72] text-xs">{f.sgio}</td>
                    <td className="font-medium text-slate-800">{f.ayudante || '—'}</td>
                    <td className="text-slate-500 text-xs">{f.dni ?? '—'}</td>
                    <td className="max-w-[180px] truncate text-slate-600">{f.subactividad ?? '—'}</td>
                    <td>
                      <span className={statusClass(f.estado)}>{f.estado}</span>
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
