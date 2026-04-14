#!/bin/bash
# scripts/sync-backups-to-external-disk.sh
# Sync K3s backups (ETcd snapshots + PVC archives) to external disk/NAS
# Usage: ./scripts/sync-backups-to-external-disk.sh <external-mount-point>
# Example: ./scripts/sync-backups-to-external-disk.sh /mnt/backup

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <external-mount-point>"
  echo "Example: $0 /mnt/backup"
  exit 1
fi

EXTERNAL_MOUNT="$1"
LOG_FILE="/var/log/backup-sync.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Verify external mount exists and is mounted
if [[ ! -d "$EXTERNAL_MOUNT" ]]; then
  log_error "External mount point not found: $EXTERNAL_MOUNT"
  log_error "Create and mount the external disk first:"
  log_error "  sudo mkdir -p $EXTERNAL_MOUNT"
  log_error "  sudo mount /dev/sdX1 $EXTERNAL_MOUNT  # Replace sdX1"
  exit 1
fi

# Check if mount is actually mounted
if ! mountpoint -q "$EXTERNAL_MOUNT"; then
  log_error "$EXTERNAL_MOUNT is not mounted. Check mount status."
  exit 1
fi

log_info "==========================================="
log_info "Starting backup sync to external disk"
log_info "External mount: $EXTERNAL_MOUNT"
log_info "Timestamp: $(date)"
log_info "==========================================="

# Sync directories
SYNC_PAIRS=(
  "/var/lib/rancher/k3s/server/db/snapshots:etcd-snapshots"
  "/backup/etcd:etcd-backups"
  "/backup/pvcs:pvc-backups"
)

SYNC_ERROR=0

for PAIR in "${SYNC_PAIRS[@]}"; do
  SRC="${PAIR%:*}"
  DST="${PAIR#*:}"
  FULL_DST="$EXTERNAL_MOUNT/$DST"

  if [[ ! -d "$SRC" ]]; then
    log_warn "Source directory not found, skipping: $SRC"
    continue
  fi

  log_info "Syncing: $SRC → $FULL_DST"

  mkdir -p "$FULL_DST"

  if sudo rsync -av --delete "$SRC/" "$FULL_DST/" >> "$LOG_FILE" 2>&1; then
    SRC_SIZE=$(du -sh "$SRC" 2>/dev/null | cut -f1)
    DST_SIZE=$(du -sh "$FULL_DST" 2>/dev/null | cut -f1)
    log_info "✅ Synced: $SRC_SIZE → $DST_SIZE"
  else
    log_error "Failed to sync: $SRC"
    SYNC_ERROR=1
  fi
done

# Show final summary
log_info "==========================================="
log_info "Backup Summary on External Disk"
log_info "==========================================="

for PAIR in "${SYNC_PAIRS[@]}"; do
  DST="${PAIR#*:}"
  FULL_DST="$EXTERNAL_MOUNT/$DST"

  if [[ -d "$FULL_DST" ]]; then
    SIZE=$(du -sh "$FULL_DST" 2>/dev/null | cut -f1)
    COUNT=$(find "$FULL_DST" -type f 2>/dev/null | wc -l)
    log_info "$DST: $SIZE ($COUNT files)"
  fi
done

TOTAL_SIZE=$(du -sh "$EXTERNAL_MOUNT" 2>/dev/null | cut -f1)
FREE_SPACE=$(df "$EXTERNAL_MOUNT" | tail -1 | awk '{print $4}')

log_info "==========================================="
log_info "Total external disk usage: $TOTAL_SIZE"
log_info "Free space available: $((FREE_SPACE / 1024 / 1024))GB"
log_info "==========================================="

if [[ $SYNC_ERROR -eq 0 ]]; then
  log_info "✅ All backups synced successfully"
  exit 0
else
  log_error "❌ Some backups failed. Check log: $LOG_FILE"
  exit 1
fi
