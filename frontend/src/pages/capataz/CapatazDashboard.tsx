import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { puntoService } from '../../services/api'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import type { ApiResponse, PuntoTrabajo } from '../../types'

export default function CapatazDashboard() {
  const [puntos,  setPuntos]  = useState<PuntoTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const { isOnline, pendingCount } = useOfflineSync()

  useEffect(() => {
    puntoService.misPuntos()
      .then(r => setPuntos((r.data as ApiResponse<PuntoTrabajo[]>).data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const pendientes  = puntos.filter(p => p.estado === 'PENDIENTE')
  const enProgreso  = puntos.filter(p => p.estado === 'EN_PROGRESO')
  const completados = puntos.filter(p => p.estado === 'COMPLETADO')

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando…</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Mi Panel</h2>

      {/* Offline alert */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm font-medium">
          📵 Sin conexión — Los registros se guardarán localmente ({pendingCount} pendiente{pendingCount !== 1 ? 's' : ''})
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes',   value: pendientes.length,  color: 'bg-gray-50 text-gray-700' },
          { label: 'En progreso',  value: enProgreso.length,  color: 'bg-orange-50 text-orange-700' },
          { label: 'Completados',  value: completados.length, color: 'bg-emerald-50 text-emerald-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 text-center ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs mt-1 opacity-75">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Botón mapa */}
      <Link
        to="/capataz/mapa"
        className="flex items-center justify-center gap-2 w-full bg-[#1D9E75] hover:bg-[#178060] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        🗺️ Ver mis puntos en el mapa
      </Link>

      {/* Lista de puntos activos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Puntos activos ({pendientes.length + enProgreso.length})</h3>
        </div>
        {[...enProgreso, ...pendientes].length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No tienes puntos activos.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {[...enProgreso, ...pendientes].map(p => (
              <li key={p.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.descripcion}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.direccion}</p>
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.estado === 'EN_PROGRESO' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>{p.estado}</span>
                </div>
                <Link
                  to={`/capataz/registrar/${p.id}`}
                  className="flex-shrink-0 text-xs bg-[#1D9E75] hover:bg-[#178060] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Registrar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
