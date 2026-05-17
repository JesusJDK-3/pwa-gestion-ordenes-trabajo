import { useCallback, useEffect, useState } from 'react'
import { offlineDB } from '../services/offlineDB'
import { registroService } from '../services/api'

export function useOfflineSync() {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing,      setSyncing]      = useState(false)

  const updatePendingCount = useCallback(async () => {
    const count = await offlineDB.contarPendientes()
    setPendingCount(count)
  }, [])

  const syncPending = useCallback(async () => {
    if (!navigator.onLine) return
    const pendientes = await offlineDB.listarPendientes()
    if (pendientes.length === 0) return

    setSyncing(true)
    try {
      await registroService.sync(pendientes)
      for (const r of pendientes) {
        if (r.id !== undefined) await offlineDB.eliminar(r.id)
      }
      await updatePendingCount()
    } catch (err) {
      console.error('Error en sync:', err)
    } finally {
      setSyncing(false)
    }
  }, [updatePendingCount])

  useEffect(() => {
    updatePendingCount()

    const handleOnline  = () => { setIsOnline(true);  syncPending() }
    const handleOffline = () => { setIsOnline(false) }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncPending, updatePendingCount])

  return { isOnline, pendingCount, syncing, syncPending, updatePendingCount }
}
