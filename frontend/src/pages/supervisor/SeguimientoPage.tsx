import React, { useCallback, useEffect, useRef, useState } from 'react'
import { puntoService } from '../../services/api'
import type { EstadoOt } from '../../types'
import { Radio, RefreshCw, CheckCircle2, Clock3, AlertCircle, Eye } from 'lucide-react'

interface OtResumen {
  idOt: number
  sgio: string
  capataz: string
  estado: EstadoOt
  direccion: string
}

interface CapatazResumen {
  nombre: string
  total: number
  completados: number
  pendientes: number
  enProgreso: number
  observadas: number
}

function agruparPorCapataz(ots: OtResumen[]): CapatazResumen[] {
  const mapa: Record<string, CapatazResumen> = {}
  for (const ot of ots) {
    if (!mapa[ot.capataz]) {
      mapa[ot.capataz] = { nombre: ot.capataz, total: 0, completados: 0, pendientes: 0, enProgreso: 0, observadas: 0 }
    }
    // Sólo contar OTs activas (no anuladas)
    if (ot.estado === 'ANULADA') continue
    mapa[ot.capataz].total++
    if      (ot.estado === 'COMPLETADA')  mapa[ot.capataz].completados++
    else if (ot.estado === 'EN_PROGRESO') mapa[ot.capataz].enProgreso++
    else if (ot.estado === 'OBSERVADA')   mapa[ot.capataz].observadas++
    else                                  mapa[ot.capataz].pendientes++
  }
  return Object.values(mapa).filter(c => c.total > 0)
}

export default function SeguimientoPage() {
  const [data,    setData]    = useState<CapatazResumen[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(() => {
    puntoService.seguimiento()
      .then(r => {
        const raw = (r.data as any)
        const ots: OtResumen[] = Array.isArray(raw) ? raw : (raw?.data ?? [])
        setData(agruparPorCapataz(ots))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchData])

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Seguimiento en tiempo real</h1>
          <p className="text-sm text-gray-500 mt-0.5">Estado actual de cada capataz en campo</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white rounded-xl px-3 py-2 shadow-card border border-gray-100">
          <RefreshCw size={12} className="animate-spin-slow" />
          Auto-refresh 30 s
        </div>
      </div>

      {/* Cards por capataz */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
          <Radio size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin datos de seguimiento activos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(cap => {
            const pct = cap.total > 0 ? Math.round((cap.completados / cap.total) * 100) : 0
            return (
              <div key={cap.nombre} className="bg-white rounded-2xl shadow-card p-5">

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#CC1111]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#CC1111] font-bold text-[11px]">
                      {cap.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{cap.nombre}</p>
                    <p className="text-xs text-gray-400">{cap.completados}/{cap.total} completados</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-2xl font-bold text-gray-800">{pct}</span>
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? '#22C55E' : pct >= 40 ? '#CC1111' : '#F59E0B'
                    }}
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2">
                  <StatChip icon={<Clock3 size={13} className="text-gray-400" />}          value={cap.pendientes}  label="Pend."  bg="bg-gray-50"    text="text-gray-700" />
                  <StatChip icon={<AlertCircle size={13} className="text-orange-500" />}   value={cap.enProgreso}  label="Prog."  bg="bg-orange-50"  text="text-orange-700" />
                  <StatChip icon={<Eye size={13} className="text-yellow-500" />}            value={cap.observadas}  label="Obs."   bg="bg-yellow-50"  text="text-yellow-700" />
                  <StatChip icon={<CheckCircle2 size={13} className="text-emerald-500" />} value={cap.completados} label="Comp."  bg="bg-emerald-50" text="text-emerald-700" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatChip({ icon, value, label, bg, text }: {
  icon: React.ReactNode; value: number; label: string; bg: string; text: string
}) {
  return (
    <div className={`${bg} rounded-xl p-2.5 text-center`}>
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className={`text-lg font-bold ${text}`}>{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-44 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
