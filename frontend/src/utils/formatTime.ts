/** Fecha local YYYY-MM-DD (evita desfase UTC de toISOString). */
export function fechaLocalISO(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Texto relativo simple: "hace 5 min", "hace 2 h" */
export function formatRelativeTime(timestampMs: number): string {
  const diff = Date.now() - timestampMs
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

export function fechaActividadOt(ot: {
  updatedAt?: string
  fechaFin?: string
  fechaInicio?: string
  createdAt?: string
}): string | undefined {
  return ot.updatedAt ?? ot.fechaFin ?? ot.fechaInicio ?? ot.createdAt
}

export function formatearFechaHistorial(val?: string, soloFecha = false): string {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '—'
  if (soloFecha) {
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
