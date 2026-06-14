# Informe Técnico — KABJ GIS  
## Sistema de Gestión de Órdenes de Trabajo de Campo

**Proyecto:** PWA de operaciones de campo  
**Cliente / contexto:** SEDAPAL · Mantenimiento de Redes  
**Organización:** Consultores & Constructores K.A.B.J. S.A.C.  
**Repositorio:** https://github.com/JesusJDK-3/pwa-gestion-ordenes-trabajo  

> Este documento en Markdown vive en Git junto al código. Puede exportarse a Word para entregas formales (portada, firma, anexos con capturas).

---

## 1. Introducción

### 1.1 Planteamiento del problema

La gestión de órdenes de trabajo (OT) en campo requiere coordinar supervisores (planificación e importación masiva), capataces (ejecución en terreno con mapa y registro offline) y administradores (base de datos GIS, usuarios y auditoría). Los procesos manuales con Excel y comunicación dispersa generan retrasos, OT sin asignar y falta de trazabilidad.

### 1.2 Objetivo general

Desarrollar una **Progressive Web App (PWA)** integrada con una **API REST** que permita importar OT, asignar responsables, registrar actividad en campo con mapa GIS, alertas operativas e integración continua en GitHub.

### 1.3 Objetivos específicos

- Importación de OT desde Excel (formatos SEDAPAL / Preventivo VPA).
- Asignación de capataces y georreferencia de puntos.
- Registro de actividad, ayudantes y cambio de estados OT en campo.
- Modo offline con sincronización posterior.
- Roles: supervisor, capataz y administrador.
- Pipeline CI automatizado (tests backend + lint/build frontend).

---

## 2. Alcance del sistema

### 2.1 Funcionalidades incluidas

| Módulo | Descripción |
|--------|-------------|
| Autenticación JWT | Login por rol, sesión stateless |
| Órdenes de trabajo | CRUD operativo, estados, historial |
| Excel | Preview e importación masiva |
| Mapa Leaflet | Visualización OT por estado (capataz/supervisor/admin) |
| Alertas | SIN_ASIGNAR, OBSERVADA, RETRASADA |
| Offline | IndexedDB + sync batch |
| Reportes | Diario, mensual, auditoría |
| CI | GitHub Actions en ramas `main` y `melany` |

### 2.2 Fuera de alcance (referencia)

- App nativa iOS/Android independiente (se usa PWA instalable).
- ERP contable completo.
- Firma digital legal de documentos.

---

## 3. Metodología y herramientas

### 3.1 Stack tecnológico

| Capa | Tecnología | Versión referencia |
|------|------------|-------------------|
| Frontend | React + TypeScript + Vite | React 19, Vite 8 |
| Estilos | Tailwind CSS | 3.4 |
| PWA | vite-plugin-pwa | Service Worker |
| Mapas | Leaflet + React-Leaflet | 1.9 / 5.0 |
| Backend | Spring Boot | 3.5 |
| Lenguaje servidor | Java | 21 LTS |
| Persistencia | Spring Data JPA | — |
| Base de datos prod | PostgreSQL | 14+ |
| Seguridad | Spring Security + JWT | jjwt 0.12 |
| Excel | Apache POI | 5.3 |
| CI | GitHub Actions | — |

### 3.2 Control de versiones

- **Git** + **GitHub**
- Rama de integración: `melany`
- Rama estable: `main`
- Documentación en `docs/` y `README.md`

---

## 4. Diseño del sistema

### 4.1 Arquitectura general

```
┌─────────────┐     HTTPS/JWT    ┌──────────────────┐     JPA     ┌──────────────┐
│  React PWA  │ ◄──────────────► │  Spring Boot API │ ◄─────────► │  PostgreSQL  │
│  (Vite)     │     /api/*       │  (Java 21)       │             │  sistema_ot  │
└─────────────┘                  └──────────────────┘             └──────────────┘
       │                                   │
 IndexedDB (offline)                  Apache POI (Excel)
```

Detalle ampliado: [ARCHITECTURE.md](ARCHITECTURE.md).

### 4.2 Modelo de roles

| Rol | Responsabilidad principal |
|-----|---------------------------|
| **Supervisor** | Importar OT, asignar capataces, georreferencia, monitoreo |
| **Capataz** | Mapa operativo, registro de actividad, ayudantes, offline |
| **Admin** | Alta de capataces, base GIS, alertas, auditoría |

### 4.3 Ciclo de vida de una OT

| Estado | Significado |
|--------|-------------|
| `PENDIENTE` | OT importada; trabajo no iniciado |
| `EN_PROGRESO` | Capataz registró inicio en campo |
| `OBSERVADA` | Incidencia documentada |
| `COMPLETADA` | Cierre con observaciones |
| `ANULADA` | Cancelada por supervisor |

Flujo: **Excel → PENDIENTE → asignar capataz → EN_PROGRESO → COMPLETADA**.

### 4.4 Estructura del repositorio

```
pwa-gestion-ordenes-trabajo/
├── backend/sistema-ot/     # API Spring Boot
├── frontend/               # PWA React
├── database/               # bootstrap.sql (esquema referencia)
├── docs/                   # Documentación técnica
├── .github/workflows/      # CI
├── README.md
├── start.sh / setup.sh
```

---

## 5. Implementación

### 5.1 Backend — capas principales

| Paquete | Función |
|---------|---------|
| `controller` | Endpoints REST, autorización `@PreAuthorize` |
| `service` | Reglas de negocio (OT, Excel, alertas, sync) |
| `entity` / `repository` | Modelo JPA y consultas |
| `security` | JWT, filtros, rate limit login |

Servicios críticos: `ExcelCargaService`, `OrdenTrabajoService`, `RegistroController`, `AlertaService`, `SyncService`.

### 5.2 Frontend — módulos principales

| Ruta / módulo | Función |
|---------------|---------|
| `services/api.ts` | Cliente HTTP centralizado |
| `services/offlineDB.ts` | Cola offline IndexedDB |
| `pages/capataz/` | Mapa, formulario actividad, ayudantes |
| `pages/supervisor/` | Dashboard, Excel, asignación, seguimiento |
| `pages/admin/` | Panel administración |

### 5.3 Seguridad

- Autenticación **JWT Bearer** en cada request protegido.
- Autorización por rol en backend (no solo en UI).
- CORS restringido a origen configurado.
- Variables sensibles vía entorno (`JWT_SECRET`, `PG_PASSWORD`).

---

## 6. Pruebas y calidad

### 6.1 Integración continua

Workflow `.github/workflows/ci.yml`:

| Job | Validación |
|-----|------------|
| Backend | `mvn test` con H2 |
| Frontend | ESLint + build Vite |

### 6.2 Pruebas backend

- Tests unitarios (Mockito): `AuthServiceTest`, `OrdenTrabajoServiceTest`
- Tests web: `AuthControllerTest`
- Smoke test contexto: `SistemaOtApplicationTests`

### 6.3 Pruebas manuales recomendadas

| Caso | Rol | Resultado esperado |
|------|-----|-------------------|
| Login | Todos | Redirección según rol |
| Importar Excel | Supervisor | OT en estado PENDIENTE |
| Asignar capataz | Supervisor | OT visible en panel capataz |
| Registrar actividad | Capataz | PENDIENTE → EN_PROGRESO |
| Offline | Capataz | Cola local y sync al reconectar |

---

## 7. Despliegue

Guía operativa: [GUIA-DEPLOY-Y-WORKFLOW.md](GUIA-DEPLOY-Y-WORKFLOW.md).

Resumen:

1. Configurar PostgreSQL y variables de entorno (`SPRING_PROFILES_ACTIVE=prod`).
2. Build backend: `mvn package` → JAR.
3. Build frontend: `npm run build` → `dist/`.
4. Servir `dist/` y proxy `/api` con Nginx (HTTPS).

---

## 8. Conclusiones

Se implementó una PWA full-stack para gestión de OT de campo con separación clara de roles, mapa operativo, soporte offline y pipeline CI. La documentación técnica reside en el repositorio Git (`README.md`, `docs/`) con comentarios Javadoc/JSDoc en código crítico, facilitando mantenimiento y onboarding de nuevos desarrolladores.

---

## 9. Trabajo futuro

- Deploy automatizado (GitHub Actions → servidor).
- Tests E2E (Playwright/Cypress).
- Iconos PWA nativos 192/512 px.
- Endurecer validación transaccional en importación Excel.

---

## 10. Referencias

- Documentación en repo: `README.md`, `docs/ARCHITECTURE.md`, `docs/GUIA-DEPLOY-Y-WORKFLOW.md`
- Spring Boot: https://spring.io/projects/spring-boot
- React: https://react.dev
- Leaflet: https://leafletjs.com

---

## Anexo A — Credenciales demo (solo desarrollo)

Contraseña para todos: **`password123`**

| Email | Rol |
|-------|-----|
| `supervisor@ot.com` | Supervisor |
| `capataz1@ot.com` | Capataz |
| `capataz2@ot.com` | Capataz |
| `admin@ot.com` | Administrador |

**No usar en producción.** Configurar `SEED_DEMO_DATA=false` en servidor real.
