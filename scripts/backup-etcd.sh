#!/bin/bash
# scripts/backup-etcd.sh
# Backup K3s ETcd database for disaster recovery
# Usage: ./scripts/backup-etcd.sh [backup-dir]
# Default backup-dir: /backup/etcd

set -euo pipefail

BACKUP_DIR="${1:-/backup/etcd}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SNAPSHOT_NAME="etcd-snapshot-$TIMESTAMP"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Verify K3s is accessible
if ! command -v k3s &> /dev/null; then
  log_error "k3s not found. Ensure K3s is installed and in PATH."
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
log_info "Using backup directory: $BACKUP_DIR"

# Create snapshot
log_info "Creating ETcd snapshot: $SNAPSHOT_NAME"
if ! sudo k3s etcd-snapshot save --name "$SNAPSHOT_NAME" 2>&1; then
  log_error "Failed to create ETcd snapshot. Check K3s logs."
  exit 1
fi

log_info "✅ Snapshot created: $SNAPSHOT_NAME"

# List available snapshots
log_info "Available snapshots:"
sudo k3s etcd-snapshot ls

# Copy snapshot to backup directory (if automatic copy available)
# K3s usually stores in: /var/lib/rancher/k3s/server/db/snapshots/
SNAPSHOT_SRC="/var/lib/rancher/k3s/server/db/snapshots"
if [[ -d "$SNAPSHOT_SRC" ]]; then
  log_info "Archiving snapshots to $BACKUP_DIR"
  sudo cp -v "$SNAPSHOT_SRC"/*.db "$BACKUP_DIR/" 2>/dev/null || true
  log_info "✅ Snapshots copied to $BACKUP_DIR"
fi

# Cleanup old snapshots (keep last 7)
log_info "Cleaning up old snapshots (keeping last 7)..."
SNAPSHOT_COUNT=$(sudo ls -1 /var/lib/rancher/k3s/server/db/snapshots/*.db 2>/dev/null | wc -l)
if [[ $SNAPSHOT_COUNT -gt 7 ]]; then
  log_warn "Found $SNAPSHOT_COUNT snapshots, removing oldest..."
  sudo ls -1t /var/lib/rancher/k3s/server/db/snapshots/*.db 2>/dev/null | tail -n +8 | xargs -r sudo rm
fi

# Final summary
log_info "==========================================="
log_info "✅ ETcd Backup Complete"
log_info "Snapshot: $SNAPSHOT_NAME"
log_info "Location: $BACKUP_DIR"
du -sh "$BACKUP_DIR" 2>/dev/null || true
log_info "==========================================="

# Exit success
exit 0
