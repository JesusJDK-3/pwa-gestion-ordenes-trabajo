# Documentación técnica — KABJ GIS

> Guía de arquitectura para desarrolladores que se integran al proyecto.  
> Complementa los comentarios Javadoc/JSDoc en el código fuente.

---

## 1. Visión general

**KABJ GIS** es una PWA para operaciones de campo (SEDAPAL / mantenimiento de redes). Conecta tres perfiles operativos con un backend REST y PostgreSQL.

```
┌─────────────┐     JWT      ┌──────────────────┐     JPA      ┌──────────────┐
│  React PWA  │ ◄──────────► │  Spring Boot API │ ◄──────────► │  PostgreSQL  │
│  (Vite)     │   /api/*     │  (Java 21)       │              │  sistema_ot  │
└─────────────┘              └──────────────────┘              └──────────────┘
       │                              │
       │ IndexedDB (offline)          │ Apache POI (Excel)
       └──────────────────────────────┘ Validación fotos (externa)
```

### Responsabilidades por capa

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| **UI** | `frontend/src/pages/` | Pantallas por rol, mapa Leaflet, formularios |
| **Cliente API** | `frontend/src/services/api.ts` | Axios, interceptores JWT, servicios REST |
| **Offline** | `frontend/src/services/offlineDB.ts`, `hooks/useOfflineSync.ts` | Cola local y sincronización |
| **API REST** | `backend/.../controller/` | Endpoints HTTP, autorización `@PreAuthorize` |
| **Negocio** | `backend/.../service/` | Reglas de OT, alertas, Excel, sync |
| **Persistencia** | `backend/.../entity/`, `repository/` | Modelo JPA y consultas |
| **Seguridad** | `backend/.../security/` | JWT, filtros, rate limit login |
| **BD** | `database/bootstrap.sql` | Esquema de referencia PostgreSQL |

---

## 2. Roles y permisos

| Rol (JWT) | Panel principal | Acciones clave |
|-----------|-----------------|----------------|
| `supervisor` | `/supervisor` | Importar Excel, asignar capataces, georreferencia, reportes |
| `capataz` | `/capataz`, `/dashboard` | Mapa operativo, registro de actividad, ayudantes, offline |
| `admin` | `/admin` | Alta de capataces (RRHH), base GIS, alertas, auditoría |

La autorización se aplica en backend con `@PreAuthorize`. El frontend usa `PrivateRoute` y `Layout` solo como UX; **nunca** sustituye la seguridad del servidor.

---

## 3. Ciclo de vida de una OT

Estados definidos en `cat_estado_ot` (`database/bootstrap.sql`):

| Código | Significado | ¿Final? |
|--------|-------------|---------|
| `PENDIENTE` | Recién importada; trabajo no iniciado | No |
| `EN_PROGRESO` | Capataz registró inicio en campo | No |
| `OBSERVADA` | Incidencia documentada (requiere observación) | No |
| `COMPLETADA` | Cierre con observaciones | Sí — sale del mapa |
| `ANULADA` | Cancelada por supervisor | Sí — sale del mapa |

### Flujo operativo típico

```
Supervisor importa Excel  →  PENDIENTE (sin capataz)
Supervisor asigna capataz →  PENDIENTE (con capataz)
Capataz registra actividad →  EN_PROGRESO (+ fecha_inicio)
Capataz completa OT        →  COMPLETADA (+ fecha_fin, visible_en_mapa=false)
```

**Código clave:** `ExcelCargaService` (creación), `OrdenTrabajoController.asignar`, `RegistroController` (cambio de estado).

---

## 4. Módulos backend

### 4.1 Controllers (`controller/`)

| Clase | Base path | Función |
|-------|-----------|---------|
| `AuthController` | `/api/auth` | Login JWT, `/me` |
| `OrdenTrabajoController` | `/api/ordenes`, `/api/puntos` | CRUD OT, Excel, asignación, mapa |
| `RegistroController` | `/api/registros` | Registro de actividad del capataz |
| `AlertaController` | `/api/alertas` | Alertas operativas por rol |
| `CapatazController` | `/api/capataces` | Alta/listado capataces (admin/supervisor) |
| `TrabajadorController` | `/api/trabajadores` | Ayudantes RRHH |
| `SyncController` | `/api/sync` | Sincronización offline batch |
| `ReporteController` | `/api/reportes` | Diario, mensual, auditoría |
| `CuadrillaController` | `/api/cuadrillas` | Plantilla de cuadrilla |
| `HealthController` | `/api/health` | Health check |
| `AppConfigController` | `/api/config` | Config pública frontend |

### 4.2 Services (`service/`)

| Clase | Responsabilidad |
|-------|-----------------|
| `OrdenTrabajoService` | Consultas OT, historial, coordenadas, cambio estado supervisor |
| `ExcelCargaService` | Preview e importación Excel SEDAPAL / Preventivo VPA |
| `AlertaService` | Generación automática: SIN_ASIGNAR, OBSERVADA, RETRASADA |
| `RegistroController` + servicios aux. | Actividad, ayudantes, evidencias, purgado hidrante |
| `SyncService` | Replay de operaciones móviles offline |
| `AuthService` | Validación credenciales y emisión JWT |
| `CapatazService` | Registro usuario + trabajador capataz |
| `CuadrillaService` | Cuadrillas y miembros |
| `ValidacionFotoService` | Estado validación fotos (integración externa) |
| `EventoService` | Auditoría `op_ot_evento` |

### 4.3 Entidades principales (`entity/`)

| Entidad | Tabla | Descripción |
|---------|-------|-------------|
| `OpOrdenTrabajo` | `op_orden_trabajo` | OT operativa: estado, coords, capataz |
| `ImpOtLote` / `ImpOtFila` | `imp_ot_*` | Trazabilidad importación Excel |
| `OpAlerta` | `op_alerta` | Alertas derivadas del estado de OT |
| `OpOtAcompanante` | `op_ot_acompanante` | Ayudantes por OT |
| `RrhhCapataz` / `RrhhTrabajador` | `rrhh_*` | Personal de campo |
| `GisVpa` / `GisHidrante` | `gis_*` | Base geográfica admin |
| `Usuario` | `usuario` | Cuenta + rol |

---

## 5. Módulos frontend

### 5.1 Rutas (`App.tsx`)

Todas las rutas autenticadas cuelgan de `/` con `Layout` + `PrivateRoute`.

| Ruta | Rol | Pantalla |
|------|-----|----------|
| `/supervisor/*` | supervisor | Dashboard, carga OT, asignar, seguimiento, reportes |
| `/capataz/*` | capataz | Dashboard, mapa, registro, ayudantes, alertas |
| `/dashboard`, `/actividad`, `/ficha`, `/historial` | capataz | Flujo KABJ clásico (catálogo actividades) |
| `/admin/*` | admin | Panel, carga GIS, alertas, mapa |

### 5.2 Servicios cliente

| Archivo | Función |
|---------|---------|
| `services/api.ts` | Cliente Axios y agrupación por dominio |
| `services/offlineDB.ts` | IndexedDB para cola offline |
| `hooks/useOfflineSync.ts` | Sincronización al recuperar red |
| `context/AuthContext.tsx` | Sesión JWT en memoria + localStorage |
| `types/index.ts` | Contratos TypeScript alineados al backend |

### 5.3 Pantallas delicadas (lógica de negocio en UI)

| Componente | Por qué es crítico |
|------------|-------------------|
| `FormularioActividad.tsx` | Cambio de estado OT, ayudantes, offline vs online |
| `MapaPuntos.tsx` | Visualización Leaflet, filtros por estado |
| `AsignarPuntos.tsx` | Asignación supervisor, estados editables |
| `AlertasPage.tsx` | Resolución manual OBSERVADA (admin/supervisor) |
| `CargarOT` / `ExcelCargaService` | Entrada masiva de OT |

---

## 6. Alertas automáticas

`AlertaService.sincronizarDesdeOrdenes()` evalúa todas las OT activas:

| Tipo | Condición | Quién resuelve |
|------|-----------|----------------|
| `SIN_ASIGNAR` | `PENDIENTE` sin capataz | Al asignar capataz (automático) |
| `OBSERVADA` | Estado OT = OBSERVADA | Admin/supervisor manual |
| `RETRASADA` | EN_PROGRESO > 3 días desde `fecha_inicio` | Al avanzar/cerrar OT |

Capataz solo ve alertas `OBSERVADA` y `RETRASADA` de sus OT.

---

## 7. Modo offline (PWA)

1. Capataz guarda registro en IndexedDB (`offlineDB.ts`).
2. Estado OT **no cambia** sin conexión (solo notas locales).
3. Al reconectar, `useOfflineSync` envía batch a `POST /api/sync/operacion`.
4. UI muestra contador en `OfflineBadge` / `BannerOffline`.

---

## 8. Configuración y perfiles

| Perfil / archivo | Uso |
|------------------|-----|
| `application.properties` | Desarrollo con PostgreSQL local |
| `application-local.properties` | H2 en archivo (sin PostgreSQL) — gitignored |
| `application-prod.properties` | Producción — ver `.example` |
| `application-test.properties` | Tests con H2 en memoria |
| `frontend/.env` | `VITE_API_URL`, URLs externas |

Variables sensibles en producción: `PG_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`.

---

## 9. Convenciones para contribuir

### Backend (Java)

- **Controller:** solo HTTP, DTOs y delegación a service.
- **Service:** transacciones `@Transactional`, reglas de negocio.
- **Repository:** consultas JPQL; nombres descriptivos (`findByCapatazActivas`).
- Documentar clases públicas con Javadoc: propósito, rol en el sistema, reglas no obvias.
- Ver `package-info.java` en cada paquete para índice del módulo.

### Frontend (TypeScript)

- Páginas en `pages/{rol}/`; componentes reutilizables en `components/`.
- Llamadas API solo vía `services/api.ts`.
- Tipos compartidos en `types/index.ts`.
- Comentario de archivo (`/** ... */`) en módulos con lógica de negocio.

### Commits y CI

- Push a `main` o PR ejecuta `.github/workflows/ci.yml`.
- Pipeline: `mvn test` (backend) + `npm run lint` + `npm run build` (frontend).
- No mergear si CI falla.

---

## 10. Comandos útiles

```bash
# Backend — tests (H2, sin PostgreSQL)
cd backend/sistema-ot && ./mvnw test

# Frontend — lint + build
cd frontend && npm run lint && npm run build

# Sistema completo (requiere PostgreSQL)
bash start.sh
```

---

## 11. Mapa de dependencias (lectura recomendada)

Para entender el sistema en 1–2 horas, leer en este orden:

1. `README.md` — inicio rápido y credenciales demo
2. Este documento — arquitectura
3. `backend/.../entity/OpOrdenTrabajo.java` — modelo central
4. `backend/.../service/ExcelCargaService.java` — entrada de OT
5. `backend/.../controller/RegistroController.java` — trabajo de campo
6. `frontend/src/services/api.ts` — contrato frontend ↔ API
7. `frontend/src/pages/capataz/FormularioActividad.tsx` — UX crítica capataz
