import { useNavigate } from 'react-router-dom'
import { ChevronRight, Droplets, Search, PenLine } from 'lucide-react'
import { ACTIVIDADES } from '../../data/actividades'
import type { Actividad } from '../../types/kabj'

const ICON_CFG: Record<string, { accent: string; iconBg: string; Icon: typeof Droplets }> = {
  blue:   { accent: 'border-l-sky-600',     iconBg: 'bg-sky-50 border-sky-200 text-sky-700',       Icon: Droplets },
  orange: { accent: 'border-l-amber-500',   iconBg: 'bg-amber-50 border-amber-200 text-amber-700', Icon: Search },
  purple: { accent: 'border-l-violet-600',  iconBg: 'bg-violet-50 border-violet-200 text-violet-700', Icon: Search },
  green:  { accent: 'border-l-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: PenLine },
}

function ActivityCard({ actividad }: { actividad: Actividad }) {
  const navigate = useNavigate()
  const cfg = ICON_CFG[actividad.colorIcono] ?? ICON_CFG.blue
  const Icon = cfg.Icon

  return (
    <button
      type="button"
      onClick={() => navigate(`/actividad/${actividad.id}`)}
      className={`kpi-tile-btn ${cfg.accent} items-center`}
    >
      <div className={`kpi-icon-box ${cfg.iconBg}`}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{actividad.codigo}</p>
        <p className="font-bold text-slate-800">{actividad.nombre}</p>
        <p className="text-xs text-slate-500 mt-0.5">{actividad.subtitulo}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Recursos · Manuales</p>
          <h1 className="page-title">Manuales técnicos</h1>
          <p className="page-subtitle">
            Elija una actividad para ver procedimientos, materiales y medidas de seguridad
          </p>
        </div>
      </div>

      <div className="corp-card overflow-hidden">
        <div className="corp-card-header">
          <span>Actividades disponibles</span>
          <span className="badge-count">{ACTIVIDADES.length}</span>
        </div>
        <div className="kpi-grid grid-cols-1 sm:grid-cols-2 border-0">
          {ACTIVIDADES.map(act => (
            <ActivityCard key={act.id} actividad={act} />
          ))}
        </div>
      </div>
    </div>
  )
}
