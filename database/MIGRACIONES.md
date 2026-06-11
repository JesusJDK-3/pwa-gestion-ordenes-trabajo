# Aplicar Migraciones: Acompañantes y Purgado

## 📋 Resumen

Este directorio contiene los scripts para aplicar dos nuevas tablas y funciones a la base de datos PostgreSQL:

1. **`op_ot_acompanante`** - Tabla para registrar trabajadores que acompañan al capataz en una OT (máx 10)
2. **`op_ot_purgado_hidrante`** - Tabla para datos técnicos del purgado de hidrantes

## 🔧 Requisitos Previos

- **PostgreSQL 15+** instalado y corriendo en `localhost:5432`
- **Usuario**: `postgres` (o el configurado en `application.properties`)
- **Contraseña**: `melcita123` (o la configurada en `application.properties`)
- **Base de datos**: `sistema_ot` (debe existir)
- **pgSQL client**: Debe estar en el PATH del sistema

## 📁 Archivos Disponibles

| Archivo | Descripción | Cómo usar |
|---------|-------------|----------|
| `apply_migrations_manual.sql` | Script SQL con el comando `\echo` para seguimiento | `psql -f apply_migrations_manual.sql` |
| `add_acompanantes_purgado.sql` | Script SQL original sin comandos interactivos | `psql -f add_acompanantes_purgado.sql` |
| `apply_migrations.bat` | Script batch de Windows | `apply_migrations.bat` |
| `apply_migrations.ps1` | Script PowerShell | `.\apply_migrations.ps1` |
| `apply_migrations.py` | Script Python (requiere `psycopg2`) | `python apply_migrations.py` |

## 🚀 Ejecución

### Opción 1: Script Batch (Windows - Más Simple)

```batch
cd database
apply_migrations.bat
```

### Opción 2: PowerShell

```powershell
cd database
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\apply_migrations.ps1
```

### Opción 3: Línea de Comandos (Windows CMD)

```batch
set PGPASSWORD=melcita123
psql -h localhost -U postgres -d sistema_ot -f database/apply_migrations_manual.sql
```

### Opción 4: Línea de Comandos (PowerShell)

```powershell
$env:PGPASSWORD = "melcita123"
psql -h localhost -U postgres -d sistema_ot -f database/apply_migrations_manual.sql
```

### Opción 5: Python (Requiere psycopg2)

```bash
pip install psycopg2-binary
cd database
python apply_migrations.py
```

## ✅ Verificación Manual en PostgreSQL

Si prefieres ejecutar las migraciones manualmente en pgAdmin o psql interactivo:

```sql
-- Conectar a la BD sistema_ot primero

-- Crear tabla de acompañantes
CREATE TABLE op_ot_acompanante (
    id_ot_acompanante   BIGSERIAL    PRIMARY KEY,
    id_ot               BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    id_trabajador       BIGINT       REFERENCES rrhh_trabajador(id_trabajador),
    dni                 VARCHAR(8),
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    cargo               VARCHAR(100) DEFAULT 'AYUDANTE',
    rol                 VARCHAR(30)  NOT NULL DEFAULT 'AYUDANTE',
    orden_en_lista      INT          NOT NULL DEFAULT 0,
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (id_ot, id_trabajador) WHERE id_trabajador IS NOT NULL,
    CHECK (id_trabajador IS NOT NULL OR dni IS NOT NULL)
);

-- Crear tabla de purgado
CREATE TABLE op_ot_purgado_hidrante (
    id_purgado                  BIGSERIAL    PRIMARY KEY,
    id_ot_formulario            BIGINT       NOT NULL REFERENCES op_ot_formulario(id_ot_formulario),
    id_ot                       BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    marca_hidrante              VARCHAR(100),
    numero_bocamazas            INT,
    presion_psi_hidrante        DECIMAL(10,2),
    tiempo_inicio_purgado       TIMESTAMP,
    tiempo_fin_purgado          TIMESTAMP,
    medicion_cloro_ppm          DECIMAL(10,2),
    observaciones               TEXT,
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (id_ot_formulario)
);

-- Verificar creación
\dt op_ot_acompanante
\dt op_ot_purgado_hidrante
```

## 🔍 Verificación de Éxito

Después de ejecutar las migraciones, deberías ver:

```
[✓] Tabla op_ot_acompanante creada
[✓] Tabla op_ot_purgado_hidrante creada
[✓] Función fn_validar_limite_acompanantes creada
[✓] Función fn_validar_purgado_obligatorios creada
[✓] Migraciones aplicadas exitosamente
```

Además, puedes verificar manualmente:

```sql
-- Verificar tablas
\dt op_ot_acompanante
\dt op_ot_purgado_hidrante

-- Verificar funciones
\df fn_validar_limite_acompanantes
\df fn_validar_purgado_obligatorios

-- Verificar índices
\di idx_ot_acompanante*
\di idx_purgado*
```

## 🐛 Solución de Problemas

### Error: "psql not found"
- PostgreSQL no está en el PATH
- Solución: Agrega `C:\Program Files\PostgreSQL\15\bin` al PATH del sistema

### Error: "database sistema_ot does not exist"
- La base de datos no existe
- Solución: Ejecuta primero `sistema_OT_BD_v3.sql` para crear la BD

### Error de conexión
- PostgreSQL no está corriendo
- Solución: Inicia el servicio de PostgreSQL desde Services o línea de comandos

### Error: "relation op_orden_trabajo does not exist"
- Las tablas base no existen aún
- Solución: Ejecuta primero `sistema_OT_BD_v3.sql`

## 📝 Configuración de Conexión

Los scripts usan esta configuración (del `application.properties`):

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/sistema_ot
spring.datasource.username=postgres
spring.datasource.password=melcita123
```

Para cambiar los parámetros de conexión, edita los scripts batch/PowerShell.

## 📦 Contenido de las Migraciones

### Tabla: `op_ot_acompanante`

- Registra trabajadores que acompañan al capataz en una OT
- Máximo 10 acompañantes por OT (validado por trigger)
- Rol predefinido como "AYUDANTE" (no seleccionable)
- Soporta trabajadores existentes (FK) o nuevos (DNI)

**Campos principales:**
- `id_ot` - Referencia a la OT
- `id_trabajador` - Trabajador existente (opcional)
- `dni` - DNI para trabajadores nuevos (obligatorio si no hay FK)
- `nombres`, `apellidos` - Datos del trabajador
- `rol` - Siempre "AYUDANTE"
- `orden_en_lista` - Orden visual

### Tabla: `op_ot_purgado_hidrante`

- Datos técnicos del purgado de hidrantes
- Se relaciona con formularios de tipo "PURGADO_HIDRANTE"
- Validación de campos obligatorios cuando el formulario está completo

**Campos principales:**
- `id_ot_formulario` - Formulario técnico asociado
- `id_ot` - Referencia a la OT
- `marca_hidrante` - Marca del hidrante
- `numero_bocamazas` - Cantidad de bocamazas
- `presion_psi_hidrante` - Presión en PSI
- `tiempo_inicio_purgado`, `tiempo_fin_purgado` - Duración del purgado
- `medicion_cloro_ppm` - Medición del cloro

### Funciones Trigger

1. **`fn_validar_limite_acompanantes()`**
   - Valida máximo 10 acompañantes por OT
   - Se ejecuta en INSERT

2. **`fn_validar_purgado_obligatorios()`**
   - Valida campos obligatorios cuando formulario está COMPLETADO
   - Se ejecuta en INSERT y UPDATE

## 🎯 Próximos Pasos

1. ✅ Ejecutar migraciones
2. ✅ Verificar tablas creadas
3. 📝 Actualizar modelos JPA en el backend (entidades Java)
4. 📝 Crear repositorios y servicios para las nuevas tablas
5. 📝 Actualizar endpoints REST para CRUD de acompañantes y purgado
6. 📝 Actualizar frontend para mostrar formularios

## 📞 Soporte

Si tienes problemas:

1. Verifica que PostgreSQL esté corriendo
2. Confirma los datos de conexión en `application.properties`
3. Asegúrate de que la BD base (sistema_ot) existe
4. Ejecuta `SELECT version();` en psql para confirmar conexión
5. Verifica los logs en `backend.log` y `backend-err.log`
