import { useCallback, useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import { puntoService } from '../../services/api'

import { offlineDB } from '../../services/offlineDB'

import { useOfflineSync } from '../../context/OfflineSyncContext'

import { useAuth } from '../../context/AuthContext'

import type { OrdenTrabajo } from '../../types'

import PageRefreshButton from '../../components/PageRefreshButton'

import OtFiltrosBar from '../../components/OtFiltrosBar'
import { unwrapList } from '../../utils/apiParse'

import {

  Timer, Wrench, CircleCheckBig, MapPinned, WifiOff,

  ClipboardList, AlertTriangle,

} from 'lucide-react'



function statusClass(codigo?: string) {

  switch (codigo) {

    case 'EN_PROGRESO': return 'status-progreso'

    case 'OBSERVADA':   return 'status-observada'

    case 'COMPLETADA':  return 'status-completada'

    default:            return 'status-pendiente'

  }

}



function necesitaUbicacion(ot: OrdenTrabajo) {

  return ot.latitud == null || ot.longitud == null || ot.requiereCorreccionCoordenadas

}



export default function CapatazDashboard() {

  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filtroSgio, setFiltroSgio] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('')

  const { isOnline, pendingCount } = useOfflineSync()

  const { user } = useAuth()

  const cacheKey = user?.email ?? 'capataz'



  const cargar = useCallback(() => {

    setLoading(true)

    setError('')

    puntoService.misAsignacionesDia({

      sgio: filtroSgio || undefined,

      estado: filtroEstado || undefined,

    })

      .then(r => setOrdenes(unwrapList<OrdenTrabajo>(r.data)))

      .catch(async () => {

        if (!navigator.onLine) {

          const cached = await offlineDB.obtenerPuntosCache(cacheKey)

          setOrdenes(cached)

          setError(cached.length ? '' : 'Sin datos en caché. Conéctese para cargar asignaciones.')

        } else {

          setOrdenes([])

          setError('No se pudieron cargar sus asignaciones. Verifique la conexión.')

        }

      })

      .finally(() => setLoading(false))

  }, [filtroSgio, filtroEstado, cacheKey])



  useEffect(() => { cargar() }, [cargar])



  const pendientes  = useMemo(() => ordenes.filter(p => p.estadoCodigo === 'PENDIENTE'), [ordenes])

  const enProgreso  = useMemo(() => ordenes.filter(p => p.estadoCodigo === 'EN_PROGRESO'), [ordenes])

  const observadas  = useMemo(() => ordenes.filter(p => p.estadoCodigo === 'OBSERVADA'), [ordenes])

  const completadas = useMemo(() => ordenes.filter(p => p.estadoCodigo === 'COMPLETADA'), [ordenes])



  const stats = [

    { label: 'Pendiente',    value: pendientes.length,  icon: Timer,          accent: 'border-l-slate-500',   iconBg: 'bg-slate-50 border-slate-200 text-slate-600', tab: 'PENDIENTE' },

    { label: 'En progreso',  value: enProgreso.length,  icon: Wrench,         accent: 'border-l-amber-500',   iconBg: 'bg-amber-50 border-amber-200 text-amber-700', tab: 'EN_PROGRESO' },

    { label: 'Observada',    value: observadas.length,  icon: AlertTriangle,  accent: 'border-l-yellow-500',  iconBg: 'bg-yellow-50 border-yellow-300 text-yellow-800', tab: 'OBSERVADA' },

    { label: 'Completadas',  value: completadas.length, icon: CircleCheckBig, accent: 'border-l-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', tab: 'COMPLETADA' },

  ]



  if (loading && ordenes.length === 0) return <PageSkeleton />



  return (

    <div className="space-y-6">

      <div className="page-header border-0 pb-0 mb-0">

        <div>

          <p className="page-breadcrumb">Operaciones de campo · Capataz</p>

          <h1 className="page-title">Mis asignaciones</h1>

          <p className="page-subtitle">

            Trabajo del día · {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

          </p>

        </div>

        <PageRefreshButton onClick={cargar} loading={loading} />

      </div>



      {!isOnline && (

        <div className="alert-banner alert-warning">

          <WifiOff size={16} />

          Modo sin conexión — {pendingCount} registro{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de sincronizar

        </div>

      )}



      <div className="kpi-grid">

        {stats.map(s => {

          const Icon = s.icon

          return (

            <button

              key={s.label}

              type="button"

              onClick={() => setFiltroEstado(filtroEstado === s.tab ? '' : s.tab)}

              className={`kpi-tile border-l-4 ${s.accent} text-left hover:bg-slate-50/80 transition-colors cursor-pointer`}

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



      {error && <div className="alert-banner alert-error text-sm">{error}</div>}



      <OtFiltrosBar

        sgio={filtroSgio}

        estado={filtroEstado}

        onSgio={setFiltroSgio}

        onEstado={setFiltroEstado}

        onLimpiar={() => { setFiltroSgio(''); setFiltroEstado('') }}

      />



      <div className="corp-card overflow-hidden">

        <div className="corp-card-header">

          <span className="flex items-center gap-2">

            <ClipboardList size={14} />

            Órdenes del día

          </span>

          <span className="badge-count">{ordenes.length}</span>

        </div>



        {ordenes.length === 0 ? (

          <div className="px-6 py-12 text-center text-slate-400">

            <CircleCheckBig size={32} className="mx-auto mb-2 text-emerald-400" />

            <p className="text-sm font-medium">No hay OTs para los filtros seleccionados.</p>

          </div>

        ) : (

          <table className="enterprise-table">

            <thead>

              <tr>

                {['SGIO', 'Ubicación / Actividad', 'Estado', 'Observaciones', 'Acciones'].map(h => (

                  <th key={h}>{h}</th>

                ))}

              </tr>

            </thead>

            <tbody>

              {ordenes.map(p => {

                const sinMapa = necesitaUbicacion(p)

                return (

                  <tr key={p.idOt} className={p.estadoCodigo === 'OBSERVADA' ? 'bg-yellow-50/60' : sinMapa ? 'bg-amber-50/40' : undefined}>

                    <td className="font-mono font-bold text-[#1B4F72] text-xs">{p.sgio}</td>

                    <td className="max-w-xs text-slate-600">

                      <p className="truncate">{p.direccion ?? p.subactividad ?? '—'}</p>

                      {sinMapa && (

                        <p className="text-[10px] text-amber-800 mt-1 flex items-center gap-1">

                          <AlertTriangle size={10} />

                          Ubicación pendiente — ver alertas

                        </p>

                      )}

                    </td>

                    <td>

                      <span className={`status-pill ${statusClass(p.estadoCodigo)}`}>

                        {p.estado ?? p.estadoCodigo}

                      </span>

                    </td>

                    <td className="max-w-[180px] text-xs text-slate-600 line-clamp-2">

                      {p.observacion?.trim() || '—'}

                    </td>

                    <td>

                      <div className="flex flex-wrap items-center gap-2">

                        <Link

                          to={`/capataz/mapa?ot=${p.idOt}`}

                          className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${

                            sinMapa ? 'text-amber-800' : 'text-[#1B4F72]'

                          }`}

                        >

                          <MapPinned size={12} />

                          Mapa

                        </Link>

                        {p.estadoCodigo !== 'COMPLETADA' && (

                          <Link to={`/capataz/registrar/${p.idOt}`} className="btn-accent text-xs py-1.5 px-3">

                            Registrar

                          </Link>

                        )}

                      </div>

                    </td>

                  </tr>

                )

              })}

            </tbody>

          </table>

        )}

      </div>

    </div>

  )

}



function PageSkeleton() {

  return (

    <div className="space-y-6 animate-pulse">

      <div className="h-10 w-48 bg-slate-200" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200 border border-slate-200">

        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white" />)}

      </div>

      <div className="h-64 bg-slate-200" />

    </div>

  )

}


