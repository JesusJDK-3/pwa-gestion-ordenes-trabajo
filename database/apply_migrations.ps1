#!/usr/bin/env powershell
# ====================================================================
# Script para aplicar migraciones a PostgreSQL desde PowerShell
# ====================================================================

param(
    [string]$SqlFile = "apply_migrations_manual.sql"
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  APLICANDO MIGRACIONES: ACOMPANANTES Y PURGADO                 ║" -ForegroundColor Green
Write-Host "║  PostgreSQL 15+ - Base de datos: sistema_ot                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Configurar variables de conexión
$PgHost = "localhost"
$PgPort = "5432"
$PgUser = "postgres"
$PgPassword = "melcita123"
$PgDatabase = "sistema_ot"

# Ruta del script SQL
$ScriptPath = Join-Path $PSScriptRoot $SqlFile

Write-Host "[*] Configuración de conexión:" -ForegroundColor Cyan
Write-Host "    Host: $PgHost" 
Write-Host "    Puerto: $PgPort"
Write-Host "    Usuario: $PgUser"
Write-Host "    Base de datos: $PgDatabase"
Write-Host ""

# Verificar que psql esté disponible
try {
    $psqlVersion = & psql --version 2>$null
    Write-Host "[✓] PostgreSQL client encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] ERROR: PostgreSQL client (psql) no se encontró en PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, agrega la carpeta de PostgreSQL al PATH:" -ForegroundColor Yellow
    Write-Host "  Típicamente: C:\Program Files\PostgreSQL\15\bin"
    Write-Host ""
    Read-Host "Presiona Enter para continuar"
    exit 1
}

# Verificar que el archivo SQL existe
if (-not (Test-Path $ScriptPath)) {
    Write-Host "[!] ERROR: Archivo SQL no encontrado: $ScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Ejecutando script SQL: $SqlFile" -ForegroundColor Cyan
Write-Host ""

# Crear variable de entorno temporal
$env:PGPASSWORD = $PgPassword

# Ejecutar psql
& psql -h $PgHost -p $PgPort -U $PgUser -d $PgDatabase -f $ScriptPath

$exitCode = $LASTEXITCODE

# Limpiar variable de entorno
Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "[✓] Migraciones aplicadas exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Las nuevas tablas están listas para ser usadas:" -ForegroundColor Green
    Write-Host "  • op_ot_acompanante (Acompañantes de OT)"
    Write-Host "  • op_ot_purgado_hidrante (Formulario técnico de purgado)"
    Write-Host ""
} else {
    Write-Host "[!] ERROR: Falló la ejecución del script SQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL está corriendo en $($PgHost):$($PgPort)"
    Write-Host "  2. La base de datos '$PgDatabase' existe"
    Write-Host "  3. El usuario '$PgUser' tiene permisos"
    Write-Host "  4. La contraseña es correcta"
    Write-Host ""
}

exit $exitCode
