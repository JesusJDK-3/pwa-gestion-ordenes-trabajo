@echo off
REM ====================================================================
REM Script para aplicar migraciones a PostgreSQL
REM ====================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  APLICANDO MIGRACIONES: ACOMPANANTES Y PURGADO                 ║
echo ║  PostgreSQL 15+ - Base de datos: sistema_ot                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Configurar variables de conexión
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=melcita123
set PGDATABASE=sistema_ot

REM Ruta del script SQL
set SCRIPT_PATH=%~dp0apply_migrations_manual.sql

echo [*] Configuración de conexión:
echo     Host: %PGHOST%
echo     Puerto: %PGPORT%
echo     Usuario: %PGUSER%
echo     Base de datos: %PGDATABASE%
echo.

REM Verificar que psql esté disponible
where psql >nul 2>&1
if errorlevel 1 (
    echo [!] ERROR: PostgreSQL client (psql) no se encontró en PATH
    echo.
    echo Por favor, agrega la carpeta de PostgreSQL al PATH:
    echo   Típicamente: C:\Program Files\PostgreSQL\15\bin
    echo.
    pause
    exit /b 1
)

echo [*] Ejecutando script SQL...
echo.

REM Ejecutar psql con el script
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f "%SCRIPT_PATH%"

if errorlevel 1 (
    echo.
    echo [!] ERROR: Falló la ejecución del script SQL
    echo.
    echo Verifica:
    echo   1. PostgreSQL está corriendo en %PGHOST%:%PGPORT%
    echo   2. La base de datos '%PGDATABASE%' existe
    echo   3. El usuario '%PGUSER%' tiene permisos
    echo   4. La contraseña es correcta
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo [✓] Migraciones aplicadas exitosamente
    echo.
    echo Las nuevas tablas están listas para ser usadas:
    echo   • op_ot_acompanante (Acompañantes de OT)
    echo   • op_ot_purgado_hidrante (Formulario técnico de purgado)
    echo.
    pause
    exit /b 0
)
