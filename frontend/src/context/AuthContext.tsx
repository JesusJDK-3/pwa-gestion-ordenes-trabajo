import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'
import { authService } from '../services/api'
import type { Rol, User } from '../types/index'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const VALID_ROLES: Rol[] = ['supervisor', 'capataz', 'admin']

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw) as User
    // Normalizar rol a minúsculas y validar
    const rol = u.rol?.toLowerCase() as Rol
    if (!VALID_ROLES.includes(rol)) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return null
    }
    return { ...u, rol }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user,  setUser]  = useState<User | null>(getStoredUser)

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data } = await authService.login(email, password)
    const { token: tk, rol: rawRol, nombre, userId } = data as {
      token: string; rol: string; nombre: string; userId: number; email: string
    }
    const rol = rawRol?.toLowerCase() as Rol
    const me: User = { id: userId, nombre, email, rol }
    localStorage.setItem('token', tk)
    localStorage.setItem('user',  JSON.stringify(me))
    setToken(tk)
    setUser(me)
    return me
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
