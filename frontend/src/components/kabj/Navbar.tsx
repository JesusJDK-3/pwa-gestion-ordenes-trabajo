import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Clock, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  showActions?: boolean
}


export default function Navbar({
  title = 'Sistema de Operaciones de Campo',
  subtitle = 'SEDAPAL - Mantenimiento de Redes',
  showBack = false,
  showActions = true,
}: NavbarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="h-16 bg-[#1A2535] flex items-center px-5 gap-3 animate-fade-in-down shadow-md flex-shrink-0">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white flex-shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src="/logo-kabj.png"
          alt="K.A.B.J."
          className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-white font-bold text-[18px] leading-tight truncate">{title}</p>
          <p className="text-slate-400 text-[13px] leading-tight truncate">{subtitle}</p>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/historial')}
            className="flex items-center gap-2 border border-[#334155] rounded-lg px-3 py-2 text-white text-[13px] font-medium hover:bg-white/10"
          >
            <Clock size={15} />
            <span className="hidden sm:inline">Historial</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-[#334155] rounded-lg px-3 py-2 text-white text-[13px] font-medium hover:bg-white/10"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Salir</span>
          </button>
          {/* Mobile actions: overflow menu */}
          <div className="relative sm:hidden">
            <button onClick={() => setMenuOpen(v => !v)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white">
              <svg width="18" height="4" viewBox="0 0 18 4" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="2" fill="white"/><circle cx="9" cy="2" r="2" fill="white"/><circle cx="16" cy="2" r="2" fill="white"/></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg overflow-hidden z-[9999]">
                <button onClick={() => { setMenuOpen(false); navigate('/historial') }} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">Historial</button>
                <button onClick={() => { setMenuOpen(false); handleLogout() }} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">Salir</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
