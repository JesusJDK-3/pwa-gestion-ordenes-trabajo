-- ====================================================================
--  SCRIPT DE EJECUCIÓN MANUAL PARA APLICAR MIGRACIONES
--  Instrucciones de uso:
--
--  En Windows (PowerShell o CMD):
--    set PGPASSWORD=melcita123
--    psql -h localhost -U postgres -d sistema_ot -f add_acompanantes_purgado.sql
--
--  En Linux/Mac:
--    export PGPASSWORD="melcita123"
--    psql -h localhost -U postgres -d sistema_ot -f add_acompanantes_purgado.sql
--
-- ====================================================================
-- CONEXIÓN: 
--   Host: localhost (puerto 5432)
--   Usuario: postgres
--   Contraseña: melcita123
--   Base de datos: sistema_ot
-- ====================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  APLICANDO MIGRACIONES: ACOMPAÑANTES Y PURGADO                 ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

-- Establecer modo de error para detener en caso de problemas
\set ON_ERROR_STOP on

-- ====================================================================
--  TABLA: op_ot_acompanante
--  Descripción: Registra los trabajadores que acompañan al capataz
--               en una orden de trabajo. Pueden ser hasta 10.
--               Rol fijo predefinido como 'AYUDANTE'.
-- ====================================================================

\echo '[*] Creando tabla op_ot_acompanante...'

CREATE TABLE IF NOT EXISTS op_ot_acompanante (
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

\echo '[✓] Tabla op_ot_acompanante creada'

-- Crear índices para op_ot_acompanante
\echo '[*] Creando índices para op_ot_acompanante...'

CREATE INDEX IF NOT EXISTS idx_ot_acompanante_ot        ON op_ot_acompanante(id_ot);
CREATE INDEX IF NOT EXISTS idx_ot_acompanante_trabajador ON op_ot_acompanante(id_trabajador);
CREATE INDEX IF NOT EXISTS idx_ot_acompanante_orden     ON op_ot_acompanante(id_ot, orden_en_lista);

\echo '[✓] Índices creados'

-- ====================================================================
--  TABLA: op_ot_purgado_hidrante
--  Descripción: Datos técnicos del purgado de hidrantes (PSI - TIEMPO DE PURGADO - CLORO)
--               Se relaciona con op_ot_formulario cuando el formulario
--               sea de tipo 'PURGADO_HIDRANTE'.
-- ====================================================================

\echo '[*] Creando tabla op_ot_purgado_hidrante...'

CREATE TABLE IF NOT EXISTS op_ot_purgado_hidrante (
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

\echo '[✓] Tabla op_ot_purgado_hidrante creada'

-- Crear índices para op_ot_purgado_hidrante
\echo '[*] Creando índices para op_ot_purgado_hidrante...'

CREATE INDEX IF NOT EXISTS idx_purgado_formulario  ON op_ot_purgado_hidrante(id_ot_formulario);
CREATE INDEX IF NOT EXISTS idx_purgado_ot          ON op_ot_purgado_hidrante(id_ot);
CREATE INDEX IF NOT EXISTS idx_purgado_fecha       ON op_ot_purgado_hidrante(created_at);

\echo '[✓] Índices creados'

-- ====================================================================
--  FUNCIÓN: Validar límite de acompañantes (máx 10)
-- ====================================================================

\echo '[*] Creando función de validación de acompañantes...'

CREATE OR REPLACE FUNCTION fn_validar_limite_acompanantes()
RETURNS TRIGGER AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM op_ot_acompanante
    WHERE id_ot = NEW.id_ot AND activo = TRUE;
    
    IF v_count >= 10 THEN
        RAISE EXCEPTION 'No se pueden agregar más de 10 acompañantes por OT';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '[✓] Función fn_validar_limite_acompanantes creada'

-- Crear trigger para validar límite de acompañantes
\echo '[*] Creando trigger para validar límite de acompañantes...'

DROP TRIGGER IF EXISTS trg_validar_limite_acompanantes ON op_ot_acompanante;

CREATE TRIGGER trg_validar_limite_acompanantes
BEFORE INSERT ON op_ot_acompanante
FOR EACH ROW EXECUTE FUNCTION fn_validar_limite_acompanantes();

\echo '[✓] Trigger trg_validar_limite_acompanantes creado'

-- ====================================================================
--  FUNCIÓN: Validar campos obligatorios en purgado
-- ====================================================================

\echo '[*] Creando función de validación de purgado...'

CREATE OR REPLACE FUNCTION fn_validar_purgado_obligatorios()
RETURNS TRIGGER AS $$
BEGIN
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

\echo '[✓] Función fn_validar_purgado_obligatorios creada'

-- Crear trigger para validar campos obligatorios en purgado
\echo '[*] Creando trigger para validar campos obligatorios en purgado...'

DROP TRIGGER IF EXISTS trg_validar_purgado_obligatorios ON op_ot_purgado_hidrante;

CREATE TRIGGER trg_validar_purgado_obligatorios
BEFORE INSERT OR UPDATE ON op_ot_purgado_hidrante
FOR EACH ROW EXECUTE FUNCTION fn_validar_purgado_obligatorios();

\echo '[✓] Trigger trg_validar_purgado_obligatorios creado'

-- ====================================================================
--  VERIFICACIÓN FINAL
-- ====================================================================

\echo ''
\echo '[*] Verificando tablas creadas...'
\echo ''
\dt op_ot_acompanante
\echo ''
\dt op_ot_purgado_hidrante
\echo ''

\echo '[*] Verificando funciones creadas...'
\df+ fn_validar_limite_acompanantes
\echo ''
\df+ fn_validar_purgado_obligatorios
\echo ''

-- Mensaje de éxito
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  ✓ MIGRACIONES APLICADAS EXITOSAMENTE                         ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'Las nuevas tablas están listas para ser usadas por el backend:'
\echo '  • op_ot_acompanante (Acompañantes de OT)'
\echo '  • op_ot_purgado_hidrante (Formulario técnico de purgado)'
\echo ''
