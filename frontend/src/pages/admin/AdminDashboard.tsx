import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { ordenService, reporteService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'
import {
  Activity, BarChart2, ClipboardList, Download,
  Loader2, Users, Briefcase, CheckCircle2, RefreshCw,
  Calendar, AlertTriangle, Eye,
} from 'lucide-react'

type Tab = 'actividades' | 'diario' | 'mensual' | 'auditoria'

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'actividades', label: 'Órdenes',       icon: Activity      },
  { id: 'diario',      label: 'Reporte diario', icon: BarChart2     },
  { id: 'mensual',     label: 'Mensual',        icon: Calendar      },
  { id: 'auditoria',   label: 'Auditoría',      icon: ClipboardList },
]

interface AuditoriaStats {
  totalOrdenes:  number
  totalCapataces: number
  totalUsuarios: number
  completadas:   number
  pendientes:    number
  enProgreso:    number
  observadas:    number
  anuladas:      number
  tasaCompletado: number
}

interface DiarioItem { sgio: string; estado: string; direccion: string; capataz: string; observacion: string; updatedAt: string }
interface DiarioData  { fecha: string; totalActivos: number; completadas: number; observadas: number; enProgreso: number; detalle: DiarioItem[] }
interface MensualData { mes: number; anio: number; periodo: string; completadas: number; creadas: number; pendientes: number; porCapataz: Record<string, number> }

export default function AdminDashboard() {
  const [tab,     setTab]    = useState<Tab>('actividades')
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [stats,   setStats]  = useState<AuditoriaStats | null>(null)
  const [diario,  setDiario] = useState<DiarioData | null>(null)
  const [mensual, setMensual] = useState<MensualData | null>(null)
  const [fechaDia,  setFechaDia]  = useState(new Date().toISOString().slice(0, 10))
  const [mesSel,    setMesSel]    = useState(new Date().getMonth() + 1)
  const [anioSel,   setAnioSel]   = useState(new Date().getFullYear())
  const [loading,   setLoading]   = useState(true)
  const [loadingTab, setLoadingTab] = useState(false)

  useEffect(() => {
    Promise.all([ordenService.listar(), reporteService.auditoria()])
      .then(([oRes, aRes]) => {
        const oData = oRes.data as any
        setOrdenes(Array.isArray(oData) ? oData : (oData?.data ?? []))
        const aData = aRes.data as any
        setStats((aData?.data ?? aData) as AuditoriaStats)
      }).finally(() => setLoading(false))
  }, [])

  const fetchDiario = (fecha = fechaDia) => {
    setLoadingTab(true)
    reporteService.diario(fecha)
      .then(r => { const d = r.data as any; setDiario(d?.data ?? d) })
      .finally(() => setLoadingTab(false))
  }

  const fetchMensual = (m = mesSel, a = anioSel) => {
    setLoadingTab(true)
    reporteService.mensual(m, a)
      .then(r => { const d = r.data as any; setMensual(d?.data ?? d) })
      .finally(() => setLoadingTab(false))
  }

  useEffect(() => {
    if (tab === 'diario'  && !diario)  fetchDiario()
    if (tab === 'mensual' && !mensual) fetchMensual()
  }, [tab])

  const exportarExcel = () => {
    if (!diario?.detalle?.length) return
    const ws = XLSX.utils.json_to_sheet(diario.detalle.map(d => ({
      'SGIO':           d.sgio,
      'Estado':         d.estado,
      'Dirección':      d.direccion,
      'Capataz':        d.capataz,
      'Subactividad':   (d as any).subactividad ?? '',
      'Observaciones':  d.observacion,
      'Actualizado':    d.updatedAt ? d.updatedAt.slice(0, 19).replace('T', ' ') : '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Diario')
    XLSX.writeFile(wb, `reporte-diario-${diario.fecha}.xlsx`)
  }

  const exportarMensualExcel = () => {
    if (!mensual) return
    const resumen = [
      { Concepto: 'Período', Valor: mensual.periodo },
      { Concepto: 'OTs creadas',    Valor: mensual.creadas },
      { Concepto: 'Completadas',    Valor: mensual.completadas },
      { Concepto: 'Pendientes',     Valor: mensual.pendientes },
    ]
    const porCap = Object.entries(mensual.porCapataz).map(([cap, cnt]) => ({
      Capataz: cap, 'OTs completadas': cnt
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porCap),  'Por Capataz')
    XLSX.writeFile(wb, `reporte-mensual-${mensual.anio}-${String(mensual.mes).padStart(2,'0')}.xlsx`)
  }

  if (loading) return <PageSkeleton />

  const completadas = ordenes.filter(o => o.estadoCodigo === 'COMPLETADA').length
  const activas     = ordenes.filter(o => !['COMPLETADA','ANULADA'].includes(o.estadoCodigo ?? '')).length
  const observadas  = ordenes.filter(o => o.estadoCodigo === 'OBSERVADA').length

  const inputClass = 'border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111]'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión de registros, reportes y auditoría</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 w-fit shadow-card border border-gray-100 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-[#CC1111] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <Icon size={14} />{t.label}
            </button>
          )
        })}
      </div>

      {/* ── Actividades ─────────────────────────────────────────────── */}
      {tab === 'actividades' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Total OTs"   value={ordenes.length} color="text-gray-700"    bg="bg-gray-50"    icon={<Briefcase   size={16} className="text-gray-400"    />} />
            <KpiCard label="Activas"     value={activas}        color="text-blue-700"    bg="bg-blue-50"    icon={<Activity    size={16} className="text-blue-500"    />} />
            <KpiCard label="Completadas" value={completadas}    color="text-emerald-700" bg="bg-emerald-50" icon={<CheckCircle2 size={16} className="text-emerald-500"/>} />
            <KpiCard label="Observadas"  value={observadas}     color="text-yellow-700"  bg="bg-yellow-50"  icon={<Eye         size={16} className="text-yellow-500"  />} />
          </div>
          <OTsTable ordenes={ordenes} />
        </div>
      )}

      {/* ── Reporte diario ───────────────────────────────────────────── */}
      {tab === 'diario' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={fechaDia}
              onChange={e => setFechaDia(e.target.value)}
              className={inputClass} />
            <button onClick={() => fetchDiario(fechaDia)} disabled={loadingTab}
              className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white px-3 py-2 rounded-xl hover:border-gray-300 transition-all disabled:opacity-50">
              {loadingTab ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Consultar
            </button>
            <button onClick={exportarExcel} disabled={!diario?.detalle?.length}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors ml-auto">
              <Download size={14} />
              Exportar Excel (.xlsx)
            </button>
          </div>

          {diario && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Con actividad"   value={diario.totalActivos}  color="text-gray-700"    bg="bg-gray-50"    icon={<Activity    size={16} className="text-gray-400" />} />
              <KpiCard label="Completadas hoy" value={diario.completadas}   color="text-emerald-700" bg="bg-emerald-50" icon={<CheckCircle2 size={16} className="text-emerald-500"/>} />
              <KpiCard label="En progreso"     value={diario.enProgreso}    color="text-orange-700"  bg="bg-orange-50"  icon={<BarChart2   size={16} className="text-orange-500"/>} />
              <KpiCard label="Observadas"      value={diario.observadas}    color="text-yellow-700"  bg="bg-yellow-50"  icon={<AlertTriangle size={16} className="text-yellow-500"/>} />
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                Actividad del {fechaDia}
                {diario && <span className="text-gray-400 font-normal text-sm ml-2">({diario.detalle?.length ?? 0} registros)</span>}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    {['SGIO','Estado','Dirección','Capataz','Observación'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingTab ? (
                    <tr><td colSpan={5} className="py-12 text-center"><Loader2 size={20} className="animate-spin mx-auto text-[#CC1111]" /></td></tr>
                  ) : !diario?.detalle?.length ? (
                    <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">Sin actividad en esta fecha.</td></tr>
                  ) : diario.detalle.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#CC1111] text-[13px]">{d.sgio}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          d.estado==='COMPLETADA'?'bg-emerald-100 text-emerald-700':
                          d.estado==='EN_PROGRESO'?'bg-orange-100 text-orange-700':
                          d.estado==='OBSERVADA'?'bg-yellow-100 text-yellow-700':
                          'bg-gray-100 text-gray-600'}`}>{d.estado||'—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">{d.direccion||'—'}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-[13px]">{d.capataz||'—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate text-[12px]">{d.observacion||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Mensual (HU19) ──────────────────────────────────────────── */}
      {tab === 'mensual' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))} className={inputClass}>
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                .map((n, i) => <option key={i+1} value={i+1}>{n}</option>)}
            </select>
            <input type="number" value={anioSel} onChange={e => setAnioSel(Number(e.target.value))}
              min={2020} max={2030} className={`${inputClass} w-24`} />
            <button onClick={() => fetchMensual(mesSel, anioSel)} disabled={loadingTab}
              className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white px-3 py-2 rounded-xl hover:border-gray-300 transition-all disabled:opacity-50">
              {loadingTab ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Consultar
            </button>
            <button onClick={exportarMensualExcel} disabled={!mensual}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors ml-auto">
              <Download size={14} />
              Exportar Excel
            </button>
          </div>

          {loadingTab ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#CC1111]" /></div>
          ) : mensual ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="OTs creadas"    value={mensual.creadas}     color="text-gray-700"    bg="bg-gray-50"    icon={<Briefcase   size={16} className="text-gray-400"    />} />
                <KpiCard label="Completadas"    value={mensual.completadas} color="text-emerald-700" bg="bg-emerald-50" icon={<CheckCircle2 size={16} className="text-emerald-500"/>} />
                <KpiCard label="Pendientes"     value={mensual.pendientes}  color="text-orange-700"  bg="bg-orange-50"  icon={<Activity    size={16} className="text-orange-500"  />} />
                <KpiCard label="Tasa completado"
                  value={mensual.creadas > 0 ? Math.round((mensual.completadas/mensual.creadas)*100) : 0}
                  color="text-blue-700" bg="bg-blue-50" icon={<BarChart2 size={16} className="text-blue-500" />} />
              </div>

              {Object.keys(mensual.porCapataz).length > 0 && (
                <div className="bg-white rounded-2xl shadow-card p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Completadas por Capataz</h3>
                  <div className="space-y-3">
                    {Object.entries(mensual.porCapataz)
                      .sort(([,a],[,b]) => b - a)
                      .map(([cap, cnt]) => {
                        const max = Math.max(...Object.values(mensual.porCapataz))
                        const pct = max > 0 ? Math.round((cnt/max)*100) : 0
                        return (
                          <div key={cap} className="flex items-center gap-3">
                            <span className="text-sm text-gray-700 w-40 truncate flex-shrink-0">{cap}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                              <div className="h-2.5 rounded-full bg-[#CC1111]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold text-gray-800 w-6 text-right flex-shrink-0">{cnt}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
              Selecciona mes y año para ver el reporte mensual.
            </div>
          )}
        </div>
      )}

      {/* ── Auditoría ────────────────────────────────────────────────── */}
      {tab === 'auditoria' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total órdenes"      value={stats.totalOrdenes}   icon={<Briefcase   size={22} className="text-blue-500"   />} bg="bg-blue-50"   val="text-blue-700" />
            <StatCard label="Capataces"          value={stats.totalCapataces} icon={<Users       size={22} className="text-orange-500" />} bg="bg-orange-50" val="text-orange-700" />
            <StatCard label="Usuarios del sistema" value={stats.totalUsuarios} icon={<CheckCircle2 size={22} className="text-purple-500"/>} bg="bg-purple-50" val="text-purple-700" />
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Distribución de OTs</h3>
              <span className="text-xs text-gray-400">Tasa de completado: <strong className="text-emerald-600">{stats.tasaCompletado}%</strong></span>
            </div>
            <div className="space-y-2.5">
              {([
                { cod: 'PENDIENTE',   cnt: stats.pendientes,  color: 'bg-gray-400' },
                { cod: 'EN_PROGRESO', cnt: stats.enProgreso,  color: 'bg-orange-400' },
                { cod: 'OBSERVADA',   cnt: stats.observadas,  color: 'bg-yellow-400' },
                { cod: 'COMPLETADA',  cnt: stats.completadas, color: 'bg-emerald-500' },
                { cod: 'ANULADA',     cnt: stats.anuladas,    color: 'bg-red-400' },
              ]).map(({ cod, cnt, color }) => {
                const pct = stats.totalOrdenes > 0 ? Math.round((cnt/stats.totalOrdenes)*100) : 0
                return (
                  <div key={cod} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">{cod}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{cnt}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OTsTable({ ordenes }: { ordenes: OrdenTrabajo[] }) {
  const BADGE: Record<string, string> = {
    COMPLETADA: 'bg-emerald-100 text-emerald-700', EN_PROGRESO: 'bg-orange-100 text-orange-700',
    ANULADA: 'bg-red-100 text-red-700', OBSERVADA: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Órdenes de trabajo <span className="text-gray-400 font-normal text-sm">({ordenes.length})</span></h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              {['SGIO','Subactividad','Capataz','Estado','Fecha'].map(h => (
                <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ordenes.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Sin órdenes registradas.</td></tr>
            ) : ordenes.map(o => (
              <tr key={o.idOt} className="hover:bg-gray-50/60">
                <td className="px-5 py-3.5 font-mono font-semibold text-[#CC1111] text-[13px]">{o.sgio}</td>
                <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{o.subactividad ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-600 text-[13px]">{o.capatazNombre ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[o.estadoCodigo ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                    {o.estado ?? o.estadoCodigo}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-[13px]">{o.fechaProgramada ?? o.createdAt?.slice(0,10) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <div className={`${bg} rounded-2xl p-4 shadow-card`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatCard({ label, value, icon, bg, val }: { label: string; value: number; icon: React.ReactNode; bg: string; val: string }) {
  return (
    <div className={`${bg} rounded-2xl p-6 shadow-card`}>
      <div className="mb-3">{icon}</div>
      <p className={`text-4xl font-bold ${val}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-gray-200 rounded-lg" />
      <div className="h-12 w-64 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}</div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )
}
