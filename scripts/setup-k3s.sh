#!/bin/bash
# ==========================================================
# Script cài đặt K3s + cấu hình kubectl cho user hiện tại
# Chạy script này trong terminal Ubuntu WSL2
# Prerequisites: curl, docker (optional), socat (for port forwarding)
# ==========================================================

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

trap_error() {
  log_error "Setup failed at line $1. Check logs above."
  exit 1
}
trap 'trap_error ${LINENO}' ERR

echo ""
echo "======================================"
echo "  K3s Bootstrap für WSL2"
echo "======================================"

# Check prerequisites
log_info "Checking prerequisites..."
if ! command -v curl &> /dev/null; then
  log_error "curl not found. Install with: sudo apt update && sudo apt install -y curl"
  exit 1
fi

# Check if K3s already installed
if command -v k3s &> /dev/null; then
  log_warn "K3s seems already installed. Checking status..."
  if systemctl is-active --quiet k3s; then
    log_info "K3s is running. Skipping installation."
    IS_K3S_NEW=false
  else
    log_warn "K3s installed but not running. Attempting restart..."
    sudo systemctl start k3s
    IS_K3S_NEW=false
  fi
else
  IS_K3S_NEW=true
fi

if [[ "$IS_K3S_NEW" == "true" ]]; then
  echo ""
  echo "======================================"
  echo "  Bước 1: Cài đặt K3s (với Traefik)  "
  echo "======================================"

  # Cài K3s với Traefik ingress (mặc định)
  log_info "Installing K3s from official script..."
  if ! curl -sfL https://get.k3s.io | sh -; then
    log_error "K3s installation failed. Check internet connection and /var/log/k3s files."
    exit 1
  fi
  log_info "K3s installation complete."
else
  echo ""
  echo "======================================"
  echo "  K3s: Using existing installation"
  echo "======================================"
fi

echo ""
echo "======================================"
echo "  Bước 2: Cấu hình kubectl cho user  "
echo "======================================"

# Tạo thư mục config cho user hiện tại
mkdir -p ~/.kube

# Copy kubeconfig (cần sudo vì file thuộc root)
if [[ ! -f /etc/rancher/k3s/k3s.yaml ]]; then
  log_error "Kubeconfig not found at /etc/rancher/k3s/k3s.yaml"
  log_error "K3s may not have started properly. Check: sudo systemctl status k3s"
  exit 1
fi

log_info "Copying kubeconfig to ~/.kube/config"
if ! sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config; then
  log_error "Failed to copy kubeconfig. Check sudo permissions."
  exit 1
fi

if ! sudo chown "$(id -u):$(id -g)" ~/.kube/config; then
  log_error "Failed to change kubeconfig ownership."
  exit 1
fi

if ! chmod 600 ~/.kube/config; then
  log_error "Failed to set kubeconfig permissions."
  exit 1
fi

# Gán biến môi trường KUBECONFIG
if ! grep -q 'export KUBECONFIG=~/.kube/config' ~/.bashrc; then
  echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
  log_info "Added KUBECONFIG to ~/.bashrc"
fi
export KUBECONFIG=~/.kube/config

echo ""
echo "======================================"
echo "  Bước 3: Kiểm tra trạng thái Cluster "
echo "======================================"

# Chờ node sẵn sàng (tối đa 120 giây)
log_info "Waiting for K3s node to be Ready (max ~2 min)..."
TIMEOUT=120
ELAPSED=0
INTERVAL=5
NODE_READY=false

while [[ $ELAPSED -lt $TIMEOUT ]]; do
  if STATUS=$(kubectl get nodes --no-headers 2>/dev/null | awk '{print $2}'); then
    if [[ "$STATUS" = "Ready" ]]; then
      log_info "✅ Node is Ready!"
      NODE_READY=true
      break
    fi
  fi
  echo "   Waiting... ($ELAPSED/$TIMEOUT s)"
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [[ "$NODE_READY" != "true" ]]; then
  log_error "Node did not reach Ready state within $TIMEOUT seconds."
  log_error "Check K3s logs: sudo journalctl -u k3s -n 50"
  exit 1
fi

log_info "Node status:"
kubectl get nodes -o wide

echo ""
log_info "Running systemwide pods:"
kubectl get pods -A --no-headers | head -20

echo ""
echo "======================================"
echo "  Bước 4: Configure storage class     "
echo "======================================"

log_info "Available storage classes:"
kubectl get storageclass

if ! kubectl get storageclass local-path >/dev/null 2>&1; then
  log_error "Storage class 'local-path' not found."
  log_error "K3s default provisioner may not have started. Wait a moment and try again."
  exit 1
fi

# Check if local-path is already default
IS_DEFAULT=$(kubectl get storageclass local-path -o jsonpath='{.metadata.annotations.storageclass\.kubernetes\.io/is-default-class}' 2>/dev/null || echo "false")

if [[ "$IS_DEFAULT" != "true" ]]; then
  log_info "Setting 'local-path' as default storage class..."
  if ! kubectl patch storageclass local-path -p '{"metadata": {"annotations": {"storageclass.kubernetes.io/is-default-class":"true"}}}'; then
    log_error "Failed to patch storage class."
    exit 1
  fi
  log_info "✅ Default storage class set to local-path"
else
  log_info "✅ local-path is already default storage class"
fi

echo ""
echo "======================================"
echo "  ✅ K3s Bootstrap Complete!"
echo "======================================"
echo ""
log_info "Cluster details:"
echo "  - Kubeconfig: $HOME/.kube/config"
echo "  - K3s binary: $(which k3s)"
echo "  - K3s version: $(k3s --version 2>/dev/null || echo 'check logs')"
echo ""
log_info "Useful commands:"
echo "  • Check status: kubectl get nodes"
echo "  • View pods: kubectl get pods -A"
echo "  • K3s logs: sudo journalctl -u k3s -f"
echo "  • Stop K3s: sudo systemctl stop k3s"
echo "  • Start K3s: sudo systemctl start k3s"
echo "  • Uninstall: /usr/local/bin/k3s-uninstall.sh"
echo ""
log_info "Next: Run 'bash scripts/initialize-local-k3s.sh' to deploy apps"
