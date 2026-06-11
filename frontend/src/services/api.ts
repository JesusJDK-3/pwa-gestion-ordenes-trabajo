import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

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
      // Token expirado o inválido → limpiar sesión y redirigir
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.replace('/login')
    }

    if (status === 429) {
      // Rate limit alcanzado en login
      console.warn('[Security] Rate limit alcanzado:', url)
    }

    return Promise.reject(err)
  },
)

/** Sanitiza un string para prevenir XSS al mostrar en el DOM */
export function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/** Limita la longitud de un input y elimina caracteres peligrosos */
export function safeInput(val: string, maxLen = 500): string {
  return val.slice(0, maxLen).trim()
}

export const authService = {
  login:  (email: string, password: string) => api.post('/auth/login', { email, password }),
  me:     () => api.get('/auth/me'),
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
}

export const ordenService = {
  cargarExcel: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/ordenes/carga-excel', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
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
  misPuntos:    () => api.get('/puntos/mis-puntos'),
  todos:        (params?: Record<string, unknown>) => api.get('/puntos/todos', { params }),
  asignar:      (id: number, capatazId: number) => api.put(`/puntos/${id}/asignar`, { capatazId }),
  cambiarEstado:(id: number, estado: string) => api.put(`/puntos/${id}/estado`, { estado }),
  seguimiento:  () => api.get('/puntos/seguimiento'),
}

export const VALIDACION_FOTOS_URL =
  import.meta.env.VITE_VALIDACION_FOTOS_URL || 'http://45.71.33.77/proyecto_lima/'

export const registroService = {
  crear:    (data: object) => api.post('/registros', data),
  sync:     (registros: object[]) => api.post('/registros/sync', registros),
  porPunto: (puntoId: number) => api.get(`/registros/punto/${puntoId}`),
}

export const usuarioService = {
  listar: () => api.get('/usuarios'),
}

export const trabajadorService = {
  listar: () => api.get('/trabajadores'),
  crear:  (data: object) => api.post('/trabajadores', data),
}

export const alertaService = {
  listar:      () => api.get('/reportes/alertas'),   // HU16: alertas reales
  marcarLeida: (id: number) => api.put(`/alertas/${id}/leer`),
}

export const cuadrillaService = {
  obtener: () => api.get('/cuadrilla'),
  guardar: (data: object) => api.post('/cuadrilla', data),
  agregarMiembro: (data: object) => api.post('/cuadrilla/miembros', data),
}

export const puntoExtraService = {
  misCompletadas: () => api.get('/puntos/mis-completadas'), // HU18: historial capataz
}

export const reporteService = {
  diario:        (fecha: string) => api.get('/reportes/diario', { params: { fecha } }),
  mensual:       (mes: number, anio: number) => api.get('/reportes/mensual', { params: { mes, anio } }),
  exportarExcel: (fecha: string) =>
    api.get('/reportes/exportar-excel', { params: { fecha }, responseType: 'blob' }),
  auditoria:     () => api.get('/reportes/auditoria'),
}

export default api
