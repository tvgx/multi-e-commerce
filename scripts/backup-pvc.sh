#!/bin/bash
# scripts/backup-pvc.sh
# Backup Kubernetes PVC data for disaster recovery
# Usage: ./scripts/backup-pvc.sh [backup-dir]
# Default backup-dir: /backup/pvcs

set -euo pipefail

BACKUP_DIR="${1:-/backup/pvcs}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

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

# Create backup directory
mkdir -p "$BACKUP_DIR"
log_info "Using backup directory: $BACKUP_DIR"

# Local-path provisioner storage location
LOCAL_PATH_DIR="/var/lib/rancher/k3s/storage"

if [[ ! -d "$LOCAL_PATH_DIR" ]]; then
  log_error "Local-path provisioner directory not found: $LOCAL_PATH_DIR"
  log_error "Ensure K3s is installed with default storage provisioner."
  exit 1
fi

log_info "Archiving PVC data from: $LOCAL_PATH_DIR"

# Create tar backup
BACKUP_FILE="$BACKUP_DIR/pvc-backup-$TIMESTAMP.tar.gz"
log_info "Creating backup file: $BACKUP_FILE"

if ! sudo tar czf "$BACKUP_FILE" -C "$LOCAL_PATH_DIR" . 2>/dev/null; then
  log_error "Failed to create PVC backup archive."
  exit 1
fi

log_info "✅ PVC backup created"

# Show backup info
BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
BACKUP_DATE=$(date -r "$BACKUP_FILE" '+%Y-%m-%d %H:%M:%S')

log_info "==========================================="
log_info "✅ PVC Backup Complete"
log_info "File: $BACKUP_FILE"
log_info "Size: $BACKUP_SIZE"
log_info "Date: $BACKUP_DATE"
log_info "==========================================="

# List recent backups
log_info "Recent backups:"
ls -lh "$BACKUP_DIR"/pvc-backup-*.tar.gz | tail -5

# Cleanup old backups (keep last 7 days)
log_info "Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -name "pvc-backup-*.tar.gz" -mtime +7 -delete

exit 0
