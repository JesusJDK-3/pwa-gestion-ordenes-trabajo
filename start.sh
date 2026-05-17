#!/usr/bin/env bash
# ============================================================
#  KABJ GIS — Iniciar sistema completo
#  Uso: bash start.sh  (desde Git Bash en cualquier PC)
#  Variables de entorno opcionales:
#    PG_USER      (default: postgres)
#    PG_PASSWORD  (default: admin1234)
#    PG_HOST      (default: localhost)
#    PG_PORT      (default: 5432)
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend/sistema-ot"
FRONTEND="$ROOT/frontend"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

PG_USER="${PG_USER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-admin1234}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
DB_NAME="sistema_ot"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   KABJ GIS — Sistema de Operaciones de Campo     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar requisitos ──────────────────────────────────
echo -e "${YELLOW}[1/5] Verificando requisitos...${NC}"

if ! command -v java &>/dev/null; then
  echo -e "${RED}✗ Java no encontrado. Instala Java 21 desde https://adoptium.net${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Java: $(java -version 2>&1 | head -1)${NC}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js no encontrado. Instala desde https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Node: $(node --version)${NC}"

# ── 2. Iniciar PostgreSQL ────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/5] Iniciando PostgreSQL...${NC}"

# Comprueba si ya está activo
if (echo >/dev/tcp/$PG_HOST/$PG_PORT) 2>/dev/null; then
  echo -e "${GREEN}  ✓ PostgreSQL ya está corriendo en $PG_HOST:$PG_PORT${NC}"
else
  echo -n "  Intentando iniciar el servicio"

  # ── Windows (Git Bash / MSYS2) ───────────────────────────
  if [[ "$OSTYPE" == "msys"* ]] || [[ "$OS" == "Windows_NT" ]]; then
    started=false
    for ver in 17 16 15 14 13; do
      if net start "postgresql-x64-$ver" 2>/dev/null; then
        started=true; break
      fi
    done
    # Intento con nombre genérico
    if ! $started; then
      net start "postgresql" 2>/dev/null && started=true || true
    fi

  # ── Linux / WSL ──────────────────────────────────────────
  elif command -v systemctl &>/dev/null; then
    sudo systemctl start postgresql 2>/dev/null || true

  # ── macOS / otros ─────────────────────────────────────────
  elif command -v pg_ctl &>/dev/null; then
    pg_ctl start 2>/dev/null || true
  else
    sudo service postgresql start 2>/dev/null || true
  fi

  # Esperar hasta 15 segundos
  ok=false
  for i in $(seq 1 15); do
    sleep 1
    if (echo >/dev/tcp/$PG_HOST/$PG_PORT) 2>/dev/null; then
      ok=true; break
    fi
    echo -n "."
  done

  echo ""
  if $ok; then
    echo -e "${GREEN}  ✓ PostgreSQL iniciado en $PG_HOST:$PG_PORT${NC}"
  else
    echo -e "${RED}  ✗ PostgreSQL no responde en $PG_HOST:$PG_PORT${NC}"
    echo ""
    echo -e "  Inícialo manualmente y vuelve a ejecutar start.sh:"
    echo -e "    Windows: ${CYAN}net start postgresql-x64-17${NC}  (ajusta la versión)"
    echo -e "    Linux:   ${CYAN}sudo systemctl start postgresql${NC}"
    echo ""
    exit 1
  fi
fi

# ── 3. Crear base de datos si no existe ─────────────────────
echo ""
echo -e "${YELLOW}[3/5] Verificando base de datos '$DB_NAME'...${NC}"

PG_CLI=""
for cmd in psql "C:/Program Files/PostgreSQL/17/bin/psql" \
           "C:/Program Files/PostgreSQL/16/bin/psql" \
           "C:/Program Files/PostgreSQL/15/bin/psql" \
           "C:/Program Files/PostgreSQL/14/bin/psql"; do
  if command -v "$cmd" &>/dev/null 2>&1; then
    PG_CLI="$cmd"; break
  fi
done

if [ -n "$PG_CLI" ]; then
  DB_EXISTS=$(PGPASSWORD="$PG_PASSWORD" "$PG_CLI" \
    -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
    -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")

  if [ "$DB_EXISTS" != "1" ]; then
    PGPASSWORD="$PG_PASSWORD" "$PG_CLI" \
      -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
      -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1 \
      && echo -e "${GREEN}  ✓ Base de datos '$DB_NAME' creada${NC}" \
      || echo -e "${YELLOW}  ⚠ No se pudo crear '$DB_NAME'. Créala manualmente: CREATE DATABASE $DB_NAME;${NC}"
  else
    echo -e "${GREEN}  ✓ Base de datos '$DB_NAME' ya existe${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ psql no está en PATH.${NC}"
  echo -e "  Si la BD no existe, créala antes de continuar:"
  echo -e "    ${CYAN}psql -U $PG_USER -c \"CREATE DATABASE $DB_NAME;\"${NC}"
fi

# ── 4. Frontend: instalar deps + .env ───────────────────────
echo ""
echo -e "${YELLOW}[4/5] Verificando dependencias frontend...${NC}"
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "  Instalando dependencias npm (primera vez, espera ~1 min)..."
  cd "$FRONTEND"
  npm install --legacy-peer-deps --silent
  echo -e "${GREEN}  ✓ Dependencias instaladas${NC}"
else
  echo -e "${GREEN}  ✓ node_modules ya existe${NC}"
fi

if [ ! -f "$FRONTEND/.env" ]; then
  echo "VITE_API_URL=http://localhost:8080" > "$FRONTEND/.env"
  echo -e "${GREEN}  ✓ frontend/.env creado${NC}"
fi

# ── 5. Iniciar backend (Spring Boot) ────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Iniciando servicios...${NC}"
cd "$BACKEND"
if [[ "$OSTYPE" == "msys"* ]] || [[ "$OS" == "Windows_NT" ]]; then
  MYSQL_USER="$PG_USER" MYSQL_PASSWORD="$PG_PASSWORD" \
  PG_USER="$PG_USER" PG_PASSWORD="$PG_PASSWORD" \
  ./mvnw.cmd spring-boot:run --no-transfer-progress > "$ROOT/backend.log" 2>&1 &
else
  PG_USER="$PG_USER" PG_PASSWORD="$PG_PASSWORD" \
  ./mvnw spring-boot:run --no-transfer-progress > "$ROOT/backend.log" 2>&1 &
fi
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo $BACKEND_PID > "$ROOT/.backend.pid"

echo -n "  Esperando que el backend inicie"
for i in $(seq 1 50); do
  sleep 2
  if curl -sf http://localhost:8080/api/auth/me >/dev/null 2>&1 || \
     grep -q "Started SistemaOtApplication" "$ROOT/backend.log" 2>/dev/null; then
    echo ""
    echo -e "${GREEN}  ✓ Backend listo en http://localhost:8080${NC}"
    break
  fi
  echo -n "."
  if [ $i -eq 50 ]; then
    echo ""
    echo -e "${RED}  ✗ Backend tardó demasiado. Revisa backend.log${NC}"
    echo -e "  ${CYAN}tail -30 $ROOT/backend.log${NC}"
    exit 1
  fi
done

# Frontend (Vite)
cd "$FRONTEND"
npm run dev > "$ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo $FRONTEND_PID > "$ROOT/.frontend.pid"

sleep 3

# ── Resumen ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅  Sistema iniciado correctamente       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:8080"
echo ""
echo -e "  ${YELLOW}Credenciales de prueba (password: password123)${NC}"
echo -e "    supervisor@ot.com  → Panel Supervisor"
echo -e "    capataz1@ot.com    → App de Campo KABJ GIS"
echo -e "    admin@ot.com       → Panel Administrador"
echo ""
echo -e "  Para detener todo:  ${CYAN}bash stop.sh${NC}"
echo ""

if command -v start &>/dev/null; then
  start http://localhost:5173
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
  open http://localhost:5173
fi

wait
