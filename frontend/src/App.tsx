/**
 * Enrutamiento principal de la PWA KABJ GIS.
 *
 * Define todas las rutas por rol (supervisor, capataz, admin) con lazy loading.
 * Envuelve la app en AuthProvider + OfflineSyncProvider + ErrorBoundary.
 *
 * Rutas críticas de negocio:
 * - `/capataz/registrar/:puntoId` → FormularioActividad (cambio estado OT)
 * - `/supervisor/asignar` → AsignarPuntos
 * - `/supervisor/cargar-ot` → importación Excel
 *
 * @see docs/ARCHITECTURE.md §5.1
 */
import { lazy, Suspense, type ReactNode } from 'react'

import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'

import { OfflineSyncProvider } from './context/OfflineSyncContext'

import PrivateRoute from './components/PrivateRoute'

import Layout from './components/Layout'

import { useAuth } from './context/AuthContext'

import { getRolHome } from './utils/rolHome'

import ErrorBoundary from './components/ErrorBoundary'

import LoginPage from './pages/LoginPage'

import FloatingIssueButton from "./components/FloatingIssueButton";



function PageLoader() {

  return (

    <div className="flex items-center justify-center py-20 text-slate-500 text-sm">

      <span className="w-5 h-5 border-2 border-slate-300 border-t-[#1B4F72] rounded-full animate-spin mr-3" />

      Cargando…

    </div>

  )

}



function LazyPage({ children }: { children: ReactNode }) {

  return <Suspense fallback={<PageLoader />}>{children}</Suspense>

}



function SmartRedirect() {

  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />

  return <Navigate to={getRolHome(user.rol)} replace />

}



const SupervisorDashboard = lazy(() => import('./pages/supervisor/SupervisorDashboard'))

const CargarOT            = lazy(() => import('./pages/supervisor/CargarOT'))

const CorregirCoordenadas = lazy(() => import('./pages/supervisor/CorregirCoordenadas'))

const AsignarPuntos       = lazy(() => import('./pages/supervisor/AsignarPuntos'))

const SeguimientoPage     = lazy(() => import('./pages/supervisor/SeguimientoPage'))

const ResumenDiarioPage   = lazy(() => import('./pages/supervisor/ResumenDiarioPage'))

const ResumenMensualPage  = lazy(() => import('./pages/supervisor/ResumenMensualPage'))

const SupervisorHistorialPage = lazy(() => import('./pages/supervisor/SupervisorHistorialPage'))

const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'))

const CargarDatosPage     = lazy(() => import('./pages/admin/CargarDatosPage'))

const AlertasPage         = lazy(() => import('./pages/admin/AlertasPage'))

const CapatazDashboard    = lazy(() => import('./pages/capataz/CapatazDashboard'))

const MapaPuntos          = lazy(() => import('./pages/capataz/MapaPuntos'))

const FormularioActividad = lazy(() => import('./pages/capataz/FormularioActividad'))

const AyudantesPage       = lazy(() => import('./pages/capataz/AyudantesPage'))

const DashboardPage       = lazy(() => import('./pages/kabj/DashboardPage'))

const ActividadPage       = lazy(() => import('./pages/kabj/ActividadPage'))

const FichaPage           = lazy(() => import('./pages/kabj/FichaPage'))

const HistorialPage       = lazy(() => import('./pages/kabj/HistorialPage'))



const router = createBrowserRouter([

  { path: '/login', element: <LoginPage /> },



  {

    path: '/',

    element: (

      <PrivateRoute>

        <Layout />

      </PrivateRoute>

    ),

    children: [

      { index: true, element: <SmartRedirect /> },



      {

        path: 'supervisor',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><SupervisorDashboard /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/cargar-ot',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><CargarOT /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/coordenadas',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><CorregirCoordenadas /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/mapa',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><MapaPuntos /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/alertas',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><AlertasPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/asignar',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><AsignarPuntos /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/seguimiento',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><SeguimientoPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/resumen-diario',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><ResumenDiarioPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/resumen-mensual',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><ResumenMensualPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'supervisor/historial',

        element: <PrivateRoute roles={['supervisor']}><LazyPage><SupervisorHistorialPage /></LazyPage></PrivateRoute>,

      },



      {

        path: 'capataz',

        element: <PrivateRoute roles={['capataz']}><LazyPage><CapatazDashboard /></LazyPage></PrivateRoute>,

      },

      {

        path: 'capataz/mapa',

        element: <PrivateRoute roles={['capataz']}><LazyPage><MapaPuntos /></LazyPage></PrivateRoute>,

      },

      {

        path: 'capataz/ubicaciones',

        element: <Navigate to="/capataz/alertas" replace />,

      },
      {
        path: 'capataz/coordenadas',

        element: (<PrivateRoute roles={['capataz']}><LazyPage><CorregirCoordenadas /> </LazyPage></PrivateRoute>),
      },

      {

        path: 'capataz/alertas',

        element: <PrivateRoute roles={['capataz']}><LazyPage><AlertasPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'dashboard',

        element: <PrivateRoute roles={['capataz']}><LazyPage><DashboardPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'historial',

        element: <PrivateRoute roles={['capataz']}><LazyPage><HistorialPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'actividad/:id',

        element: <PrivateRoute roles={['capataz']}><LazyPage><ActividadPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'ficha/:subId',

        element: <PrivateRoute roles={['capataz']}><LazyPage><FichaPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'capataz/registrar/:puntoId',

        element: <PrivateRoute roles={['capataz']}><LazyPage><FormularioActividad /></LazyPage></PrivateRoute>,

      },

      {

        path: 'capataz/ayudantes',

        element: <PrivateRoute roles={['capataz']}><LazyPage><AyudantesPage /></LazyPage></PrivateRoute>,

      },



      {

        path: 'admin',

        element: <PrivateRoute roles={['admin']}><LazyPage><AdminDashboard /></LazyPage></PrivateRoute>,

      },

      {

        path: 'admin/cargar-datos',

        element: <PrivateRoute roles={['admin']}><LazyPage><CargarDatosPage /></LazyPage></PrivateRoute>,

      },

      {

        path: 'admin/mapa',

        element: <PrivateRoute roles={['admin']}><LazyPage><MapaPuntos /></LazyPage></PrivateRoute>,

      },

      {

        path: 'admin/coordenadas',

        element: <PrivateRoute roles={['admin']}><LazyPage><CorregirCoordenadas /></LazyPage></PrivateRoute>,

      },

      {

        path: 'admin/alertas',

        element: <PrivateRoute roles={['admin']}><LazyPage><AlertasPage /></LazyPage></PrivateRoute>,

      },

    ],

  },



  { path: '*', element: <SmartRedirect /> },

])



export default function App() {

  return (

    <ErrorBoundary>

      <AuthProvider>

        <OfflineSyncProvider>

          <RouterProvider router={router} />

          <FloatingIssueButton />

        </OfflineSyncProvider>

      </AuthProvider>

    </ErrorBoundary>

  )

}


