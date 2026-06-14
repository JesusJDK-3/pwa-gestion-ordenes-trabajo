/** Normaliza coordenadas Perú: acepta valores positivos (12.04, 77.04) o invertidos. */
export function normalizarCoordsPeru(lat: number, lng: number): { lat: number; lng: number } {  let la = lat
  let lo = lng

  if (Math.abs(la) >= 68 && Math.abs(la) <= 82 && Math.abs(lo) <= 20) {
    const tmp = la
    la = lo
    lo = tmp
  }

  const absLat = Math.abs(la)
  const absLng = Math.abs(lo)

  if (la > 0 && absLat <= 18.5) la = -absLat
  if (lo > 0 && absLng >= 68 && absLng <= 82) lo = -absLng

  return { lat: la, lng: lo }
}

/** Acepta "12,04" o "12.04" o "-12.04" */
export function parseCoordInput(val: string): number {
  const cleaned = val.trim().replace(',', '.')
  return parseFloat(cleaned)
}