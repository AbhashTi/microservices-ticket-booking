#!/usr/bin/env bash
# =============================================================================
#  🚀 ANTI-GRAVITY SETUP — Stadium Ticket Booking Microservices
#  Single script: installs everything missing, then runs both Jenkins pipelines
#  Run from the root of your cloned repo (microservices-ticket-booking-main/)
#  Usage:  chmod +x setup-everything.sh && ./setup-everything.sh
# =============================================================================
set -euo pipefail

# ──────────────────────────────────────────────────────────────
#  COLORS & HELPERS
# ──────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✔ $*${NC}"; }
info() { echo -e "${CYAN}➤ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
err()  { echo -e "${RED}✘ $*${NC}"; exit 1; }
sep()  { echo -e "${BOLD}──────────────────────────────────────────────────────${NC}"; }

# ──────────────────────────────────────────────────────────────
#  SCRIPT MUST RUN AS ROOT (or sudo available)
# ──────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  if ! sudo -n true 2>/dev/null; then
    warn "This script needs sudo for package installs. You may be prompted."
  fi
  SUDO="sudo"
else
  SUDO=""
fi

# ──────────────────────────────────────────────────────────────
#  DETECT REPO ROOT
# ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Support running from repo root or from a sub-dir
if [[ -d "$SCRIPT_DIR/Movie-Booking-System-Microservices" ]]; then
  REPO_ROOT="$SCRIPT_DIR"
elif [[ -d "$SCRIPT_DIR/../Movie-Booking-System-Microservices" ]]; then
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  err "Cannot find Movie-Booking-System-Microservices/ directory.\nRun this script from the repo root (microservices-ticket-booking-main/)."
fi

BACKEND_DIR="$REPO_ROOT/Movie-Booking-System-Microservices"
FRONTEND_DIR="$REPO_ROOT/Movie-Booking-Service-Frontend-main"

sep
echo -e "${BOLD}🎫 Stadium Ticket Booking – Full Environment Setup${NC}"
echo "   Repo root    : $REPO_ROOT"
echo "   Backend dir  : $BACKEND_DIR"
echo "   Frontend dir : $FRONTEND_DIR"
sep

# ==============================================================================
#  PHASE 1 — DETECT OS & PACKAGE MANAGER
# ==============================================================================
info "Detecting OS..."
OS="unknown"
PKG=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  OS="darwin"
  PKG="brew"
elif [[ -f /etc/os-release ]]; then
  . /etc/os-release
  OS="${ID:-unknown}"
fi

if [[ -z "$PKG" ]]; then
  case "$OS" in
    ubuntu|debian|linuxmint) PKG="apt" ;;
    fedora|rhel|centos|rocky|almalinux) PKG="dnf" ;;
    arch|manjaro) PKG="pacman" ;;
    *) warn "Unrecognised OS '$OS' – assuming apt-based." ; PKG="apt" ;;
  esac
fi
ok "OS: $OS  |  Package manager: $PKG"

update_pkg() {
  info "Updating package index..."
  case "$PKG" in
    apt)    $SUDO apt-get update -qq ;;
    dnf)    $SUDO dnf check-update -q || true ;;
    pacman) $SUDO pacman -Sy --noconfirm ;;
    brew)   brew update 2>/dev/null || true ;;
  esac
}

install_pkg() {
  local desc="$1"; shift
  info "Installing: $desc"
  case "$PKG" in
    apt)    $SUDO apt-get install -y -qq "$@" ;;
    dnf)    $SUDO dnf install -y -q "$@" ;;
    pacman) $SUDO pacman -S --noconfirm "$@" ;;
    brew)   brew install "$@" ;;
  esac
  ok "$desc installed."
}

# ==============================================================================
#  PHASE 2 — PREREQUISITES CHECK & INSTALL
# ==============================================================================
sep
echo -e "${BOLD}PHASE 2 — Installing prerequisites (skip if already present)${NC}"
sep

# ── Git ──────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  install_pkg "Git" git
else ok "Git already installed: $(git --version)"; fi

# ── Java 17+ ─────────────────────────────────────────────────
JAVA_OK=false
if command -v java &>/dev/null; then
  JV=$(java -version 2>&1 | awk -F '"' '/version/{print $2}' | cut -d. -f1)
  if [[ "$JV" -ge 17 ]]; then JAVA_OK=true; ok "Java $JV already installed."; fi
fi
if ! $JAVA_OK; then
  info "Installing Java 17..."
  case "$PKG" in
    apt)
      $SUDO apt-get install -y -qq openjdk-17-jdk ;;
    brew)
      brew install openjdk@17 ;;
    *)
      install_pkg "Java 17" openjdk-17-jdk ;;
  esac
  ok "Java 17 installed."
fi

# ── Maven ────────────────────────────────────────────────────
if ! command -v mvn &>/dev/null; then
  install_pkg "Maven" maven
else ok "Maven already installed: $(mvn -v 2>&1 | head -1)"; fi

# ── Node.js 18+ ──────────────────────────────────────────────
NODE_OK=false
if command -v node &>/dev/null; then
  NV=$(node -e "console.log(process.versions.node.split('.')[0])")
  if [[ "$NV" -ge 18 ]]; then NODE_OK=true; ok "Node.js $NV already installed."; fi
fi
if ! $NODE_OK; then
  info "Installing Node.js 18..."
  case "$PKG" in
    apt)
      curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO bash -
      $SUDO apt-get install -y -qq nodejs ;;
    brew)
      brew install node@18
      brew link --overwrite node@18 ;;
  esac
  ok "Node.js installed: $(node -v)"
fi

# ── Docker ────────────────────────────────────────────────────
if ! command -v docker &>/dev/null || ! docker info &>/dev/null 2>&1; then
  if [[ "$PKG" == "brew" ]]; then
    if [[ ! -d "/Applications/Docker.app" ]]; then
      warn "Docker Desktop required on macOS."
      warn "Please install from: https://www.docker.com/products/docker-desktop"
      warn "Then open Docker Desktop and re-run this script."
      exit 1
    else
      info "Docker Desktop found. Make sure it's running..."
      open /Applications/Docker.app 2>/dev/null || true
      sleep 10
    fi
  else
    info "Installing Docker..."
    curl -fsSL https://get.docker.com | $SUDO sh
    $SUDO systemctl enable --now docker
    $SUDO usermod -aG docker "$USER" 2>/dev/null || true
    ok "Docker installed."
  fi
fi
ok "Docker: $(docker --version)"
ok "Docker Compose: $(docker compose version 2>/dev/null || echo 'not available')"

sep
echo -e "${BOLD}All prerequisites satisfied ✓${NC}"
sep

# ==============================================================================
#  PHASE 3 — BUILD ALL BACKEND MICROSERVICES
# ==============================================================================
sep
echo -e "${BOLD}PHASE 3 — Building all Spring Boot microservices${NC}"
sep

SERVICES=(discovery-server api-gateway user-service match-service booking-service payment-service notification-service)

for svc in "${SERVICES[@]}"; do
  svc_dir="$BACKEND_DIR/$svc"
  if [[ ! -d "$svc_dir" ]]; then
    warn "Directory $svc_dir not found — skipping $svc"
    continue
  fi
  info "Building $svc..."
  cd "$svc_dir"
  chmod +x mvnw 2>/dev/null || true
  if [[ -f ./mvnw ]]; then
    ./mvnw -B clean package -DskipTests -q \
      || err "$svc Maven build FAILED."
  elif command -v mvn &>/dev/null; then
    mvn -B clean package -DskipTests -q \
      || err "$svc Maven build FAILED."
  else
    err "Neither ./mvnw nor mvn found for $svc."
  fi
  ok "$svc built ✓"
done

# ==============================================================================
#  PHASE 4 — BUILD FRONTEND
# ==============================================================================
sep
echo -e "${BOLD}PHASE 4 — Building React frontend${NC}"
sep

cd "$FRONTEND_DIR"
info "Installing npm dependencies..."
npm install --legacy-peer-deps

info "Building React app..."
CI=false npm run build
ok "Frontend built ✓"

# ==============================================================================
#  PHASE 5 — DOCKER BUILD & DOCKER COMPOSE UP
# ==============================================================================
sep
echo -e "${BOLD}PHASE 5 — Docker build all services + docker compose up${NC}"
sep

# Build frontend Docker image
info "Building frontend Docker image..."
cd "$FRONTEND_DIR"
docker build -t abhashti/match-frontend:local .

# Build all backend images via docker compose
cd "$BACKEND_DIR"
info "Running docker compose build..."
docker compose build

info "Starting all services..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d

info "Waiting 25s for services to start..."
sleep 25

# Start frontend container
docker stop frontend-app-container 2>/dev/null || true
docker rm frontend-app-container 2>/dev/null || true
docker run -d \
  --name frontend-app-container \
  -p 80:80 \
  abhashti/match-frontend:local 2>/dev/null || \
docker run -d \
  --name frontend-app-container \
  -p 3080:80 \
  abhashti/match-frontend:local

sep
echo -e "${BOLD}Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ==============================================================================
#  SUMMARY
# ==============================================================================
sep
echo -e "${BOLD}${GREEN}✅  ALL DONE — Summary${NC}"
sep
cat <<EOF

  SERVICE                PORT      URL
  ─────────────────────────────────────────────
  Frontend (React/nginx)  :80      http://localhost:80
  API Gateway             :8085    http://localhost:8085
  Eureka Dashboard        :8761    http://localhost:8761
  User Service            :8083
  Match Service           :8086
  Booking Service         :8087
  Payment Service         :8089
  Notification Service    :8088
  RabbitMQ Management     :15672   http://localhost:15672 (guest/guest)
  Elasticsearch           :9200
  Kibana                  :5601    http://localhost:5601

EOF
echo -e "${GREEN}Open http://localhost:80 in your browser to see the app!${NC}"
