-- ====================================================================
--  BASE DE DATOS — SISTEMA OT v3
--  Motor: PostgreSQL 15+
--  Tablas: 27
--    + imp_gis_lote / imp_gis_fila     (carga Excel GIS)
--    + op_cuadrilla                    (cuadrilla plantilla del capataz)
--    + op_cuadrilla_miembro_plantilla  (miembros fijos de la plantilla)
--    + op_ot_evidencia                 (fotos adjuntadas por el capataz)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====================================================================
--  MÓDULO 1: SEGURIDAD
-- ====================================================================

CREATE TABLE seg_rol (
    id_rol      BIGSERIAL    PRIMARY KEY,
    codigo      VARCHAR(30)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO seg_rol (codigo, nombre, descripcion) VALUES
    ('supervisor', 'Supervisor',    'Carga OT desde Excel y supervisa el avance del equipo de campo'),
    ('capataz',    'Capataz',       'Registra actividades en campo y llena formularios por punto'),
    ('admin',      'Administrador', 'Acceso total: reportes, auditoría y gestión del sistema');


CREATE TABLE seg_usuario (
    id_usuario    BIGSERIAL    PRIMARY KEY,
    id_rol        BIGINT       NOT NULL REFERENCES seg_rol(id_rol),
    username      VARCHAR(60)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    nombres       VARCHAR(100) NOT NULL,
    apellidos     VARCHAR(100) NOT NULL,
    foto_url      TEXT,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_login  TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ====================================================================
--  MÓDULO 2: RECURSOS HUMANOS
-- ====================================================================

CREATE TABLE rrhh_trabajador (
    id_trabajador   BIGSERIAL    PRIMARY KEY,
    dni             VARCHAR(8)   NOT NULL UNIQUE,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(210) GENERATED ALWAYS AS (nombres || ' ' || apellidos) STORED,
    cargo           VARCHAR(100),
    telefono        VARCHAR(15),
    foto_url        TEXT,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);


CREATE TABLE rrhh_capataz (
    id_capataz     BIGSERIAL   PRIMARY KEY,
    id_usuario     BIGINT      NOT NULL UNIQUE REFERENCES seg_usuario(id_usuario),
    id_trabajador  BIGINT      NOT NULL UNIQUE REFERENCES rrhh_trabajador(id_trabajador),
    codigo_capataz VARCHAR(20) NOT NULL UNIQUE,
    activo         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);


-- ====================================================================
--  MÓDULO 2B: CUADRILLA PLANTILLA
--
--  op_cuadrilla: grupo base de trabajadores que normalmente acompaña
--  al capataz. Es la plantilla de la que parte la confirmación diaria.
--
--  op_cuadrilla_miembro_plantilla: trabajadores que integran esa plantilla.
--
--  FLUJO:
--  Admin crea op_cuadrilla para un capataz →
--  agrega miembros a op_cuadrilla_miembro_plantilla →
--  cada día, cuando el capataz abre la jornada, el sistema
--  pre-carga esos miembros en op_jornada_miembro para que el
--  capataz solo confirme asistencia (presente/ausente/reemplazo)
--  sin tener que armar la lista desde cero.
-- ====================================================================

CREATE TABLE op_cuadrilla (
    id_cuadrilla   BIGSERIAL    PRIMARY KEY,
    id_capataz     BIGINT       NOT NULL UNIQUE REFERENCES rrhh_capataz(id_capataz),
    -- UNIQUE: un capataz tiene una sola cuadrilla plantilla
    nombre         VARCHAR(100) NOT NULL,
    -- Ej: 'Cuadrilla Climner - Sector Norte'
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);


CREATE TABLE op_cuadrilla_miembro_plantilla (
    id_miembro_plantilla BIGSERIAL PRIMARY KEY,
    id_cuadrilla         BIGINT    NOT NULL REFERENCES op_cuadrilla(id_cuadrilla),
    id_trabajador        BIGINT    NOT NULL REFERENCES rrhh_trabajador(id_trabajador),
    cargo_en_cuadrilla   VARCHAR(100),
    -- Puede diferir del cargo general del trabajador
    activo               BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (id_cuadrilla, id_trabajador)
    -- Un trabajador no puede estar dos veces en la misma plantilla
);


-- ====================================================================
--  MÓDULO 3: CATÁLOGOS
-- ====================================================================

CREATE TABLE cat_tipo_punto_operativo (
    id_tipo_punto BIGSERIAL    PRIMARY KEY,
    codigo        VARCHAR(30)  NOT NULL UNIQUE,
    -- 'VCA' = Válvula/Cámara de Agua, 'HIA' = Hidrante, 'CIVIL' = Obra Civil
    nombre        VARCHAR(100) NOT NULL,
    descripcion   TEXT,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO cat_tipo_punto_operativo (codigo, nombre) VALUES
    ('VCA',  'Válvula / Cámara de Agua'),
    ('HIA',  'Hidrante'),
    ('CIVIL','Obra Civil General');


CREATE TABLE cat_subactividad (
    id_subactividad BIGSERIAL    PRIMARY KEY,
    codigo          VARCHAR(30)  NOT NULL UNIQUE,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);


CREATE TABLE cat_subactividad_punto_operativo (
    id_subactividad_punto BIGSERIAL PRIMARY KEY,
    id_subactividad       BIGINT    NOT NULL REFERENCES cat_subactividad(id_subactividad),
    id_tipo_punto         BIGINT    NOT NULL REFERENCES cat_tipo_punto_operativo(id_tipo_punto),
    activo                BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (id_subactividad, id_tipo_punto)
);


CREATE TABLE cat_estado_ot (
    id_estado_ot BIGSERIAL    PRIMARY KEY,
    codigo       VARCHAR(30)  NOT NULL UNIQUE,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    es_final     BOOLEAN      NOT NULL DEFAULT FALSE,
    orden        INT          NOT NULL DEFAULT 0,
    activo       BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO cat_estado_ot (codigo, nombre, es_final, orden) VALUES
    ('PENDIENTE',   'Pendiente',   FALSE, 1),
    ('EN_PROGRESO', 'En Progreso', FALSE, 2),
    ('OBSERVADA',   'Observada',   FALSE, 3),
    ('COMPLETADA',  'Completada',  TRUE,  4),
    ('ANULADA',     'Anulada',     TRUE,  5);


CREATE TABLE cat_formulario (
    id_formulario   BIGSERIAL    PRIMARY KEY,
    id_subactividad BIGINT       NOT NULL REFERENCES cat_subactividad(id_subactividad),
    codigo          VARCHAR(30)  NOT NULL UNIQUE,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    version         INT          NOT NULL DEFAULT 1,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);


CREATE TABLE cat_formulario_campo (
    id_formulario_campo BIGSERIAL    PRIMARY KEY,
    id_formulario       BIGINT       NOT NULL REFERENCES cat_formulario(id_formulario),
    codigo_campo        VARCHAR(50)  NOT NULL,
    nombre_campo        VARCHAR(150) NOT NULL,
    tipo_dato           VARCHAR(30)  NOT NULL,
    -- 'texto', 'numero', 'decimal', 'fecha', 'booleano', 'lista'
    obligatorio         BOOLEAN      NOT NULL DEFAULT TRUE,
    orden               INT          NOT NULL DEFAULT 0,
    opciones_json       JSONB,
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (id_formulario, codigo_campo)
);


-- ====================================================================
--  MÓDULO 4: GIS — PUNTOS OPERATIVOS
-- ====================================================================

CREATE TABLE gis_punto_operativo (
    id_punto_operativo    BIGSERIAL     PRIMARY KEY,
    id_tipo_punto         BIGINT        NOT NULL REFERENCES cat_tipo_punto_operativo(id_tipo_punto),
    -- Tipo: VCA, HIA, CIVIL
    codigo_punto          VARCHAR(30),
    -- 'VCA-3748' o 'HIA-2781' — viene del Excel GIS, es el campo de cruce con OT
    nis                   VARCHAR(30),
    -- NIS (VCA) o SUMINISTRO (HIA) — segundo campo de cruce
    direccion             TEXT,
    localidad             VARCHAR(100),
    distrito              VARCHAR(100),
    sector                VARCHAR(100),
    latitud               DECIMAL(10,8) NOT NULL,
    longitud              DECIMAL(11,8) NOT NULL,
    geom                  GEOMETRY(Point, 4326),
    origen_registro       VARCHAR(30)   DEFAULT 'EXCEL_GIS',
    -- 'EXCEL_GIS' = cargado desde imp_gis_lote
    -- 'MANUAL'    = ingresado a mano por supervisor
    estado_validacion_gis VARCHAR(20)   DEFAULT 'VALIDADO',
    observacion           TEXT,
    id_gis_lote           BIGINT,
    -- FK a imp_gis_lote — se agrega con ALTER TABLE después de crear imp_gis_lote
    creado_por            BIGINT        REFERENCES seg_usuario(id_usuario),
    validado_por          BIGINT        REFERENCES seg_usuario(id_usuario),
    created_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
    validated_at          TIMESTAMP,
    activo                BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_gis_geom         ON gis_punto_operativo USING GIST(geom);
CREATE INDEX idx_gis_nis          ON gis_punto_operativo(nis);
CREATE INDEX idx_gis_codigo_punto ON gis_punto_operativo(codigo_punto);

-- Trigger: sincroniza geom con lat/lng automáticamente
CREATE OR REPLACE FUNCTION fn_sync_geom_punto()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_geom_punto
BEFORE INSERT OR UPDATE OF latitud, longitud
ON gis_punto_operativo
FOR EACH ROW EXECUTE FUNCTION fn_sync_geom_punto();


-- ====================================================================
--  MÓDULO 5: IMPORTACIÓN GIS DESDE EXCEL  ← NUEVO
--
--  El admin sube el Excel de coordenadas (BD_VPA.xlsx o BD_HIDRANTES.xlsx).
--  El sistema carga los puntos en imp_gis_fila, luego sincroniza
--  gis_punto_operativo desde el lote activo.
--  Para actualizar: se sube un nuevo Excel → el lote anterior pasa
--  a REEMPLAZADO → gis_punto_operativo se regenera desde el nuevo lote.
-- ====================================================================

CREATE TABLE imp_gis_lote (
    id_lote         BIGSERIAL    PRIMARY KEY,
    tipo_catalogo   VARCHAR(10)  NOT NULL,
    -- 'VCA' = BD_VPA.xlsx | 'HIA' = BD_HIDRANTES.xlsx
    nombre_archivo  VARCHAR(255) NOT NULL,
    archivo_url     TEXT,
    id_usuario      BIGINT       NOT NULL REFERENCES seg_usuario(id_usuario),
    -- Admin que subió el archivo
    estado          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    -- 'ACTIVO'      = es el lote vigente para este tipo_catalogo
    -- 'REEMPLAZADO' = fue reemplazado por uno más nuevo
    -- 'ERROR'       = falló la carga
    total_registros INT          NOT NULL DEFAULT 0,
    registros_ok    INT          NOT NULL DEFAULT 0,
    registros_error INT          NOT NULL DEFAULT 0,
    observacion     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Solo puede haber UN lote ACTIVO por tipo_catalogo
CREATE UNIQUE INDEX idx_gis_lote_activo
    ON imp_gis_lote(tipo_catalogo)
    WHERE estado = 'ACTIVO';

-- FK diferida: ahora que imp_gis_lote existe, se enlaza con gis_punto_operativo
ALTER TABLE gis_punto_operativo
    ADD CONSTRAINT fk_gis_punto_lote
    FOREIGN KEY (id_gis_lote) REFERENCES imp_gis_lote(id_lote);


CREATE TABLE imp_gis_fila (
    id_gis_fila    BIGSERIAL     PRIMARY KEY,
    id_lote        BIGINT        NOT NULL REFERENCES imp_gis_lote(id_lote),
    numero_fila    INT           NOT NULL,
    -- Número de fila en el Excel original
    codigo_punto   VARCHAR(30)   NOT NULL,
    -- 'VCA-3748' o 'HIA-2781' — clave de cruce con el Excel de OT
    nis            VARCHAR(30),
    -- NIS (en VCA) o SUMINISTRO (en HIA)
    direccion      TEXT,
    localidad      VARCHAR(100),
    distrito       VARCHAR(100),
    sector         VARCHAR(100),
    longitud       DECIMAL(11,8) NOT NULL,
    latitud        DECIMAL(10,8) NOT NULL,
    tipo_punto     VARCHAR(10)   NOT NULL,
    -- 'VCA' o 'HIA' — heredado del lote
    estado_fila    VARCHAR(20)   NOT NULL DEFAULT 'OK',
    -- 'OK'    = coordenadas válidas, fila sincronizada a gis_punto_operativo
    -- 'ERROR' = coordenada inválida o dato faltante
    mensaje_error  TEXT,
    -- FK al punto operativo generado desde esta fila
    id_punto_operativo BIGINT    REFERENCES gis_punto_operativo(id_punto_operativo),
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gis_fila_lote   ON imp_gis_fila(id_lote);
CREATE INDEX idx_gis_fila_codigo ON imp_gis_fila(codigo_punto);


-- Función que sincroniza gis_punto_operativo desde un lote GIS recién activado.
-- El backend llama a: SELECT fn_sincronizar_gis_lote(<id_lote>);
-- después de insertar todas las filas en imp_gis_fila.
CREATE OR REPLACE FUNCTION fn_sincronizar_gis_lote(p_id_lote BIGINT)
RETURNS void AS $$
DECLARE
    v_tipo    VARCHAR(10);
    v_usuario BIGINT;
    v_tipo_id BIGINT;
BEGIN
    SELECT tipo_catalogo, id_usuario
      INTO v_tipo, v_usuario
      FROM imp_gis_lote
     WHERE id_lote = p_id_lote;

    SELECT id_tipo_punto INTO v_tipo_id
      FROM cat_tipo_punto_operativo
     WHERE codigo = v_tipo;

    -- 1. Desactivar puntos del lote anterior de este tipo
    UPDATE gis_punto_operativo
       SET activo = FALSE, updated_at = NOW()
     WHERE id_tipo_punto = v_tipo_id
       AND origen_registro = 'EXCEL_GIS';

    -- 2. Insertar/actualizar desde las filas del nuevo lote
    INSERT INTO gis_punto_operativo (
        id_tipo_punto, codigo_punto, nis, direccion, localidad,
        distrito, sector, latitud, longitud, origen_registro,
        estado_validacion_gis, id_gis_lote, creado_por, activo
    )
    SELECT
        v_tipo_id,
        f.codigo_punto, f.nis, f.direccion, f.localidad,
        f.distrito, f.sector, f.latitud, f.longitud,
        'EXCEL_GIS', 'VALIDADO', p_id_lote, v_usuario, TRUE
    FROM imp_gis_fila f
    WHERE f.id_lote = p_id_lote
      AND f.estado_fila = 'OK'
    ON CONFLICT DO NOTHING;

    -- 3. Actualizar FK en imp_gis_fila → id_punto_operativo generado
    UPDATE imp_gis_fila f
       SET id_punto_operativo = g.id_punto_operativo
      FROM gis_punto_operativo g
     WHERE f.id_lote = p_id_lote
       AND f.codigo_punto = g.codigo_punto
       AND g.id_gis_lote  = p_id_lote;

    -- 4. Actualizar contadores del lote
    UPDATE imp_gis_lote
       SET registros_ok    = (SELECT COUNT(*) FROM imp_gis_fila WHERE id_lote = p_id_lote AND estado_fila = 'OK'),
           registros_error = (SELECT COUNT(*) FROM imp_gis_fila WHERE id_lote = p_id_lote AND estado_fila = 'ERROR'),
           total_registros = (SELECT COUNT(*) FROM imp_gis_fila WHERE id_lote = p_id_lote),
           updated_at      = NOW()
     WHERE id_lote = p_id_lote;

END;
$$ LANGUAGE plpgsql;


-- ====================================================================
--  MÓDULO 6: IMPORTACIÓN DE OT DESDE EXCEL
-- ====================================================================

CREATE TABLE imp_ot_lote (
    id_lote               BIGSERIAL    PRIMARY KEY,
    nombre_archivo        VARCHAR(255) NOT NULL,
    archivo_url           TEXT,
    fecha_carga           TIMESTAMP    NOT NULL DEFAULT NOW(),
    periodo               VARCHAR(20),
    fecha_programada      DATE,
    id_supervisor_usuario BIGINT       NOT NULL REFERENCES seg_usuario(id_usuario),
    id_subactividad       BIGINT       REFERENCES cat_subactividad(id_subactividad),
    id_tipo_punto         BIGINT       REFERENCES cat_tipo_punto_operativo(id_tipo_punto),
    id_capataz            BIGINT       REFERENCES rrhh_capataz(id_capataz),
    estado_lote           VARCHAR(20)  NOT NULL DEFAULT 'PROCESANDO',
    -- 'PROCESANDO' → 'VALIDADO' → 'IMPORTADO' | 'CON_ERRORES'
    total_filas           INT          NOT NULL DEFAULT 0,
    filas_correctas       INT          NOT NULL DEFAULT 0,
    filas_advertencia     INT          NOT NULL DEFAULT 0,
    filas_error           INT          NOT NULL DEFAULT 0,
    filas_duplicadas      INT          NOT NULL DEFAULT 0,
    filas_coord_manual    INT          NOT NULL DEFAULT 0,
    observacion           TEXT,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);


CREATE TABLE imp_ot_fila (
    id_fila                     BIGSERIAL     PRIMARY KEY,
    id_lote                     BIGINT        NOT NULL REFERENCES imp_ot_lote(id_lote),
    numero_fila_excel            INT           NOT NULL,
    sgio                        VARCHAR(50)   NOT NULL UNIQUE,
    nis                          VARCHAR(30),
    hia_codigo                  VARCHAR(50),
    -- 'HIA-2781' — se cruza con imp_gis_fila.codigo_punto (tipo HIA)
    vca_codigo                  VARCHAR(50),
    -- 'VCA-3748' — se cruza con imp_gis_fila.codigo_punto (tipo VCA)
    direccion_excel              TEXT,
    localidad_excel              VARCHAR(100),
    distrito_excel               VARCHAR(100),
    sector_excel                 VARCHAR(100),
    fecha_programada             DATE,
    estado_validacion            VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    -- 'PENDIENTE', 'CORRECTO', 'ADVERTENCIA', 'ERROR', 'DUPLICADO'
    mensaje_validacion           TEXT,
    id_punto_operativo_resuelto  BIGINT        REFERENCES gis_punto_operativo(id_punto_operativo),
    -- Se llena al cruzar hia_codigo o vca_codigo con gis_punto_operativo.codigo_punto
    requiere_revision            BOOLEAN       NOT NULL DEFAULT FALSE,
    requiere_coordenada_manual   BOOLEAN       NOT NULL DEFAULT FALSE,
    -- TRUE si no se encontró coincidencia en GIS
    latitud_manual               DECIMAL(10,8),
    longitud_manual              DECIMAL(11,8),
    direccion_manual             TEXT,
    referencia_manual            TEXT,
    observacion_manual           TEXT,
    created_at                   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMP     NOT NULL DEFAULT NOW()
);


CREATE TABLE imp_ot_validacion (
    id_validacion     BIGSERIAL    PRIMARY KEY,
    id_fila           BIGINT       NOT NULL REFERENCES imp_ot_fila(id_fila),
    codigo_validacion VARCHAR(30)  NOT NULL,
    -- 'CODIGO_NO_ENCONTRADO', 'COORD_INVALIDA', 'SGIO_DUPLICADO', 'FECHA_PASADA'
    tipo_validacion   VARCHAR(20)  NOT NULL,
    -- 'ERROR', 'ADVERTENCIA', 'INFO'
    mensaje           TEXT         NOT NULL,
    resuelto          BOOLEAN      NOT NULL DEFAULT FALSE,
    resuelto_por      BIGINT       REFERENCES seg_usuario(id_usuario),
    fecha_resolucion  TIMESTAMP,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ====================================================================
--  MÓDULO 7: OPERACIONES — JORNADAS Y ÓRDENES DE TRABAJO
-- ====================================================================

CREATE TABLE op_jornada_campo (
    id_jornada    BIGSERIAL    PRIMARY KEY,
    id_capataz    BIGINT       NOT NULL REFERENCES rrhh_capataz(id_capataz),
    fecha_jornada DATE         NOT NULL,
    estado        VARCHAR(20)  NOT NULL DEFAULT 'ABIERTA',
    -- 'ABIERTA', 'CERRADA', 'CONFIRMADA'
    hora_inicio   TIMESTAMP,
    hora_fin      TIMESTAMP,
    confirmada    BOOLEAN      NOT NULL DEFAULT FALSE,
    observacion   TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (id_capataz, fecha_jornada)
);


CREATE TABLE op_jornada_miembro (
    id_jornada_miembro BIGSERIAL    PRIMARY KEY,
    id_jornada         BIGINT       NOT NULL REFERENCES op_jornada_campo(id_jornada),
    id_trabajador      BIGINT       NOT NULL REFERENCES rrhh_trabajador(id_trabajador),
    dni                VARCHAR(8)   NOT NULL,
    nombres            VARCHAR(100) NOT NULL,
    apellidos          VARCHAR(100) NOT NULL,
    cargo              VARCHAR(100),
    estado_asistencia  VARCHAR(20)  NOT NULL DEFAULT 'PRESENTE',
    -- 'PRESENTE', 'AUSENTE', 'TARDANZA'
    es_reemplazo       BOOLEAN      NOT NULL DEFAULT FALSE,
    observacion        TEXT,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (id_jornada, id_trabajador)
);


CREATE TABLE op_orden_trabajo (
    id_ot                   BIGSERIAL     PRIMARY KEY,
    sgio                    VARCHAR(50)   NOT NULL UNIQUE,
    id_lote                 BIGINT        REFERENCES imp_ot_lote(id_lote),
    id_fila_importacion     BIGINT        UNIQUE REFERENCES imp_ot_fila(id_fila),
    id_subactividad         BIGINT        NOT NULL REFERENCES cat_subactividad(id_subactividad),
    id_tipo_punto           BIGINT        NOT NULL REFERENCES cat_tipo_punto_operativo(id_tipo_punto),
    id_punto_operativo      BIGINT        REFERENCES gis_punto_operativo(id_punto_operativo),
    nis                     VARCHAR(30),
    id_capataz              BIGINT        NOT NULL REFERENCES rrhh_capataz(id_capataz),
    id_cuadrilla            BIGINT        REFERENCES op_cuadrilla(id_cuadrilla),
    id_asistente            BIGINT        REFERENCES rrhh_trabajador(id_trabajador),
    id_jornada              BIGINT        REFERENCES op_jornada_campo(id_jornada),
    id_estado_ot            BIGINT        NOT NULL REFERENCES cat_estado_ot(id_estado_ot),
    fecha_programada        DATE,
    fecha_inicio            TIMESTAMP,
    fecha_fin               TIMESTAMP,
    fecha_cierre            DATE,
    direccion               TEXT,
    distrito                VARCHAR(100),
    sector                  VARCHAR(100),
    latitud                 DECIMAL(10,8),
    longitud                DECIMAL(11,8),
    geom                    GEOMETRY(Point, 4326),
    visible_en_mapa         BOOLEAN       NOT NULL DEFAULT TRUE,
    estado_sincronizacion   VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    -- 'PENDIENTE', 'SINCRONIZADO', 'ERROR_SYNC'
    estado_validacion_fotos VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    -- 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'BLOQUEADO'
    observacion             TEXT,
    created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
    cerrada_at              TIMESTAMP,
    activo                  BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_ot_capataz      ON op_orden_trabajo(id_capataz);
CREATE INDEX idx_ot_mapa         ON op_orden_trabajo(id_capataz, visible_en_mapa);
CREATE INDEX idx_ot_cuadrilla    ON op_orden_trabajo(id_cuadrilla);
CREATE INDEX idx_ot_asistente    ON op_orden_trabajo(id_asistente);
CREATE INDEX idx_ot_estado       ON op_orden_trabajo(id_estado_ot);
CREATE INDEX idx_ot_fecha_cierre ON op_orden_trabajo(fecha_cierre);
CREATE INDEX idx_ot_jornada      ON op_orden_trabajo(id_jornada);
CREATE INDEX idx_ot_geom         ON op_orden_trabajo USING GIST(geom);

-- Trigger: cierre automático al pasar a estado final
CREATE OR REPLACE FUNCTION fn_gestionar_cierre_ot()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id_estado_ot <> OLD.id_estado_ot THEN
        IF EXISTS (
            SELECT 1 FROM cat_estado_ot
            WHERE id_estado_ot = NEW.id_estado_ot AND es_final = TRUE
        ) THEN
            NEW.visible_en_mapa := FALSE;
            NEW.fecha_cierre    := CURRENT_DATE;
            NEW.cerrada_at      := NOW();
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gestionar_cierre_ot
BEFORE UPDATE ON op_orden_trabajo
FOR EACH ROW EXECUTE FUNCTION fn_gestionar_cierre_ot();


CREATE TABLE op_ot_evento (
    id_evento       BIGSERIAL    PRIMARY KEY,
    id_ot           BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    tipo_evento     VARCHAR(50)  NOT NULL,
    -- 'CAMBIO_ESTADO', 'ASIGNACION', 'SINCRONIZACION', 'VALIDACION_FOTO', 'ALERTA_GENERADA'
    estado_anterior VARCHAR(30),
    estado_nuevo    VARCHAR(30),
    descripcion     TEXT,
    id_usuario      BIGINT       REFERENCES seg_usuario(id_usuario),
    fecha_evento    TIMESTAMP    NOT NULL DEFAULT NOW(),
    origen          VARCHAR(20)  NOT NULL DEFAULT 'WEB',
    -- 'WEB', 'MOVIL', 'SISTEMA'
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ====================================================================
--  MÓDULO 8: FORMULARIOS DE CAMPO
-- ====================================================================

CREATE TABLE op_ot_formulario (
    id_ot_formulario    BIGSERIAL    PRIMARY KEY,
    id_ot               BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    id_formulario       BIGINT       NOT NULL REFERENCES cat_formulario(id_formulario),
    version_formulario  INT          NOT NULL DEFAULT 1,
    estado_formulario   VARCHAR(20)  NOT NULL DEFAULT 'EN_PROGRESO',
    -- 'EN_PROGRESO', 'COMPLETADO', 'OBSERVADO'
    fecha_inicio        TIMESTAMP,
    fecha_fin           TIMESTAMP,
    completado          BOOLEAN      NOT NULL DEFAULT FALSE,
    id_usuario_registro BIGINT       REFERENCES seg_usuario(id_usuario),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (id_ot, id_formulario)
);


CREATE TABLE op_ot_formulario_respuesta (
    id_respuesta         BIGSERIAL     PRIMARY KEY,
    id_ot_formulario     BIGINT        NOT NULL REFERENCES op_ot_formulario(id_ot_formulario),
    id_formulario_campo  BIGINT        NOT NULL REFERENCES cat_formulario_campo(id_formulario_campo),
    codigo_campo         VARCHAR(50)   NOT NULL,
    valor_texto          TEXT,
    valor_numero         INT,
    valor_decimal        DECIMAL(15,4),
    valor_fecha          DATE,
    valor_booleano       BOOLEAN,
    valor_json           JSONB,
    created_at           TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (id_ot_formulario, id_formulario_campo)
);


-- ====================================================================
--  MÓDULO 9: VALIDACIÓN DE FOTOS
-- ====================================================================

CREATE TABLE op_ot_validacion_foto (
    id_validacion_foto     BIGSERIAL    PRIMARY KEY,
    id_ot                  BIGINT       NOT NULL UNIQUE REFERENCES op_orden_trabajo(id_ot),
    estado_validacion      VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    -- 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'ERROR'
    bloqueada              BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE = la OT no puede cerrarse hasta tener todas las fotos
    fecha_validacion       TIMESTAMP,
    resultado_json         JSONB,
    fotos_requeridas_json  JSONB,
    fotos_encontradas_json JSONB,
    fotos_faltantes_json   JSONB,
    mensaje_error          TEXT,
    intentos               INT          NOT NULL DEFAULT 0,
    validado_por_proceso   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Trigger: actualiza 'bloqueada' al recibir resultado del sistema externo
CREATE OR REPLACE FUNCTION fn_actualizar_bloqueo_foto()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fotos_faltantes_json IS NOT NULL
       AND jsonb_array_length(NEW.fotos_faltantes_json) > 0 THEN
        NEW.bloqueada         := TRUE;
        NEW.estado_validacion := 'RECHAZADO';
    ELSE
        NEW.bloqueada := FALSE;
        IF NEW.estado_validacion <> 'ERROR' THEN
            NEW.estado_validacion := 'APROBADO';
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_bloqueo_foto
BEFORE INSERT OR UPDATE OF fotos_faltantes_json
ON op_ot_validacion_foto
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_bloqueo_foto();


-- ====================================================================
--  MÓDULO 9B: EVIDENCIAS DE CAMPO
--
--  El capataz adjunta fotos desde la PWA al llenar el formulario.
--  Cada foto es un registro aquí: se guarda la URL (en el servidor
--  o en almacenamiento externo) y el tipo de foto requerido por
--  el formulario (foto_antes, foto_durante, foto_despues, etc.).
--
--  El sistema externo de validación de fotos compara las fotos
--  requeridas (definidas en cat_formulario_campo) contra las
--  encontradas en su sistema. Esta tabla da trazabilidad de qué
--  subió el capataz desde la PWA.
--
--  RELACIÓN:
--  op_orden_trabajo ──(1)──→──(N)── op_ot_evidencia
-- ====================================================================

CREATE TABLE op_ot_evidencia (
    id_evidencia    BIGSERIAL    PRIMARY KEY,
    id_ot           BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    id_ot_formulario BIGINT      REFERENCES op_ot_formulario(id_ot_formulario),
    -- Formulario al que pertenece esta foto (puede ser NULL si es evidencia general)
    tipo_foto       VARCHAR(50)  NOT NULL,
    -- 'foto_antes', 'foto_durante', 'foto_despues', 'foto_general'
    -- Debe coincidir con codigo_campo en cat_formulario_campo tipo 'foto'
    url_archivo     TEXT         NOT NULL,
    -- URL donde se almacenó la foto (servidor propio o storage externo)
    nombre_archivo  VARCHAR(255),
    tamano_bytes    INT,
    latitud_foto    DECIMAL(10,8),
    longitud_foto   DECIMAL(11,8),
    -- Coordenadas GPS del celular al momento de tomar la foto
    tomada_offline  BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE si fue adjuntada sin internet y luego sincronizada
    sincronizada    BOOLEAN      NOT NULL DEFAULT FALSE,
    -- FALSE mientras esté pendiente de subir al servidor
    id_usuario      BIGINT       REFERENCES seg_usuario(id_usuario),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidencia_ot ON op_ot_evidencia(id_ot);


-- ====================================================================
--  MÓDULO 10: SINCRONIZACIÓN OFFLINE → ONLINE
-- ====================================================================

CREATE TABLE sync_operacion_movil (
    id_sync_operacion    BIGSERIAL    PRIMARY KEY,
    client_op_uuid       UUID         NOT NULL UNIQUE,
    -- UUID generado en el celular con crypto.randomUUID() — evita duplicados
    id_usuario           BIGINT       NOT NULL REFERENCES seg_usuario(id_usuario),
    id_ot                BIGINT       REFERENCES op_orden_trabajo(id_ot),
    tipo_operacion       VARCHAR(50)  NOT NULL,
    -- 'GUARDAR_FORMULARIO', 'COMPLETAR_PUNTO', 'ADJUNTAR_EVIDENCIA'
    payload_json         JSONB        NOT NULL,
    estado_sync          VARCHAR(20)  NOT NULL DEFAULT 'RECIBIDO',
    -- 'RECIBIDO', 'PROCESANDO', 'PROCESADO', 'ERROR'
    intentos             INT          NOT NULL DEFAULT 0,
    mensaje_error        TEXT,
    created_at_cliente   TIMESTAMP    NOT NULL,
    received_at_servidor TIMESTAMP    NOT NULL DEFAULT NOW(),
    processed_at         TIMESTAMP
);

CREATE INDEX idx_sync_pendientes ON sync_operacion_movil(estado_sync, created_at_cliente)
    WHERE estado_sync IN ('RECIBIDO', 'ERROR');
CREATE INDEX idx_sync_usuario    ON sync_operacion_movil(id_usuario);


-- ====================================================================
--  FIN DEL ESQUEMA
--
--  TABLAS: 27
--    Seguridad     : seg_rol, seg_usuario
--    RRHH          : rrhh_trabajador, rrhh_capataz
--    Cuadrilla     : op_cuadrilla, op_cuadrilla_miembro_plantilla     ← NUEVO v3
--    Catálogos     : cat_tipo_punto_operativo, cat_subactividad,
--                    cat_subactividad_punto_operativo, cat_estado_ot,
--                    cat_formulario, cat_formulario_campo
--    GIS           : gis_punto_operativo
--    Import GIS    : imp_gis_lote, imp_gis_fila                       ← NUEVO v2
--    Import OT     : imp_ot_lote, imp_ot_fila, imp_ot_validacion
--    Operaciones   : op_jornada_campo, op_jornada_miembro,
--                    op_orden_trabajo, op_ot_evento
--    Formularios   : op_ot_formulario, op_ot_formulario_respuesta
--    Evidencias    : op_ot_evidencia                                   ← NUEVO v3
--    Validac. foto : op_ot_validacion_foto
--    Sync          : sync_operacion_movil
--
--  TRIGGERS : 4 (sync_geom, cierre_ot, bloqueo_foto)
--  FUNCIONES: 4 (incluye fn_sincronizar_gis_lote)
--  ÍNDICES  : 15
-- ====================================================================
