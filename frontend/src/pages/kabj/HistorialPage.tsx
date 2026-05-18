import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, MapPin, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { puntoExtraService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'
import Navbar from '../../components/kabj/Navbar'
import HelpButton from '../../components/kabj/HelpButton'

function useCounter(target: number, duration = 700) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const steps = 40
    const inc = target / steps
    let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(t) }
      else { setVal(Math.round(cur)) }
    }, duration / steps)
    return () => clearInterval(t)
  }, [target, duration])
  return val
}

const BADGE: Record<string, string> = {
  COMPLETADA:  'bg-emerald-100 text-emerald-700',
  OBSERVADA:   'bg-yellow-100 text-yellow-700',
  EN_PROGRESO: 'bg-orange-100 text-orange-700',
  PENDIENTE:   'bg-gray-100 text-gray-600',
  ANULADA:     'bg-red-100 text-red-600',
}

function KpiCard({ label, value, unit, icon, bg }: {
  label: string; value: number; unit: string; icon: React.ReactNode; bg: string
}) {
  const anim = useCounter(value)
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 animate-fade-in-up">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <div className="flex items-end gap-1">
        <span className="text-[22px] font-bold text-gray-900 leading-none">{anim}</span>
        <span className="text-[12px] text-gray-400 mb-0.5">{unit}</span>
      </div>
    </div>
  )
}

export default function HistorialPage() {
  const [completadas, setCompletadas] = useState<OrdenTrabajo[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const cargar = () => {
    setLoading(true)
    setError('')
    puntoExtraService.misCompletadas()
      .then(r => {
        const d = r.data as any
        setCompletadas(Array.isArray(d) ? d : (d?.data ?? []))
      })
      .catch(() => setError('No se pudo cargar el historial. Verifica tu conexión.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const hoy = completadas.filter(o => {
    if (!o.fechaFin) return false
    return o.fechaFin.slice(0, 10) === new Date().toISOString().slice(0, 10)
  })

  return (
    <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
      <Navbar showBack title="Historial de OTs" subtitle="Órdenes completadas" showActions={false} />

      <main className="flex-1 px-5 py-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KpiCard
            label="Total completadas"
            value={completadas.length}
            unit="OT"
            icon={<CheckCircle size={16} className="text-white" />}
            bg="bg-emerald-500"
          />
          <KpiCard
            label="Completadas hoy"
            value={hoy.length}
            unit="OT"
            icon={<Clock size={16} className="text-white" />}
            bg="bg-blue-500"
          />
          <KpiCard
            label="Con observaciones"
            value={completadas.filter(o => o.observacion).length}
            unit="OT"
            icon={<MapPin size={16} className="text-white" />}
            bg="bg-purple-500"
          />
        </div>

        {/* Header con refresh */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[15px] text-gray-800">
            Órdenes completadas ({completadas.length})
          </h2>
          <button
            onClick={cargar}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 bg-white px-3 py-1.5 rounded-xl hover:border-gray-300 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Actualizar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400 text-sm">
            <Loader2 size={20} className="animate-spin text-[#CC1111]" />
            Cargando historial…
          </div>
        ) : completadas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aún no tienes órdenes completadas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completadas.map((ot, i) => (
              <div key={ot.idOt} className="bg-white rounded-2xl shadow-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-800 font-mono text-[14px]">{ot.sgio}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${BADGE[ot.estadoCodigo ?? 'COMPLETADA']}`}>
                        {ot.estadoCodigo ?? 'COMPLETADA'}
                      </span>
                    </div>
                    {ot.subactividad && (
                      <p className="text-[12px] text-gray-500 mb-1">{ot.subactividad}</p>
                    )}
                    {ot.direccion && (
                      <p className="text-[12px] text-gray-400 flex items-center gap-1">
                        <MapPin size={11} />
                        {ot.direccion}
                      </p>
                    )}
                    {ot.observacion && (
                      <p className="text-[12px] text-gray-500 mt-2 bg-gray-50 rounded-lg px-2.5 py-2 leading-relaxed line-clamp-3">
                        {ot.observacion}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {ot.fechaFin && (
                      <p className="text-[11px] text-gray-400">
                        {new Date(ot.fechaFin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mt-1 ml-auto">
                      <CheckCircle size={16} className="text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <HelpButton />
    </div>
  )
}
