import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getRolHome } from '../utils/rolHome'
import logoKabj from '../assets/logo-kabj-transparent.png'

export default function LoginPage() {
  const navigate                         = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) navigate(getRolHome(user.rol), { replace: true })
  }, [isAuthenticated, user, navigate])

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
      const u = await login(email, password)
      navigate(getRolHome(u.rol), { replace: true })
    } catch {
      setError('Credenciales incorrectas. Verifique usuario y contraseña.')
      setShake(true)
      setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page min-h-screen flex flex-col lg:flex-row">
      {/* Izquierda — imagen difuminada + título */}
      <div className="relative lg:w-[48%] min-h-[220px] lg:min-h-screen flex flex-col justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-[3px]"
          style={{ backgroundImage: "url('/login-campo.jpg')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628]/82 via-[#1B4F72]/65 to-[#0A1628]/78" />
        <div className="absolute inset-0 bg-login-grid opacity-30" />

        <div className="relative z-10 px-8 py-10 lg:px-14 lg:py-16">
          <div className="w-12 h-[3px] bg-[#C0392B]" />
          <h1 className="login-display mt-8 text-[1.75rem] lg:text-[2.375rem] font-semibold text-white leading-[1.08] max-w-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
            Gestión de Operaciones de Campo
          </h1>
        </div>
      </div>

      {/* Derecha — acceso */}
      <div className="flex-1 flex flex-col bg-[#ECEFF1] min-h-0">
        <div className="h-1 bg-[#1B4F72]" />

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className={`w-full max-w-[420px] ${shake ? 'animate-shake' : ''}`}>
            <div className="flex justify-center mb-8">
              <img
                src={logoKabj}
                alt="K.A.B.J. Consultores & Constructores S.A.C."
                className="h-[104px] w-auto max-w-[280px] object-contain drop-shadow-[0_6px_24px_rgba(10,22,40,0.12)]"
              />
            </div>

            <div className="bg-white border border-slate-200/90 shadow-[0_12px_40px_rgba(10,22,40,0.08)] overflow-hidden">
              <div className="bg-[#1B4F72] px-8 py-6 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C0392B]" />
                <p className="login-eyebrow text-white/50 pl-3">
                  Acceso al sistema
                </p>
                <h2 className="login-display text-[1.375rem] font-semibold text-white mt-1.5 pl-3">
                  Inicio de sesión
                </h2>
              </div>

              <div className="px-8 py-8">
                {error && (
                  <div className="alert-banner alert-error mb-6 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="login-label block mb-2">Usuario / Email</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B4F72]/45">
                        <User size={17} strokeWidth={1.75} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="correo@empresa.com"
                        required
                        maxLength={150}
                        className="login-input corp-input pl-11 h-12 bg-[#F8FAFB] border-slate-200 focus:bg-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="login-label block mb-2">Contraseña</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B4F72]/45">
                        <Lock size={17} strokeWidth={1.75} />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        maxLength={100}
                        className="login-input corp-input pl-11 h-12 bg-[#F8FAFB] border-slate-200 focus:bg-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full h-12 mt-2 text-[0.9375rem] font-semibold tracking-wide shadow-[0_4px_14px_rgba(27,79,114,0.25)]"
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Ingresando…</>
                      : <><ArrowRight size={18} strokeWidth={2} /> Acceder al sistema</>
                    }
                  </button>
                </form>
              </div>
            </div>

            <p className="login-footer mt-6 text-center">
              © {new Date().getFullYear()} K.A.B.J. — Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
