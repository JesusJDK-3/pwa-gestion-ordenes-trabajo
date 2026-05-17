import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, Zap, MapPin, Medal } from 'lucide-react'
import { ACTIVIDADES, RESUMEN_DIARIO } from '../../data/actividades'
import type { OrdenTrabajo } from '../../types/kabj'
import Navbar from '../../components/kabj/Navbar'
import HelpButton from '../../components/kabj/HelpButton'

/* ── KPI counter hook ─────────────────────────────────────────── */
function useCounter(target: number, duration = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const steps = 50
    const inc    = target / steps
    let cur      = 0
    const t      = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(t) }
      else               { setVal(Math.round(cur)) }
    }, duration / steps)
    return () => clearInterval(t)
  }, [target, duration])
  return val
}

/* ── Helper ───────────────────────────────────────────────────── */
function getSubNombre(subId: string): string {
  for (const act of ACTIVIDADES) {
    const sub = act.subactividades.find(s => s.id === subId)
    if (sub) return sub.nombre
  }
  return subId
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({
  label, value, unit, icon, iconBg, badge, delay,
}: {
  label: string
  value: number
  unit: string
  icon: React.ReactNode
  iconBg: string
  badge?: string
  delay: string
}) {
  const anim = useCounter(value)
  return (
    <div className={`bg-white rounded-2xl shadow-card p-4 animate-fade-in-up ${delay}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {badge && (
          <span className="text-[12px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[12px] text-gray-400 mb-0.5">{label}</p>
      <div className="flex items-end gap-1">
        <span className="text-[24px] font-bold text-gray-900 leading-none">{anim}</span>
        <span className="text-[13px] text-gray-400 mb-0.5">{unit}</span>
      </div>
    </div>
  )
}

/* ── Timeline item ────────────────────────────────────────────── */
function TimelineItem({ orden, index }: { orden: OrdenTrabajo; index: number }) {
  const stagger = `stagger-${Math.min(index + 1, 6)}`
  return (
    <div className={`relative flex gap-4 animate-fade-in-up ${stagger}`}>
      {/* Dot */}
      <div className="flex-shrink-0 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-check-draw">
            <path
              d="M3 8l4 4 6-7"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="30"
              strokeDashoffset="0"
            />
          </svg>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-xl shadow-card px-5 py-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#CC1111] font-semibold text-[13px]">{orden.id}</span>
            <span className="bg-green-100 text-green-700 text-[12px] px-2.5 py-0.5 rounded-full font-medium">
              Completada
            </span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-gray-400">
            <Clock size={12} />
            {orden.tiempoReal} min
          </div>
        </div>

        <p className="font-semibold text-[14px] text-gray-800 mb-2 leading-snug">
          {getSubNombre(orden.subactividadId)}
        </p>

        <div className="grid grid-cols-3 gap-1 text-[12px] text-gray-400">
          <div>
            <p className="font-medium text-gray-500">Dirección</p>
            <p className="truncate">{orden.direccion}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Horario</p>
            <p>{orden.horarioInicio} – {orden.horarioFin}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Sector</p>
            <p>{orden.sector}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sector summary ───────────────────────────────────────────── */
function SectorSummary({ ordenes }: { ordenes: OrdenTrabajo[] }) {
  const bySector: Record<string, { count: number; minutos: number }> = {}
  ordenes.forEach(o => {
    if (!bySector[o.sector]) bySector[o.sector] = { count: 0, minutos: 0 }
    bySector[o.sector].count++
    bySector[o.sector].minutos += o.tiempoReal ?? 0
  })

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-in-up stagger-4">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-[15px] text-gray-800">Resumen por Sector</h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-[12px] text-gray-500 uppercase tracking-wide">
            <th className="px-5 py-3 text-left font-semibold">Sector</th>
            <th className="px-5 py-3 text-center font-semibold">OTs</th>
            <th className="px-5 py-3 text-right font-semibold">Tiempo total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Object.entries(bySector).map(([sector, data]) => (
            <tr key={sector} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 text-[14px] text-gray-700">{sector}</td>
              <td className="px-5 py-3 text-[14px] text-gray-700 text-center font-medium">{data.count}</td>
              <td className="px-5 py-3 text-[14px] text-gray-500 text-right">{data.minutos} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function HistorialPage() {
  const r = RESUMEN_DIARIO
  const eficiencia  = useCounter(r.eficiencia)
  const puntualidad = useCounter(r.puntualidad)
  const calidad     = useCounter(r.calidad)

  return (
    <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
      <Navbar
        showBack
        title="Historial Diario"
        subtitle={formatDate(r.fecha)}
        showActions={false}
      />

      <main className="flex-1 px-5 py-6 space-y-5">

        {/* ── KPI grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="OTs Completadas"
            value={r.otCompletadas}
            unit="OT"
            icon={<CheckCircle size={18} className="text-white" />}
            iconBg="bg-green-500"
            badge="Hoy"
            delay="stagger-1"
          />
          <KpiCard
            label="Tiempo Promedio"
            value={r.tiempoPromedio}
            unit="min"
            icon={<Clock size={18} className="text-white" />}
            iconBg="bg-blue-500"
            badge="Hoy"
            delay="stagger-2"
          />
          <KpiCard
            label="Tiempo Total"
            value={r.tiempoTotal}
            unit="min"
            icon={<Zap size={18} className="text-white" />}
            iconBg="bg-purple-500"
            badge="Hoy"
            delay="stagger-3"
          />
          <KpiCard
            label="Km recorridos"
            value={Math.round(r.distanciaTotal)}
            unit="km"
            icon={<MapPin size={18} className="text-white" />}
            iconBg="bg-orange-500"
            badge="Hoy"
            delay="stagger-4"
          />
        </div>

        {/* ── Rendimiento banner ─────────────────────────────── */}
        <div className="bg-[#CC1111] rounded-2xl px-6 py-5 text-white animate-banner-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Medal size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[16px] leading-tight">Rendimiento del Día</p>
              <p className="text-[13px] mt-0.5" style={{ opacity: 0.85 }}>Excelente desempeño operativo</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              { label: 'Eficiencia',  value: eficiencia },
              { label: 'Puntualidad', value: puntualidad },
              { label: 'Calidad',     value: calidad },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[12px] font-medium" style={{ opacity: 0.75 }}>{label}</p>
                <p className="text-[28px] font-bold leading-tight">{value}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────── */}
        <div className="animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 15L9 3l6 12" stroke="#CC1111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.5 11h7" stroke="#CC1111" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h2 className="font-semibold text-[15px] text-gray-800">
              Órdenes Completadas ({r.ordenes.length})
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[19px] top-[40px] w-0.5 bg-green-400"
              style={{ height: `calc(100% - 80px)` }}
            />
            {r.ordenes.map((o, i) => (
              <TimelineItem key={o.id} orden={o} index={i} />
            ))}
          </div>
        </div>

        {/* ── Sector summary ───────────────────────────────────── */}
        <SectorSummary ordenes={r.ordenes} />
      </main>

      <HelpButton />
    </div>
  )
}
