# KABJ GIS — Frontend (React + TypeScript + Vite)

Interfaz PWA del Sistema de Operaciones de Campo.  
Forma parte del monorepo `pwa-gestion-ordenes-trabajo`.

---

## Desarrollo local

```bash
# Desde la raíz del proyecto — inicia todo:
bash start.sh

# O solo el frontend (requiere el backend corriendo):
cd frontend
npm run dev
```

La app queda disponible en **http://localhost:5173**.

---

## Variables de entorno

Crea un archivo `frontend/.env` (el script `start.sh` lo genera automáticamente):

```env
VITE_API_URL=http://localhost:8080
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Revisión de código con ESLint |

---

## Stack

- **React 19** + **TypeScript**
- **Vite** — bundler y dev server
- **Tailwind CSS** — estilos utilitarios
- **Lucide React** — íconos
- **Leaflet / React-Leaflet** — mapas GIS
- **Axios** — cliente HTTP con interceptores JWT
- **vite-plugin-pwa** — soporte PWA + Service Worker

---

## Estructura `src/`

```
src/
├── App.tsx                  ← Router principal
├── main.tsx                 ← Entry point
├── index.css                ← Estilos globales + Tailwind
├── pages/
│   ├── LoginPage.tsx
│   ├── kabj/                ← App de campo (Capataz)
│   │   ├── DashboardPage.tsx
│   │   ├── ActividadPage.tsx
│   │   ├── FichaPage.tsx
│   │   └── HistorialPage.tsx
│   ├── supervisor/          ← Panel Supervisor
│   │   ├── SupervisorDashboard.tsx
│   │   ├── CargarOT.tsx
│   │   ├── AsignarPuntos.tsx
│   │   └── SeguimientoPage.tsx
│   ├── capataz/             ← Vistas legacy con sidebar
│   │   ├── CapatazDashboard.tsx
│   │   ├── MapaPuntos.tsx
│   │   └── FormularioActividad.tsx
│   └── admin/
│       └── AdminDashboard.tsx
├── components/
│   ├── Layout.tsx           ← Sidebar + header (Supervisor/Admin)
│   ├── PrivateRoute.tsx     ← Guard por rol
│   ├── OfflineBadge.tsx     ← Indicador de conexión
│   └── kabj/
│       ├── Navbar.tsx       ← Barra superior (App de campo)
│       └── HelpButton.tsx
├── context/
│   └── AuthContext.tsx      ← Auth global (token JWT)
├── services/
│   ├── api.ts               ← Axios + endpoints
│   └── offlineDB.ts         ← IndexedDB para modo offline
├── hooks/
│   └── useOfflineSync.ts    ← Sincronización offline
├── types/                   ← Interfaces TypeScript
└── data/
    └── actividades.ts       ← Catálogo de actividades SEDAPAL
```
