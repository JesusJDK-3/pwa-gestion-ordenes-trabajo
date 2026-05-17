export type IconoColor = 'blue' | 'orange' | 'purple' | 'green'

export interface Subactividad {
  id: string
  nombre: string
  tipo: string
  tiempoMaximo: number
  descripcion: string
  pasos: string[]
  medidasSeguridad: string[]
  materiales: string[]
  recomendaciones: string[]
}

export interface Actividad {
  id: string
  nombre: string
  codigo: string
  colorIcono: IconoColor
  totalOT: number
  activo: boolean
  subtitulo: string
  subactividades: Subactividad[]
}

export interface OrdenTrabajo {
  id: string
  subactividadId: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  direccion: string
  sector: string
  horarioInicio: string
  horarioFin?: string
  tiempoReal?: number
  lat: number
  lng: number
}

export interface ResumenDiario {
  fecha: string
  otCompletadas: number
  tiempoPromedio: number
  tiempoTotal: number
  distanciaTotal: number
  eficiencia: number
  puntualidad: number
  calidad: number
  ordenes: OrdenTrabajo[]
}
