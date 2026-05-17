import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  showActions?: boolean
}

function LogoKabj() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-label="KABJ Logo">
      <rect width="40" height="40" rx="9" fill="#CC1111" />
      {/* Gear ring */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.5 7.5h-3l-.5 2.2a7.2 7.2 0 00-1.8.75l-1.9-1.1-2.1 2.1 1.1 1.9a7.2 7.2 0 00-.75 1.8L10.3 15.5v3l2.2.5c.18.63.44 1.24.75 1.8l-1.1 1.9 2.1 2.1 1.9-1.1c.56.31 1.17.57 1.8.75l.5 2.2h3l.5-2.2a7.2 7.2 0 001.8-.75l1.9 1.1 2.1-2.1-1.1-1.9c.31-.56.57-1.17.75-1.8l2.2-.5v-3l-2.2-.5a7.2 7.2 0 00-.75-1.8l1.1-1.9-2.1-2.1-1.9 1.1a7.2 7.2 0 00-1.8-.75L21.5 7.5zM20 15.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
        fill="white"
        fillOpacity="0.92"
      />
      {/* Buildings inside gear circle */}
      <rect x="16.5" y="17.5" width="2.5" height="5" fill="#CC1111" rx="0.5" />
      <rect x="17" y="15.5" width="1.5" height="2" fill="#CC1111" rx="0.5" />
      <rect x="21" y="18.5" width="2.5" height="4" fill="#CC1111" rx="0.5" />
      <rect x="21.5" y="16.5" width="1.5" height="2" fill="#CC1111" rx="0.5" />
    </svg>
  )
}

export default function Navbar({
  title = 'Sistema de Operaciones de Campo',
  subtitle = 'SEDAPAL - Mantenimiento de Redes',
  showBack = false,
  showActions = true,
}: NavbarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

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
        <LogoKabj />
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
            onClick={logout}
            className="flex items-center gap-2 border border-[#334155] rounded-lg px-3 py-2 text-white text-[13px] font-medium hover:bg-white/10"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      )}
    </nav>
  )
}
