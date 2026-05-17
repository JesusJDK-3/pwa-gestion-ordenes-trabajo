#!/usr/bin/env bash
# ============================================================
#  KABJ GIS — Detener sistema
#  Uso: bash stop.sh
# ============================================================

ROOT="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "${RED}Deteniendo KABJ GIS...${NC}"

stop_pid() {
  local name="$1"
  local pidfile="$ROOT/.$2.pid"
  if [ -f "$pidfile" ]; then
    PID=$(cat "$pidfile")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null
      echo -e "  ${GREEN}✓ $name (PID $PID) detenido${NC}"
    else
      echo "  $name ya estaba detenido"
    fi
    rm -f "$pidfile"
  fi
}

stop_pid "Frontend" "frontend"
stop_pid "Backend"  "backend"

# Liberar puertos por si acaso
if command -v taskkill &>/dev/null; then
  taskkill //F //FI "TCP 8080" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}Sistema detenido.${NC}"
echo ""
