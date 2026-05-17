#!/usr/bin/env bash
# ============================================================
#  KABJ GIS — Configuración inicial (ejecutar UNA sola vez)
#  Uso: bash setup.sh
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"
APP_PROPS="$ROOT/backend/sistema-ot/src/main/resources/application.properties"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       KABJ GIS — Configuración inicial           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar Java ────────────────────────────────────────
echo -e "${YELLOW}[1/5] Verificando Java 21+...${NC}"
if ! command -v java &>/dev/null; then
  echo -e "${RED}✗ Java no encontrado.${NC}"
  echo "  Descarga Java 21 en: https://adoptium.net"
  exit 1
fi
JAVA_VER=$(java -version 2>&1 | grep -oP '(?<=version ")[\d]+' | head -1)
if [ "${JAVA_VER:-0}" -lt 21 ] 2>/dev/null; then
  echo -e "${RED}✗ Se requiere Java 21+. Tienes Java $JAVA_VER${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Java $JAVA_VER${NC}"

# ── 2. Verificar Node ────────────────────────────────────────
echo -e "${YELLOW}[2/5] Verificando Node.js 18+...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js no encontrado. Instala desde https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Node $(node --version)${NC}"

# ── 3. Verificar psql (cliente PostgreSQL) ───────────────────
echo -e "${YELLOW}[3/5] Verificando PostgreSQL...${NC}"

PG_CLI=""
for cmd in psql \
           "C:/Program Files/PostgreSQL/17/bin/psql" \
           "C:/Program Files/PostgreSQL/16/bin/psql" \
           "C:/Program Files/PostgreSQL/15/bin/psql" \
           "C:/Program Files/PostgreSQL/14/bin/psql" \
           "/usr/bin/psql" \
           "/usr/local/bin/psql"; do
  if command -v "$cmd" &>/dev/null 2>&1; then
    PG_CLI="$cmd"; break
  fi
done

if [ -z "$PG_CLI" ]; then
  echo -e "${RED}✗ psql (cliente PostgreSQL) no encontrado.${NC}"
  echo ""
  echo "  Instala PostgreSQL desde: https://www.postgresql.org/download/"
  echo "  Y agrega su carpeta bin al PATH. Ejemplo Windows:"
  echo '    export PATH="$PATH:/c/Program Files/PostgreSQL/17/bin"'
  echo ""
  echo "  O ejecuta start.sh y crea la BD manualmente."
  exit 1
fi
echo -e "${GREEN}  ✓ psql encontrado: $PG_CLI${NC}"

# ── 4. Configurar base de datos ──────────────────────────────
echo -e "${YELLOW}[4/5] Configurando base de datos PostgreSQL...${NC}"
echo ""
echo -e "  ${CYAN}Ingresa los datos de conexión PostgreSQL:${NC}"
read -rp "  Host [localhost]: "    DB_HOST;  DB_HOST="${DB_HOST:-localhost}"
read -rp "  Puerto [5432]: "       DB_PORT;  DB_PORT="${DB_PORT:-5432}"
read -rp "  Usuario [postgres]: "  DB_USER;  DB_USER="${DB_USER:-postgres}"
read -rsp "  Contraseña: "         DB_PASS;  echo ""

# Test conexión
if ! PGPASSWORD="$DB_PASS" "$PG_CLI" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" \
     -c "SELECT 1;" >/dev/null 2>&1; then
  echo -e "${RED}  ✗ No se pudo conectar a PostgreSQL. Verifica usuario y contraseña.${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Conexión exitosa${NC}"

# Crear base de datos si no existe
DB_EXISTS=$(PGPASSWORD="$DB_PASS" "$PG_CLI" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" \
  -tAc "SELECT 1 FROM pg_database WHERE datname='sistema_ot';" 2>/dev/null || echo "")

if [ "$DB_EXISTS" != "1" ]; then
  PGPASSWORD="$DB_PASS" "$PG_CLI" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" \
    -c "CREATE DATABASE sistema_ot;" >/dev/null 2>&1
  echo -e "${GREEN}  ✓ Base de datos 'sistema_ot' creada${NC}"
else
  echo -e "${GREEN}  ✓ Base de datos 'sistema_ot' ya existe${NC}"
fi

# Guardar credenciales en application.properties
sed -i "s|PG_USER:[^}]*|PG_USER:$DB_USER|g"     "$APP_PROPS" 2>/dev/null || true
sed -i "s|PG_PASSWORD:[^}]*|PG_PASSWORD:$DB_PASS|g" "$APP_PROPS" 2>/dev/null || true

# Actualizar host/puerto si cambiaron del default
if [ "$DB_HOST" != "localhost" ] || [ "$DB_PORT" != "5432" ]; then
  sed -i "s|jdbc:postgresql://[^/]*/|jdbc:postgresql://$DB_HOST:$DB_PORT/|g" "$APP_PROPS" 2>/dev/null || true
fi

echo -e "${GREEN}  ✓ Configuración de BD guardada en application.properties${NC}"

# ── 5. Instalar dependencias frontend ───────────────────────
echo -e "${YELLOW}[5/5] Instalando dependencias frontend...${NC}"
cd "$FRONTEND"
npm install --legacy-peer-deps --silent
echo -e "${GREEN}  ✓ Dependencias npm instaladas${NC}"

if [ ! -f "$FRONTEND/.env" ]; then
  echo "VITE_API_URL=http://localhost:8080" > "$FRONTEND/.env"
  echo -e "${GREEN}  ✓ frontend/.env creado${NC}"
fi

# ── Resumen ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅  Configuración completada exitosamente    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Ahora ejecuta:  ${CYAN}bash start.sh${NC}"
echo ""
