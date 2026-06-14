/**
 * Shell de navegación por rol: sidebar, header, badge offline y alertas.
 *
 * Menús definidos en NAV_BY_ROL según supervisor | capataz | admin.
 * No implementa autorización de seguridad (solo UX); el backend valida JWT.
 */
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import {
  Gauge, FileSpreadsheet, Crosshair, UserCog, LineChart,
  ClipboardList, MapPinned, HardHat, BookMarked, Building2,
  LogOut, Menu, Calendar, BarChart2, Upload, AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { alertaService } from '../services/api'
import OfflineBadge from './OfflineBadge'
import BannerOffline from './BannerOffline'
import type { Rol } from '../types'
import logoKabj from '../assets/logo-kabj-transparent.png'

interface NavItem { to: string; label: string; icon: LucideIcon; section?: string }

const NAV_BY_ROL: Record<Rol, NavItem[]> = {
  supervisor: [
    { to: '/supervisor',                  label: 'Centro de control',   icon: Gauge,           section: 'Operaciones' },
    { to: '/supervisor/cargar-ot',        label: 'Importar Excel OT',   icon: FileSpreadsheet },
    { to: '/supervisor/coordenadas',      label: 'Georreferencia',      icon: Crosshair },
    { to: '/supervisor/asignar',          label: 'Asignar cuadrillas',  icon: UserCog },
    { to: '/supervisor/mapa',             label: 'Mapa de monitoreo',   icon: MapPinned,       section: 'Seguimiento' },
    { to: '/supervisor/seguimiento',      label: 'Monitoreo en vivo',   icon: LineChart },
    { to: '/supervisor/alertas',          label: 'Alertas',             icon: AlertTriangle },
    { to: '/supervisor/resumen-diario',   label: 'Resumen diario',      icon: Calendar,        section: 'Reportes' },
    { to: '/supervisor/historial',        label: 'Historial',           icon: Calendar },
    { to: '/supervisor/resumen-mensual',  label: 'Resumen mensual',     icon: BarChart2 },
  ],
  capataz: [
    { to: '/capataz/mapa',         label: 'Mapa operativo',   icon: MapPinned,     section: 'Campo' },
    { to: '/capataz',              label: 'Mis asignaciones', icon: ClipboardList },
    { to: '/capataz/alertas',      label: 'Alertas',          icon: AlertTriangle },
    { to: '/historial',            label: 'Historial',        icon: Calendar },
    { to: '/capataz/ayudantes',    label: 'Apoyo en OT',      icon: HardHat },
    { to: '/dashboard',            label: 'Manuales técnicos', icon: BookMarked, section: 'Recursos' },
  ],
  admin: [
    { to: '/admin',              label: 'Consola administrativa', icon: Building2,      section: 'Sistema' },
    { to: '/admin/cargar-datos', label: 'Base VPA / Hidrantes',   icon: Upload },
    { to: '/admin/mapa',         label: 'Mapa de monitoreo',      icon: MapPinned,      section: 'Monitoreo' },
    { to: '/admin/alertas',      label: 'Alertas',                icon: AlertTriangle },
  ],
}

const ROL_BADGE: Record<Rol, { color: string; label: string; labelLight: string; pillLight: string; pillDark: string }> = {
  supervisor: {
    color: 'text-sky-300',
    label: 'Supervisor',
    labelLight: 'text-sky-700',
    pillLight: 'bg-sky-50 text-sky-700 border-sky-200',
    pillDark: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
  },
  capataz: {
    color: 'text-amber-300',
    label: 'Capataz de campo',
    labelLight: 'text-amber-800',
    pillLight: 'bg-amber-50 text-amber-800 border-amber-200',
    pillDark: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  },
  admin: {
    color: 'text-violet-300',
    label: 'Administrador',
    labelLight: 'text-violet-700',
    pillLight: 'bg-violet-50 text-violet-700 border-violet-200',
    pillDark: 'bg-violet-500/20 text-violet-200 border-violet-400/30',
  },
}

const PAGE_TITLES: Record<string, string> = {
  '/supervisor':                  'Centro de control',
  '/supervisor/cargar-ot':        'Importar Excel OT',
  '/supervisor/coordenadas':      'Georreferencia',
  '/supervisor/asignar':          'Asignación de cuadrillas',
  '/supervisor/seguimiento':      'Monitoreo en vivo',
  '/supervisor/mapa':             'Mapa de monitoreo',
  '/supervisor/alertas':          'Alertas',
  '/supervisor/resumen-diario':   'Resumen diario',
  '/supervisor/historial':         'Historial de OTs',
  '/supervisor/resumen-mensual':  'Resumen mensual',
  '/capataz':                     'Mis asignaciones',
  '/capataz/mapa':                'Mapa operativo',
  '/capataz/alertas':             'Alertas',
  '/historial':                   'Historial de OTs',
  '/capataz/ayudantes':           'Apoyo en OT',
  '/dashboard':                   'Manuales técnicos',
  '/admin':                       'Consola administrativa',
  '/admin/cargar-datos':          'Base geográfica',
  '/admin/mapa':                  'Mapa de monitoreo',
  '/admin/alertas':               'Alertas',
}

function getInitials(nombre = '') {
  return nombre.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

interface SidebarPanelProps {
  navItems: NavItem[]
  badge: (typeof ROL_BADGE)[Rol]
  userNombre?: string
  alertasPath: string
  alertasActivas: number
  onNavClick: () => void
  onLogout: () => void
}

function SidebarPanel({
  navItems,
  badge,
  userNombre,
  alertasPath,
  alertasActivas,
  onNavClick,
  onLogout,
}: SidebarPanelProps) {
  const navWithSections = navItems.reduce<Array<NavItem & { showSection: boolean }>>((acc, item) => {
    const prevSection = acc.length > 0 ? acc[acc.length - 1].section : undefined
    const showSection = Boolean(item.section && item.section !== prevSection)
    acc.push({ ...item, showSection })
    return acc
  }, [])

  return (
    <>
      <div className="sidebar-brand relative overflow-hidden border-b border-slate-200">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-[2px] opacity-[0.14]"
          style={{ backgroundImage: "url('/login-campo.jpg')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-white/94" />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#C0392B]" />
        <div className="relative px-5 py-5">
          <img
            src={logoKabj}
            alt="K.A.B.J."
            className="h-[68px] w-auto max-w-full object-contain object-left"
          />
          <div className="mt-3 pt-3 border-t border-slate-200/80">
            <p className="app-display text-[#1B4F72] text-[14px] font-semibold tracking-tight">
              Sistema OT
            </p>
            <span className={`inline-flex mt-2 px-2.5 py-1 rounded border app-eyebrow ${badge.pillLight}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto bg-[#FAFBFC]" aria-label="Navegación principal">
        {navWithSections.map(item => {
          const Icon = item.icon
          return (
            <div key={item.to}>
              {item.showSection && (
                <p className="app-eyebrow px-4 pt-4 pb-1 text-slate-400">
                  {item.section}
                </p>
              )}
              <NavLink
                to={item.to}
                end={item.to === '/supervisor' || item.to === '/capataz' || item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 px-2 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1B4F72] text-white border-l-[3px] border-l-[#C0392B] shadow-sm'
                      : 'text-slate-600 hover:text-[#1B4F72] hover:bg-white border-l-[3px] border-l-transparent'
                  }`
                }
                onClick={onNavClick}
              >
                {({ isActive }) => (
                  <>
                    <span className={`nav-icon-box ${isActive ? 'nav-icon-box-active' : ''}`}>
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.to === alertasPath && alertasActivas > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#C0392B] text-white text-[10px] font-bold">
                        {alertasActivas > 99 ? '99+' : alertasActivas}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded border flex items-center justify-center flex-shrink-0 ${badge.pillLight}`}>
            <span className="text-[10px] font-bold">{getInitials(userNombre)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 text-[12px] font-semibold truncate">{userNombre}</p>
            <p className={`text-[10px] font-medium app-eyebrow ${badge.labelLight}`}>{badge.label}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 text-slate-400 hover:text-[#C0392B] text-[12px] py-1.5 px-1"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [alertasActivas, setAlertasActivas] = useState(0)

  const rawRol   = user?.rol?.toLowerCase() as Rol | undefined
  const rol      = (rawRol && ROL_BADGE[rawRol] ? rawRol : 'capataz') as Rol
  const navItems = NAV_BY_ROL[rol] ?? []
  const badge    = ROL_BADGE[rol] ?? ROL_BADGE['capataz']
  const pageTitle = (() => {
    if (PAGE_TITLES[location.pathname]) return PAGE_TITLES[location.pathname]
    if (location.pathname.startsWith('/actividad/')) return 'Subactividades'
    if (location.pathname.startsWith('/ficha/')) return 'Ficha técnica'
    return 'Sistema OT'
  })()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const alertasPath = rol === 'admin' ? '/admin/alertas'
    : rol === 'supervisor' ? '/supervisor/alertas'
    : '/capataz/alertas'

  useEffect(() => {
    alertaService.contarActivas()
      .then(r => {
        const d = r.data as { data?: { activas?: number }; activas?: number }
        setAlertasActivas(d?.data?.activas ?? d?.activas ?? 0)
      })
      .catch(() => setAlertasActivas(0))
  }, [rol, location.pathname])

  useEffect(() => {
    document.title = `${pageTitle} — Sistema OT | K.A.B.J.`
  }, [pageTitle])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobile() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, closeMobile])

  return (
    <div className="app-shell flex h-screen bg-[#ECEFF1] overflow-hidden">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 hidden md:flex shadow-[2px_0_16px_rgba(10,22,40,0.04)]">
        <SidebarPanel
          navItems={navItems}
          badge={badge}
          userNombre={user?.nombre}
          alertasPath={alertasPath}
          alertasActivas={alertasActivas}
          onNavClick={closeMobile}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeMobile}
            aria-hidden
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-[9999] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <SidebarPanel
              navItems={navItems}
              badge={badge}
              userNombre={user?.nombre}
              alertasPath={alertasPath}
              alertasActivas={alertasActivas}
              onNavClick={closeMobile}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-12 bg-[#1B4F72] text-white flex items-center justify-between px-4 md:px-5 flex-shrink-0 relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C0392B]" />
          <div className="flex items-center gap-3 pl-2">
            <button
              className="md:hidden min-w-11 min-h-11 flex items-center justify-center hover:bg-white/10 rounded"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
            >
              <Menu size={18} aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <Building2 size={15} className="opacity-70 hidden sm:block" />
              <span className="app-display text-sm font-semibold">{pageTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <OfflineBadge />
            <span className={`hidden sm:block app-eyebrow ${badge.color}`}>{badge.label}</span>
            <span className="hidden sm:block text-xs text-white/80 font-medium">
              {user?.nombre}
            </span>
          </div>
        </header>

        <div className="h-8 bg-white border-b border-slate-200 flex items-center px-4 md:px-6">
          <span className="app-eyebrow text-slate-400">KABJ</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="app-eyebrow text-slate-500">{badge.label}</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="app-display text-xs text-slate-700 font-medium">{pageTitle}</span>
        </div>

        <BannerOffline />
        <main id="main-content" className="flex-1 overflow-auto p-5 md:p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
