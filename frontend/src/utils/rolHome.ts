import type { Rol } from '../types'

/** Ruta inicial tras login según rol */
export function getRolHome(rol: Rol | string): string {
  if (rol === 'capataz') return '/capataz/mapa'
  if (rol === 'supervisor') return '/supervisor'
  return '/admin'
}
