#!/bin/bash
# ==========================================================
# build-images.sh
# Build Docker images và import vào K3s containerd
# CHẠY TRONG: WSL2 (yêu cầu Docker đã cài trong WSL2)
# ==========================================================
# Luồng: Docker build → docker save → k3s ctr import
# Không cần Docker Hub hay private registry
# ==========================================================

set -e

# Màu sắc output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

trap_error() {
  log_error "Build failed at line $1"
  exit 1
}
trap 'trap_error ${LINENO}' ERR

# ==========================================================
# Kiểm tra điều kiện
# ==========================================================
echo ""
echo "======================================================"
echo "  Ecommerce Platform — Docker Build Pipeline"
echo "======================================================"
echo ""

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
  log_error "Docker not found. Install: https://docs.docker.com/engine/install/ubuntu/"
fi
log_success "Docker: $(docker --version)"

# Verify Docker daemon is running
if ! docker ps >/dev/null 2>&1; then
  log_error "Docker daemon not responding. Start: sudo service docker start (or use WSL)"
fi

# Kiểm tra K3s
if ! command -v k3s &> /dev/null; then
  log_error "K3s not installed. Run: bash scripts/setup-k3s.sh first"
fi
log_success "K3s: $(k3s --version | head -1)"

# Kiểm tra project root
if [ ! -d "$PROJECT_ROOT" ]; then
  log_error "Project not found: $PROJECT_ROOT"
fi
log_success "Project root: $PROJECT_ROOT"

echo ""
log_info "Starting builds from: $PROJECT_ROOT"
echo ""

# ==========================================================
# Hàm build + import một image
# ==========================================================
build_and_import() {
  local APP_NAME=$1        # api-core | admin | storefront
  local IMAGE_NAME=$2      # ecommerce-api-core | ecommerce-admin | ecommerce-storefront
  local DOCKERFILE=$3      # Dockerfile path relative to project root

  echo "------------------------------------------------------"
  log_info "Building: ${IMAGE_NAME}:latest"
  echo "------------------------------------------------------"

  # Validate Dockerfile exists
  if [ ! -f "${PROJECT_ROOT}/${DOCKERFILE}" ]; then
    log_error "Dockerfile not found: ${PROJECT_ROOT}/${DOCKERFILE}"
  fi
  log_info "Dockerfile: ${DOCKERFILE}"

  # Build image (use cache by default for faster iterations)
  log_info "Running docker build..."
  if ! docker build \
    -t "${IMAGE_NAME}:latest" \
    -f "${PROJECT_ROOT}/${DOCKERFILE}" \
    "${PROJECT_ROOT}" \
    --progress=plain; then
    log_error "Docker build failed for ${IMAGE_NAME}"
  fi

  log_success "Build complete: ${IMAGE_NAME}:latest"

  # Verify image exists
  if ! docker images "${IMAGE_NAME}" --quiet | grep -q .; then
    log_error "Built image not found locally: ${IMAGE_NAME}"
  fi

  # Import vào K3s containerd
  log_info "Importing to K3s containerd..."
  if ! docker save "${IMAGE_NAME}:latest" | sudo k3s ctr images import - 2>&1 | grep -q "sha256"; then
    log_warn "Import completed (please verify with: sudo k3s ctr images ls | grep ${IMAGE_NAME})"
  fi

  # Verify import succeeded
  if sudo k3s ctr images list | grep -q "${IMAGE_NAME}"; then
    log_success "Imported to K3s: ${IMAGE_NAME}:latest"
  else
    log_error "Failed to import: ${IMAGE_NAME}"
  fi
  echo ""
}

# ==========================================================
# Parse arguments để chọn build app cụ thể
# Dùng: ./build-images.sh [all|api-core|admin|storefront]
# ==========================================================
TARGET=${1:-all}

case "$TARGET" in
  "all")
    log_info "Build tất cả images..."
    build_and_import "api-core"   "ecommerce-api-core"   "apps/api-core/Dockerfile"
    build_and_import "admin"      "ecommerce-admin"      "apps/admin/Dockerfile"
    build_and_import "storefront" "ecommerce-storefront" "apps/storefront/Dockerfile"
    ;;
  "api-core")
    build_and_import "api-core" "ecommerce-api-core" "apps/api-core/Dockerfile"
    ;;
  "admin")
    build_and_import "admin" "ecommerce-admin" "apps/admin/Dockerfile"
    ;;
  "storefront")
    build_and_import "storefront" "ecommerce-storefront" "apps/storefront/Dockerfile"
    ;;
  *)
    echo "Usage: $0 [all|api-core|admin|storefront]"
    exit 1
    ;;
esac

# ==========================================================
# Verify results and summary
# ==========================================================
echo "======================================================"
log_success "Build pipeline complete!"
echo ""
log_info "Verifying images in K3s containerd:"
MISSING_COUNT=0
for img in "ecommerce-api-core" "ecommerce-admin" "ecommerce-storefront"; do
  if sudo k3s ctr images list | grep -q "$img"; then
    echo "  ✓ $img"
  else
    echo "  ✗ $img (missing!)"
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
done

if [ $MISSING_COUNT -gt 0 ]; then
  log_error "$MISSING_COUNT image(s) failed to import"
fi

echo ""
log_info "Build output summary:"
echo "  • Docker images built: $(docker images | grep ecommerce | wc -l)"
echo "  • K3s containerd images: $(sudo k3s ctr images list | grep ecommerce | wc -l)"
echo ""
log_info "Next steps — deploy to cluster:"
echo "  1. bash scripts/initialize-local-k3s.sh   (one-shot bootstrap)"
echo "  2. Or manually:"
echo "     - kubectl apply -f k8s/namespace.yaml"
echo "     - bash scripts/create-k8s-secrets.sh"
echo "     - kubectl apply -f k8s/infrastructure/ k8s/apps/ k8s/ingress/"
echo "======================================================"
