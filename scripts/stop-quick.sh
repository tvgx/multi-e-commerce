#!/bin/bash
# stop-quick.sh — Quick stop: delete ingress/apps/infrastructure layer only
# Purpose: Fast app shutdown for pause scenarios; preserves DB (docker-compose) + K3s cluster
# Resources freed: ~500MB pod memory
# Time: ~30 seconds
# Usage: bash scripts/stop-quick.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Pre-flight checks
log_info "Running pre-flight checks..."

# Check kubectl accessibility
if ! kubectl cluster-info &> /dev/null; then
    log_error "kubectl not accessible or K3s not running. Start K3s first: bash scripts/setup-k3s.sh"
fi

# Check if kubeconfig is accessible
if [ -z "$KUBECONFIG" ] && [ ! -f ~/.kube/config ]; then
    log_error "kubeconfig not found at ~/.kube/config and KUBECONFIG not set"
fi

log_success "Pre-flight checks passed"

# Get baseline pod count
BEFORE_PODS=$(kubectl get pods -A --no-headers 2>/dev/null | wc -l)
log_info "Current pod count before cleanup: $BEFORE_PODS"

# Delete workload layers (leaving infrastructure intact for now)
log_info "Deleting ingress layer..."
kubectl delete -f "$PROJECT_ROOT/k8s/ingress" \
    --ignore-not-found=true \
    -q || log_warn "Ingress deletion failed or already absent"

log_info "Deleting app deployments layer..."
kubectl delete -f "$PROJECT_ROOT/k8s/apps" \
    --ignore-not-found=true \
    -q || log_warn "Apps deletion failed or already absent"

log_info "Deleting infrastructure layer (Redis, MinIO, Prometheus, Grafana, etc.)..."
kubectl delete -f "$PROJECT_ROOT/k8s/infrastructure" \
    --ignore-not-found=true \
    -q || log_warn "Infrastructure deletion failed or already absent"

# Wait for pods to terminate gracefully (timeout 30s)
log_info "Waiting for pods to terminate (timeout 30s)..."
timeout 30 bash -c '
    while [ $(kubectl get pods -A --no-headers 2>/dev/null | grep -v "kube-system" | wc -l) -gt 0 ]; do
        sleep 1
    done
' || log_warn "Timeout waiting for pods to terminate (some kube-system pods may still be present)"

# Get pod count after cleanup
AFTER_PODS=$(kubectl get pods -A --no-headers 2>/dev/null | wc -l)
PODS_FREED=$((BEFORE_PODS - AFTER_PODS))

# Get docker container count
RUNNING_CONTAINERS=$(docker ps --no-header 2>/dev/null | wc -l)
STOPPED_CONTAINERS=$(docker ps -a --no-header 2>/dev/null | grep -c "Exited" || echo 0)

# Print final report
echo ""
log_success "Quick stop completed"
echo ""
echo -e "${BLUE}=== Resource Status Report ===${NC}"
echo -e "  Pods before: $BEFORE_PODS"
echo -e "  Pods after:  $AFTER_PODS"
echo -e "  Pods freed:  ${GREEN}$PODS_FREED${NC}"
echo -e "  K3s cluster: $(kubectl cluster-info 2>/dev/null | grep -q 'is running' && echo -e "${GREEN}Available${NC}" || echo -e "${YELLOW}Degraded${NC}")"
echo -e "  Docker containers running: $RUNNING_CONTAINERS"
echo -e "  Docker containers stopped: $STOPPED_CONTAINERS"
echo ""
echo -e "${BLUE}=== Next Steps ===${NC}"
echo -e "  • Resume apps: ${GREEN}npm run dev:loop${NC}"
echo -e "  • View status: ${GREEN}npm run verify:stop${NC}"
echo -e "  • Full cleanup: ${GREEN}npm run stop:deep${NC}"
echo ""
