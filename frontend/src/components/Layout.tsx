import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, MapPin, Radio,
  Home, Map, Shield, LogOut, BookOpen,
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
    { to: '/capataz',      label: 'Mis OTs',    icon: Home },
    { to: '/capataz/mapa', label: 'Mapa',        icon: Map },
    { to: '/dashboard',    label: 'Guías',       icon: BookOpen },
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


export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const rawRol    = user?.rol?.toLowerCase() as Rol | undefined
  const rol       = (rawRol && ROL_BADGE[rawRol] ? rawRol : 'capataz') as Rol
  const navItems  = NAV_BY_ROL[rol] ?? []
  const badge     = ROL_BADGE[rol] ?? ROL_BADGE['capataz']

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-[#EEF1F5] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 bg-[#1A2535] flex flex-col flex-shrink-0">

        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/logo-kabj.png"
              alt="K.A.B.J."
              className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 flex-shrink-0"
            />
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
