import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

// ── Existing supervisor / admin pages ─────────────────────────
import LoginPage          from './pages/LoginPage'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import CargarOT           from './pages/supervisor/CargarOT'
import AsignarPuntos      from './pages/supervisor/AsignarPuntos'
import SeguimientoPage    from './pages/supervisor/SeguimientoPage'
import AdminDashboard     from './pages/admin/AdminDashboard'

// ── Capataz legacy map/form ────────────────────────────────────
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
      <PrivateRoute roles={['CAPATAZ']}>
        <DashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/actividad/:id',
    element: (
      <PrivateRoute roles={['CAPATAZ']}>
        <ActividadPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/ficha/:subId',
    element: (
      <PrivateRoute roles={['CAPATAZ']}>
        <FichaPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/historial',
    element: (
      <PrivateRoute roles={['CAPATAZ']}>
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
      { index: true, element: <Navigate to="/login" replace /> },

      // Supervisor
      {
        path: 'supervisor',
        element: <PrivateRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><SupervisorDashboard /></PrivateRoute>,
      },
      {
        path: 'supervisor/cargar-ot',
        element: <PrivateRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><CargarOT /></PrivateRoute>,
      },
      {
        path: 'supervisor/asignar',
        element: <PrivateRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><AsignarPuntos /></PrivateRoute>,
      },
      {
        path: 'supervisor/seguimiento',
        element: <PrivateRoute roles={['SUPERVISOR', 'ADMINISTRADOR']}><SeguimientoPage /></PrivateRoute>,
      },

      // Capataz legacy map/form (still accessible from ficha CTA)
      {
        path: 'capataz/mapa',
        element: <PrivateRoute roles={['CAPATAZ']}><MapaPuntos /></PrivateRoute>,
      },
      {
        path: 'capataz/registrar/:puntoId',
        element: <PrivateRoute roles={['CAPATAZ']}><FormularioActividad /></PrivateRoute>,
      },

      // Admin
      {
        path: 'admin',
        element: <PrivateRoute roles={['ADMINISTRADOR']}><AdminDashboard /></PrivateRoute>,
      },
    ],
  },

  { path: '*', element: <Navigate to="/login" replace /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
