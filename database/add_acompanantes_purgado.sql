-- ====================================================================
--  EXTENSIÓN BD: MÚLTIPLES ACOMPAÑANTES Y PURGADO HIDRANTE
--  Fecha: 2026-05-22
--  Descripción:
--    - op_ot_acompanante: Trabajadores que acompañan al capataz en una OT
--    - op_ot_purgado_hidrante: Formulario técnico de purgado para hidrantes
-- ====================================================================

-- ====================================================================
--  TABLA: op_ot_acompanante
--  Descripción: Registra los trabajadores que acompañan al capataz
--               en una orden de trabajo. Pueden ser hasta 10.
--               Rol fijo predefinido como 'AYUDANTE'.
-- ====================================================================

CREATE TABLE op_ot_acompanante (
    id_ot_acompanante   BIGSERIAL    PRIMARY KEY,
    id_ot               BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    id_trabajador       BIGINT       REFERENCES rrhh_trabajador(id_trabajador),
    -- FK nullable si es un trabajador creado on-the-fly
    dni                 VARCHAR(8),
    -- DNI: obligatorio si id_trabajador es NULL (nuevo trabajador)
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    cargo               VARCHAR(100) DEFAULT 'AYUDANTE',
    -- Rol fijo predefinido
    rol                 VARCHAR(30)  NOT NULL DEFAULT 'AYUDANTE',
    -- Rol fijo, no seleccionable
    orden_en_lista      INT          NOT NULL DEFAULT 0,
    -- Para ordenar la visualización de acompañantes
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    CHECK (id_trabajador IS NOT NULL OR dni IS NOT NULL)
);

CREATE UNIQUE INDEX uq_ot_acompanante_trabajador
    ON op_ot_acompanante(id_ot, id_trabajador)
    WHERE id_trabajador IS NOT NULL;

CREATE INDEX idx_ot_acompanante_ot        ON op_ot_acompanante(id_ot);
CREATE INDEX idx_ot_acompanante_trabajador ON op_ot_acompanante(id_trabajador);
CREATE INDEX idx_ot_acompanante_orden     ON op_ot_acompanante(id_ot, orden_en_lista);


-- ====================================================================
--  TABLA: op_ot_purgado_hidrante
--  Descripción: Datos técnicos del purgado de hidrantes (PSI - TIEMPO DE PURGADO - CLORO)
--               Se relaciona con op_ot_formulario cuando el formulario
--               sea de tipo 'PURGADO_HIDRANTE'.
-- ====================================================================

CREATE TABLE op_ot_purgado_hidrante (
    id_purgado                  BIGSERIAL    PRIMARY KEY,
    id_ot_formulario            BIGINT       NOT NULL REFERENCES op_ot_formulario(id_ot_formulario),
    id_ot                       BIGINT       NOT NULL REFERENCES op_orden_trabajo(id_ot),
    -- Desnormalización para queries rápidas
    
    -- Campos técnicos del purgado
    marca_hidrante              VARCHAR(100),
    -- Marca del hidrante (FUMOSAC, EMICSA, FUNCION_URBANO, etc.)
    numero_bocamazas            INT,
    -- Número de bocamazas encontradas
    presion_psi_hidrante        DECIMAL(10,2),
    -- Presión del hidrante en PSI
    tiempo_inicio_purgado       TIMESTAMP,
    -- Hora de inicio del purgado
    tiempo_fin_purgado          TIMESTAMP,
    -- Hora de fin del purgado
    medicion_cloro_ppm          DECIMAL(10,2),
    -- Medición del cloro en PPM (partes por millón)
    
    -- Campos opcionales
    observaciones               TEXT,
    -- Observaciones o notas técnicas
    
    -- Auditoría
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP    NOT NULL DEFAULT NOW(),
    
    -- Restricciones de unicidad
    UNIQUE (id_ot_formulario)
    -- Solo un purgado por formulario
);

CREATE INDEX idx_purgado_formulario  ON op_ot_purgado_hidrante(id_ot_formulario);
CREATE INDEX idx_purgado_ot          ON op_ot_purgado_hidrante(id_ot);
CREATE INDEX idx_purgado_fecha       ON op_ot_purgado_hidrante(created_at);


-- ====================================================================
--  FUNCIÓN: Validar límite de acompañantes (máx 10)
-- ====================================================================

CREATE OR REPLACE FUNCTION fn_validar_limite_acompanantes()
RETURNS TRIGGER AS $$
DECLARE
    v_count INT;
BEGIN
    -- Contar acompañantes activos en esta OT
    SELECT COUNT(*) INTO v_count
    FROM op_ot_acompanante
    WHERE id_ot = NEW.id_ot AND activo = TRUE;
    
    -- Si ya hay 10, no permitir más
    IF v_count >= 10 THEN
        RAISE EXCEPTION 'No se pueden agregar más de 10 acompañantes por OT';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_limite_acompanantes
BEFORE INSERT ON op_ot_acompanante
FOR EACH ROW EXECUTE FUNCTION fn_validar_limite_acompanantes();


-- ====================================================================
--  FUNCIÓN: Validar campos obligatorios en purgado
-- ====================================================================

CREATE OR REPLACE FUNCTION fn_validar_purgado_obligatorios()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el formulario está COMPLETADO, todos los campos deben estar llenos
    IF (SELECT estado_formulario FROM op_ot_formulario WHERE id_ot_formulario = NEW.id_ot_formulario) = 'COMPLETADO' THEN
        IF NEW.marca_hidrante IS NULL
           OR NEW.numero_bocamazas IS NULL
           OR NEW.presion_psi_hidrante IS NULL
           OR NEW.tiempo_inicio_purgado IS NULL
           OR NEW.tiempo_fin_purgado IS NULL
           OR NEW.medicion_cloro_ppm IS NULL THEN
            RAISE EXCEPTION 'Todos los campos técnicos del purgado son obligatorios';
        END IF;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_purgado_obligatorios
BEFORE INSERT OR UPDATE ON op_ot_purgado_hidrante
FOR EACH ROW EXECUTE FUNCTION fn_validar_purgado_obligatorios();

-- ====================================================================
--  FIN EXTENSIÓN
-- ====================================================================
