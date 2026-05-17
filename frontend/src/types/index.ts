export type Rol = 'SUPERVISOR' | 'CAPATAZ' | 'ADMINISTRADOR'
export type EstadoPunto = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'OBSERVADO'
export type EstadoOrden = 'ACTIVA' | 'CERRADA'

export interface User {
  id: number
  nombre: string
  email: string
  rol: Rol
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface PuntoTrabajo {
  id: number
  ordenId: number | null
  codigoOt: string | null
  latitud: number
  longitud: number
  descripcion: string
  direccion: string
  estado: EstadoPunto
  capatazId?: number | null
  capatazNombre?: string | null
}

export interface OrdenTrabajo {
  id: number
  codigoOt: string
  descripcion: string
  fechaCarga: string
  estado: EstadoOrden
  supervisorId: number | null
  supervisorNombre: string | null
  puntos: PuntoTrabajo[] | null
}

export interface RegistroActividad {
  id: number
  puntoId: number | null
  descripcionPunto: string | null
  capatazId: number | null
  capatazNombre: string | null
  tipoActividad: string
  observaciones: string
  fechaRegistro: string
  validado: boolean
  sincronizado: boolean
  creadoOffline: boolean
}

export interface SeguimientoCapataz {
  capatazId: number
  nombre: string
  total: number
  completados: number
  pendientes: number
  enProgreso: number
}

export interface Alerta {
  id: number
  mensaje: string
  puntoId: number | null
  descripcionPunto: string | null
  leida: boolean
  createdAt: string
}

export interface RegistroPendiente {
  id?: number
  puntoId: number
  tipoActividad: string
  observaciones: string
  fechaRegistro: string
  datosAdicionales?: string
  creadoOffline: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T
}
