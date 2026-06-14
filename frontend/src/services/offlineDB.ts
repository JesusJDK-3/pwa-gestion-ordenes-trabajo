/**
 * Persistencia local IndexedDB para modo offline del capataz.
 *
 * Stores:
 * - `actividades_pendientes` — registros no sincronizados (cola de sync)
 * - `puntos_cache` — cache de OT por capataz para consulta sin red
 *
 * Consumido por FormularioActividad (guardar) y useOfflineSync (enviar batch).
 *
 * @see hooks/useOfflineSync.ts
 * @see POST /api/sync/operacion
 */
import { openDB } from 'idb'
import type { OrdenTrabajo, RegistroPendiente } from '../types'

const DB_NAME = 'sistema-ot-db'
const STORE_ACTIVIDADES = 'actividades_pendientes'
const STORE_PUNTOS = 'puntos_cache'
const LEGACY_STORE = 'registros_pendientes'

const getDB = () =>
  openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1 && !db.objectStoreNames.contains(LEGACY_STORE)) {
        db.createObjectStore(LEGACY_STORE, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVIDADES)) {
        db.createObjectStore(STORE_ACTIVIDADES, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(STORE_PUNTOS)) {
        db.createObjectStore(STORE_PUNTOS, { keyPath: 'capatazKey' })
      }
    },
  })

export const offlineDB = {
  async guardarActividad(registro: Omit<RegistroPendiente, 'id'>): Promise<void> {
    const db = await getDB()
    await db.add(STORE_ACTIVIDADES, {
      ...registro,
      sincronizado: false,
      creadoOffline: true,
    })
  },

  async listarPendientes(): Promise<RegistroPendiente[]> {
    const db = await getDB()
    const actividades = await db.getAll(STORE_ACTIVIDADES)
    if (actividades.length > 0) return actividades
    return db.getAll(LEGACY_STORE)
  },

  async eliminarPendiente(id: number): Promise<void> {
    const db = await getDB()
    try { await db.delete(STORE_ACTIVIDADES, id) } catch { /* */ }
    try { await db.delete(LEGACY_STORE, id) } catch { /* */ }
  },

  async actualizarClientOpUuid(id: number, clientOpUuid: string): Promise<void> {
    const db = await getDB()
    for (const store of [STORE_ACTIVIDADES, LEGACY_STORE]) {
      const row = await db.get(store, id) as RegistroPendiente | undefined
      if (row) await db.put(store, { ...row, clientOpUuid })
    }
  },

  async contarPendientes(): Promise<number> {
    const db = await getDB()
    const n = await db.count(STORE_ACTIVIDADES)
    if (n > 0) return n
    return db.count(LEGACY_STORE)
  },

  async guardarPuntosCache(capatazKey: string, puntos: OrdenTrabajo[]): Promise<void> {
    const db = await getDB()
    await db.put(STORE_PUNTOS, { capatazKey, puntos, cachedAt: Date.now() })
  },

  async obtenerPuntosCache(capatazKey: string): Promise<OrdenTrabajo[]> {
    const meta = await this.obtenerPuntosCacheMeta(capatazKey)
    return meta.puntos
  },

  async obtenerPuntosCacheMeta(capatazKey: string): Promise<{ puntos: OrdenTrabajo[]; cachedAt: number | null }> {
    const db = await getDB()
    const row = await db.get(STORE_PUNTOS, capatazKey)
    return { puntos: row?.puntos ?? [], cachedAt: row?.cachedAt ?? null }
  },
}
