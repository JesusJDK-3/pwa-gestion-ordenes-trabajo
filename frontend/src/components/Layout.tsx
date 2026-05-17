import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, MapPin, Radio,
  Home, Map, Shield, LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import OfflineBadge from './OfflineBadge'
import type { Rol } from '../types'

interface NavItem { to: string; label: string; icon: LucideIcon }

const NAV_BY_ROL: Record<Rol, NavItem[]> = {
  supervisor: [
    { to: '/supervisor',             label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/supervisor/cargar-ot',   label: 'Cargar OT',      icon: Upload },
    { to: '/supervisor/asignar',     label: 'Asignar Puntos', icon: MapPin },
    { to: '/supervisor/seguimiento', label: 'Seguimiento',    icon: Radio },
  ],
  capataz: [
    { to: '/capataz',      label: 'Dashboard', icon: Home },
    { to: '/capataz/mapa', label: 'Mapa',      icon: Map },
  ],
  admin: [
    { to: '/admin', label: 'Panel Admin', icon: Shield },
  ],
}

const ROL_BADGE: Record<Rol, { bg: string; text: string; label: string }> = {
  supervisor: { bg: 'bg-blue-500/20',   text: 'text-blue-300',   label: 'Supervisor' },
  capataz:    { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Capataz' },
  admin:      { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Administrador' },
}

function getInitials(nombre = '') {
  return nombre.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function KabjGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <path
        fillRule="evenodd" clipRule="evenodd"
        d="M21.5 7.5h-3l-.5 2.2a7.2 7.2 0 00-1.8.75l-1.9-1.1-2.1 2.1 1.1 1.9a7.2 7.2 0 00-.75 1.8L10.3 15.5v3l2.2.5c.18.63.44 1.24.75 1.8l-1.1 1.9 2.1 2.1 1.9-1.1c.56.31 1.17.57 1.8.75l.5 2.2h3l.5-2.2a7.2 7.2 0 001.8-.75l1.9 1.1 2.1-2.1-1.1-1.9c.31-.56.57-1.17.75-1.8l2.2-.5v-3l-2.2-.5a7.2 7.2 0 00-.75-1.8l1.1-1.9-2.1-2.1-1.9 1.1a7.2 7.2 0 00-1.8-.75L21.5 7.5zM20 15.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
        fill="white" fillOpacity="0.95"
      />
      <rect x="16.5" y="17.5" width="2.5" height="5" fill="#CC1111" rx="0.5" />
      <rect x="17"   y="15.5" width="1.5" height="2" fill="#CC1111" rx="0.5" />
      <rect x="21"   y="18.5" width="2.5" height="4" fill="#CC1111" rx="0.5" />
      <rect x="21.5" y="16.5" width="1.5" height="2" fill="#CC1111" rx="0.5" />
    </svg>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const rol       = (user?.rol ?? 'capataz') as Rol
  const navItems  = NAV_BY_ROL[rol] ?? []
  const badge     = ROL_BADGE[rol]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-[#EEF1F5] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 bg-[#1A2535] flex flex-col flex-shrink-0">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#CC1111] rounded-xl flex items-center justify-center flex-shrink-0">
              <KabjGear />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-tight">Sistema OT</p>
              <p className="text-white/40 text-[10px] leading-tight">K.A.B.J. S.A.C.</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/supervisor' || item.to === '/capataz' || item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#CC1111] text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={15} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#CC1111] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{getInitials(user?.nombre)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-semibold truncate">{user?.nombre}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-white/40 hover:text-red-400 text-[12px] transition-colors py-1"
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-sm text-gray-500">
            Bienvenido, <span className="font-semibold text-gray-800">{user?.nombre}</span>
          </span>
          <OfflineBadge />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
