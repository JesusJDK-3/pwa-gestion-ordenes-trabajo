#!/usr/bin/env bash
# ============================================================
#  KABJ GIS — Configuración inicial (ejecutar UNA sola vez)
#  Uso: bash setup.sh
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"

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
if [ "$JAVA_VER" -lt 21 ] 2>/dev/null; then
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

# ── 3. Verificar MySQL ───────────────────────────────────────
echo -e "${YELLOW}[3/5] Verificando MySQL...${NC}"
MYSQL_CMD=""
for p in "mysql" "/usr/bin/mysql" "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql"; do
  if command -v "$p" &>/dev/null; then
    MYSQL_CMD="$p"
    break
  fi
done

if [ -z "$MYSQL_CMD" ]; then
  echo -e "${RED}✗ MySQL no encontrado en PATH.${NC}"
  echo "  Agrega el directorio bin de MySQL al PATH, por ejemplo:"
  echo '  export PATH="$PATH:/c/Program Files/MySQL/MySQL Server 8.0/bin"'
  echo "  Luego vuelve a ejecutar este script."
  exit 1
fi
echo -e "${GREEN}  ✓ MySQL encontrado${NC}"

# ── 4. Configurar base de datos ──────────────────────────────
echo -e "${YELLOW}[4/5] Configurando base de datos...${NC}"
echo ""
echo -e "  ${CYAN}Ingresa los datos de conexión MySQL:${NC}"
read -rp "  Usuario MySQL [root]: " DB_USER
DB_USER="${DB_USER:-root}"
read -rsp "  Contraseña MySQL: " DB_PASS
echo ""

# Test conexión
if ! "$MYSQL_CMD" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" &>/dev/null; then
  echo -e "${RED}  ✗ No se pudo conectar a MySQL. Verifica usuario y contraseña.${NC}"
  exit 1
fi

# Crear base de datos
"$MYSQL_CMD" -u"$DB_USER" -p"$DB_PASS" \
  -e "CREATE DATABASE IF NOT EXISTS sistema_ot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" &>/dev/null
echo -e "${GREEN}  ✓ Base de datos 'sistema_ot' lista${NC}"

# Escribir application.properties local
APP_PROPS="$ROOT/backend/sistema-ot/src/main/resources/application.properties"
sed -i "s|MYSQL_USER:[^}]*|MYSQL_USER:$DB_USER|g"   "$APP_PROPS" 2>/dev/null || true
sed -i "s|MYSQL_PASSWORD:[^}]*|MYSQL_PASSWORD:$DB_PASS|g" "$APP_PROPS" 2>/dev/null || true
echo -e "${GREEN}  ✓ Configuración de BD guardada${NC}"

# ── 5. Instalar dependencias frontend ───────────────────────
echo -e "${YELLOW}[5/5] Instalando dependencias frontend...${NC}"
cd "$FRONTEND"
npm install --legacy-peer-deps --silent
echo -e "${GREEN}  ✓ Dependencias npm instaladas${NC}"

# .env
if [ ! -f "$FRONTEND/.env" ]; then
  echo "VITE_API_URL=http://localhost:8080" > "$FRONTEND/.env"
fi

# ── Resumen ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅  Configuración completada exitosamente    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Ahora ejecuta:  ${CYAN}bash start.sh${NC}"
echo ""
