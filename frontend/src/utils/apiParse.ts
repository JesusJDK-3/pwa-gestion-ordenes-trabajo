/** Desenvuelve listas de la API (raw array o ApiResponse { success, data }). */
export function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const w = raw as { success?: boolean; data?: T[]; message?: string }
    if (w.success === false) {
      throw new Error(w.message ?? 'Error al cargar datos')
    }
    if (Array.isArray(w.data)) return w.data
  }
  return []
}

/** Desenvuelve un objeto de la API. */
export function unwrapData<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw) {
    const w = raw as { success?: boolean; data?: T; message?: string }
    if (w.success === false) {
      throw new Error(w.message ?? 'Error al cargar datos')
    }
    return (w.data ?? null) as T | null
  }
  return raw as T
}
