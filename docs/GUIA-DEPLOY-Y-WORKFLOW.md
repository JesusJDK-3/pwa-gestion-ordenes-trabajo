# Guía de workflow, CI y deploy — KABJ GIS

> Documento operativo para el equipo. Complementa [ARCHITECTURE.md](ARCHITECTURE.md) y el [README](../README.md).

**Repositorio:** https://github.com/JesusJDK-3/pwa-gestion-ordenes-trabajo

---

## 1. Ramas y flujo de trabajo

| Rama | Propósito |
|------|-----------|
| **`main`** | Rama estable (producción tras merge) |
| **`melany`** | Integración de cambios antes de merge a `main` |

### Comandos habituales

```bash
git clone https://github.com/JesusJDK-3/pwa-gestion-ordenes-trabajo.git
cd pwa-gestion-ordenes-trabajo
git checkout melany
git pull origin melany

# Trabajar, commitear y subir
git add .
git commit -m "descripción del cambio"
git push origin melany

# Cuando esté listo: Pull Request melany → main en GitHub
```

### Credenciales GitHub

- Usa la cuenta con permiso de escritura en el repo.
- La contraseña al hacer push debe ser un **Personal Access Token (PAT)**, no la contraseña de la cuenta.
- Si falla con otra cuenta, borra credenciales viejas en **Administrador de credenciales** (Windows).

---

## 2. Integración continua (CI)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Se ejecuta en push/PR hacia: **`main`**, **`master`**, **`melany`**.

| Job | Qué valida |
|-----|------------|
| **Backend** | JDK 21 → `mvn test` (H2, sin PostgreSQL) |
| **Frontend** | Node 20 → `npm ci` → `lint` → `build` |

Ver estado: GitHub → pestaña **Actions**.

### Probar localmente antes de push

```bash
cd backend/sistema-ot && ./mvnw test
cd frontend && npm ci --legacy-peer-deps && npm run lint && npm run build
```

---

## 3. Entornos: local vs producción

| Entorno | Perfil | Base de datos |
|---------|--------|---------------|
| Desarrollo | (default) | PostgreSQL local |
| Dev sin PostgreSQL | `local` | H2 en disco (`application-local.properties`, gitignored) |
| Producción | `prod` | PostgreSQL servidor |
| Tests / CI | — | H2 memoria (`src/test/resources/application.properties`) |

### Variables backend (producción)

| Variable | Descripción |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE=prod` | Activa perfil producción |
| `PG_USER` / `PG_PASSWORD` | Credenciales PostgreSQL |
| `JWT_SECRET` | Clave ≥ 32 caracteres |
| `CORS_ALLOWED_ORIGIN` | URL del frontend (HTTPS) |
| `SEED_DEMO_DATA=false` | Sin usuarios demo en prod |

Plantilla: `backend/sistema-ot/src/main/resources/application-prod.properties.example`

### Variables frontend (producción)

Plantilla: `frontend/.env.production.example` → copiar a `.env.production`

```env
VITE_API_URL=https://tu-dominio.com/api
```

Build: `cd frontend && npm run build` → salida en `frontend/dist/`

---

## 4. Deploy en Supabase + Railway + Vercel

Guía completa paso a paso: **[DEPLOY-SUPABASE-RAILWAY-VERCEL.md](DEPLOY-SUPABASE-RAILWAY-VERCEL.md)**

| Plataforma | Componente | Archivos clave |
|------------|------------|----------------|
| **Supabase** | PostgreSQL + PostGIS | `database/README.md` |
| **Railway** | Backend Spring Boot | `railway.toml`, `application-cloud.properties`, `supabase.env.example` |
| **Vercel** | Frontend PWA | `vercel.json`, `vercel.env.example` |

### Orden de despliegue

```
Supabase (BD + SQL) → Railway (backend) → Vercel (frontend) → CORS en Railway
```

### Variables mínimas

**Railway** (`backend/sistema-ot/railway.env.example`):

| Variable | Ejemplo |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | `cloud` |
| `PG_URL` | JDBC de Supabase con `sslmode=require` |
| `PGUSER` | Usuario de Supabase |
| `PGPASSWORD` | Password de Supabase |
| `JWT_SECRET` | clave ≥ 32 caracteres |
| `CORS_ALLOWED_ORIGIN` | `https://tu-app.vercel.app` |
| `JPA_DDL_AUTO` | `validate` (con scripts SQL completos) |
| `SEED_DEMO_DATA` | `true` (primera vez) |

**Vercel** (`frontend/vercel.env.example`):

| Variable | Ejemplo |
|----------|---------|
| `VITE_API_URL` | `https://xxx.up.railway.app/api` |
| `VITE_VALIDACION_FOTOS_URL` | URL portal S COMAS |

Credenciales demo: `supervisor@ot.com` / `password123`

---

## 5. Checklist de deploy

**Antes del merge a `main`**

- [ ] CI en verde
- [ ] Sin secretos en el repo (`.env`, `application-prod.properties` gitignored)
- [ ] Schema BD aplicado si es instalación nueva (`database/README.md`)

**En cloud (Supabase + Railway + Vercel)**

- [ ] Guía [DEPLOY-SUPABASE-RAILWAY-VERCEL.md](DEPLOY-SUPABASE-RAILWAY-VERCEL.md) completada
- [ ] `/api/health` OK en Railway
- [ ] Login OK desde URL de Vercel

**En servidor propio (alternativa)**
- [ ] Reverse proxy (Nginx) sirviendo `dist/` y proxy `/api` → `:8080`
- [ ] HTTPS activo

---

## 6. Documentación relacionada

| Documento | Contenido |
|-----------|-----------|
| [README.md](../README.md) | Inicio rápido e instalación |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura técnica detallada |
| [INFORME-TECNICO.md](INFORME-TECNICO.md) | Informe técnico (base para entrega Word) |
