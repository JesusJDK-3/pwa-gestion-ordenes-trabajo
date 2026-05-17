# KABJ GIS — Sistema de Operaciones de Campo
> PWA para gestión de órdenes de trabajo de campo · SEDAPAL · Mantenimiento de Redes  
> Consultores & Constructores K.A.B.J. S.A.C.

---

## ⚡ Inicio rápido (Git Bash)

```bash
# 1. Primera vez en una PC nueva — configuración automática
bash setup.sh

# 2. Iniciar el sistema completo (PostgreSQL + backend + frontend)
bash start.sh

# 3. Detener todo
bash stop.sh
```

> `start.sh` inicia PostgreSQL automáticamente si está instalado como servicio de Windows.

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Java** (Temurin) | 21 LTS | https://adoptium.net |
| **Node.js** | 18+ | https://nodejs.org |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download/ |
| **Git Bash** | cualquier | https://gitforwindows.org |

> **pgAdmin** (opcional, para visualizar la BD): se instala junto con PostgreSQL.

---

## Instalación manual paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/pwa-gestion-ordenes-trabajo.git
cd pwa-gestion-ordenes-trabajo
```

### 2. Configurar PostgreSQL

En psql, pgAdmin o Git Bash:

```bash
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql:
CREATE DATABASE sistema_ot;
\q
```

### 3. Configurar el backend

Edita `backend/sistema-ot/src/main/resources/application.properties` si tu usuario o contraseña de PostgreSQL son diferentes al valor por defecto:

```properties
# Cambia solo si es necesario
spring.datasource.username=${PG_USER:postgres}
spring.datasource.password=${PG_PASSWORD:admin1234}
```

O pásalos como variables de entorno al ejecutar:

```bash
PG_PASSWORD=mi_contraseña bash start.sh
```

### 4. Instalar dependencias frontend

```bash
cd frontend
npm install --legacy-peer-deps
cd ..
```

### 5. Iniciar el sistema

```bash
bash start.sh
```

---

## URLs del sistema

| Servicio | URL |
|---|---|
| **Frontend PWA** | http://localhost:5173 |
| **Backend API** | http://localhost:8080 |
| **Health check** | http://localhost:8080/api/auth/me |

---

## Credenciales de prueba

> Todos usan la contraseña: **`password123`**

| Email | Rol | Acceso |
|---|---|---|
| `supervisor@ot.com` | SUPERVISOR | Panel supervisor, carga Excel, asignación |
| `capataz1@ot.com` | CAPATAZ | App de campo KABJ GIS (técnico en campo) |
| `capataz2@ot.com` | CAPATAZ | App de campo KABJ GIS (técnico en campo) |
| `admin@ot.com` | ADMINISTRADOR | Panel administrador, reportes, auditoría |

---

## Flujos de usuario

### Capataz / Técnico de campo
```
Login → /dashboard (Seleccionar Actividad)
     → /actividad/:id (Ver subactividades)
     → /ficha/:subId (Ficha técnica + CTA)
     → /capataz/mapa (Mapa GIS con OT activa)
     → /historial (Historial diario)
```

### Supervisor
```
Login → /supervisor (Dashboard + alertas)
     → /supervisor/cargar-ot (Subir Excel)
     → /supervisor/asignar (Asignar capataces)
     → /supervisor/seguimiento (Seguimiento en tiempo real)
```

### Administrador
```
Login → /admin (Panel: actividades, reportes, auditoría)
```

---

## Estructura del proyecto

```
pwa-gestion-ordenes-trabajo/
├── start.sh                  ← Inicia PostgreSQL + backend + frontend
├── stop.sh                   ← Detiene todo
├── setup.sh                  ← Configuración inicial (primera vez)
│
├── backend/
│   └── sistema-ot/           ← Spring Boot (Java 21)
│       ├── src/main/java/com/kabj/sistema_ot/
│       │   ├── controller/   ← REST endpoints
│       │   ├── service/      ← Lógica de negocio
│       │   ├── entity/       ← JPA entities
│       │   ├── security/     ← JWT + filtros
│       │   └── config/       ← DataInitializer, SecurityConfig
│       └── src/main/resources/application.properties
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.tsx         ← Login KABJ
│       │   ├── kabj/                 ← App de campo
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── ActividadPage.tsx
│       │   │   ├── FichaPage.tsx
│       │   │   └── HistorialPage.tsx
│       │   ├── supervisor/           ← Panel supervisor
│       │   └── admin/                ← Panel admin
│       ├── components/kabj/          ← Navbar, HelpButton
│       ├── context/AuthContext.tsx   ← Auth global
│       ├── services/api.ts           ← Axios + JWT
│       ├── types/                    ← TypeScript interfaces
│       └── data/actividades.ts       ← Catálogo SEDAPAL
│
└── database/
    └── bootstrap.sql         ← Schema PostgreSQL (referencia)
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| PWA | vite-plugin-pwa + Service Worker |
| Mapas | Leaflet + React-Leaflet v5 |
| Estado | React Context (auth) + React hooks |
| Backend | Java 21 + Spring Boot 3.5 |
| Seguridad | Spring Security + JWT (jjwt 0.12) |
| Base de datos | **PostgreSQL 14+** + Spring Data JPA |
| Excel | Apache POI 5.3 |

---

## Problemas frecuentes

**`bash: start.sh: Permission denied`**
```bash
chmod +x start.sh stop.sh setup.sh
bash start.sh
```

**`PostgreSQL no responde en localhost:5432`**
```bash
# Windows — ajusta el número de versión (14, 15, 16, 17…)
net start postgresql-x64-17

# Linux
sudo systemctl start postgresql

# O pasa la versión instalada a start.sh:
PG_PORT=5433 bash start.sh
```

**`Connection refused` al iniciar el backend**  
→ La base de datos `sistema_ot` no existe. Créala:
```bash
psql -U postgres -c "CREATE DATABASE sistema_ot;"
```

**Contraseña de PostgreSQL distinta al default**
```bash
PG_PASSWORD=mi_contraseña bash start.sh
# O ejecuta setup.sh para guardarla permanentemente
bash setup.sh
```

**`npm install` falla con peer deps**
```bash
npm install --legacy-peer-deps
```

**Puerto 8080 ocupado**  
Edita `backend/sistema-ot/src/main/resources/application.properties`:
```properties
server.port=8081
```
Y actualiza `frontend/.env`:
```
VITE_API_URL=http://localhost:8081
```

**`java` no se reconoce en Git Bash**
```bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.x.x"
export PATH="$JAVA_HOME/bin:$PATH"
```

---

## Contacto

Proyecto — Consultores & Constructores K.A.B.J. S.A.C.  
SEDAPAL · Mantenimiento de Redes · Lima, Perú
