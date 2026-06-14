import { useCallback, useEffect, useRef, useState } from 'react'
import { offlineDB } from '../services/offlineDB'
import { syncService } from '../services/api'

const SYNC_TIMEOUT_MS = 15_000

interface SyncResult {
  procesados?: number
  duplicados?: number
  total?: number
  errores?: string[]
  procesadosUuids?: string[]
}

export function useOfflineSyncState() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncMsg, setLastSyncMsg] = useState<string | null>(null)
  const syncingRef = useRef(false)

  const updatePendingCount = useCallback(async () => {
    const count = await offlineDB.contarPendientes()
    setPendingCount(count)
  }, [])

  const syncPending = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return
    const pendientes = await offlineDB.listarPendientes()
    if (pendientes.length === 0) return

    syncingRef.current = true
    setSyncing(true)
    setLastSyncMsg(null)

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo máximo de sincronización excedido (15 s)')), SYNC_TIMEOUT_MS),
    )

    try {
      const operaciones = pendientes.map(p => ({
        clientOpUuid: p.clientOpUuid ?? crypto.randomUUID(),
        puntoId: p.puntoId,
        tipoOperacion: 'GUARDAR_ACTIVIDAD',
        tipoActividad: p.tipoActividad ?? p.actividad,
        actividad: p.actividad,
        subactividad: p.subactividad,
        estado: p.estado,
        observaciones: p.observaciones,
        fechaRegistro: p.fechaRegistro,
        asistenteIds: p.asistenteIds,
        creadoOffline: true,
      }))

      for (let i = 0; i < pendientes.length; i++) {
        const p = pendientes[i]
        const uuid = operaciones[i].clientOpUuid as string
        if (!p.clientOpUuid && p.id != null) {
          await offlineDB.actualizarClientOpUuid(p.id, uuid)
        }
      }

      const res = await Promise.race([syncService.operacion(operaciones), timeout])
      const raw = res.data as { success?: boolean; message?: string; data?: SyncResult } & SyncResult
      if (raw?.success === false) {
        throw new Error(raw.message ?? 'Sincronización rechazada por el servidor')
      }
      const data: SyncResult = raw?.data ?? raw
      const uuidsOk = new Set(data?.procesadosUuids ?? [])
      const errores = data?.errores ?? []

      let eliminados = 0
      for (let i = 0; i < pendientes.length; i++) {
        const p = pendientes[i]
        const uuid = operaciones[i].clientOpUuid as string
        if (p.id != null && uuidsOk.has(uuid)) {
          await offlineDB.eliminarPendiente(p.id)
          eliminados++
        }
      }

      if (errores.length > 0) {
        setLastSyncMsg(
          `${eliminados} sincronizada(s). ${errores.length} con error: ${errores.slice(0, 2).join(' · ')}${errores.length > 2 ? '…' : ''}`,
        )
      } else {
        setLastSyncMsg(raw?.message ?? `${eliminados} actividad(es) sincronizada(s) correctamente`)
      }

      await updatePendingCount()
    } catch (err) {
      console.error('Error en sync:', err)
      setLastSyncMsg(err instanceof Error ? err.message : 'Error al sincronizar')
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [updatePendingCount])

  useEffect(() => {
    updatePendingCount()

    const handleOnline = () => { setIsOnline(true); syncPending() }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncPending, updatePendingCount])

  useEffect(() => {
    if (!lastSyncMsg || !isOnline) return
    const t = setTimeout(() => setLastSyncMsg(null), 8_000)
    return () => clearTimeout(t)
  }, [lastSyncMsg, isOnline])

  return { isOnline, pendingCount, syncing, syncPending, updatePendingCount, lastSyncMsg }
}
