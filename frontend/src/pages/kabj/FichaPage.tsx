import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, FileText, Shield, Wrench, Info, MapPin } from 'lucide-react'
import { ACTIVIDADES } from '../../data/actividades'
import type { Subactividad } from '../../types/kabj'
import Navbar from '../../components/kabj/Navbar'
import HelpButton from '../../components/kabj/HelpButton'

/* ── Helper: find subactividad across all actividades ─────────── */
function findSub(subId: string): { sub: Subactividad; actNombre: string } | null {
  for (const act of ACTIVIDADES) {
    const sub = act.subactividades.find(s => s.id === subId)
    if (sub) return { sub, actNombre: act.nombre }
  }
  return null
}

/* ── Step circle ──────────────────────────────────────────────── */
function StepCircle({ n }: { n: number }) {
  return (
    <div
      className="w-7 h-7 rounded-full bg-[#CC1111] text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0"
      style={{ boxShadow: '0 2px 4px rgba(204,17,17,0.30)' }}
    >
      {n}
    </div>
  )
}

/* ── Section card ──────────────────────────────────────────────── */
function Section({
  icon,
  title,
  className = '',
  children,
}: {
  icon: React.ReactNode
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-card p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-[15px] text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function FichaPage() {
  const { subId }  = useParams<{ subId: string }>()
  const navigate   = useNavigate()
  const result     = findSub(subId ?? '')

  if (!result) {
    return (
      <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
        <Navbar showBack subtitle="Ficha técnica" />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-[15px]">
          Ficha no encontrada.
        </div>
      </div>
    )
  }

  const { sub, actNombre } = result

  return (
    <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
      {/* Navbar */}
      <Navbar
        showBack
        title={`${sub.id} - ${sub.nombre}`}
        subtitle={actNombre}
        showActions={false}
      />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-4">

        {/* ── Red banner ─────────────────────────────────────────── */}
        <div className="bg-[#CC1111] rounded-2xl px-6 py-5 text-white animate-banner-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {sub.id}
                </span>
              </div>
              <h1 className="font-bold text-[20px] leading-tight">{sub.nombre}</h1>
              <p className="text-[13px] mt-1" style={{ opacity: 0.85 }}>{sub.tipo}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <Clock size={20} style={{ opacity: 0.75 }} className="ml-auto mb-2" />
              <p className="text-[12px]" style={{ opacity: 0.75 }}>Tiempo máximo</p>
              <p className="font-bold text-[15px]">{sub.tiempoMaximo} minutos por punto</p>
            </div>
          </div>
        </div>

        {/* ── Descripción ────────────────────────────────────────── */}
        <Section
          icon={<FileText size={18} className="text-[#CC1111]" />}
          title="Descripción de la Operación"
          className="animate-fade-in-up stagger-1"
        >
          <p className="text-[14px] text-gray-600 leading-[1.7]">{sub.descripcion}</p>
        </Section>

        {/* ── Procedimiento ──────────────────────────────────────── */}
        <Section
          icon={<Clock size={18} className="text-[#CC1111]" />}
          title="Procedimiento Paso a Paso"
          className="animate-fade-in-up stagger-2"
        >
          <ol className="space-y-4">
            {sub.pasos.map((paso, i) => (
              <li key={i} className="flex items-start gap-3">
                <StepCircle n={i + 1} />
                <p className="text-[14px] text-gray-600 leading-relaxed pt-0.5">{paso}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Medidas de Seguridad ────────────────────────────────── */}
        <Section
          icon={<Shield size={18} className="text-amber-500" />}
          title="Medidas de Seguridad"
          className="animate-fade-in-up stagger-3"
        >
          <ul className="space-y-3">
            {sub.medidasSeguridad.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-[14px] text-gray-600 leading-relaxed">{m}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Materiales ─────────────────────────────────────────── */}
        <Section
          icon={<Wrench size={18} className="text-gray-500" />}
          title="Materiales y Herramientas"
          className="animate-fade-in-up stagger-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sub.materiales.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#CC1111] flex-shrink-0 mt-2"
                />
                <p className="text-[14px] text-gray-600">{m}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Recomendaciones ────────────────────────────────────── */}
        <div
          className="bg-blue-50 border-l-4 border-blue-500 rounded-r-2xl px-5 py-4 animate-fade-in-up stagger-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info size={17} className="text-blue-500 flex-shrink-0" />
            <h2 className="font-semibold text-[15px] text-gray-800">Recomendaciones Importantes</h2>
          </div>
          <ul className="space-y-2.5">
            {sub.recomendaciones.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                <p className="text-[14px] text-blue-800 leading-relaxed">{r}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Sticky CTA ─────────────────────────────────────────── */}
      <div className="shadow-cta-up">
        <button
          onClick={() => navigate('/capataz/mapa')}
          className="w-full bg-[#CC1111] hover:bg-[#AA0E0E] active:scale-[0.99] text-white font-bold text-[15px] py-[18px] flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          Iniciar Operación en Mapa
        </button>
      </div>

      <HelpButton />
    </div>
  )
}
