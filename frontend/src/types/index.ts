/**
 * Tipos TypeScript alineados al contrato REST del backend.
 *
 * Mantener sincronizados con:
 * - `OrdenTrabajoResponse` (Java DTO)
 * - `cat_estado_ot` en PostgreSQL
 * - Payload de login JWT
 *
 * @module types
 */

// Roles del nuevo esquema (lowercase)
export type Rol = 'supervisor' | 'capataz' | 'admin'

// Estados de OT según cat_estado_ot — ver docs/ARCHITECTURE.md §3
export type EstadoOt = 'PENDIENTE' | 'EN_PROGRESO' | 'OBSERVADA' | 'COMPLETADA' | 'ANULADA'

export interface User {
  id: number
  nombre: string
  email: string
  rol: Rol
  username?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Orden de Trabajo (op_orden_trabajo)
export interface OrdenTrabajo {
  idOt: number
  sgio: string
  estado: string        // nombre del estado
  estadoCodigo: EstadoOt
  subactividad?: string
  tipoPunto?: string
  nis?: string
  direccion?: string
  distrito?: string
  sector?: string
  latitud?: number
  longitud?: number
  fechaProgramada?: string
  fechaInicio?: string
  fechaFin?: string
  capatazNombre?: string
  capatazId?: number
  cuadrillaNombre?: string
  asistenteNombre?: string
  estadoSincronizacion?: string
  observacion?: string
  createdAt?: string
  updatedAt?: string
  visibleEnMapa?: boolean
  requiereCorreccionCoordenadas?: boolean
  mensajeCoordenadas?: string
  localidad?: string
  // aliases for backwards compatibility with frontend components
  id?: number
  descripcion?: string
  lat?: number
  lng?: number
}

export interface SeguimientoOt {
  idOt: number
  sgio: string
  capataz: string
  estado: EstadoOt
  direccion: string
  latitud?: number
  longitud?: number
}

export interface RegistroPendiente {
  id?: number
  clientOpUuid?: string
  sincronizado?: boolean
  puntoId: number
  tipoActividad?: string
  asistenteIds?: number[]
  cuadrillaId?: number
  cuadrillaNombre?: string
  asistenteId?: number
  asistenteDni?: string
  asistenteNombres?: string
  asistenteApellidos?: string
  asistenteCargo?: string
  cargoEnCuadrilla?: string
  actividad?: string
  subactividad?: string
  estado: string
  observaciones: string
  fechaRegistro: string
  creadoOffline: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T
}
