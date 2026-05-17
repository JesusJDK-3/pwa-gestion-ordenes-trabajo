#!/usr/bin/env bash
# ============================================================
#  KABJ GIS — Iniciar sistema completo
#  Uso: bash start.sh  (desde Git Bash en cualquier PC)
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

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   KABJ GIS — Sistema de Operaciones de Campo     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar requisitos ──────────────────────────────────
echo -e "${YELLOW}[1/4] Verificando requisitos...${NC}"

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

# ── 2. Frontend: instalar deps si falta node_modules ────────
echo ""
echo -e "${YELLOW}[2/4] Verificando dependencias frontend...${NC}"
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "  Instalando dependencias npm (primera vez, espera ~1 min)..."
  cd "$FRONTEND"
  npm install --legacy-peer-deps --silent
  echo -e "${GREEN}  ✓ Dependencias instaladas${NC}"
else
  echo -e "${GREEN}  ✓ node_modules ya existe${NC}"
fi

# ── 3. Crear archivo .env si no existe ────────────────────────
if [ ! -f "$FRONTEND/.env" ]; then
  echo "VITE_API_URL=http://localhost:8080" > "$FRONTEND/.env"
  echo -e "${GREEN}  ✓ .env creado${NC}"
fi

# ── 4. Iniciar backend (Spring Boot) ────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Iniciando Backend Spring Boot (puerto 8080)...${NC}"
cd "$BACKEND"
if [[ "$OSTYPE" == "msys"* ]] || [[ "$OS" == "Windows_NT" ]]; then
  ./mvnw.cmd spring-boot:run --no-transfer-progress > "$ROOT/backend.log" 2>&1 &
else
  ./mvnw spring-boot:run --no-transfer-progress > "$ROOT/backend.log" 2>&1 &
fi
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo $BACKEND_PID > "$ROOT/.backend.pid"

# Esperar a que el backend esté listo
echo -n "  Esperando que el backend inicie"
for i in $(seq 1 40); do
  sleep 2
  if curl -sf http://localhost:8080/api/auth/me >/dev/null 2>&1 || \
     grep -q "Started SistemaOtApplication" "$ROOT/backend.log" 2>/dev/null; then
    echo ""
    echo -e "${GREEN}  ✓ Backend listo en http://localhost:8080${NC}"
    break
  fi
  echo -n "."
  if [ $i -eq 40 ]; then
    echo ""
    echo -e "${RED}  ✗ Backend tardó demasiado. Revisa backend.log${NC}"
    exit 1
  fi
done

# ── 5. Iniciar frontend (Vite) ───────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Iniciando Frontend Vite (puerto 5173)...${NC}"
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

# Abrir navegador si está disponible
if command -v start &>/dev/null; then
  start http://localhost:5173
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
  open http://localhost:5173
fi

wait
