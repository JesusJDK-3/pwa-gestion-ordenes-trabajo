/**
 * Cliente HTTP central del frontend PWA.
 *
 * Punto único de acceso a la API REST (`/api/*`). Todos los módulos de pantalla
 * deben usar estos servicios en lugar de llamar axios directamente.
 *
 * ## Interceptores
 * - **Request:** adjunta `Authorization: Bearer` desde localStorage.
 * - **Response:** ante 401 (excepto login/me) limpia sesión y redirige a `/login`.
 *
 * ## Servicios exportados
 * | Servicio | Dominio |
 * |----------|---------|
 * | `authService` | Login y sesión |
 * | `ordenService` | Excel, validación foto, coordenadas |
 * | `puntoService` | OT del capataz, asignación, seguimiento |
 * | `registroService` | Actividad de campo y ayudantes |
 * | `syncService` | Cola offline → backend |
 * | `alertaService` | Alertas operativas |
 * | `capatazService` | Alta/listado capataces (admin) |
 * | `reporteService` | Reportes diario/mensual/auditoría |
 *
 * @module services/api
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const url: string = err.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/me')

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.replace('/login')
    }

    return Promise.reject(err)
  },
)

export function safeInput(val: string, maxLen = 500): string {
  return val.slice(0, maxLen).trim()
}

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me:    () => api.get('/auth/me'),
}

export interface PreviewFilaExcel {
  fila: number
  sgio: string
  direccion?: string
  valido: boolean
  mensaje: string
}

export interface CargaExcelResult {
  message: string
  creadas?: number
  duplicadas?: number
  errores?: number
  coordenadasValidas?: number
  coordenadasInvalidas?: number
  coordenadasRevisar?: number
  detalleCoordenadas?: Array<{ sgio: string; mensaje: string }>
  filas?: PreviewFilaExcel[]
  validas?: number
  total?: number
}

export const ordenService = {
  previewExcel: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/ordenes/preview-excel', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  cargarExcel: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/ordenes/carga-excel', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  validacionFoto: (id: number) => api.get(`/ordenes/${id}/validacion-foto`),
  listar:  () => api.get('/ordenes'),
  detalle: (id: number) => api.get(`/ordenes/${id}`),
  coordenadasPendientes: () => api.get('/ordenes/coordenadas-pendientes'),
  corregirCoordenadas: (id: number, latitud: number, longitud: number) =>
    api.put(`/puntos/${id}/coordenadas`, { latitud, longitud }),
}

export const configService = {
  publica: () => api.get<{ validacionFotosUrl: string }>('/config/public'),
}

export const puntoService = {
  misPuntos:      () => api.get('/puntos/mis-puntos'),
  misAsignacionesDia: (params?: { sgio?: string; estado?: string }) =>
    api.get('/puntos/mis-asignaciones-dia', { params }),
  historialCapataz: (params?: { fecha?: string; sgio?: string; estado?: string }) =>
    api.get('/puntos/historial', { params }),
  historialSupervisor: (params?: { fecha?: string; sgio?: string; estado?: string }) =>
    api.get('/ordenes/historial', { params }),
  mapaMonitoreo:  () => api.get('/puntos/mapa-monitoreo'),
  todos:        (params?: Record<string, unknown>) => api.get('/puntos/todos', { params }),
  asignar:      (id: number, capatazId: number) => api.put(`/puntos/${id}/asignar`, { capatazId }),
  cambiarEstado:(id: number, estado: string) => api.put(`/puntos/${id}/estado`, { estado }),
  seguimientoResumen: () => api.get('/puntos/seguimiento-resumen'),
}

export const VALIDACION_FOTOS_URL =
  import.meta.env.VITE_VALIDACION_FOTOS_URL || 'http://45.71.33.77/proyecto_lima/'

export const registroService = {
  crear: (data: object) => api.post('/registros', data),
  historialApoyo: () => api.get('/registros/historial-apoyo'),
}

export const syncService = {
  operacion: (ops: object[]) => api.post('/sync/operacion', ops, { timeout: 15_000 }),
}

export const capatazService = {
  listar: () => api.get('/capataces'),
  registrar: (data: {
    email: string
    username: string
    nombres: string
    apellidos: string
    dni: string
    password: string
  }) => api.post('/capataces', data),
  inactivar: (id: number) => api.put(`/capataces/${id}/inactivar`),
}

export const usuarioService = {
  listar: () => api.get('/usuarios'),
  registrarSupervisor: (data: {
    email: string
    username: string
    nombres: string
    apellidos: string
    password: string
  }) => api.post('/usuarios', data),
  inactivar: (id: number) => api.put(`/usuarios/${id}/inactivar`),
}

export const trabajadorService = {
  listar: () => api.get('/trabajadores'),
  crear:  (data: object) => api.post('/trabajadores', data),
}

export const alertaService = {
  listar:         () => api.get('/alertas'),
  contarActivas:  () => api.get('/alertas/count'),
  marcarResuelta: (id: number) => api.put(`/alertas/${id}/resolver`),
}

export const puntoExtraService = {
  misCompletadas: () => api.get('/puntos/mis-completadas'),
}

export const reporteService = {
  diario:  (fecha: string) => api.get('/reportes/diario', { params: { fecha } }),
  mensual: (mes: number, anio: number) => api.get('/reportes/mensual', { params: { mes, anio } }),
  auditoria:        () => api.get('/reportes/auditoria'),
  eventosAuditoria: (params?: Record<string, string | number>) =>
    api.get('/reportes/auditoria/eventos', { params }),
}

export default api
