import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OfflineBadge from './OfflineBadge'
import type { Rol } from '../types'

interface NavItem { to: string; label: string }

const NAV_BY_ROL: Record<Rol, NavItem[]> = {
  SUPERVISOR: [
    { to: '/supervisor',             label: '📊 Dashboard' },
    { to: '/supervisor/cargar-ot',   label: '📂 Cargar OT' },
    { to: '/supervisor/asignar',     label: '📌 Asignar Puntos' },
    { to: '/supervisor/seguimiento', label: '📡 Seguimiento' },
  ],
  CAPATAZ: [
    { to: '/capataz',      label: '🏠 Dashboard' },
    { to: '/capataz/mapa', label: '🗺️ Mapa' },
  ],
  ADMINISTRADOR: [
    { to: '/admin', label: '🛡️ Admin Panel' },
  ],
}

const ROL_BADGE: Record<Rol, string> = {
  SUPERVISOR:    'bg-emerald-100 text-emerald-800',
  CAPATAZ:       'bg-orange-100 text-orange-800',
  ADMINISTRADOR: 'bg-purple-100 text-purple-800',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const rol = (user?.rol ?? 'CAPATAZ') as Rol
  const navItems = NAV_BY_ROL[rol] ?? []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-[#1D9E75]">Sistema OT</h1>
          <p className="text-[10px] text-gray-400 leading-tight">K.A.B.J. S.A.C.</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/supervisor' || item.to === '/capataz' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1D9E75] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-800 truncate">{user?.nombre}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROL_BADGE[rol]}`}>
            {rol}
          </span>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-xs text-gray-500 hover:text-red-600 text-left transition-colors"
          >
            Cerrar sesión →
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm font-medium text-gray-700">Bienvenido, {user?.nombre}</span>
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
