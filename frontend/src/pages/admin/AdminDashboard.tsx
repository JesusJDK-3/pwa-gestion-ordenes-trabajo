import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import * as XLSX from 'xlsx'
import { ordenService, reporteService, capatazService, usuarioService } from '../../services/api'
import type { OrdenTrabajo, EstadoOt, User } from '../../types'
import PageRefreshButton from '../../components/PageRefreshButton'
import {
  Activity, ClipboardList, Users, Briefcase, CheckCircle2, Eye, Download, ChevronLeft, ChevronRight, UserPlus,
} from 'lucide-react'
import { unwrapList } from '../../utils/apiParse'

type Tab = 'actividades' | 'auditoria' | 'capataces' | 'supervisores'

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'actividades', label: 'Todas las OTs', icon: Activity },
  { id: 'capataces',   label: 'Capataces',     icon: Users },
  { id: 'supervisores', label: 'Supervisores', icon: UserPlus },
  { id: 'auditoria',   label: 'Auditoría',     icon: ClipboardList },
]

interface AuditoriaStats {
  totalOrdenes: number
  totalCapataces: number
  totalUsuarios: number
  completadas: number
  pendientes: number
  enProgreso: number
  observadas: number
  anuladas: number
  tasaCompletado: number
}

function statusClass(estado?: EstadoOt | string) {
  switch (estado) {
    case 'COMPLETADA':  return 'status-pill status-completada'
    case 'EN_PROGRESO': return 'status-pill status-progreso'
    case 'OBSERVADA':   return 'status-pill status-observada'
    case 'ANULADA':     return 'status-pill status-anulada'
    default:            return 'status-pill status-pendiente'
  }
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('actividades')
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [stats, setStats] = useState<AuditoriaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const cargar = useCallback((esRefresh = false) => {
    if (esRefresh) setRefreshing(true)
    else setLoading(true)
    Promise.all([ordenService.listar(), reporteService.auditoria()])
      .then(([oRes, aRes]) => {
        const oData = oRes.data as { data?: OrdenTrabajo[] } | OrdenTrabajo[]
        setOrdenes(Array.isArray(oData) ? oData : (oData?.data ?? []))
        const aData = aRes.data as { data?: AuditoriaStats } | AuditoriaStats
        setStats((aData as { data?: AuditoriaStats })?.data ?? (aData as AuditoriaStats))
      })
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => { cargar() }, [cargar])

  if (loading && ordenes.length === 0) return <PageSkeleton />

  const completadas = ordenes.filter(o => o.estadoCodigo === 'COMPLETADA').length
  const activas = ordenes.filter(o => !['COMPLETADA', 'ANULADA'].includes(o.estadoCodigo ?? '')).length
  const observadas = ordenes.filter(o => o.estadoCodigo === 'OBSERVADA').length

  const kpis = [
    { label: 'Registro total', value: ordenes.length, icon: Briefcase, iconBg: 'bg-slate-50 border-slate-200 text-slate-600', accent: 'border-l-slate-500' },
    { label: 'OTs en operación', value: activas, icon: Activity, iconBg: 'bg-sky-50 border-sky-200 text-sky-700', accent: 'border-l-sky-600' },
    { label: 'Ejecutadas', value: completadas, icon: CheckCircle2, iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', accent: 'border-l-emerald-600' },
    { label: 'Observadas', value: observadas, icon: Eye, iconBg: 'bg-amber-50 border-amber-200 text-amber-700', accent: 'border-l-amber-500' },
  ]

  const auditKpis = stats ? [
    { label: 'Total órdenes', value: stats.totalOrdenes, icon: Briefcase, iconBg: 'bg-sky-50 border-sky-200 text-sky-700', accent: 'border-l-sky-600' },
    { label: 'Capataces', value: stats.totalCapataces, icon: Users, iconBg: 'bg-amber-50 border-amber-200 text-amber-700', accent: 'border-l-amber-500' },
    { label: 'Usuarios sistema', value: stats.totalUsuarios, icon: CheckCircle2, iconBg: 'bg-violet-50 border-violet-200 text-violet-700', accent: 'border-l-violet-600' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0 mb-0">
        <div>
          <p className="page-breadcrumb">Panel ejecutivo · Administrador</p>
          <h1 className="page-title">Consola administrativa</h1>
          <p className="page-subtitle">
            Consulta global de OTs, registro de capataces de campo, base geográfica y alertas ·{' '}
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <PageRefreshButton onClick={() => cargar(true)} loading={refreshing} />
      </div>

      <div className="corp-card inline-flex overflow-hidden p-0">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-r border-slate-200 last:border-r-0 ${
                tab === t.id
                  ? 'bg-[#1B4F72] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

          {tab === 'actividades' && (
        <div className="space-y-5">
          <div className="kpi-grid">
            {kpis.map(k => {
              const Icon = k.icon
              return (
                <div key={k.label} className={`kpi-tile border-l-4 ${k.accent}`}>
                  <div className={`kpi-icon-box ${k.iconBg}`}>
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="kpi-value">{k.value}</p>
                    <p className="kpi-label">{k.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <OTsTable ordenes={ordenes} />
        </div>
      )}

      {tab === 'capataces' && <CapatacesPanel />}

      {tab === 'supervisores' && <SupervisoresPanel />}

      {tab === 'auditoria' && stats && (
        <div className="space-y-5">
          <div className="kpi-grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3">
            {auditKpis.map(k => {
              const Icon = k.icon
              return (
                <div key={k.label} className={`kpi-tile border-l-4 ${k.accent}`}>
                  <div className={`kpi-icon-box ${k.iconBg}`}>
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="kpi-value">{k.value}</p>
                    <p className="kpi-label">{k.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="corp-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Distribución de OTs</h3>
              <span className="text-xs text-slate-500">
                Tasa de completado: <strong className="text-emerald-700">{stats.tasaCompletado}%</strong>
              </span>
            </div>
            <div className="space-y-2.5">
              {([
                { cod: 'PENDIENTE', cnt: stats.pendientes, color: 'bg-slate-400' },
                { cod: 'EN_PROGRESO', cnt: stats.enProgreso, color: 'bg-amber-400' },
                { cod: 'OBSERVADA', cnt: stats.observadas, color: 'bg-yellow-400' },
                { cod: 'COMPLETADA', cnt: stats.completadas, color: 'bg-emerald-500' },
                { cod: 'ANULADA', cnt: stats.anuladas, color: 'bg-red-400' },
              ]).map(({ cod, cnt, color }) => {
                const pct = stats.totalOrdenes > 0 ? Math.round((cnt / stats.totalOrdenes) * 100) : 0
                return (
                  <div key={cod} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 flex-shrink-0 font-medium">{cod}</span>
                    <div className="flex-1 bg-slate-100 h-2">
                      <div className={`h-2 ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-8 text-right tabular-nums">{cnt}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <AuditoriaTimeline />
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

interface CapatazRegistro {
  id: number
  nombre: string
  email: string
  username: string
  dni: string
  codigoCapataz: string
}

function SupervisoresPanel() {
  const [lista, setLista] = useState<SupervisorRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    username: '',
    password: '',
  })

  const cargar = useCallback(() => {
    setLoading(true)
    usuarioService.listar()
      .then(r => {
        const items = unwrapList<User>(r.data)
          .filter(u => u.rol === 'supervisor')
          .map(u => ({
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            username: u.username ?? '',
          }))
        setLista(items)
      })
      .catch(() => setError('No se pudo cargar la lista de supervisores.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setExito('')
    try {
      await usuarioService.registrarSupervisor(form)
      setExito(`Supervisor ${form.nombres} ${form.apellidos} registrado correctamente.`)
      setForm({ nombres: '', apellidos: '', email: '', username: '', password: '' })
      cargar()
    } catch (err: unknown) {
      const txt = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo registrar el supervisor.'
      setError(txt)
    } finally {
      setSaving(false)
    }
  }

  const handleInactivar = async (id: number) => {
    setError('')
    setExito('')
    try {
      await usuarioService.inactivar(id)
      setExito('Supervisor inactivado correctamente.')
      cargar()
    } catch (err: unknown) {
      const txt = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo inactivar al supervisor.'
      setError(txt)
    }
  }

  const inputClass = 'corp-input text-sm py-2 w-full'

  return (
    <div className="space-y-5">
      <div className="corp-card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="kpi-icon-box bg-violet-50 border-violet-200 text-violet-700">
            <UserPlus size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Registrar supervisor</h3>
            <p className="text-sm text-slate-500 mt-1">
              Crea el usuario de acceso con rol supervisor. El supervisor podrá cargar OTs, asignar cuadrillas y ver reportes.
            </p>
          </div>
        </div>

        {error && <div className="alert-banner alert-error text-sm mb-4" role="alert">{error}</div>}
        {exito && <div className="alert-banner alert-success text-sm mb-4" role="status">{exito}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sup-nombres" className="corp-label">Nombres</label>
            <input id="sup-nombres" required maxLength={100} value={form.nombres}
              onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sup-apellidos" className="corp-label">Apellidos</label>
            <input id="sup-apellidos" required maxLength={100} value={form.apellidos}
              onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sup-email" className="corp-label">Email (login)</label>
            <input id="sup-email" type="email" required maxLength={150} value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sup-username" className="corp-label">Usuario</label>
            <input id="sup-username" required maxLength={60} value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sup-password" className="corp-label">Contraseña inicial</label>
            <input id="sup-password" type="password" required minLength={8} maxLength={100} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass}
              autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary min-h-11 px-5">
              {saving ? 'Registrando…' : 'Registrar supervisor'}
            </button>
          </div>
        </form>
      </div>

      <div className="corp-card overflow-hidden">
        <div className="corp-card-header">
          <span>Supervisores activos</span>
          <span className="badge-count">{lista.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                {['Nombre', 'Email', 'Usuario', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">Cargando…</td></tr>
              ) : lista.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">No hay supervisores registrados.</td></tr>
              ) : lista.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.nombre}</td>
                  <td>{s.email}</td>
                  <td>{s.username}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn-secondary text-xs py-1 px-2"
                      onClick={() => handleInactivar(s.id)}
                    >
                      Inactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface SupervisorRegistro {
  id: number
  nombre: string
  email: string
  username: string
}

function CapatacesPanel() {
  const [lista, setLista] = useState<CapatazRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    username: '',
    password: '',
  })

  const cargar = useCallback(() => {
    setLoading(true)
    capatazService.listar()
      .then(r => setLista(unwrapList<CapatazRegistro>(r.data)))
      .catch(() => setError('No se pudo cargar la lista de capataces.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setExito('')
    try {
      await capatazService.registrar(form)
      setExito(`Capataz ${form.nombres} ${form.apellidos} registrado. El supervisor ya puede asignarlo en «Asignar cuadrillas».`)
      setForm({ nombres: '', apellidos: '', dni: '', email: '', username: '', password: '' })
      cargar()
    } catch (err: unknown) {
      const txt = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo registrar el capataz.'
      setError(txt)
    } finally {
      setSaving(false)
    }
  }

  const handleInactivar = async (id: number) => {
    setError('')
    setExito('')
    try {
      await capatazService.inactivar(id)
      setExito('Capataz inactivado correctamente.')
      cargar()
    } catch (err: unknown) {
      const txt = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo inactivar al capataz.'
      setError(txt)
    }
  }

  const inputClass = 'corp-input text-sm py-2 w-full'

  return (
    <div className="space-y-5">
      <div className="corp-card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="kpi-icon-box bg-sky-50 border-sky-200 text-sky-700">
            <UserPlus size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Registrar capataz de campo</h3>
            <p className="text-sm text-slate-500 mt-1">
              Crea el usuario de acceso y el registro RRHH. El supervisor no da de alta capataces: solo los asigna a las OTs del día.
            </p>
          </div>
        </div>

        {error && <div className="alert-banner alert-error text-sm mb-4" role="alert">{error}</div>}
        {exito && <div className="alert-banner alert-success text-sm mb-4" role="status">{exito}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cap-nombres" className="corp-label">Nombres</label>
            <input id="cap-nombres" required maxLength={100} value={form.nombres}
              onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cap-apellidos" className="corp-label">Apellidos</label>
            <input id="cap-apellidos" required maxLength={100} value={form.apellidos}
              onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cap-dni" className="corp-label">DNI</label>
            <input id="cap-dni" required maxLength={8} pattern="[0-9]{8}" value={form.dni}
              onChange={e => setForm(f => ({ ...f, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
              className={inputClass} placeholder="8 dígitos" />
          </div>
          <div>
            <label htmlFor="cap-email" className="corp-label">Email (login)</label>
            <input id="cap-email" type="email" required maxLength={150} value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cap-username" className="corp-label">Usuario</label>
            <input id="cap-username" required maxLength={60} value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cap-password" className="corp-label">Contraseña inicial</label>
            <input id="cap-password" type="password" required minLength={8} maxLength={100} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass}
              autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary min-h-11 px-5">
              {saving ? 'Registrando…' : 'Registrar capataz'}
            </button>
          </div>
        </form>
      </div>

      <div className="corp-card overflow-hidden">
        <div className="corp-card-header">
          <span>Capataces activos</span>
          <span className="badge-count">{lista.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                {['Código', 'Nombre', 'DNI', 'Email', 'Usuario', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Cargando…</td></tr>
              ) : lista.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">No hay capataces registrados.</td></tr>
              ) : lista.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.codigoCapataz}</td>
                  <td className="font-medium">{c.nombre}</td>
                  <td className="tabular-nums">{c.dni}</td>
                  <td>{c.email}</td>
                  <td>{c.username}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn-secondary text-xs py-1 px-2"
                      onClick={() => handleInactivar(c.id)}
                    >
                      Inactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function OTsTable({ ordenes }: { ordenes: OrdenTrabajo[] }) {
  const [filtroCapataz, setFiltroCapataz] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDistrito, setFiltroDistrito] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [pagina, setPagina] = useState(1)

  const capataces = useMemo(() => [...new Set(ordenes.map(o => o.capatazNombre).filter(Boolean))].sort(), [ordenes])
  const distritos = useMemo(() => [...new Set(ordenes.map(o => o.distrito).filter(Boolean))].sort(), [ordenes])

  const filtradas = useMemo(() => ordenes.filter(o => {
    if (filtroCapataz && o.capatazNombre !== filtroCapataz) return false
    if (filtroEstado && o.estadoCodigo !== filtroEstado) return false
    if (filtroDistrito && o.distrito !== filtroDistrito) return false
    if (filtroFecha) {
      const f = o.fechaProgramada ?? o.createdAt?.slice(0, 10) ?? ''
      if (!f.startsWith(filtroFecha)) return false
    }
    return true
  }), [ordenes, filtroCapataz, filtroEstado, filtroDistrito, filtroFecha])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginadas = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const inputClass = 'corp-input text-xs py-1.5 max-w-[180px]'

  return (
    <div className="corp-card overflow-hidden">
      <div className="corp-card-header flex-col items-stretch gap-3 !py-4">
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            <ClipboardList size={14} />
            Registro de órdenes de trabajo
          </span>
          <span className="badge-count">{filtradas.length} registros</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filtroCapataz} onChange={e => { setFiltroCapataz(e.target.value); setPagina(1) }} className={inputClass}>
            <option value="">Capataz: todos</option>
            {capataces.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1) }} className={inputClass}>
            <option value="">Estado: todos</option>
            {['PENDIENTE','EN_PROGRESO','OBSERVADA','COMPLETADA','ANULADA'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroDistrito} onChange={e => { setFiltroDistrito(e.target.value); setPagina(1) }} className={inputClass}>
            <option value="">Distrito: todos</option>
            {distritos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="date" value={filtroFecha} onChange={e => { setFiltroFecha(e.target.value); setPagina(1) }} className={inputClass} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="enterprise-table">
          <thead>
            <tr>
              {['Código SGIO', 'Capataz', 'Punto', 'Subactividad', 'Estado', 'Fecha prog.'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Sin resultados.</td>
              </tr>
            ) : paginadas.map(o => (
              <tr key={o.idOt}>
                <td className="font-mono font-bold text-[#1B4F72] text-xs">{o.sgio}</td>
                <td className="text-slate-600">{o.capatazNombre ?? '—'}</td>
                <td className="max-w-[140px] truncate text-slate-500">{o.direccion ?? '—'}</td>
                <td className="max-w-xs truncate">{o.subactividad ?? '—'}</td>
                <td>
                  <span className={statusClass(o.estadoCodigo)}>
                    {o.estado ?? o.estadoCodigo}
                  </span>
                </td>
                <td className="text-slate-500 tabular-nums text-xs">
                  {o.fechaProgramada ?? o.createdAt?.slice(0, 10) ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Página {pagina} de {totalPaginas}</span>
          <div className="flex gap-2">
            <button disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} className="btn-outline text-xs py-1 px-2 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <button disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="btn-outline text-xs py-1 px-2 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface EventoAuditoria {
  fecha: string
  sgio: string
  evento: string
  estadoAnterior?: string
  estadoNuevo?: string
  usuario: string
  origen: string
}

function AuditoriaTimeline() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(()=> {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    reporteService.eventosAuditoria(params)
      .then(r => {
        const d = r.data as { data?: EventoAuditoria[] } | EventoAuditoria[]
        setEventos(Array.isArray(d) ? d : (d?.data ?? []))
      })
      .finally(() => setLoading(false))
  }, [filtroTipo, desde, hasta])

  useEffect(() => {cargar()}, [cargar])

  const exportar = () => {
    if (!eventos.length) return
    const ws = XLSX.utils.json_to_sheet(eventos.map(e => ({
      Fecha: e.fecha?.slice(0, 19).replace('T', ' '),
      OT: e.sgio,
      Evento: e.evento,
      'Estado anterior': e.estadoAnterior ?? '',
      'Estado nuevo': e.estadoNuevo ?? '',
      Usuario: e.usuario,
      Origen: e.origen,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría')
    XLSX.writeFile(wb, 'auditoria-eventos.xlsx')
  }

  const inputClass = 'corp-input text-xs py-1.5'

  return (
    <div className="corp-card overflow-hidden">
      <div className="corp-card-header flex-wrap gap-2 !py-3">
        <span>Timeline de eventos</span>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={inputClass}>
            <option value="">Tipo: todos</option>
            {['CAMBIO_ESTADO','ASIGNACION','SINCRONIZACION'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={inputClass} />
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={inputClass} />
          <button onClick={cargar} className="btn-outline text-xs py-1.5">Filtrar</button>
          <button onClick={exportar} disabled={!eventos.length} className="btn-primary text-xs py-1.5 disabled:opacity-50">
            <Download size={12} /> Exportar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className="enterprise-table">
          <thead>
            <tr>
              {['Fecha','OT','Evento','Est. anterior','Est. nuevo','Usuario','Origen'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">Cargando…</td></tr>
            ) : eventos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">Sin eventos registrados aún.</td></tr>
            ) : eventos.map((e, i) => (
              <tr key={i} className="text-xs">
                <td className="text-slate-500">{e.fecha?.slice(0, 16).replace('T', ' ')}</td>
                <td className="font-mono font-bold text-[#1B4F72]">{e.sgio}</td>
                <td>{e.evento}</td>
                <td>{e.estadoAnterior ?? '—'}</td>
                <td>{e.estadoNuevo ?? '—'}</td>
                <td>{e.usuario}</td>
                <td>{e.origen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-72 bg-slate-200" />
      <div className="h-10 w-64 bg-slate-200" />
      <div className="grid grid-cols-4 gap-px bg-slate-200 border border-slate-200">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white" />)}
      </div>
      <div className="h-80 bg-slate-200" />
    </div>
  )
}
