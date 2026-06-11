import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, ArrowRight, Loader2, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function getRolHome(rol: string) {
  if (rol === 'capataz')    return '/capataz'
  if (rol === 'supervisor') return '/supervisor'
  return '/admin'
}

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
    <div className="min-h-screen flex">
      {/* Panel corporativo izquierdo */}
      <div className="hidden lg:flex lg:w-[46%] bg-login-panel bg-login-grid text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <img src="/logo-kabj.png" alt="K.A.B.J." className="w-16 h-16 object-contain bg-white rounded p-1" />
          <h1 className="mt-8 text-3xl font-semibold leading-tight tracking-tight">
            Gestión de Operaciones<br />de Campo
          </h1>
          <p className="mt-4 text-white/70 text-sm max-w-sm leading-relaxed">
            Plataforma empresarial para supervisión de órdenes de trabajo,
            asignación de cuadrillas y seguimiento georreferenciado SEDAPAL.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/50">
          <Shield size={14} />
          Acceso seguro · K.A.B.J. Consultores & Constructores S.A.C.
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5" />
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#F4F6F9]">
        <div className={`w-full max-w-[400px] ${shake ? 'animate-shake' : ''}`}>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo-kabj.png" alt="K.A.B.J." className="w-12 h-12 object-contain" />
            <div>
              <p className="font-semibold text-slate-900">Sistema OT</p>
              <p className="text-xs text-slate-500">K.A.B.J. S.A.C.</p>
            </div>
          </div>

          <div className="corp-card p-8">
            <h2 className="text-lg font-semibold text-slate-900">Iniciar sesión</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Ingrese sus credenciales corporativas</p>

            {error && (
              <div className="alert-banner alert-error mb-5">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="corp-label">Usuario / Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    required
                    maxLength={150}
                    className="corp-input pl-10 h-11"
                  />
                </div>
              </div>
              <div>
                <label className="corp-label">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={16} /></span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    maxLength={100}
                    className="corp-input pl-10 h-11"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full h-11 mt-2">
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Ingresando…</>
                  : <><ArrowRight size={18} /> Acceder al sistema</>
                }
              </button>
            </form>
          </div>

          <p className="mt-6 text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} K.A.B.J. — Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
