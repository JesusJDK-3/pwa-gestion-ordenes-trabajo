import { useParams, useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { ACTIVIDADES } from '../../data/actividades'
import type { Subactividad } from '../../types/kabj'
import Navbar from '../../components/kabj/Navbar'
import HelpButton from '../../components/kabj/HelpButton'

const TYPE_COLORS: Record<string, string> = {
  'Mantenimiento Correctivo': 'bg-red-100 text-red-700',
  'Mantenimiento Preventivo': 'bg-blue-100 text-blue-700',
  'Operación Planificada':    'bg-amber-100 text-amber-700',
  'Inspección Técnica':       'bg-purple-100 text-purple-700',
}

function SubactCard({ sub, index, onClick }: { sub: Subactividad; index: number; onClick: () => void }) {
  const stagger = `stagger-${Math.min(index + 1, 6)}`
  const typeColor = TYPE_COLORS[sub.tipo] ?? 'bg-gray-100 text-gray-600'

  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all text-left p-5 animate-fade-in-up ${stagger} group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-gray-100 text-gray-500 text-[12px] px-2 py-0.5 rounded-md font-medium">
              {sub.id}
            </span>
            <span className={`text-[12px] px-2 py-0.5 rounded-md font-medium ${typeColor}`}>
              {sub.tipo}
            </span>
          </div>
          <p className="font-semibold text-[15px] text-gray-900 leading-snug">{sub.nombre}</p>
          <p className="text-[13px] text-gray-500 mt-1.5 line-clamp-2">{sub.descripcion}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <ChevronRight size={18} className="text-gray-300 group-hover:text-[#CC1111] transition-colors" />
          <div className="flex items-center gap-1 text-[12px] text-gray-400">
            <Clock size={13} />
            <span>{sub.tiempoMaximo} min</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-[12px] text-gray-400">
        <span>{sub.pasos.length} pasos</span>
        <span>{sub.materiales.length} materiales</span>
        <span className="flex items-center gap-1">
          <AlertCircle size={12} className="text-amber-500" />
          {sub.medidasSeguridad.length} medidas
        </span>
      </div>
    </button>
  )
}

export default function ActividadPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const actividad  = ACTIVIDADES.find(a => a.id === id)

  if (!actividad) {
    return (
      <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
        <Navbar showBack subtitle="Actividad no encontrada" />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-[15px]">
          Actividad no encontrada.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
      <Navbar
        showBack
        title={actividad.nombre}
        subtitle={`${actividad.codigo} · ${actividad.totalOT} órdenes activas`}
      />

      <main className="flex-1 px-5 py-6">
        {/* Header */}
        <div className="mb-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-bold text-gray-900">{actividad.nombre}</h1>
            <span className="bg-green-100 text-green-700 text-[12px] font-medium px-3 py-1 rounded-full">
              Activo
            </span>
          </div>
          <p className="text-[14px] text-gray-500 mt-1">
            Selecciona la subactividad a ejecutar hoy
          </p>
        </div>

        {/* Sub-activities */}
        <div className="space-y-3">
          {actividad.subactividades.map((sub, i) => (
            <SubactCard
              key={sub.id}
              sub={sub}
              index={i}
              onClick={() => navigate(`/ficha/${sub.id}`)}
            />
          ))}
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
