import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, FileText, Shield, Wrench, Info, MapPinned,
  ListOrdered, ArrowUpRight, AlertTriangle,
} from 'lucide-react'
import { ACTIVIDADES } from '../../data/actividades'
import type { Subactividad } from '../../types/kabj'

function findSub(subId: string): { sub: Subactividad; actNombre: string; actId: string } | null {
  for (const act of ACTIVIDADES) {
    const sub = act.subactividades.find(s => s.id === subId)
    if (sub) return { sub, actNombre: act.nombre, actId: act.id }
  }
  return null
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="corp-card overflow-hidden">
      <div className="corp-card-header">
        <span className="flex items-center gap-2 normal-case tracking-normal font-semibold text-slate-700">
          {icon}
          {title}
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

export default function FichaPage() {
  const { subId } = useParams<{ subId: string }>()
  const navigate = useNavigate()
  const result = findSub(subId ?? '')

  if (!result) {
    return (
      <div className="corp-card p-12 text-center text-slate-500 text-sm">
        Ficha no encontrada.
      </div>
    )
  }

  const { sub, actNombre, actId } = result

  return (
    <div className="space-y-6 pb-4">
      <div className="page-header border-0 pb-0 mb-0">
        <div className="flex items-start gap-3">
          <Link to={`/actividad/${actId}`} className="btn-outline py-2 px-2.5 flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="page-breadcrumb">Manuales · {actNombre}</p>
            <h1 className="page-title">{sub.nombre}</h1>
            <p className="page-subtitle">
              <span className="font-mono text-[#1B4F72]">{sub.id}</span>
              {' · '}{sub.tipo}
            </p>
          </div>
        </div>
      </div>

      <div className="kpi-grid grid-cols-3">
        <div className="kpi-tile border-l-4 border-l-[#1B4F72]">
          <div className="kpi-icon-box bg-sky-50 border-sky-200 text-sky-700">
            <Clock size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value text-2xl">{sub.tiempoMaximo}</p>
            <p className="kpi-label">Min. máximo</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-amber-500">
          <div className="kpi-icon-box bg-amber-50 border-amber-200 text-amber-700">
            <ListOrdered size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value text-2xl">{sub.pasos.length}</p>
            <p className="kpi-label">Pasos</p>
          </div>
        </div>
        <div className="kpi-tile border-l-4 border-l-emerald-600">
          <div className="kpi-icon-box bg-emerald-50 border-emerald-200 text-emerald-700">
            <Shield size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="kpi-value text-2xl">{sub.medidasSeguridad.length}</p>
            <p className="kpi-label">Medidas EPP</p>
          </div>
        </div>
      </div>

      <Section icon={<FileText size={15} className="text-[#1B4F72]" />} title="Descripción de la operación">
        <p className="text-sm text-slate-600 leading-relaxed">{sub.descripcion}</p>
      </Section>

      <Section icon={<ListOrdered size={15} className="text-[#1B4F72]" />} title="Procedimiento paso a paso">
        <ol className="space-y-3">
          {sub.pasos.map((paso, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-[#1B4F72] text-white text-xs font-bold">
                {i + 1}
              </span>
              <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{paso}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={<Shield size={15} className="text-amber-600" />} title="Medidas de seguridad">
        <ul className="space-y-2.5">
          {sub.medidasSeguridad.map((m, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
              {m}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={<Wrench size={15} className="text-slate-600" />} title="Materiales y herramientas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sub.materiales.map((m, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F72] flex-shrink-0 mt-2" />
              {m}
            </div>
          ))}
        </div>
      </Section>

      <div className="corp-card border-l-4 border-l-sky-600 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-sky-700 flex-shrink-0" />
          <h2 className="font-semibold text-sm text-slate-800">Recomendaciones importantes</h2>
        </div>
        <ul className="space-y-2">
          {sub.recomendaciones.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 flex-shrink-0 mt-2" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => navigate('/capataz/mapa')}
        className="action-tile border-l-[#1B4F72] w-full group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1B4F72] flex items-center justify-center text-white">
            <MapPinned size={22} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800">Ir al mapa operativo</p>
            <p className="text-xs text-slate-500 mt-0.5">Ubique sus OT asignadas en campo</p>
          </div>
        </div>
        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-[#1B4F72]" />
      </button>
    </div>
  )
}
