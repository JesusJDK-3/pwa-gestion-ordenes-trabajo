import { useEffect, useRef, useState, type MouseEvent } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { alertaService } from '../../services/api'

import { useAuth } from '../../context/AuthContext'

import { formatearObservacionCapataz, resumenObservacionCapataz } from '../../utils/observacionCapataz'
import { unwrapList } from '../../utils/apiParse'

import PageRefreshButton from '../../components/PageRefreshButton'

import { AlertOctagon, BellRing, Loader2, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'



interface AlertaItem {

  id?: number

  tipo?: string

  tipoLabel?: string

  titulo?: string

  detalle?: string

  prioridad?: string

  prioridadLabel?: string

  sgio?: string

  idOt?: number

  direccion?: string

  capatazNombre?: string

  estadoOt?: string

  accionLabel?: string

  timestamp?: string

  observacionCapataz?: string

}



const ROL_LABEL: Record<string, string> = {

  admin: 'Administrador',

  supervisor: 'Supervisor',

  capataz: 'Capataz de campo',

}



const PRIORIDAD_COLOR: Record<string, string> = {

  alta: 'bg-red-100 text-red-700',

  media: 'bg-amber-100 text-amber-800',

  baja: 'bg-slate-100 text-slate-600',

}



function puedeMarcarResuelta(tipo: string | undefined, rol: string): boolean {
  return tipo === 'OBSERVADA' && (rol === 'admin' || rol === 'supervisor')
}

function rutaAccion(tipo: string | undefined, rol: string, idOt?: number): string | null {
  switch (tipo) {
    case 'SIN_ASIGNAR':
      return rol === 'supervisor' ? '/supervisor/asignar' : null
    case 'OBSERVADA':
      if (rol === 'capataz' && idOt) return `/capataz/registrar/${idOt}`
      return null
    case 'RETRASADA':
      if (rol === 'capataz') return '/capataz/mapa'
      if (rol === 'supervisor') return '/supervisor/mapa'
      return '/admin/mapa'
    default:
      return null
  }
}



export default function AlertasPage() {

  const { user } = useAuth()

  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  const rol = user?.rol?.toLowerCase() ?? 'admin'

  const [alertas, setAlertas] = useState<AlertaItem[]>([])

  const [loading, setLoading] = useState(true)

  const [resolviendo, setResolviendo] = useState<number | null>(null)

  const [expandida, setExpandida] = useState<number | null>(null)

  const [error, setError] = useState('')

  const [exito, setExito] = useState('')

  const filaRefs = useRef<Record<number, HTMLDivElement | null>>({})



  const cargar = () => {

    setLoading(true)

    setError('')

    setExito('')

    alertaService.listar()

      .then(r => setAlertas(unwrapList<AlertaItem>(r.data)))

      .catch(() => setError('No se pudieron cargar las alertas. Intente de nuevo.'))

      .finally(() => setLoading(false))

  }



  useEffect(() => { cargar() }, [])



  useEffect(() => {

    const otFocus = Number(searchParams.get('ot') || 0)

    if (!otFocus || loading) return

    const found = alertas.find(a => Number(a.idOt) === otFocus)

    if (found?.id != null) {

      setExpandida(found.id)

      requestAnimationFrame(() => {

        filaRefs.current[found.id!]?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      })

      return

    }

    setExpandida(null)

    if (searchParams.get('ot')) {

      setSearchParams({}, { replace: true })

      setExito('No hay alerta activa para esta OT. Si ya la marcaste como resuelta, la OT puede seguir como Observada en el centro de control hasta que el capataz la complete.')

    }

  }, [alertas, searchParams, loading])



  const marcarResuelta = async (id: number, e?: MouseEvent) => {

    e?.stopPropagation()

    setResolviendo(id)

    setError('')

    setExito('')

    try {

      const alerta = alertas.find(a => a.id === id)

      await alertaService.marcarResuelta(id)

      setAlertas(prev => prev.filter(a => a.id !== id))

      if (expandida === id) setExpandida(null)

      if (alerta && Number(searchParams.get('ot')) === Number(alerta.idOt)) {

        setSearchParams({}, { replace: true })

      }

      setExito('Alerta marcada como resuelta. La OT sigue en estado Observada en el centro de control hasta que el capataz la complete.')

    } catch {

      setError('No se pudo marcar la alerta como resuelta.')

    } finally {

      setResolviendo(null)

    }

  }



  const irAccion = (a: AlertaItem, e?: MouseEvent) => {

    e?.stopPropagation()

    const ruta = rutaAccion(a.tipo, rol, a.idOt)

    if (ruta) navigate(ruta)

  }



  const toggleDetalle = (id?: number) => {

    if (id == null) return

    setExpandida(prev => (prev === id ? null : id))

  }



  return (

    <div className="space-y-6">

      <div className="page-header border-0 pb-0 mb-0">

        <div>

          <p className="page-breadcrumb">{ROL_LABEL[rol] ?? 'Usuario'} · Monitoreo</p>

          <h1 className="page-title">Alertas del sistema</h1>

          <p className="page-subtitle">
            {rol === 'capataz'
              ? 'Avisos de sus OT observadas o retrasadas. La georreferencia la corrige el supervisor en su módulo de coordenadas.'
              : rol === 'supervisor'
                ? 'OTs observadas, sin capataz o retrasadas. «Marcar como revisada» solo aplica a observadas; las demás se resuelven al corregir la causa (asignar capataz, etc.).'
                : 'OTs observadas, sin asignar o retrasadas para escalamiento. La georreferencia y asignación las gestiona el supervisor.'}
          </p>

        </div>

        <PageRefreshButton onClick={cargar} loading={loading} />

      </div>



      {error && (

        <div className="alert-banner alert-error text-sm">{error}</div>

      )}



      {exito && (

        <div className="alert-banner alert-success text-sm">{exito}</div>

      )}



      {loading ? (

        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#1B4F72]" /></div>

      ) : alertas.length === 0 ? (

        <div className="corp-card p-12 text-center text-slate-400">

          <AlertOctagon size={32} className="mx-auto mb-3 opacity-30" />

          <p className="text-sm">No hay alertas activas.</p>

        </div>

      ) : (

        <div className="corp-card overflow-hidden divide-y divide-slate-100">

          {alertas.map(a => {

            const abierta = expandida === a.id

            const ruta = rutaAccion(a.tipo, rol, a.idOt)

            return (

              <div key={a.id ?? a.sgio} ref={el => { if (a.id != null) filaRefs.current[a.id] = el }}>

                <button

                  type="button"

                  onClick={() => toggleDetalle(a.id)}

                  aria-expanded={abierta}

                  aria-controls={a.id != null ? `alerta-detalle-${a.id}` : undefined}

                  className="w-full px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/60 text-left min-h-11"

                >

                  <div className="flex items-start gap-3 flex-1 min-w-0">

                    <BellRing size={16} className="text-red-500 flex-shrink-0 mt-0.5" />

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-semibold text-gray-800 text-sm">{a.titulo ?? 'Alerta'}</p>

                        {a.tipoLabel && (

                          <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">

                            {a.tipoLabel}

                          </span>

                        )}

                        {a.prioridadLabel && (

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORIDAD_COLOR[a.prioridad ?? ''] ?? PRIORIDAD_COLOR.media}`}>

                            {a.prioridadLabel}

                          </span>

                        )}

                      </div>

                      {a.sgio && <p className="text-xs font-mono text-[#CC1111] mt-1">{a.sgio}</p>}

                      {!abierta && a.tipo === 'OBSERVADA' && (
                        <p className="text-sm text-amber-800 mt-1 line-clamp-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          {a.observacionCapataz?.trim()
                            ? resumenObservacionCapataz(a.observacionCapataz)
                            : 'Sin observaciones escritas del capataz'}
                        </p>
                      )}

                      {!abierta && a.tipo !== 'OBSERVADA' && a.detalle && (

                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{a.detalle}</p>

                      )}

                    </div>

                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-gray-400">

                    <span className="text-[10px] hidden sm:inline">Ver detalle</span>

                    {abierta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

                  </div>

                </button>



                {abierta && (

                  <div id={a.id != null ? `alerta-detalle-${a.id}` : undefined} className="px-6 pb-4 -mt-1 border-t border-gray-50 bg-gray-50/40">

                    {a.tipo === 'OBSERVADA' && (

                      <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">

                          Observaciones del capataz

                        </p>

                        <p className="mt-2 text-sm text-amber-950 whitespace-pre-wrap leading-relaxed">
                          {a.observacionCapataz?.trim()
                            ? formatearObservacionCapataz(a.observacionCapataz)
                            : 'El capataz marcó la OT como observada pero no dejó observaciones escritas.'}
                        </p>

                        {a.capatazNombre && (

                          <p className="mt-3 text-xs text-amber-700">

                            Registrado por: <strong>{a.capatazNombre}</strong>

                          </p>

                        )}

                      </div>

                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-3">

                      {a.tipo !== 'OBSERVADA' && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Detalle</p>
                          <p className="text-gray-700 mt-0.5">{a.detalle ?? '—'}</p>
                        </div>
                      )}

                      <div>

                        <p className="text-xs text-gray-400 uppercase tracking-wide">SGIO</p>

                        <p className="font-mono text-gray-800 mt-0.5">{a.sgio ?? '—'}</p>

                      </div>

                      {a.direccion && (

                        <div>

                          <p className="text-xs text-gray-400 uppercase tracking-wide">Dirección</p>

                          <p className="text-gray-700 mt-0.5">{a.direccion}</p>

                        </div>

                      )}

                      {a.capatazNombre && a.tipo !== 'OBSERVADA' && (

                        <div>

                          <p className="text-xs text-gray-400 uppercase tracking-wide">Capataz</p>

                          <p className="text-gray-700 mt-0.5">{a.capatazNombre}</p>

                        </div>

                      )}

                      {a.estadoOt && (

                        <div>

                          <p className="text-xs text-gray-400 uppercase tracking-wide">Estado OT</p>

                          <p className="text-gray-700 mt-0.5">{a.estadoOt}</p>

                        </div>

                      )}

                      {a.timestamp && (

                        <div>

                          <p className="text-xs text-gray-400 uppercase tracking-wide">Generada</p>

                          <p className="text-gray-700 mt-0.5">{a.timestamp}</p>

                        </div>

                      )}

                    </div>



                    <div className="flex flex-wrap gap-2 mt-4">

                      {a.tipo === 'SIN_ASIGNAR' && rol === 'admin' && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          La asignación de capataces la realiza el supervisor en «Asignar cuadrillas».
                        </p>
                      )}

                      {ruta && (
                        <button
                          type="button"
                          onClick={e => irAccion(a, e)}
                          className="flex items-center gap-1.5 text-xs bg-[#1B4F72] hover:bg-[#154360] text-white px-3 py-2 rounded-lg"
                        >
                          <ExternalLink size={12} />
                          {a.tipo === 'OBSERVADA' ? 'Ir a registrar actividad' : (a.accionLabel ?? 'Ir a corregir')}
                        </button>
                      )}

                      {a.id != null && puedeMarcarResuelta(a.tipo, rol) && (
                        <button
                          type="button"
                          onClick={e => marcarResuelta(a.id!, e)}
                          disabled={resolviendo === a.id}
                          title="Confirma que revisó el caso. La OT sigue observada hasta que el capataz la complete."
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                        >

                          {resolviendo === a.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}

                          Marcar como revisada

                        </button>

                      )}

                    </div>

                  </div>

                )}

              </div>

            )

          })}

        </div>

      )}

    </div>

  )

}


