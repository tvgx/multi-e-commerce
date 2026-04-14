#!/bin/bash
# ==========================================================
# initialize-local-k3s.sh
# One-shot bootstrap cho môi trường bare-metal WSL + K3s
# Prerequisites: K3s đã cài, kubeconfig accessible, Docker running
# ==========================================================

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${BLUE}[STEP]${NC} $1"; }

trap_error() {
  log_error "Bootstrap failed at line $1 (step $CURRENT_STEP)"
  log_error "Check logs: kubectl logs -n ecommerce deployment/<app> --tail=50"
  exit 1
}
trap 'trap_error ${LINENO}' ERR

CURRENT_STEP=0

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Ecommerce Platform — Local K3s Bootstrap      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Prerequisites check
log_step "Checking prerequisites..."
CURRENT_STEP=1

if ! command -v kubectl &> /dev/null; then
  log_error "kubectl not found. Install: curl -LO https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  log_warn "Docker not found. Check if docker is installed or alias configured."
fi

if ! command -v k3s &> /dev/null; then
  log_error "K3s not found. Run: bash scripts/setup-k3s.sh first"
  exit 1
fi

# Validate kubeconfig
if ! kubectl cluster-info &>/dev/null; then
  log_error "Cannot access K3s cluster via kubectl."
  log_error "Check KUBECONFIG: $KUBECONFIG"
  log_error "Or set manually: export KUBECONFIG=~/.kube/config"
  exit 1
fi

log_info "✅ All prerequisites met"

echo ""
log_step "Setting up K3s single-node..."
CURRENT_STEP=2
bash "${PROJECT_ROOT}/scripts/setup-k3s.sh"
log_info "✅ K3s ready"

echo ""
log_step "Building and importing Docker images..."
CURRENT_STEP=3
if ! bash "${PROJECT_ROOT}/scripts/build-images.sh" all; then
  log_error "Failed to build/import images. Check Docker daemon."
  exit 1
fi
log_info "✅ Images built and imported"

echo ""
log_step "Creating Kubernetes namespace..."
CURRENT_STEP=4
if ! kubectl apply -f "${PROJECT_ROOT}/k8s/namespace.yaml"; then
  log_error "Failed to create namespace."
  exit 1
fi
log_info "✅ Namespace created"

echo ""
log_step "Creating app secrets..."
CURRENT_STEP=5
if [[ -n "${DB_PASSWORD:-}" ]] || ([[ -n "${DATABASE_URL_SHARD_1:-}" ]] && [[ -n "${DATABASE_URL_SHARD_2:-}" ]]); then
  if ! bash "${PROJECT_ROOT}/scripts/create-k8s-secrets.sh"; then
    log_error "Failed to create secrets."
    exit 1
  fi
  log_info "✅ Secrets created"
else
  log_warn "DB credentials not provided. Using defaults."
  log_warn "Set: export DB_PASSWORD='...' or DATABASE_URL_SHARD_1/2"
  bash "${PROJECT_ROOT}/scripts/create-k8s-secrets.sh" || true
fi

echo ""
log_step "Deploying infrastructure..."
CURRENT_STEP=6
for manifest in infrastructure apps ingress; do
  if [[ -d "${PROJECT_ROOT}/k8s/$manifest" ]]; then
    log_info "Applying k8s/$manifest..."
    if ! kubectl apply -f "${PROJECT_ROOT}/k8s/$manifest/"; then
      log_error "Failed to apply $manifest manifests."
      exit 1
    fi
  fi
done
log_info "✅ Infrastructure deployed"

echo ""
log_step "Waiting for deployments to be ready..."
CURRENT_STEP=7
APPS=("api-core" "admin" "storefront")
TIMEOUT=300
for app in "${APPS[@]}"; do
  log_info "Waiting for $app deployment (max ${TIMEOUT}s)..."
  if ! kubectl rollout status deployment/"$app" -n ecommerce --timeout="${TIMEOUT}s"; then
    log_error "Deployment $app failed to reach ready state."
    log_error "Check: kubectl describe deployment/$app -n ecommerce"
    log_error "Logs: kubectl logs deployment/$app -n ecommerce --tail=20"
    exit 1
  fi
  log_info "✅ $app ready"
done

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  ✅ Bootstrap Complete!                        ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
log_info "Cluster status:"
kubectl get nodes -o wide
echo ""
kubectl get pods -n ecommerce --no-headers
echo ""
log_info "Ingress endpoints:"
kubectl get ingress -n ecommerce
echo ""
log_info "Next steps:"
echo "  1. Setup local DNS: /etc/hosts with 127.0.0.1 *.ecommerce.local"
echo "  2. Or use port-forward: kubectl port-forward -n kube-system svc/traefik 80:80"
echo "  3. Test: curl http://api.ecommerce.local/health"
echo "  4. Monitor: kubectl logs -n ecommerce deployment/api-core -f"
echo ""
