import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Upload, MapPin, Radio, Navigation,
  Home, Map, Shield, LogOut, BookOpen, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import OfflineBadge from './OfflineBadge'
import type { Rol } from '../types'

interface NavItem { to: string; label: string; icon: LucideIcon }

const NAV_BY_ROL: Record<Rol, NavItem[]> = {
  supervisor: [
    { to: '/supervisor',               label: 'Panel',              icon: LayoutDashboard },
    { to: '/supervisor/cargar-ot',     label: 'Carga Excel',        icon: Upload },
    { to: '/supervisor/coordenadas',   label: 'Coordenadas',        icon: Navigation },
    { to: '/supervisor/asignar',      label: 'Asignación',         icon: MapPin },
    { to: '/supervisor/seguimiento',   label: 'Seguimiento',        icon: Radio },
  ],
  capataz: [
    { to: '/capataz',           label: 'Mis OTs',     icon: Home },
    { to: '/capataz/mapa',      label: 'Mapa',        icon: Map },
    { to: '/capataz/ayudantes', label: 'Ayudantes',   icon: Users },
    { to: '/dashboard',         label: 'Guías',       icon: BookOpen },
  ],
  admin: [
    { to: '/admin', label: 'Administración', icon: Shield },
  ],
}

const ROL_BADGE: Record<Rol, { bg: string; text: string; label: string }> = {
  supervisor: { bg: 'bg-blue-500/15',   text: 'text-blue-200',   label: 'Supervisor' },
  capataz:    { bg: 'bg-amber-500/15',  text: 'text-amber-200',  label: 'Capataz' },
  admin:      { bg: 'bg-violet-500/15', text: 'text-violet-200', label: 'Administrador' },
}

function getInitials(nombre = '') {
  return nombre.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const rawRol   = user?.rol?.toLowerCase() as Rol | undefined
  const rol      = (rawRol && ROL_BADGE[rawRol] ? rawRol : 'capataz') as Rol
  const navItems = NAV_BY_ROL[rol] ?? []
  const badge    = ROL_BADGE[rol] ?? ROL_BADGE['capataz']

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium border-l-[3px] transition-colors ${
      isActive
        ? 'border-l-[#CC1111] bg-white/8 text-white'
        : 'border-l-transparent text-white/55 hover:text-white hover:bg-white/5'
    }`

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/logo-kabj.png"
            alt="K.A.B.J."
            className="w-9 h-9 rounded object-contain bg-white p-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Sistema OT</p>
            <p className="text-white/40 text-[10px] uppercase tracking-wider">K.A.B.J. S.A.C.</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/supervisor' || item.to === '/capataz' || item.to === '/admin'}
              className={({ isActive }) => navLinkClass(isActive)}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={15} strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#0F4C81] rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">{getInitials(user?.nombre)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user?.nombre}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-white/45 hover:text-red-300 text-[12px] py-1"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#F4F6F9] overflow-hidden">

      <aside className="w-56 bg-[#0B1F33] flex flex-col flex-shrink-0 hidden md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-[#0B1F33] flex flex-col z-[9999]">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <path d="M0 1.5H18M0 6H18M0 10.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="text-sm text-slate-500 hidden md:inline">
              {user?.nombre}
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-slate-700 font-medium">{badge.label}</span>
            </span>
          </div>
          <OfflineBadge />
        </header>

        <main className="flex-1 overflow-auto p-5 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
