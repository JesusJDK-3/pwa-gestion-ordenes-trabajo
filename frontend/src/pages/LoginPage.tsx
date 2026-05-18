import { type FormEvent, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Lock, ArrowRight, Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"

function getRolHome(rol: string) {
  if (rol === "capataz")    return "/capataz"
  if (rol === "supervisor") return "/supervisor"
  return "/admin"
}

export default function LoginPage() {
  const navigate                         = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) navigate(getRolHome(user.rol), { replace: true })
  }, [isAuthenticated, user, navigate])

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [shake,    setShake]    = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const u = await login(email, password)
      navigate(getRolHome(u.rol), { replace: true })
    } catch {
      setError("Credenciales incorrectas. Verifica tu usuario y contrasena.")
      setShake(true)
      setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-login-pattern flex items-center justify-center p-4">
      <div className={`bg-white rounded-[20px] shadow-login w-full max-w-[420px] p-10 animate-scale-in ${shake ? "animate-shake" : ""}`}>

        <div className="flex flex-col items-center mb-7">
          <img src="/logo-kabj.png" alt="K.A.B.J." className="w-28 h-28 object-contain drop-shadow-sm" />
          <h1 className="mt-3 text-[20px] font-bold text-gray-900 text-center leading-tight">
            Sistema de Operaciones de Campo
          </h1>
          <p className="mt-1 text-[13px] text-gray-500 text-center">
            Mantenimiento de Redes SEDAPAL
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-[#FDECEA] border border-[#FECACA] rounded-xl px-4 py-3 text-[13px] text-[#CC1111] font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Usuario / Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={17} /></span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com" required maxLength={150}
                className="input-kabj w-full h-12 pl-11 pr-4 rounded-[10px] border border-[#E5E7EB] text-[14px] text-gray-800 placeholder-gray-400 bg-white transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Contrasena</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={17} /></span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="..." required maxLength={100}
                className="input-kabj w-full h-12 pl-11 pr-4 rounded-[10px] border border-[#E5E7EB] text-[14px] text-gray-800 placeholder-gray-400 bg-white transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="mt-2 w-full h-12 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:opacity-75 text-white font-bold text-[15px] rounded-[10px] flex items-center justify-center gap-2 shadow-md">
            {loading ? <><Loader2 size={18} className="animate-spin-slow" /> Ingresando...</> : <><ArrowRight size={18} /> Ingresar al Sistema</>}
          </button>
        </form>

        <p className="mt-7 text-[12px] text-gray-400 text-center">KABJ - Consultores & Constructores S.A.C.</p>
      </div>
    </div>
  )
}