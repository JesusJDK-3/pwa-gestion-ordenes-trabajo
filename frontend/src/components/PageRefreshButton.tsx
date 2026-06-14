import { Loader2, RefreshCw } from 'lucide-react'

interface Props {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

/** Actualizar: siempre en la esquina derecha del page-header */
export default function PageRefreshButton({ onClick, loading = false, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="btn-outline text-sm min-h-11 px-3 py-2 flex-shrink-0 disabled:opacity-50"
      aria-label={loading ? 'Actualizando datos' : 'Actualizar datos de la página'}
    >
      {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
      Actualizar
    </button>
  )
}
