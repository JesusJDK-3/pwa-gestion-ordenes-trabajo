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
      className="btn-outline text-xs py-2 flex-shrink-0 disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      Actualizar
    </button>
  )
}
