import { RefreshCw } from 'lucide-react'
import { useOfflineSync } from '../context/OfflineSyncContext'

export default function OfflineBadge() {
  const { isOnline, pendingCount, syncing, syncPending } = useOfflineSync()

  if (syncing) {
    return (
      <span className="flex items-center gap-1.5 text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2.5 py-1 rounded-full font-medium">
        <span className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        Sincronizando…
      </span>
    )
  }

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 border border-red-300 px-2.5 py-1 rounded-full font-medium">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        Sin conexión{pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}
      </span>
    )
  }

  if (pendingCount > 0) {
    return (
      <button
        type="button"
        onClick={() => syncPending()}
        className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full font-medium hover:bg-amber-100 transition-colors"
        title="Sincronizar actividades pendientes"
      >
        <RefreshCw size={11} />
        {pendingCount} pendiente{pendingCount > 1 ? 's' : ''} · Sincronizar
      </button>
    )
  }

  return null
}
