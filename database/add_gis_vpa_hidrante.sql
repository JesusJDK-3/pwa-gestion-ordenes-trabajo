-- ====================================================================
--  EXTENSIÓN BD: GIS VPA + HIDRANTES + columnas OT para carga Excel
--  Compatible con merge dev_Jesus → melany
--  Ejecutar: psql -U postgres -d sistema_ot -f database/add_gis_vpa_hidrante.sql
-- ====================================================================

-- Tabla VPA (válvulas / puntos de agua)
CREATE TABLE IF NOT EXISTS gis_vpa (
    id_vpa      BIGSERIAL PRIMARY KEY,
    vca         VARCHAR(50)  NOT NULL UNIQUE,
    nis         VARCHAR(50)  NOT NULL UNIQUE,
    longitud    NUMERIC(11,8),
    latitud     NUMERIC(10,8),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla Hidrantes
CREATE TABLE IF NOT EXISTS gis_hidrante (
    id_hidrante  BIGSERIAL PRIMARY KEY,
    hia          VARCHAR(50)  NOT NULL UNIQUE,
    suministro   VARCHAR(50)  NOT NULL UNIQUE,
    direccion    VARCHAR(255),
    localidad    VARCHAR(100),
    distrito     VARCHAR(100),
    sector       VARCHAR(100),
    longitud     NUMERIC(11,8),
    latitud      NUMERIC(10,8),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gis_vpa_vca         ON gis_vpa (vca);
CREATE INDEX IF NOT EXISTS idx_gis_vpa_nis         ON gis_vpa (nis);
CREATE INDEX IF NOT EXISTS idx_gis_hidrante_hia    ON gis_hidrante (hia);
CREATE INDEX IF NOT EXISTS idx_gis_hidrante_suministro ON gis_hidrante (suministro);

-- Columnas adicionales en op_orden_trabajo (Excel SEDAPAL / GIS)
ALTER TABLE op_orden_trabajo ADD COLUMN IF NOT EXISTS hia         VARCHAR(50);
ALTER TABLE op_orden_trabajo ADD COLUMN IF NOT EXISTS vca         VARCHAR(50);
ALTER TABLE op_orden_trabajo ADD COLUMN IF NOT EXISTS suministro   VARCHAR(50);
ALTER TABLE op_orden_trabajo ADD COLUMN IF NOT EXISTS localidad   VARCHAR(100);
ALTER TABLE op_orden_trabajo ADD COLUMN IF NOT EXISTS id_cuadrilla BIGINT REFERENCES op_cuadrilla(id_cuadrilla);
ALTER TABLE op_orden_trabajo ADD COLUMN IF NOT EXISTS id_asistente BIGINT REFERENCES rrhh_trabajador(id_trabajador);

-- OTs importadas desde Excel pueden crearse sin capataz asignado
ALTER TABLE op_orden_trabajo ALTER COLUMN id_capataz DROP NOT NULL;
