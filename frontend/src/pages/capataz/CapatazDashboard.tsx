import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { puntoService } from '../../services/api'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import type { OrdenTrabajo } from '../../types'
import { Clock3, CheckCircle2, AlertCircle, Map, WifiOff, ArrowRight } from 'lucide-react'

export default function CapatazDashboard() {
  const [ordenes,  setOrdenes]  = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const { isOnline, pendingCount } = useOfflineSync()

  useEffect(() => {
    puntoService.misPuntos()
      .then(r => {
        const data = (r.data as any)
        setOrdenes(Array.isArray(data) ? data : (data?.data ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  const pendientes  = ordenes.filter(p => p.estadoCodigo === 'PENDIENTE')
  const enProgreso  = ordenes.filter(p => p.estadoCodigo === 'EN_PROGRESO')
  const completados = ordenes.filter(p => p.estadoCodigo === 'COMPLETADA')

  if (loading) return <PageSkeleton />

  const stats = [
    { label: 'Pendientes',  value: pendientes.length,  icon: Clock3,        bg: 'bg-gray-50',    text: 'text-gray-700',    icon_c: 'text-gray-400' },
    { label: 'En progreso', value: enProgreso.length,  icon: AlertCircle,   bg: 'bg-orange-50',  text: 'text-orange-700',  icon_c: 'text-orange-500' },
    { label: 'Completados', value: completados.length, icon: CheckCircle2,  bg: 'bg-emerald-50', text: 'text-emerald-700', icon_c: 'text-emerald-500' },
  ]

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Mi Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de tus órdenes asignadas</p>
      </div>

      {/* Offline alert */}
      {!isOnline && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-red-700 text-sm font-medium">
          <WifiOff size={18} className="flex-shrink-0" />
          Sin conexión — Los registros se guardarán localmente ({pendingCount} pendiente{pendingCount !== 1 ? 's' : ''})
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`rounded-2xl p-5 ${s.bg} shadow-card`}>
              <Icon size={20} className={`${s.icon_c} mb-3`} />
              <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Map CTA */}
      <Link
        to="/capataz/mapa"
        className="flex items-center justify-between w-full bg-[#1A2535] hover:bg-[#243347] text-white font-semibold py-4 px-5 rounded-2xl transition-colors shadow-card group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <Map size={18} />
          </div>
          Ver mis puntos en el mapa
        </div>
        <ArrowRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Órdenes activas */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Órdenes activas{' '}
            <span className="text-gray-400 font-normal text-sm">({pendientes.length + enProgreso.length})</span>
          </h2>
        </div>
        {[...enProgreso, ...pendientes].length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-sm">No tienes órdenes activas.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {[...enProgreso, ...pendientes].map(p => (
              <li key={p.idOt} className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 font-mono">{p.sgio}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.direccion ?? p.subactividad ?? '—'}</p>
                  <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    p.estadoCodigo === 'EN_PROGRESO' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>{p.estado ?? p.estadoCodigo}</span>
                </div>
                <Link
                  to={`/capataz/registrar/${p.idOt}`}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-[#CC1111] hover:bg-[#AA0E0E] text-white px-3 py-2 rounded-xl font-semibold transition-colors"
                >
                  Registrar
                  <ArrowRight size={12} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-14 bg-gray-200 rounded-2xl" />
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )
}
