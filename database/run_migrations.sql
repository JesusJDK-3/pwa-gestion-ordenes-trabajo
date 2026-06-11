-- Script para aplicar las migraciones de acompañantes y purgado
-- Ejecutar con: psql -h localhost -U postgres -d sistema_ot -f database/run_migrations.sql

\set ON_ERROR_STOP on

-- Mostrar mensaje de inicio
\echo '=== Iniciando aplicación de migraciones ==='

-- Incluir el script de acompañantes y purgado
\i add_acompanantes_purgado.sql

-- Verificar que las tablas fueron creadas
\echo ''
\echo '=== Verificación de tablas creadas ==='
\dt op_ot_acompanante
\dt op_ot_purgado_hidrante

-- Mostrar las funciones trigger creadas
\echo ''
\echo '=== Funciones trigger creadas ==='
\df fn_validar_limite_acompanantes
\df fn_validar_purgado_obligatorios

\echo ''
\echo '=== Migraciones aplicadas exitosamente ==='
