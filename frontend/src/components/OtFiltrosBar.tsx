import type { EstadoOt } from '../types'

const ESTADOS: { value: '' | EstadoOt; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En progreso' },
  { value: 'OBSERVADA', label: 'Observada' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'ANULADA', label: 'Anulada' },
]

interface Props {
  sgio: string
  estado: string
  fecha?: string
  onSgio: (v: string) => void
  onEstado: (v: string) => void
  onFecha?: (v: string) => void
  showFecha?: boolean
  onLimpiar?: () => void
}

export default function OtFiltrosBar({
  sgio, estado, fecha = '', onSgio, onEstado, onFecha, showFecha, onLimpiar,
}: Props) {
  const inputClass = 'corp-input text-sm py-2'

  return (
    <div className="corp-card p-4 flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Código OT (SGIO)</label>
        <input
          type="text"
          value={sgio}
          onChange={e => onSgio(e.target.value)}
          placeholder="Ej. OT-2026-010"
          className={inputClass}
        />
      </div>
      {showFecha && onFecha && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
          <input type="date" value={fecha} onChange={e => onFecha(e.target.value)} className={inputClass} />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
        <select value={estado} onChange={e => onEstado(e.target.value)} className={inputClass}>
          {ESTADOS.map(o => (
            <option key={o.value || 'all'} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {onLimpiar && (sgio || estado || fecha) && (
        <button type="button" onClick={onLimpiar} className="btn-outline text-xs py-2">
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
