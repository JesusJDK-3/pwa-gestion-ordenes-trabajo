# Deploy en producción — Supabase + Railway + Vercel

Guía paso a paso para desplegar **KABJ GIS** en la nube.

| Plataforma | Qué aloja |
|------------|-----------|
| **Supabase** | PostgreSQL 15 + PostGIS (base de datos) |
| **Railway** | Backend Spring Boot (API REST) |
| **Vercel** | Frontend PWA (React + Vite) |

**Repositorio:** https://github.com/JesusJDK-3/pwa-gestion-ordenes-trabajo  
**Rama recomendada:** `melany`

---

## Arquitectura

```
┌─────────────┐   HTTPS/JWT    ┌──────────────────┐   JDBC/SSL   ┌─────────────┐
│   Vercel    │ ─────────────► │     Railway      │ ──────────► │  Supabase   │
│  React PWA  │  /api/*        │  Spring Boot     │             │ PostgreSQL  │
└─────────────┘                └──────────────────┘             └─────────────┘
```

---

## Paso 1 — Supabase (base de datos)

### 1.1 Crear proyecto

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Elige región (ej. **South America**).
3. Guarda la **contraseña** de la base de datos (la necesitarás en Railway).

### 1.2 Crear tablas

1. En el proyecto → **SQL Editor** → **New query**.
2. Abre el archivo del repo: `database/bootstrap.sql` (o `sistema_OT_BD_clean.sql`).
3. Copia todo el contenido y **Run**.
4. Verifica en **Table Editor** que existan tablas como `seg_usuario`, `op_orden_trabajo`, etc.

> El script activa `postgis` y `pgcrypto`. Si falla PostGIS, en Supabase ve a **Database → Extensions** y habilita **postgis**.

### 1.3 Obtener cadena de conexión

1. **Settings** → **Database** → **Connection string**.
2. Pestaña **URI**, modo **Session** (puerto **5432**).
3. Copia la URI (reemplaza `[YOUR-PASSWORD]` por tu contraseña real):

```
postgresql://postgres.[REF]:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

Guarda esta URI para el **Paso 2**.

> **Nota:** el plan gratuito pausa el proyecto tras ~7 días sin uso. Para reactivar: Dashboard → **Restore project**.

Plantilla de variables: `backend/sistema-ot/supabase.env.example`

---

## Paso 2 — Railway (backend)

### 2.1 Crear servicio

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Selecciona `pwa-gestion-ordenes-trabajo`.
3. En el servicio → **Settings**:
   - **Root Directory:** `backend/sistema-ot`
   - **Branch:** `melany` (o `main`)

### 2.2 Variables de entorno

**Settings → Variables** → pegar (ajusta valores reales):

| Variable | Valor |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `cloud` |
| `DATABASE_URL` | URI de Supabase del Paso 1.3 |
| `JWT_SECRET` | Clave aleatoria ≥ 32 caracteres |
| `CORS_ALLOWED_ORIGIN` | `https://tu-proyecto.vercel.app` (actualizar tras Paso 3) |
| `SEED_DEMO_DATA` | `true` (primera vez) |
| `JPA_DDL_AUTO` | `validate` (si corriste bootstrap.sql) |
| `VALIDACION_FOTOS_URL` | `http://45.71.33.77/proyecto_lima/` |

> **No** añadas el plugin PostgreSQL de Railway si usas Supabase. Solo un origen de BD.

**Alternativa a `DATABASE_URL`:**

```
PG_URL=jdbc:postgresql://db.xxxxx.supabase.co:5432/postgres?sslmode=require
PGUSER=postgres
PGPASSWORD=tu-password
```

### 2.3 Dominio público

1. **Settings → Networking → Generate Domain**.
2. Copia la URL (ej. `https://sistema-ot-production.up.railway.app`).

### 2.4 Verificar

Abre en el navegador:

```
https://TU-BACKEND.up.railway.app/api/health
```

Respuesta esperada:

```json
{"status":"ok","service":"sistema-ot","timestamp":"..."}
```

Archivos de config en el repo:
- `railway.toml` — build Maven + healthcheck
- `nixpacks.toml` — JDK 21
- `application-cloud.properties` — perfil cloud
- `railway.env.example` — plantilla variables

---

## Paso 3 — Vercel (frontend)

### 3.1 Crear proyecto

1. [vercel.com](https://vercel.com) → **Add New Project** → mismo repo GitHub.
2. **Root Directory:** `frontend`
3. Framework: **Vite** (detectado por `vercel.json`).

### 3.2 Variables de entorno

**Settings → Environment Variables** → Production:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-BACKEND.up.railway.app/api` |
| `VITE_VALIDACION_FOTOS_URL` | `http://45.71.33.77/proyecto_lima/` |

### 3.3 Deploy

1. **Deploy**.
2. Copia la URL final (ej. `https://pwa-gestion-ordenes-trabajo.vercel.app`).

### 3.4 CORS en Railway

Vuelve a **Railway → Variables** y actualiza:

```
CORS_ALLOWED_ORIGIN=https://tu-url-final.vercel.app
```

Railway redeployará automáticamente.

Plantilla: `frontend/vercel.env.example`  
Config: `frontend/vercel.json`

---

## Paso 4 — Probar el sistema

| Acción | Dónde |
|--------|-------|
| Abrir app | URL de Vercel |
| Login demo | `supervisor@ot.com` / `password123` |
| Otros roles | `capataz1@ot.com`, `admin@ot.com` (misma contraseña) |

Solo funcionan si `SEED_DEMO_DATA=true` en el primer deploy.

---

## Orden de despliegue (resumen)

```
1. Supabase  → crear BD + ejecutar bootstrap.sql + copiar DATABASE_URL
2. Railway   → deploy backend + variables + dominio + /api/health OK
3. Vercel    → deploy frontend + VITE_API_URL
4. Railway   → actualizar CORS_ALLOWED_ORIGIN con URL de Vercel
```

---

## Checklist

- [ ] `bootstrap.sql` ejecutado en Supabase SQL Editor
- [ ] Railway: Root Directory = `backend/sistema-ot`
- [ ] Railway: `SPRING_PROFILES_ACTIVE=cloud`
- [ ] Railway: `DATABASE_URL` con contraseña real de Supabase
- [ ] Railway: `/api/health` responde `ok`
- [ ] Vercel: Root Directory = `frontend`
- [ ] Vercel: `VITE_API_URL` termina en `/api`
- [ ] Railway: `CORS_ALLOWED_ORIGIN` = URL exacta de Vercel
- [ ] Login funciona desde la URL de Vercel

---

## Solución de problemas

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| 502 en Railway | BD no conecta | Revisa `DATABASE_URL`, contraseña, proyecto Supabase activo |
| CORS error en navegador | URL Vercel no en CORS | Actualiza `CORS_ALLOWED_ORIGIN` en Railway |
| Login falla | BD vacía sin seed | `SEED_DEMO_DATA=true` o ejecuta bootstrap.sql |
| Supabase pausado | Plan gratuito inactivo | Dashboard → Restore project |
| Frontend sin datos | `VITE_API_URL` mal | Debe ser `https://backend.../api` (con `/api`) |
| `vite: command not found` en Vercel | Root Directory vacío o sin devDependencies | Root Directory = `frontend` **o** usar `vercel.json` en raíz del repo; redeploy |

---

## Archivos de referencia en el repo

| Archivo | Uso |
|---------|-----|
| `database/bootstrap.sql` | Schema inicial en Supabase |
| `backend/sistema-ot/supabase.env.example` | Variables Supabase → Railway |
| `backend/sistema-ot/railway.env.example` | Variables Railway |
| `frontend/vercel.env.example` | Variables Vercel |
| `docs/GUIA-DEPLOY-Y-WORKFLOW.md` | CI, ramas y workflow Git |

---

## Seguridad en producción

Cuando el sistema esté estable:

1. Railway: `SEED_DEMO_DATA=false`
2. Railway: `JWT_SECRET` único y largo (nunca en el repo)
3. Supabase: no compartir `DATABASE_URL` públicamente
4. Cambiar contraseñas demo si se usaron en pruebas
