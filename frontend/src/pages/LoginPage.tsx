import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate   = useNavigate()
  const { login }  = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [shake,    setShake]    = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.rol === 'CAPATAZ')         navigate('/dashboard')
      else if (user.rol === 'SUPERVISOR') navigate('/supervisor')
      else                                navigate('/admin')
    } catch {
      setError('Credenciales incorrectas. Verifica tu usuario y contraseña.')
      setShake(true)
      setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-login-pattern flex items-center justify-center p-4">

      {/* ── Card ─────────────────────────────────────────────────── */}
      <div
        className={`bg-white rounded-[20px] shadow-login w-full max-w-[420px] p-10 animate-scale-in ${shake ? 'animate-shake' : ''}`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <KabjLogoFull />
          <h1 className="mt-4 text-[20px] font-bold text-gray-900 text-center leading-tight">
            Sistema de Operaciones de Campo
          </h1>
          <p className="mt-1 text-[13px] text-gray-500 text-center">
            Mantenimiento de Redes SEDAPAL
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 bg-[#FDECEA] border border-[#FECACA] rounded-xl px-4 py-3 text-[13px] text-[#CC1111] font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Usuario */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              Usuario / Email
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={17} />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
                className="input-kabj w-full h-12 pl-11 pr-4 rounded-[10px] border border-[#E5E7EB] text-[14px] text-gray-800 placeholder-gray-400 bg-white transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={17} />
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-kabj w-full h-12 pl-11 pr-4 rounded-[10px] border border-[#E5E7EB] text-[14px] text-gray-800 placeholder-gray-400 bg-white transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-12 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:opacity-75 text-white font-bold text-[15px] rounded-[10px] flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin-slow" />
                Ingresando…
              </>
            ) : (
              <>
                <ArrowRight size={18} />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-7 text-[12px] text-gray-400 text-center">
          KABJ • Consultores &amp; Constructores S.A.C.
        </p>
      </div>

      {/* Help button */}
      <button
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#1A2535] text-white font-bold text-lg shadow-lg hover:bg-[#243347] flex items-center justify-center z-50"
        aria-label="Ayuda"
      >
        ?
      </button>
    </div>
  )
}

function KabjLogoFull() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-label="KABJ">
      <rect width="64" height="64" rx="16" fill="#CC1111" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34 12h-4l-.8 3.5a11.5 11.5 0 00-2.9 1.2l-3.1-1.8-2.8 2.8 1.8 3.1a11.5 11.5 0 00-1.2 2.9L17.5 25v4l3.5.8c.3 1 .7 2 1.2 2.9l-1.8 3.1 2.8 2.8 3.1-1.8c.9.5 1.9.9 2.9 1.2l.8 3.5h4l.8-3.5a11.5 11.5 0 002.9-1.2l3.1 1.8 2.8-2.8-1.8-3.1a11.5 11.5 0 001.2-2.9l3.5-.8v-4l-3.5-.8a11.5 11.5 0 00-1.2-2.9l1.8-3.1-2.8-2.8-3.1 1.8a11.5 11.5 0 00-2.9-1.2L34 12zM32 24a7 7 0 100 14 7 7 0 000-14z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Buildings inside gear */}
      <rect x="27" y="28" width="4" height="7" fill="#CC1111" rx="1" />
      <rect x="27.5" y="24.5" width="3" height="3.5" fill="#CC1111" rx="0.5" />
      <rect x="33" y="29.5" width="4" height="5.5" fill="#CC1111" rx="1" />
      <rect x="33.5" y="26" width="3" height="3.5" fill="#CC1111" rx="0.5" />
    </svg>
  )
}
