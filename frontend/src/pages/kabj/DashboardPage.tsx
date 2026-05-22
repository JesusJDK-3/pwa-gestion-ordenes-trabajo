import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { ACTIVIDADES } from '../../data/actividades'
import type { Actividad } from '../../types/kabj'

const ICON_BG: Record<string, string> = {
  blue:   'bg-[#2563EB]',
  orange: 'bg-[#EA580C]',
  purple: 'bg-[#9333EA]',
  green:  'bg-[#16A34A]',
}

function ActivityIcon({ color }: { color: string }) {
  const icons: Record<string, React.ReactElement> = {
    blue: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
    orange: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    purple: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    green: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  }
  return icons[color] ?? icons.blue
}

function ActivityCard({ actividad, index }: { actividad: Actividad; index: number }) {
  const navigate = useNavigate()
  const staggerClass = `stagger-${Math.min(index + 1, 6)}`

  return (
    <button
      onClick={() => navigate(`/actividad/${actividad.id}`)}
      className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all text-left p-5 animate-fade-in-up ${staggerClass} group`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-[52px] h-[52px] rounded-[14px] ${ICON_BG[actividad.colorIcono]} flex items-center justify-center flex-shrink-0`}>
          <ActivityIcon color={actividad.colorIcono} />
        </div>
        <div className="text-right">
          <span className="inline-block bg-green-100 text-green-700 text-[12px] font-medium px-3 py-1 rounded-full">
            Activo
          </span>
          <div className="mt-1">
            <span className="text-[#CC1111] font-bold text-[22px] leading-none">{actividad.totalOT}</span>
            <span className="text-gray-400 text-[13px] ml-1">OT</span>
          </div>
        </div>
      </div>

      {/* Code */}
      <span className="inline-block bg-gray-100 text-gray-500 text-[12px] px-2 py-0.5 rounded-md mb-2">
        {actividad.codigo}
      </span>

      {/* Title & subtitle */}
      <p className="font-semibold text-[16px] text-gray-900 leading-snug">{actividad.nombre}</p>
      <p className="text-[13px] text-gray-500 mt-0.5">{actividad.subtitulo}</p>

      {/* Divider */}
      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
        <span className="text-[13px] text-gray-400">Ver subactividades</span>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#CC1111] transition-colors" />
      </div>
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-gray-900">Guías de Procedimiento</h1>
        <p className="text-[14px] text-gray-500 mt-1">Consulta los pasos técnicos antes de iniciar tu operación</p>
      </div>

      {/* Acceso rápido a OTs reales */}
      <button
        onClick={() => navigate('/capataz')}
        className="w-full mb-5 bg-[#1A2535] hover:bg-[#243347] text-white rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors shadow-card animate-fade-in-up"
      >
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <ClipboardList size={18} />
        </div>
        <div className="text-left">
          <p className="font-semibold text-[14px]">Mis Órdenes de Trabajo</p>
          <p className="text-[12px] text-white/60">Ver y gestionar OTs asignadas</p>
        </div>
        <ChevronRight size={16} className="ml-auto opacity-50" />
      </button>

      {/* Grid de actividades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACTIVIDADES.map((act, i) => (
          <ActivityCard key={act.id} actividad={act} index={i} />
        ))}
      </div>
    </div>
  )
}
