-- ====================================================================
--  EXTENSION BD: ALERTAS OPERATIVAS
--  Compatible con PostgreSQL / Supabase
-- ====================================================================

CREATE TABLE IF NOT EXISTS op_alerta (
    id_alerta                BIGSERIAL PRIMARY KEY,
    id_ot                    BIGINT REFERENCES op_orden_trabajo(id_ot),
    tipo                     VARCHAR(50)  NOT NULL,
    titulo                   VARCHAR(200) NOT NULL,
    detalle                  TEXT,
    prioridad                VARCHAR(20)  DEFAULT 'media',
    resuelta                 BOOLEAN      NOT NULL DEFAULT FALSE,
    resuelta_at              TIMESTAMP,
    observacion_al_resolver  TEXT,
    created_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_op_alerta_resuelta_created
    ON op_alerta(resuelta, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_op_alerta_ot_tipo_resuelta
    ON op_alerta(id_ot, tipo, resuelta);
