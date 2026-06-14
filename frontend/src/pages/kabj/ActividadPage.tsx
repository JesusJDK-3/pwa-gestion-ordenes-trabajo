import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, ChevronRight, AlertTriangle, ListOrdered, Wrench } from 'lucide-react'
import { ACTIVIDADES } from '../../data/actividades'
import type { Subactividad } from '../../types/kabj'

const TYPE_CLASS: Record<string, string> = {
  'Mantenimiento Correctivo': 'status-pill status-anulada',
  'Mantenimiento Preventivo': 'status-pill border-sky-200 bg-sky-50 text-sky-800',
  'Operación Planificada':    'status-progreso',
  'Inspección Técnica':       'status-pill border-violet-200 bg-violet-50 text-violet-800',
}

function SubactCard({ sub, onClick }: { sub: Subactividad; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="kpi-tile-btn border-l-4 border-l-[#1B4F72] items-start w-full"
    >
      <div className="flex-1 min-w-0 text-left space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">{sub.id}</span>
          <span className={TYPE_CLASS[sub.tipo] ?? 'status-pill status-pendiente'}>{sub.tipo}</span>
        </div>
        <p className="font-bold text-slate-800 text-sm leading-snug">{sub.nombre}</p>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{sub.descripcion}</p>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1">
            <ListOrdered size={12} />
            {sub.pasos.length} pasos
          </span>
          <span className="inline-flex items-center gap-1">
            <Wrench size={12} />
            {sub.materiales.length} materiales
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlertTriangle size={12} />
            {sub.medidasSeguridad.length} medidas
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <ChevronRight size={16} className="text-slate-300" />
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={12} />
          <span>{sub.tiempoMaximo} min</span>
        </div>
      </div>
    </button>
  )
}

export default function ActividadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const actividad = ACTIVIDADES.find(a => a.id === id)

  if (!actividad) {
    return (
      <div className="corp-card p-12 text-center text-slate-500 text-sm">
        Actividad no encontrada.
      </div>
    )
  }

  const tiempoProm = Math.round(
    actividad.subactividades.reduce((s, sub) => s + sub.tiempoMaximo, 0) / actividad.subactividades.length
  )

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div className="flex items-start gap-3">
          <Link to="/dashboard" className="btn-outline py-2 px-2.5 flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="page-breadcrumb">Manuales · {actividad.codigo}</p>
            <h1 className="page-title">{actividad.nombre}</h1>
            <p className="page-subtitle">
              {actividad.subtitulo} — seleccione la subactividad para ver la ficha técnica
            </p>
          </div>
        </div>
      </div>

      <div className="kpi-grid grid-cols-3">
        <div className="kpi-tile border-l-4 border-l-[#1B4F72]">
          <div>
            <p className="kpi-value">{actividad.subactividades.length}</p>
            <p className="kpi-label">Subactividades</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-amber-500">
          <div>
            <p className="kpi-value">{tiempoProm}</p>
            <p className="kpi-label">Min. promedio</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-emerald-600">
          <div>
            <p className="kpi-value">{actividad.totalOT}</p>
            <p className="kpi-label">OT referencia</p>
          </div>
        </div>
      </div>

      <div className="corp-card overflow-hidden">
        <div className="corp-card-header">
          <span>Subactividades disponibles</span>
          <span className="badge-count">{actividad.subactividades.length}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {actividad.subactividades.map(sub => (
            <div key={sub.id} className="p-0">
              <SubactCard sub={sub} onClick={() => navigate(`/ficha/${sub.id}`)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
