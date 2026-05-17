import { useEffect, useState } from 'react'
import { ordenService, reporteService } from '../../services/api'
import type { OrdenTrabajo } from '../../types'
import { Activity, BarChart2, ClipboardList, Download, Loader2, Users, Briefcase, CheckCircle2, RefreshCw } from 'lucide-react'

type Tab = 'actividades' | 'reportes' | 'auditoria'

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'actividades', label: 'Órdenes',   icon: Activity },
  { id: 'reportes',    label: 'Reporte diario', icon: BarChart2 },
  { id: 'auditoria',   label: 'Auditoría', icon: ClipboardList },
]

interface AuditoriaStats {
  totalOrdenes:  number
  totalCapataces: number
  totalUsuarios: number
}

interface ReporteDiario {
  sgio:     string
  estado:   string
  direccion: string
}

export default function AdminDashboard() {
  const [tab,      setTab]     = useState<Tab>('actividades')
  const [ordenes,  setOrdenes] = useState<OrdenTrabajo[]>([])
  const [stats,    setStats]   = useState<AuditoriaStats | null>(null)
  const [diario,   setDiario]  = useState<ReporteDiario[]>([])
  const [loading,  setLoading] = useState(true)
  const [loadingDiario, setLoadingDiario] = useState(false)

  useEffect(() => {
    Promise.all([
      ordenService.listar(),
      reporteService.auditoria(),
    ]).then(([oRes, aRes]) => {
      const oData = oRes.data as any
      setOrdenes(Array.isArray(oData) ? oData : (oData?.data ?? []))
      const aData = aRes.data as any
      const statsData = aData?.data ?? aData
      setStats(statsData ?? { totalOrdenes: 0, totalCapataces: 0, totalUsuarios: 0 })
    }).finally(() => setLoading(false))
  }, [])

  const fetchDiario = () => {
    setLoadingDiario(true)
    reporteService.diario(new Date().toISOString().slice(0, 10))
      .then(r => {
        const d = r.data as any
        setDiario(Array.isArray(d) ? d : (d?.data ?? []))
      })
      .finally(() => setLoadingDiario(false))
  }

  useEffect(() => {
    if (tab === 'reportes') fetchDiario()
  }, [tab])

  if (loading) return <PageSkeleton />

  const completadas = ordenes.filter(o => o.estadoCodigo === 'COMPLETADA').length
  const activas     = ordenes.filter(o => !['COMPLETADA', 'ANULADA'].includes(o.estadoCodigo ?? '')).length

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión de registros, reportes y auditoría del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 w-fit shadow-card border border-gray-100">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-[#CC1111] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Actividades / Órdenes ───────────────────────────────── */}
      {tab === 'actividades' && (
        <div className="space-y-4">
          {/* KPI mini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Total OTs"    value={ordenes.length}  color="text-gray-700"    bg="bg-gray-50"    icon={<Briefcase  size={16} className="text-gray-400" />} />
            <KpiCard label="Activas"      value={activas}         color="text-blue-700"    bg="bg-blue-50"    icon={<Activity   size={16} className="text-blue-500" />} />
            <KpiCard label="Completadas"  value={completadas}     color="text-emerald-700" bg="bg-emerald-50" icon={<CheckCircle2 size={16} className="text-emerald-500" />} />
            <KpiCard label="Usuarios"     value={stats?.totalUsuarios ?? 0} color="text-purple-700" bg="bg-purple-50" icon={<Users size={16} className="text-purple-500" />} />
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                Órdenes de trabajo{' '}
                <span className="text-gray-400 font-normal text-sm">({ordenes.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    {['SGIO', 'Subactividad', 'Capataz', 'Estado', 'Fecha'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ordenes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                        Sin órdenes registradas.
                      </td>
                    </tr>
                  ) : ordenes.map(o => (
                    <tr key={o.idOt} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#CC1111] text-[13px]">{o.sgio}</td>
                      <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{o.subactividad ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-[13px]">{o.capatazNombre ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          o.estadoCodigo === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700'
                          : o.estadoCodigo === 'EN_PROGRESO' ? 'bg-orange-100 text-orange-700'
                          : o.estadoCodigo === 'ANULADA'    ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>{o.estado ?? o.estadoCodigo}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-[13px]">
                        {o.fechaProgramada ?? o.createdAt?.slice(0, 10) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Reporte diario ──────────────────────────────────────── */}
      {tab === 'reportes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-800">Reporte del día</h2>
            <button
              onClick={fetchDiario}
              disabled={loadingDiario}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-3 py-1.5 bg-white transition-all disabled:opacity-50"
            >
              {loadingDiario
                ? <Loader2 size={12} className="animate-spin" />
                : <RefreshCw size={12} />}
              Actualizar
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    {['SGIO', 'Estado', 'Dirección'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingDiario ? (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  ) : diario.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">Sin actividad registrada hoy.</td></tr>
                  ) : diario.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#CC1111] text-[13px]">{d.sgio}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          d.estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700'
                          : d.estado === 'EN_PROGRESO' ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>{d.estado || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 truncate max-w-xs">{d.direccion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exportar */}
          <div className="bg-white rounded-2xl shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Exportar reporte</p>
              <p className="text-xs text-gray-400 mt-0.5">Descarga el reporte diario en formato CSV</p>
            </div>
            <button
              onClick={() => {
                if (diario.length === 0) return
                const csv = ['SGIO,Estado,Direccion', ...diario.map(d => `${d.sgio},${d.estado},${d.direccion}`)].join('\n')
                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                const a = document.createElement('a'); a.href = url
                a.download = `reporte-${new Date().toISOString().slice(0,10)}.csv`; a.click()
                URL.revokeObjectURL(url)
              }}
              disabled={diario.length === 0}
              className="flex items-center gap-2 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Download size={14} />
              Descargar CSV
            </button>
          </div>
        </div>
      )}

      {/* ── Auditoría ───────────────────────────────────────────── */}
      {tab === 'auditoria' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total órdenes de trabajo" value={stats.totalOrdenes}  icon={<Briefcase   size={22} className="text-blue-500" />}    bg="bg-blue-50"    val="text-blue-700" />
            <StatCard label="Capataces registrados"    value={stats.totalCapataces} icon={<Users       size={22} className="text-orange-500" />}  bg="bg-orange-50"  val="text-orange-700" />
            <StatCard label="Usuarios del sistema"     value={stats.totalUsuarios}  icon={<CheckCircle2 size={22} className="text-purple-500" />} bg="bg-purple-50"  val="text-purple-700" />
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Distribución por estado</h3>
            <div className="space-y-2.5">
              {(['PENDIENTE','EN_PROGRESO','OBSERVADA','COMPLETADA','ANULADA'] as const).map(estado => {
                const cnt = ordenes.filter(o => o.estadoCodigo === estado).length
                const pct = ordenes.length > 0 ? Math.round((cnt / ordenes.length) * 100) : 0
                const colors: Record<string, string> = {
                  PENDIENTE: 'bg-gray-400', EN_PROGRESO: 'bg-orange-400',
                  OBSERVADA: 'bg-yellow-400', COMPLETADA: 'bg-emerald-500', ANULADA: 'bg-red-400'
                }
                return (
                  <div key={estado} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">{estado}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${colors[estado]}`} style={{ width: `${pct}%` }} />
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
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )
}
