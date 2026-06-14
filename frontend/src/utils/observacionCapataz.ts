/** Limpia etiquetas confusas del texto guardado en la OT (p. ej. [Inspección]). */
export function formatearObservacionCapataz(text?: string): string {
  if (!text?.trim()) return ''

  return text
    .trim()
    .split('\n')
    .map(linea => {
      const trimmed = linea.trim()
      const match = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/)
      if (!match) return trimmed

      const [, etiqueta, cuerpo] = match
      const texto = cuerpo.trim()

      if (etiqueta === 'Observada' || /^Inspección/i.test(etiqueta)) {
        return texto || trimmed
      }

      if (etiqueta.includes(' / ')) {
        return texto ? `${etiqueta}: ${texto}` : etiqueta
      }

      return texto ? `${etiqueta}: ${texto}` : trimmed
    })
    .filter(Boolean)
    .join('\n')
}

export function resumenObservacionCapataz(text?: string): string {
  const formateado = formatearObservacionCapataz(text)
  if (!formateado) return ''
  const lineas = formateado.split('\n').map(l => l.trim()).filter(Boolean)
  return lineas[lineas.length - 1] ?? ''
}

export function cuentaObservacionesCapataz(text?: string): number {
  if (!text?.trim()) return 0
  return text.trim().split('\n').map(l => l.trim()).filter(Boolean).length
}
