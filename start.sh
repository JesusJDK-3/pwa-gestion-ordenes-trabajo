#!/usr/bin/env bash
# ============================================================
#  KABJ GIS — Iniciar sistema completo
#  Uso: bash start.sh  (desde Git Bash en cualquier PC)
#
#  Variables de entorno opcionales (evitan la pregunta):
#    PG_USER      (default: postgres)
#    PG_PASSWORD  (si se define, no se pregunta)
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
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   KABJ GIS — Sistema de Operaciones de Campo     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 0. Configuracion de PostgreSQL ──────────────────────────
echo -e "${BOLD}Configuracion de PostgreSQL${NC}"
echo -e "  (Presiona Enter para usar el valor entre corchetes)"
echo ""

# Usuario
if [ -z "$PG_USER" ]; then
  read -r -p "  Usuario PostgreSQL [postgres]: " input_user
  PG_USER="${input_user:-postgres}"
fi

# Host y puerto (usar defaults silenciosamente a menos que esten en env)
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"

# Password: si ya esta en el entorno, no preguntar
if [ -z "$PG_PASSWORD" ]; then
  while true; do
    read -r -s -p "  Contrasena de '$PG_USER': " input_pass
    echo ""
    if [ -z "$input_pass" ]; then
      echo -e "  ${RED}La contrasena no puede estar vacia.${NC}"
      continue
    fi
    PG_PASSWORD="$input_pass"

    # Verificar la conexion inmediatamente
    echo -n "  Verificando conexion"

    # Buscar psql
    PG_CLI=""
    for cmd in psql \
               "/c/Program Files/PostgreSQL/18/bin/psql" \
               "/c/Program Files/PostgreSQL/17/bin/psql" \
               "/c/Program Files/PostgreSQL/16/bin/psql" \
               "/c/Program Files/PostgreSQL/15/bin/psql" \
               "C:/Program Files/PostgreSQL/18/bin/psql" \
               "C:/Program Files/PostgreSQL/17/bin/psql" \
               "C:/Program Files/PostgreSQL/16/bin/psql" \
               "C:/Program Files/PostgreSQL/15/bin/psql"; do
      if command -v "$cmd" &>/dev/null 2>&1; then
        PG_CLI="$cmd"; break
      fi
    done

    if [ -z "$PG_CLI" ]; then
      echo -e " ${YELLOW}(psql no encontrado, no se puede verificar)${NC}"
      echo -e "  ${YELLOW}Se usara la contrasena proporcionada de todas formas.${NC}"
      break
    fi

    if PGPASSWORD="$PG_PASSWORD" "$PG_CLI" \
         -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
         -tAc "SELECT 1;" >/dev/null 2>&1; then
      echo -e " ${GREEN}OK${NC}"
      echo -e "  ${GREEN}✓ Conexion exitosa como '$PG_USER'${NC}"
      break
    else
      echo ""
      echo -e "  ${RED}✗ Contrasena incorrecta o usuario '$PG_USER' no existe.${NC}"
      echo -e "  ${YELLOW}Vuelve a intentarlo.${NC}"
      echo ""
      # Preguntar si quiere cambiar tambien el usuario
      read -r -p "  Cambiar usuario? Nuevo usuario [$PG_USER]: " new_user
      if [ -n "$new_user" ]; then
        PG_USER="$new_user"
      fi
    fi
  done
else
  echo -e "  ${GREEN}✓ Usando PG_PASSWORD del entorno${NC}"
fi

DB_NAME="sistema_ot"
echo ""

# ── 1. Verificar requisitos ──────────────────────────────────
echo -e "${YELLOW}[1/5] Verificando requisitos...${NC}"

if ! command -v java &>/dev/null; then
  echo -e "${RED}  ✗ Java no encontrado. Instala Java 21 desde https://adoptium.net${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Java: $(java -version 2>&1 | head -1)${NC}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}  ✗ Node.js no encontrado. Instala desde https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Node: $(node --version)${NC}"

# ── 2. Verificar / iniciar PostgreSQL ───────────────────────
echo ""
echo -e "${YELLOW}[2/5] Verificando PostgreSQL en $PG_HOST:$PG_PORT...${NC}"

if (echo >/dev/tcp/$PG_HOST/$PG_PORT) 2>/dev/null; then
  echo -e "${GREEN}  ✓ PostgreSQL esta corriendo en $PG_HOST:$PG_PORT${NC}"
else
  echo -e "  PostgreSQL no responde. Intentando iniciar el servicio..."

  if [[ "$OSTYPE" == "msys"* ]] || [[ "$OS" == "Windows_NT" ]]; then
    started=false
    for ver in 18 17 16 15 14 13; do
      if net start "postgresql-x64-$ver" 2>/dev/null; then
        started=true; break
      fi
    done
    if ! $started; then
      net start "postgresql" 2>/dev/null && started=true || true
    fi
  elif command -v systemctl &>/dev/null; then
    sudo systemctl start postgresql 2>/dev/null || true
  elif command -v pg_ctl &>/dev/null; then
    pg_ctl start 2>/dev/null || true
  else
    sudo service postgresql start 2>/dev/null || true
  fi

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
    echo -e "${GREEN}  ✓ PostgreSQL iniciado${NC}"
  else
    echo -e "${RED}  ✗ PostgreSQL no responde en $PG_HOST:$PG_PORT${NC}"
    echo -e "  Inícialo manualmente y vuelve a ejecutar start.sh:"
    echo -e "    Windows : ${CYAN}net start postgresql-x64-18${NC}"
    echo -e "    Linux   : ${CYAN}sudo systemctl start postgresql${NC}"
    exit 1
  fi
fi

# ── 3. Crear BD si no existe ─────────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Verificando base de datos '$DB_NAME'...${NC}"

if [ -n "$PG_CLI" ]; then
  DB_EXISTS=$(PGPASSWORD="$PG_PASSWORD" "$PG_CLI" \
    -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
    -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")

  if [ "$DB_EXISTS" != "1" ]; then
    PGPASSWORD="$PG_PASSWORD" "$PG_CLI" \
      -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" \
      -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1 \
      && echo -e "${GREEN}  ✓ Base de datos '$DB_NAME' creada${NC}" \
      || echo -e "${YELLOW}  ⚠ No se pudo crear '$DB_NAME'. Crea la BD manualmente antes de continuar.${NC}"
  else
    echo -e "${GREEN}  ✓ Base de datos '$DB_NAME' ya existe${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ psql no encontrado en PATH. Asegurate de que la BD '$DB_NAME' exista.${NC}"
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

# Crear/actualizar .env del frontend
cat > "$FRONTEND/.env" <<EOF
VITE_API_URL=http://localhost:8080/api
EOF
echo -e "${GREEN}  ✓ frontend/.env configurado${NC}"

# ── 5. Iniciar servicios ─────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Iniciando servicios...${NC}"

cd "$BACKEND"
if [[ "$OSTYPE" == "msys"* ]] || [[ "$OS" == "Windows_NT" ]]; then
  PG_USER="$PG_USER" PG_PASSWORD="$PG_PASSWORD" \
  PG_HOST="$PG_HOST" PG_PORT="$PG_PORT" \
  ./mvnw.cmd spring-boot:run --no-transfer-progress > "$ROOT/backend.log" 2>&1 &
else
  PG_USER="$PG_USER" PG_PASSWORD="$PG_PASSWORD" \
  PG_HOST="$PG_HOST" PG_PORT="$PG_PORT" \
  ./mvnw spring-boot:run --no-transfer-progress > "$ROOT/backend.log" 2>&1 &
fi
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo $BACKEND_PID > "$ROOT/.backend.pid"

echo -n "  Esperando que el backend inicie"
backend_ready=false
for i in $(seq 1 50); do
  sleep 2
  if grep -q "Started SistemaOtApplication" "$ROOT/backend.log" 2>/dev/null; then
    backend_ready=true; break
  fi
  if grep -q "APPLICATION FAILED TO START\|BUILD FAILURE" "$ROOT/backend.log" 2>/dev/null; then
    echo ""
    echo -e "${RED}  ✗ El backend fallo al iniciar.${NC}"
    echo -e "  Revisa el log: ${CYAN}cat $ROOT/backend.log${NC}"
    exit 1
  fi
  echo -n "."
done
echo ""

if $backend_ready; then
  echo -e "${GREEN}  ✓ Backend listo en http://localhost:8080${NC}"
else
  echo -e "${RED}  ✗ El backend tardo demasiado. Revisa backend.log${NC}"
  exit 1
fi

# Iniciar frontend
cd "$FRONTEND"
npm run dev > "$ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo $FRONTEND_PID > "$ROOT/.frontend.pid"
sleep 3
echo -e "${GREEN}  ✓ Frontend listo en http://localhost:5173${NC}"

# ── Resumen final ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅  Sistema iniciado correctamente       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Frontend :${NC}  http://localhost:5173"
echo -e "  ${CYAN}Backend  :${NC}  http://localhost:8080"
echo -e "  ${CYAN}BD       :${NC}  $DB_NAME @ $PG_HOST:$PG_PORT (usuario: $PG_USER)"
echo ""
echo -e "  ${YELLOW}Credenciales de prueba (password: password123)${NC}"
echo -e "    supervisor@ot.com  ->  Panel Supervisor"
echo -e "    capataz1@ot.com    ->  App de Campo"
echo -e "    admin@ot.com       ->  Panel Administrador"
echo ""
echo -e "  Para detener:  ${CYAN}bash stop.sh${NC}"
echo ""

# Abrir navegador
if command -v start &>/dev/null; then
  start http://localhost:5173
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
  open http://localhost:5173
fi

wait
