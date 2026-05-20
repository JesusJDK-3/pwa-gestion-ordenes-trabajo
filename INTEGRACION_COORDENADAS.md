# Integración de Coordenadas VPA e Hidrantes - Documentación

## 📋 Estructura Implementada

### Nuevas Entidades JPA
1. **GisVpa** (`gis_vpa` tabla)
   - `idVpa`: PK auto-generado
   - `vca`: Código único del punto de agua
   - `nis`: Relaciona con Hidrantes (unique)
   - `longitud`, `latitud`: Coordenadas
   - Timestamps: `created_at`, `updated_at`

2. **GisHidrante** (`gis_hidrante` tabla)
   - `idHidrante`: PK auto-generado
   - `hia`: Código hidrante único
   - `suministro`: ID único (se relaciona con OT)
   - `direccion`, `localidad`, `distrito`, `sector`: Datos geográficos
   - `longitud`, `latitud`: Coordenadas
   - Timestamps

3. **OpOrdenTrabajo** (modificada)
   - ✅ Agregado campo `hia` (String, 50 chars) - Hidrante
   - ✅ Agregado campo `vca` (String, 50 chars) - Punto de Agua
   - ✅ Agregado campo `suministro` (String, 50 chars) - Para usos futuros
   - ✅ Agregado campo `localidad` (String, 100 chars)
   - Mantiene `latitud`, `longitud` para almacenar coordenadas encontradas
   - Mantiene `nis` (String, 30 chars) para propósitos informativos

### Nuevos Repositorios
- `GisVpaRepository`: Búsqueda por VCA y NIS
- `GisHidranteRepository`: Búsqueda por HIA y SUMINISTRO

### Mejorado ExcelCargaService
1. **`cargarVpaExcel(file)`**
   - Lee: VCA, NIS, LONGITUD, LATITUD
   - Valida duplicados por VCA

2. **`cargarHidranteExcel(file)`**
   - Lee: HIA, SUMINISTRO, DIRECCIÓN, LOCALIDAD, DISTRITO, SECTOR, LONGITUD, LATITUD
   - Valida duplicados por SUMINISTRO

3. **`cargarExcel(file, username)`** (MEJORADO)
   - Lee OT: ITEM, OT, SUMINISTRO, SGIO, DIRECCIÓN, LOCALIDAD, DISTRITO, SECTOR, FECHA
   - **Busca SUMINISTRO en tabla `gis_hidrante`**
   - Si encuentra Hidrante: trae coords + datos geográficos
   - Si no encuentra: usa datos del Excel

### Nuevos Endpoints REST

#### Para Admin (Carga de referencia)
```
POST /api/admin/vpa/carga-excel
  - Body: multipart file (bd_vpa.xlsx)
  - Response: {creadas, duplicadas, errores, detalle}

POST /api/admin/hidrantes/carga-excel
  - Body: multipart file (bd_hidrantes.xlsx)
  - Response: {creadas, duplicadas, errores, detalle}
```

#### Para Supervisor (Carga de OT)
```
POST /api/ordenes/carga-excel
  - Body: multipart file (OT.xlsx) + auth
  - Response: {creadas, duplicadas, errores, detalle}
  - ⚠️ AQUÍ se relacionan con Hidrantes automáticamente
```

---

## 🔄 Flujo de Trabajo

### 1️⃣ Admin sube Coordenadas (Una sola vez)
```
POST /api/admin/vpa/carga-excel
↓ Guarda en: gis_vpa (VCA, NIS, coords)

POST /api/admin/hidrantes/carga-excel
↓ Guarda en: gis_hidrante (HIA, coords + datos geográficos)
```

### 2️⃣ Supervisor sube OT (Repetidas)
```
POST /api/ordenes/carga-excel
↓
Para cada OT:
  1. Lee HIA, VCA, NIS del Excel (Prioridad: HIA > VCA > NIS)
  2. PRIORIDAD 1: Si HIA existe → busca en gis_hidrante
     ✓ Encontrado → copia coords + localidad/distrito/sector
  3. PRIORIDAD 2: Si HIA vacío/no existe → busca VCA en gis_vpa
     ✓ Encontrado → copia coords
  4. PRIORIDAD 3: Si HIA y VCA no funcionan → busca NIS en gis_vpa
     ⚠️ Solo si NIS no está vacío y no es "FALTA"
     ✓ Encontrado → obtiene VCA y coords
  5. Si ninguno funciona → usa datos del Excel como fallback
  6. Guarda OT con coordenadas automáticas
```

---

## 🗄️ Estructura Base de Datos

**Todas las tablas e índices están ya integrados en `sistema_OT_BD_clean.sql`**

### Nuevo Schema (automáticamente creado):

#### 1. Tabla `gis_vpa` (Puntos de Agua)
```sql
CREATE TABLE gis_vpa (
    id_vpa bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    vca varchar(50) NOT NULL UNIQUE,
    nis varchar(50) NOT NULL UNIQUE,
    longitud numeric(11,8),
    latitud numeric(10,8),
    created_at timestamp,
    updated_at timestamp
);
```

#### 2. Tabla `gis_hidrante` (Hidrantes)
```sql
CREATE TABLE gis_hidrante (
    id_hidrante bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    hia varchar(50) NOT NULL UNIQUE,
    suministro varchar(50) NOT NULL UNIQUE,
    direccion varchar(255),
    localidad varchar(100),
    distrito varchar(100),
    sector varchar(100),
    longitud numeric(11,8),
    latitud numeric(10,8),
    created_at timestamp,
    updated_at timestamp
);
```

#### 3. Campos agregados a `op_orden_trabajo`
```sql
hia varchar(50)          -- Hidrante (PRIORIDAD 1)
vca varchar(50)          -- Punto de Agua (PRIORIDAD 2)
suministro varchar(50)   -- Campo informativo
localidad varchar(100)   -- Datos geográficos
```

#### 4. Índices (para búsquedas rápidas)
```sql
CREATE INDEX idx_gis_vpa_vca ON gis_vpa(vca);
CREATE INDEX idx_gis_vpa_nis ON gis_vpa(nis);
CREATE INDEX idx_gis_hidrante_hia ON gis_hidrante(hia);
CREATE INDEX idx_gis_hidrante_suministro ON gis_hidrante(suministro);
CREATE INDEX idx_op_orden_trabajo_hia ON op_orden_trabajo(hia);
CREATE INDEX idx_op_orden_trabajo_vca ON op_orden_trabajo(vca);
CREATE INDEX idx_op_orden_trabajo_suministro ON op_orden_trabajo(suministro);
```

---

## 📝 Estructura de Excel Esperada

### bd_vpa.xlsx
```
Columna | Encabezado | Ejemplo
A       | VCA        | VCA-654
B       | NIS        | 7234580
C       | LONGITUD   | -77.086307
D       | LATITUD    | -11.874489
```

### bd_hidrantes.xlsx
```
Columna | Encabezado  | Ejemplo
A       | HIA         | HIA-26745
B       | SUMINISTRO  | 7208015
C       | DIRECCIÓN   | AV REVOLUCIÓN 1990
D       | LOCALIDAD   | URB SAN EULOGIO
E       | DISTRITO    | COMAS
F       | SECTOR      | 338
G       | LONGITUD    | -77.086307
H       | LATITUD     | -11.874489
```

### OT.xlsx (CON NUEVA ESTRUCTURA)
```
Columna | Encabezado  | Ejemplo      | Descripción
A       | ITEM        | 1            | Número de fila
B       | OT          | 23227        | SGIO (código único)
C       | HIA         | HIA-26745    | ← PRIORIDAD 1 (Hidrante)
D       | VCA         | VCA-654      | ← PRIORIDAD 2 (Punto Agua)
E       | NIS         | 7234580      | ← PRIORIDAD 3 (fallback si HIA/VCA vacíos)
F       | DIRECCIÓN   | AV REV 1990  | (fallback si no existe HIA/VCA)
G       | LOCALIDAD   | URB EULOGIO  | (fallback)
H       | DISTRITO    | COMAS        | (fallback)
I       | SECTOR      | 338          | (fallback)
J       | FECHA       | 2026-05-20   | Fecha programada
```

**Nota sobre NIS:**
- Se busca en `gis_vpa` SOLO si:
  - NIS está lleno (no vacío)
  - Y no es igual a "FALTA" (case-insensitive)
- Si NIS es vacío o "FALTA" → se ignora, se avanza a fallback
```

---

## 🚀 Pasos para Implementar

### ✅ Backend
- ✅ Entidades GisVpa, GisHidrante creadas
- ✅ Repositorios creados
- ✅ ExcelCargaService mejorado con lógica prioritaria
- ✅ Endpoints añadidos
- ⏳ Compilar y desplegar

### ✅ Base de Datos
- ✅ **TODO está integrado en `sistema_OT_BD_clean.sql`**
  - Nuevos campos en `op_orden_trabajo`: hia, vca, suministro, localidad
  - Nuevas tablas: `gis_vpa`, `gis_hidrante`
  - Índices creados automáticamente

**Opción A: Usar el script limpio (RECOMENDADO)**
```bash
# Borra la BD y la recrea desde cero con todo incluido
psql -U postgres -d postgres -f sistema_OT_BD_clean.sql
```

**Opción B: Si quieres solo agregar sin borrar**
```bash
# No recomendado, mejor hacer backup y recrear
```

### 🔧 Compilar Backend
```bash
cd backend/sistema-ot
mvn clean package
```

---

## ✅ Testing

### Admin carga VPA
```bash
curl -X POST http://localhost:8080/api/admin/vpa/carga-excel \
  -F "file=@bd_vpa.xlsx"
```

### Admin carga Hidrantes
```bash
curl -X POST http://localhost:8080/api/admin/hidrantes/carga-excel \
  -F "file=@bd_hidrantes.xlsx"
```

### Supervisor carga OT (con relación automática)
```bash
curl -X POST http://localhost:8080/api/ordenes/carga-excel \
  -H "Authorization: Bearer <token>" \
  -F "file=@OT.xlsx"
```

---

## 📌 Lógica de Relación Prioritaria

La OT se relaciona en este ORDEN:

1. **HIA (Hidrante)** - PRIORIDAD 1
   - Si tiene valor → busca en `gis_hidrante.hia`
   - Si encuentra → trae coords + dirección/localidad/distrito/sector

2. **VCA (Punto de Agua)** - PRIORIDAD 2
   - Si HIA está vacío o no existe → busca en `gis_vpa.vca`
   - Si encuentra → trae coords

3. **NIS (fallback)** - PRIORIDAD 3
   - Si HIA y VCA no funcionan → busca en `gis_vpa.nis`
   - ⚠️ **SOLO si NIS no está vacío Y no es "FALTA"**
   - Si encuentra → obtiene VCA y sus coords

4. **Excel fallback** - ÚLTIMA OPCIÓN
   - Si ninguno funciona → usa datos del Excel como fallback
   - Coordenadas pueden quedar NULL
- **SUMINISTRO** es un campo informativo adicional (no se usa para relación)
- Los índices aceleran búsquedas por HIA, VCA, NIS
- `localidad` se agregó a `op_orden_trabajo` para consistencia
