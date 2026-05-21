-- ============================================================
-- KABJ GIS Field Operations — Bootstrap completo (PostgreSQL)
-- Incluye tablas de seguridad + dominio OT (6 tablas de negocio)
--
-- Uso:
--   psql -U postgres -d sistema_ot -f database/bootstrap.sql
--
-- Con ddl-auto=update, Spring Boot crea/actualiza las tablas
-- automáticamente. Este script es útil para un deploy limpio.
-- ============================================================

-- ── Seguridad ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seg_rol (
    id_rol      BIGSERIAL     PRIMARY KEY,
    codigo      VARCHAR(30)   NOT NULL UNIQUE,
    nombre      VARCHAR(100)  NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seg_usuario (
    id_usuario    BIGSERIAL     PRIMARY KEY,
    id_rol        BIGINT        NOT NULL REFERENCES seg_rol(id_rol),
    username      VARCHAR(60)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    nombres       VARCHAR(100)  NOT NULL,
    apellidos     VARCHAR(100)  NOT NULL,
    foto_url      TEXT,
    activo        BOOLEAN       NOT NULL DEFAULT TRUE,
    ultimo_login  TIMESTAMP,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_username ON seg_usuario(username);
CREATE INDEX IF NOT EXISTS idx_usuario_email    ON seg_usuario(email);

-- ── Órdenes de trabajo ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id          BIGSERIAL     PRIMARY KEY,
    codigo_ot   VARCHAR(50)   NOT NULL,
    descripcion VARCHAR(255),
    fecha_carga DATE,
    supervisor_id BIGINT REFERENCES seg_usuario(id_usuario),
    estado      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVA',
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── Puntos de trabajo ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS puntos_trabajo (
    id          BIGSERIAL     PRIMARY KEY,
    orden_id    BIGINT        REFERENCES ordenes_trabajo(id),
    latitud     NUMERIC(10,7) NOT NULL,
    longitud    NUMERIC(10,7) NOT NULL,
    descripcion VARCHAR(255),
    direccion   VARCHAR(300),
    estado      VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    capataz_id  BIGINT        REFERENCES seg_usuario(id_usuario),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_punto_orden   ON puntos_trabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_punto_capataz ON puntos_trabajo(capataz_id);

-- ── Registros de actividad ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registros_actividad (
    id               BIGSERIAL  PRIMARY KEY,
    punto_id         BIGINT     REFERENCES puntos_trabajo(id),
    capataz_id       BIGINT     REFERENCES seg_usuario(id_usuario),
    tipo_actividad   VARCHAR(100),
    observaciones    TEXT,
    fecha_registro   TIMESTAMP  NOT NULL DEFAULT NOW(),
    datos_adicionales TEXT,
    validado         BOOLEAN    NOT NULL DEFAULT FALSE,
    sincronizado     BOOLEAN    NOT NULL DEFAULT TRUE,
    creado_offline   BOOLEAN    NOT NULL DEFAULT FALSE
);

-- ── Evidencias ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidencias (
    id                  BIGSERIAL  PRIMARY KEY,
    punto_id            BIGINT     REFERENCES puntos_trabajo(id),
    registro_id         BIGINT     REFERENCES registros_actividad(id),
    url_foto            VARCHAR(500),
    sistema_externo_id  VARCHAR(100),
    estado_validacion   VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    created_at          TIMESTAMP  NOT NULL DEFAULT NOW()
);

-- ── Alertas ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alertas (
    id            BIGSERIAL  PRIMARY KEY,
    punto_id      BIGINT     REFERENCES puntos_trabajo(id),
    supervisor_id BIGINT     REFERENCES seg_usuario(id_usuario),
    mensaje       TEXT,
    leida         BOOLEAN    NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP  NOT NULL DEFAULT NOW()
);

INSERT INTO cat_tipo_punto_operativo (codigo, nombre, activo)
VALUES ('VCA',   'Válvula / Cámara de Agua', true),
       ('HIA',   'Hidrante',                 true),
       ('CIVIL', 'Obra Civil General',        true)
ON CONFLICT (codigo) DO NOTHING;


INSERT INTO cat_estado_ot 
(codigo, nombre, descripcion, es_final, orden, activo)
VALUES
('PENDIENTE',   'Pendiente',   'OT pendiente de ejecución',  false, 1, true),
('EN_PROGRESO', 'En Progreso', 'OT en ejecución',            false, 2, true),
('COMPLETADA',  'Completada',  'OT ejecutada correctamente', true,  3, true),
('OBSERVADA',   'Observada',   'OT con observaciones',       false, 4, true),
('ANULADA',     'Anulada',     'OT anulada',                 true,  5, true);

-- ── Nota ──────────────────────────────────────────────────────────────────────
-- El DataInitializer de Spring Boot inserta automáticamente:
--   Roles: SUPERVISOR, CAPATAZ, ADMINISTRADOR
--   Usuarios: supervisor@ot.com, capataz1@ot.com, capataz2@ot.com, admin@ot.com
--   Password para todos: password123
--   2 Órdenes de trabajo con 5 puntos de prueba en Lima
