# KABJ GIS Field Operations
> PWA para gestión de órdenes de trabajo de campo — Consultores & Constructores K.A.B.J. S.A.C.

---

## Requisitos previos

Instala esto antes de clonar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Java (Temurin) | 21 LTS | https://adoptium.net |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 15+ | https://www.postgresql.org/download |
| Git | cualquier | https://git-scm.com |

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/pwa-gestion-ordenes-trabajo.git
cd pwa-gestion-ordenes-trabajo
```

---

## 2. Configurar la base de datos

1. Abre **pgAdmin** o tu cliente PostgreSQL preferido
2. Crea la base de datos:
```sql
CREATE DATABASE sistema_ot;
```
3. Conéctate a `sistema_ot` y ejecuta el script completo:
```
archivo: sistema_OT_BD_v3.sql
```
Esto creará las 27 tablas con sus relaciones, triggers e índices.

---

## 3. Configurar el Backend

Edita el archivo:
```
backend/sistema-ot/src/main/resources/application.properties
```

Cambia solo el password:
```properties
spring.datasource.password=TU_PASSWORD_POSTGRES
```

> El resto de la configuración ya está lista. No cambies nada más salvo que tu usuario de PostgreSQL no sea `postgres`.

---

## 4. Correr el Backend

```bash
cd backend/sistema-ot
.\mvnw.cmd spring-boot:run        # Windows
./mvnw spring-boot:run            # Mac / Linux
```

La primera vez descarga dependencias (~2 min). Espera ver:
```
Started SistemaOtApplication in X seconds
HikariPool-1 - Start completed.
```
✅ Backend corriendo en: `http://localhost:8080`

---

## 5. Correr el Frontend

Abre **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend corriendo en: `http://localhost:5173`

---

## 6. Flujo de trabajo en equipo (ramas)

```bash
# Crear tu rama de trabajo
git checkout -b feature/nombre-de-lo-que-haces

# Subir cambios
git add .
git commit -m "descripción del cambio"
git push origin feature/nombre-de-lo-que-haces
```

> **Nunca trabajes directo en `main`.** Siempre usa tu rama y luego haz Pull Request.

---

## Estructura del proyecto

```
pwa-gestion-ordenes-trabajo/
├── backend/
│   └── sistema-ot/          ← Spring Boot (Java 21)
│       ├── src/
│       │   └── main/
│       │       ├── java/com/kabj/sistema_ot/
│       │       └── resources/
│       │           └── application.properties  ← EDITAR PASSWORD AQUÍ
│       └── pom.xml
├── frontend/                ← React + TypeScript + Vite
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── sistema_OT_BD_v3.sql     ← Script completo de la BD
└── README.md
```

---

## Stack tecnológico

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS 3
- MapLibre GL (mapas)
- Zustand (estado global)
- React Hook Form
- Axios (HTTP)
- idb (IndexedDB / modo offline)
- vite-plugin-pwa (Service Worker)

**Backend**
- Java 21 + Spring Boot 3.3
- Spring Data JPA + Spring Security
- Apache POI (Excel)
- JWT (autenticación)

**Base de datos**
- PostgreSQL 15+ con PostGIS
- 27 tablas — esquema v3

---

## Roles del sistema

| Rol | Acceso |
|---|---|
| **Supervisor** | Carga Excel, valida OT, asigna capataces, genera reportes |
| **Capataz** | Ejecuta OT en campo, llena formularios, trabaja offline |
| **Administrador** | Gestión de usuarios, roles, cuadrillas y configuración |

---

## Problemas frecuentes

**`java` no se reconoce**
→ Instala Java 21 desde adoptium.net y reinicia la terminal.

**`Connection refused` al correr el backend**
→ PostgreSQL no está corriendo. Inicia el servicio desde pgAdmin o Servicios de Windows.

**`password authentication failed`**
→ Revisa el password en `application.properties`.

**`Schema-validation: missing table`**
→ No ejecutaste el SQL v3. Hazlo desde pgAdmin sobre la BD `sistema_ot`.

**Puerto 8080 ocupado**
→ Cambia `server.port=8081` en `application.properties`.

---

## Contacto del proyecto

Proyecto académico — Consultores & Constructores K.A.B.J. S.A.C.