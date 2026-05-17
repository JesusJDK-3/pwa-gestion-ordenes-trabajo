import { useCallback, useEffect, useRef, useState } from 'react'
import { puntoService } from '../../services/api'
import type { ApiResponse, SeguimientoCapataz } from '../../types'

export default function SeguimientoPage() {
  const [data,    setData]    = useState<SeguimientoCapataz[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(() => {
    puntoService.seguimiento()
      .then(r => setData((r.data as ApiResponse<SeguimientoCapataz[]>).data ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchData])

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Seguimiento en tiempo real</h2>
        <span className="text-xs text-gray-400">Auto-refresh cada 30 s</span>
      </div>

      {/* Cards por capataz */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-3 text-center py-8">Sin datos de seguimiento.</p>
        ) : data.map(cap => {
          const pct = cap.total > 0 ? Math.round((cap.completados / cap.total) * 100) : 0
          return (
            <div key={cap.capatazId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 truncate">{cap.nombre}</p>

              {/* Barra de progreso */}
              <div className="mt-3 mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{cap.completados}/{cap.total} completados</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#1D9E75] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-gray-700">{cap.pendientes}</p>
                  <p className="text-gray-400">Pend.</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-orange-600">{cap.enProgreso}</p>
                  <p className="text-orange-400">En prog.</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-emerald-600">{cap.completados}</p>
                  <p className="text-emerald-400">Comp.</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
