import { openDB } from 'idb'
import type { RegistroPendiente } from '../types'

const DB_NAME  = 'sistema-ot-db'
const STORE    = 'registros_pendientes'

const getDB = () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    },
  })

export const offlineDB = {
  async guardar(registro: Omit<RegistroPendiente, 'id'>): Promise<void> {
    const db = await getDB()
    await db.add(STORE, { ...registro, creadoOffline: true })
  },

  async listarPendientes(): Promise<RegistroPendiente[]> {
    const db = await getDB()
    return db.getAll(STORE)
  },

  async eliminar(id: number): Promise<void> {
    const db = await getDB()
    await db.delete(STORE, id)
  },

  async contarPendientes(): Promise<number> {
    const db = await getDB()
    return db.count(STORE)
  },
}
