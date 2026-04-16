#!/bin/bash
# scripts/add-node-to-cluster.sh
# Add a new K3s agent node to existing cluster
# Usage: ./scripts/add-node-to-cluster.sh <node-name> <node-ip> <master-ip>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [[ $# -ne 3 ]]; then
  log_error "Usage: $0 <node-name> <node-ip> <master-ip>"
  echo "Example: $0 worker-2 192.168.1.102 192.168.1.100"
  exit 1
fi

NODE_NAME="$1"
NODE_IP="$2"
MASTER_IP="$3"
MASTER_PORT="6443"

log_info "Adding node: $NODE_NAME ($NODE_IP) to master ($MASTER_IP:$MASTER_PORT)"

# Step 1: Get K3s token from master
log_info "Step 1: Retrieving K3s token from master..."

if ! command -v kubectl &> /dev/null; then
  log_error "kubectl not found. Install kubectl or ensure kubeconfig is accessible."
  exit 1
fi

# Check if we can access the master cluster
if ! kubectl cluster-info &> /dev/null; then
  log_error "Cannot access K3s master cluster. Verify kubeconfig and master connectivity."
  exit 1
fi

# Retrieve node token
NODE_TOKEN=$(sudo cat /var/lib/rancher/k3s/server/node-token 2>/dev/null)

if [[ -z "$NODE_TOKEN" ]]; then
  log_error "Failed to retrieve K3s node token from master."
  log_error "Verify: kubeconfig is set, you have sudo access, and master is running K3s."
  exit 1
fi

log_info "Node token retrieved successfully (length: ${#NODE_TOKEN} chars)"

# Step 2: Display installation command (for verification)
echo ""
log_info "Step 2: Installation command for new node"
echo "========================================"
cat << EOF

On the NEW node ($NODE_IP), run as root:

  curl -sfL https://get.k3s.io | \\
    K3S_URL=https://$MASTER_IP:$MASTER_PORT \\
    K3S_TOKEN='$NODE_TOKEN' \\
    sh -

Or with exact hostname:

  curl -sfL https://get.k3s.io | \\
    K3S_URL=https://$MASTER_IP:$MASTER_PORT \\
    K3S_TOKEN='$NODE_TOKEN' \\
    K3S_NODE_NAME=$NODE_NAME \\
    sh -

EOF
echo "========================================"

# Step 3: Wait for node to join (optional auto-wait)
read -p "Wait for node to join cluster? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log_info "Step 3: Waiting for node to join (max 5 min)..."

  TIMEOUT=300
  ELAPSED=0
  INTERVAL=5

  while [[ $ELAPSED -lt $TIMEOUT ]]; do
    NODE_STATUS=$(kubectl get node "$NODE_NAME" 2>/dev/null || echo "NotFound")

    if [[ "$NODE_STATUS" != "NotFound" ]]; then
      # Check if Ready
      IS_READY=$(kubectl get node "$NODE_NAME" -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")

      if [[ "$IS_READY" == "True" ]]; then
        log_info "✅ Node $NODE_NAME is Ready!"
        kubectl get node "$NODE_NAME" -o wide
        break
      else
        log_warn "Node found but not Ready yet... ($ELAPSED/$TIMEOUT s)"
      fi
    else
      log_warn "Node not yet in cluster... ($ELAPSED/$TIMEOUT s)"
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done

  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    log_warn "Timeout waiting for node. Check node logs and kubeconfig."
    exit 1
  fi
fi

# Step 4: Label node (optional)
read -p "Label node with role=compute? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log_info "Step 4: Labeling node..."
  kubectl label node "$NODE_NAME" node-role=compute --overwrite
  kubectl label node "$NODE_NAME" kubernetes.io/hostname="$NODE_NAME" --overwrite
  log_info "Node labeled: node-role=compute"
fi

# Step 5: Verify cluster nodes
log_info "Step 5: Cluster nodes overview"
echo "========================================"
kubectl get nodes -o wide
echo "========================================"

log_info "✅ Node addition workflow complete!"
log_info "Next steps:"
echo "  1. Monitor pod scheduling: kubectl get pods -A -w"
echo "  2. Scale deployments: kubectl scale deployment/api-core --replicas=3 -n ecommerce"
echo "  3. Apply PDB: kubectl apply -f k8s/templates/pod-disruption-budgets.yaml"
echo "  4. Apply anti-affinity: kubectl apply -f k8s/templates/anti-affinity.yaml"

exit 0
