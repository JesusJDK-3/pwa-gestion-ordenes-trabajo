# KABJ GIS — Sistema de Operaciones de Campo
> PWA para gestión de órdenes de trabajo de campo · SEDAPAL · Mantenimiento de Redes  
> Consultores & Constructores K.A.B.J. S.A.C.

---

## ⚡ Inicio rápido (Git Bash)

```bash
# 1. Primera vez en una PC nueva — configuración automática
bash setup.sh

# 2. Iniciar el sistema completo (backend + frontend)
bash start.sh

# 3. Detener todo
bash stop.sh
```

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Java** (Temurin) | 21 LTS | https://adoptium.net |
| **Node.js** | 18+ | https://nodejs.org |
| **MySQL** | 8.0 | https://dev.mysql.com/downloads |
| **Git Bash** | cualquier | https://gitforwindows.org |

> **MySQL Workbench** (opcional, para visualizar la BD): https://dev.mysql.com/downloads/workbench/

---

## Instalación manual paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/pwa-gestion-ordenes-trabajo.git
cd pwa-gestion-ordenes-trabajo
```

### 2. Configurar MySQL

En MySQL Workbench o en Git Bash:

```bash
# Conectar a MySQL (reemplaza con tu contraseña)
mysql -u root -p

# Dentro de MySQL:
CREATE DATABASE IF NOT EXISTS sistema_ot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

### 3. Configurar el backend

Edita `backend/sistema-ot/src/main/resources/application.properties`:

```properties
# Cambia solo si tu usuario/contraseña de MySQL son diferentes
spring.datasource.username=${MYSQL_USER:root}
spring.datasource.password=${MYSQL_PASSWORD:TU_PASSWORD_AQUI}
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
| **API Docs** (manual) | http://localhost:8080/api/auth/me |

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
├── start.sh                  ← Iniciar sistema completo (Git Bash)
├── stop.sh                   ← Detener sistema
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
    └── bootstrap.sql         ← Schema inicial (auto-generado por JPA)
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
| Base de datos | MySQL 8.0 + Spring Data JPA |
| Excel | Apache POI 5.3 |

---

## Problemas frecuentes

**`bash: start.sh: Permission denied`**
```bash
chmod +x start.sh stop.sh setup.sh
bash start.sh
```

**`Connection refused` al iniciar el backend**
→ MySQL no está corriendo. Inicia el servicio MySQL.

**`npm install` falla con peer deps**
```bash
npm install --legacy-peer-deps
```

**Puerto 8080 ocupado**
→ Edita `backend/sistema-ot/src/main/resources/application.properties`:
```properties
server.port=8081
```
Y actualiza `frontend/.env`:
```
VITE_API_URL=http://localhost:8081
```

**`java` no se reconoce en Git Bash**
→ Agrega Java al PATH en Git Bash:
```bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.x.x"
export PATH="$JAVA_HOME/bin:$PATH"
```

---

## Contacto

Proyecto — Consultores & Constructores K.A.B.J. S.A.C.  
SEDAPAL · Mantenimiento de Redes · Lima, Perú
