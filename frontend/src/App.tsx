import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

// Redirige al home del rol si autenticado, o a /login si no lo está
function SmartRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (user.rol === 'capataz')    return <Navigate to="/dashboard"  replace />
  if (user.rol === 'supervisor') return <Navigate to="/supervisor" replace />
  return <Navigate to="/admin" replace />
}

// ── Existing supervisor / admin pages ─────────────────────────
import LoginPage          from './pages/LoginPage'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import CargarOT           from './pages/supervisor/CargarOT'
import AsignarPuntos      from './pages/supervisor/AsignarPuntos'
import SeguimientoPage    from './pages/supervisor/SeguimientoPage'
import AdminDashboard     from './pages/admin/AdminDashboard'

// ── Capataz pages ─────────────────────────────────────────────
import CapatazDashboard   from './pages/capataz/CapatazDashboard'
import MapaPuntos         from './pages/capataz/MapaPuntos'
import FormularioActividad from './pages/capataz/FormularioActividad'

// ── KABJ field-tech interface ──────────────────────────────────
import DashboardPage  from './pages/kabj/DashboardPage'
import ActividadPage  from './pages/kabj/ActividadPage'
import FichaPage      from './pages/kabj/FichaPage'
import HistorialPage  from './pages/kabj/HistorialPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  // ── KABJ field-tech routes (own Navbar, no sidebar) ────────
  {
    path: '/dashboard',
    element: (
      <PrivateRoute roles={['capataz']}>
        <DashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/actividad/:id',
    element: (
      <PrivateRoute roles={['capataz']}>
        <ActividadPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/ficha/:subId',
    element: (
      <PrivateRoute roles={['capataz']}>
        <FichaPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/historial',
    element: (
      <PrivateRoute roles={['capataz']}>
        <HistorialPage />
      </PrivateRoute>
    ),
  },

  // ── Supervisor / Admin routes (sidebar Layout) ─────────────
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <SmartRedirect /> },

      // Supervisor
      {
        path: 'supervisor',
        element: <PrivateRoute roles={['supervisor', 'admin']}><SupervisorDashboard /></PrivateRoute>,
      },
      {
        path: 'supervisor/cargar-ot',
        element: <PrivateRoute roles={['supervisor', 'admin']}><CargarOT /></PrivateRoute>,
      },
      {
        path: 'supervisor/asignar',
        element: <PrivateRoute roles={['supervisor', 'admin']}><AsignarPuntos /></PrivateRoute>,
      },
      {
        path: 'supervisor/seguimiento',
        element: <PrivateRoute roles={['supervisor', 'admin']}><SeguimientoPage /></PrivateRoute>,
      },

      // Capataz routes (sidebar Layout)
      {
        path: 'capataz',
        element: <PrivateRoute roles={['capataz']}><CapatazDashboard /></PrivateRoute>,
      },
      {
        path: 'capataz/mapa',
        element: <PrivateRoute roles={['capataz']}><MapaPuntos /></PrivateRoute>,
      },
      {
        path: 'capataz/registrar/:puntoId',
        element: <PrivateRoute roles={['capataz']}><FormularioActividad /></PrivateRoute>,
      },

      // Admin
      {
        path: 'admin',
        element: <PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>,
      },
    ],
  },

  { path: '*', element: <SmartRedirect /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
