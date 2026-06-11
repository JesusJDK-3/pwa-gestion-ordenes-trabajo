#!/usr/bin/env powershell
# ====================================================================
# Script de Verificación Pre-Migración
# Valida que todos los archivos y dependencias estén listos
# ====================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  VERIFICACION PRE-MIGRACION                                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# 1. Verificar archivos necesarios
Write-Host "[*] Verificando archivos SQL..." -ForegroundColor Cyan

$sqlFiles = @(
    "add_acompanantes_purgado.sql",
    "apply_migrations_manual.sql"
)

foreach ($file in $sqlFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        $success += "  ✓ $file ($size bytes)"
    } else {
        $errors += "  ✗ $file no encontrado en $PSScriptRoot"
    }
}

# 2. Verificar scripts ejecutables
Write-Host "[*] Verificando scripts ejecutables..." -ForegroundColor Cyan

$executableFiles = @(
    "apply_migrations.bat",
    "apply_migrations.ps1"
)

foreach ($file in $executableFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $success += "  ✓ $file"
    } else {
        $warnings += "  ⚠ $file no encontrado (opcional)"
    }
}

# 3. Verificar documentación
Write-Host "[*] Verificando documentación..." -ForegroundColor Cyan

$docFiles = @(
    "MIGRACIONES.md",
    "EJECUCION.md",
    "README.txt"
)

foreach ($file in $docFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $success += "  ✓ $file"
    } else {
        $warnings += "  ⚠ $file no encontrado (documentación)"
    }
}

# 4. Verificar PostgreSQL
Write-Host "[*] Verificando PostgreSQL..." -ForegroundColor Cyan

try {
    $psqlVersion = & psql --version 2>$null
    if ($psqlVersion) {
        $success += "  ✓ psql disponible: $psqlVersion"
    } else {
        $errors += "  ✗ psql no responde (PostgreSQL puede no estar instalado)"
    }
} catch {
    $errors += "  ✗ psql no encontrado en PATH"
    $warnings += "    → Agrega C:\Program Files\PostgreSQL\15\bin al PATH"
}

# 5. Verificar conexión a la BD (si psql está disponible)
if ($psqlVersion) {
    Write-Host "[*] Verificando conexión a la base de datos..." -ForegroundColor Cyan
    
    $env:PGPASSWORD = "melcita123"
    
    try {
        $result = & psql -h localhost -p 5432 -U postgres -d sistema_ot -c "SELECT version();" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $success += "  ✓ Conexión exitosa a PostgreSQL"
            
            # Verificar tablas base
            Write-Host "[*] Verificando tablas base..." -ForegroundColor Cyan
            
            $tables = @("op_orden_trabajo", "rrhh_trabajador", "op_ot_formulario")
            
            foreach ($table in $tables) {
                $result = & psql -h localhost -p 5432 -U postgres -d sistema_ot -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    $success += "  ✓ Tabla $table existe"
                } else {
                    $warnings += "  ⚠ Tabla $table no encontrada (requerida para FKs)"
                }
            }
        } else {
            $errors += "  ✗ No se pudo conectar a PostgreSQL"
            $errors += "    → Verifica que PostgreSQL esté corriendo en localhost:5432"
        }
    } catch {
        $errors += "  ✗ Error al conectar a PostgreSQL: $_"
    } finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# 6. Verificar que las nuevas tablas NO existen (aún no migradas)
Write-Host "[*] Verificando que tablas nuevas aún no existan..." -ForegroundColor Cyan

if ($psqlVersion -and $LASTEXITCODE -eq 0) {
    $env:PGPASSWORD = "melcita123"
    
    $newTables = @("op_ot_acompanante", "op_ot_purgado_hidrante")
    
    foreach ($table in $newTables) {
        $result = & psql -h localhost -p 5432 -U postgres -d sistema_ot -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $result -notmatch "^[^(]*\(0 rows\)") {
            $warnings += "  ⚠ Tabla $table YA existe (migrations puede que ya hayan sido aplicadas)"
        } else {
            $success += "  ✓ Tabla $table no existe (lista para ser creada)"
        }
    }
    
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Mostrar resumen
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor White

if ($success.Count -gt 0) {
    Write-Host ""
    Write-Host "✓ VERIFICACIONES EXITOSAS ($($success.Count))" -ForegroundColor Green
    foreach ($msg in $success) {
        Write-Host $msg -ForegroundColor Green
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠ ADVERTENCIAS ($($warnings.Count))" -ForegroundColor Yellow
    foreach ($msg in $warnings) {
        Write-Host $msg -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "✗ ERRORES ($($errors.Count))" -ForegroundColor Red
    foreach ($msg in $errors) {
        Write-Host $msg -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor White

# Resumen final
Write-Host ""
$allGood = ($errors.Count -eq 0)

if ($allGood) {
    Write-Host "[✓] TODO ESTA LISTO PARA EJECUTAR LAS MIGRACIONES" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pasos siguientes:" -ForegroundColor Cyan
    Write-Host "  1. Ejecuta: apply_migrations.bat (o apply_migrations.ps1)"
    Write-Host "  2. Verifica que las tablas se crearon: \dt op_ot_acompanante"
    Write-Host "  3. Crea las entidades Java correspondientes en el backend"
    Write-Host ""
} else {
    Write-Host "[!] HAY ERRORES QUE DEBEN RESOLVERSE ANTES DE CONTINUAR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, resuelve los errores listados arriba." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
