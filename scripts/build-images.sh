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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

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
  log_error "Docker không tìm thấy. Cài Docker trong WSL2: https://docs.docker.com/engine/install/ubuntu/"
fi
log_success "Docker: $(docker --version)"

# Kiểm tra K3s
if ! command -v k3s &> /dev/null; then
  log_error "K3s chưa được cài đặt. Chạy scripts/setup-k3s.sh trước."
fi
log_success "K3s: $(k3s --version | head -1)"

# Kiểm tra project root
if [ ! -d "$PROJECT_ROOT" ]; then
  log_error "Không tìm thấy project tại $PROJECT_ROOT"
fi
log_success "Project root: $PROJECT_ROOT"

echo ""
log_info "Bắt đầu build từ: $PROJECT_ROOT"
echo ""

# ==========================================================
# Hàm build + import một image
# ==========================================================
build_and_import() {
  local APP_NAME=$1        # api-core | admin | storefront
  local IMAGE_NAME=$2      # ecommerce-api-core | ecommerce-admin | ecommerce-storefront
  local DOCKERFILE=$3      # đường dẫn Dockerfile tương đối từ project root

  echo "------------------------------------------------------"
  log_info "Building: ${IMAGE_NAME}:latest"
  echo "------------------------------------------------------"

  # Build image (context là project root để turbo prune hoạt động)
  docker build \
    -t "${IMAGE_NAME}:latest" \
    -f "${PROJECT_ROOT}/${DOCKERFILE}" \
    "${PROJECT_ROOT}" \
    --no-cache \
    --progress=plain

  log_success "Build xong: ${IMAGE_NAME}:latest"

  # Import vào K3s containerd (bỏ qua Docker daemon của K3s)
  log_info "Import vào K3s containerd..."
  docker save "${IMAGE_NAME}:latest" | sudo k3s ctr images import -

  log_success "Import xong: ${IMAGE_NAME}:latest → K3s containerd"
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
# Xác nhận kết quả
# ==========================================================
echo "======================================================"
log_success "Build pipeline hoàn tất!"
echo ""
log_info "Kiểm tra images trong K3s containerd:"
sudo k3s ctr images list | grep "ecommerce"
echo ""
log_info "Bước tiếp theo — deploy lên cluster:"
echo "  kubectl apply -f ${PROJECT_ROOT}/k8s/namespace.yaml"
echo "  bash ${PROJECT_ROOT}/scripts/create-k8s-secrets.sh"
echo "  kubectl apply -f ${PROJECT_ROOT}/k8s/infrastructure/"
echo "  kubectl apply -f ${PROJECT_ROOT}/k8s/apps/"
echo "  kubectl apply -f ${PROJECT_ROOT}/k8s/ingress/"
echo "======================================================"
