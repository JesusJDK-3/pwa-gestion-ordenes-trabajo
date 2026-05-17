import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Rol } from '../types'

interface Props {
  children: ReactNode
  roles?: Rol[]
}

function getRolHome(rol: Rol): string {
  if (rol === 'SUPERVISOR') return '/supervisor'
  if (rol === 'CAPATAZ') return '/dashboard'
  return '/admin'
}

export default function PrivateRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to={getRolHome(user.rol)} replace />
  }

  return <>{children}</>
}
