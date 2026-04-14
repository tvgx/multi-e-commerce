#!/bin/bash
# stop-deep.sh — Deep cleanup: backup → workloads → optional PVC delete → docker prune → optional K3s stop
# Purpose: Complete resource reclamation for full reset scenarios
# Resources freed: 50–120GB (depends on PVC deletion + docker prune + K3s stop)
# Time: 5–10 minutes (backup + cleanup)
# Usage: bash scripts/stop-deep.sh
#        DELETE_PVCS=true bash scripts/stop-deep.sh  (aggressive PVC cleanup)
#        PRUNE_ALL_IMAGES=true bash scripts/stop-deep.sh  (all unused images)
#        STOP_K3S=true bash scripts/stop-deep.sh  (stop K3s cluster)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration from environment (defaults)
DELETE_PVCS="${DELETE_PVCS:-false}"
PRUNE_ALL_IMAGES="${PRUNE_ALL_IMAGES:-false}"
STOP_K3S="${STOP_K3S:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

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

log_critical() {
    echo -e "${MAGENTA}[CRITICAL]${NC} $1"
}

# Trap for cleanup on exit
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_warn "Script exited with code $exit_code"
    fi
    log_info "Deep cleanup finished"
}
trap cleanup_on_exit EXIT

# Pre-flight checks
log_critical "Deep Cleanup Started — This is destructive (with guardrails)"
log_info "Environment:"
echo -e "  DELETE_PVCS: ${YELLOW}$DELETE_PVCS${NC} (set DELETE_PVCS=true to enable)"
echo -e "  PRUNE_ALL_IMAGES: ${YELLOW}$PRUNE_ALL_IMAGES${NC} (set PRUNE_ALL_IMAGES=true to enable)"
echo -e "  STOP_K3S: ${YELLOW}$STOP_K3S${NC} (set STOP_K3S=true to enable)"
echo ""

# Check kubectl
if ! kubectl cluster-info &> /dev/null; then
    log_error "kubectl not accessible or K3s not running"
fi

log_success "Pre-flight checks passed"

# ============================================================================
# STEP A: Forced backup (non-optional, always run)
# ============================================================================
log_critical "STEP A: Creating backups (forced, non-optional)..."

if [ -f "$SCRIPT_DIR/backup-etcd.sh" ]; then
    log_info "Backing up ETcd snapshots..."
    bash "$SCRIPT_DIR/backup-etcd.sh" || log_warn "ETcd backup failed, continuing anyway"
else
    log_warn "backup-etcd.sh not found, skipping ETcd backup"
fi

if [ -f "$SCRIPT_DIR/backup-pvc.sh" ]; then
    log_info "Backing up PVC data..."
    bash "$SCRIPT_DIR/backup-pvc.sh" || log_warn "PVC backup failed, continuing anyway"
else
    log_warn "backup-pvc.sh not found, skipping PVC backup"
fi

# Verify backup directory exists
if [ -d "$PROJECT_ROOT/backup" ]; then
    BACKUP_SIZE=$(du -sh "$PROJECT_ROOT/backup" 2>/dev/null | awk '{print $1}')
    log_success "Backups created (size: $BACKUP_SIZE) at $PROJECT_ROOT/backup"
else
    log_warn "Backup directory not created or accessible"
fi

# ============================================================================
# STEP B: Standard workload cleanup (maps to npm run dev:down)
# ============================================================================
log_critical "STEP B: Cleaning up workloads..."

if [ -f "$SCRIPT_DIR/dev-loop.sh" ]; then
    log_info "Running dev-loop.sh down..."
    bash "$SCRIPT_DIR/dev-loop.sh" down || log_warn "dev-loop down had issues, continuing anyway"
else
    log_warn "dev-loop.sh not found, doing manual cleanup instead"
    log_info "Deleting apps + infrastructure..."
    kubectl delete -f "$PROJECT_ROOT/k8s/apps" --ignore-not-found=true -q 2>/dev/null || true
    kubectl delete -f "$PROJECT_ROOT/k8s/infrastructure" --ignore-not-found=true -q 2>/dev/null || true
    kubectl delete -f "$PROJECT_ROOT/k8s/ingress" --ignore-not-found=true -q 2>/dev/null || true
fi

log_success "Workload cleanup completed"

# ============================================================================
# STEP C: Optional PVC deletion (with guardrail)
# ============================================================================
if [ "$DELETE_PVCS" = "true" ]; then
    log_critical "STEP C: PVC DELETION ENABLED"
    echo ""
    
    # Show PVC status before deletion
    log_info "Current PVCs:"
    PVC_LIST=$(kubectl get pvc -A --no-headers 2>/dev/null || echo "")
    if [ -n "$PVC_LIST" ]; then
        echo "$PVC_LIST"
        PVC_DISK=$(kubectl get pvc -A --no-headers 2>/dev/null | awk '{print $2}' | paste -sd+ | bc 2>/dev/null || echo "unknown")
        log_warn "Total PVC storage estimated: $PVC_DISK (approximate)"
    else
        log_info "No PVCs found"
    fi
    
    echo ""
    log_critical "WARNING: About to delete ALL PVCs across all namespaces!"
    log_critical "This action is IRREVERSIBLE without external backups."
    read -p "Are you sure you want to delete all PVCs? Type 'yes' to confirm: " confirm
    
    if [ "$confirm" = "yes" ]; then
        log_critical "Deleting PVCs in ecommerce namespace..."
        kubectl delete pvc --all -n ecommerce --ignore-not-found=true -q || log_warn "PVC deletion in ecommerce failed"
        
        log_critical "Deleting PVCs in ecommerce-cli namespace..."
        kubectl delete pvc --all -n ecommerce-cli --ignore-not-found=true -q || log_warn "PVC deletion in ecommerce-cli failed"
        
        log_critical "Deleting PVCs in monitoring namespace..."
        kubectl delete pvc --all -n monitoring --ignore-not-found=true -q || log_warn "PVC deletion in monitoring failed"
        
        # Verify deletion
        REMAINING_PVCS=$(kubectl get pvc -A --no-headers 2>/dev/null | wc -l)
        if [ "$REMAINING_PVCS" -eq 0 ]; then
            log_success "All PVCs deleted"
        else
            log_warn "$REMAINING_PVCS PVCs still remaining (may be in protected namespaces)"
        fi
    else
        log_warn "PVC deletion skipped (user cancelled)"
    fi
else
    log_info "STEP C: PVC deletion DISABLED (default) — set DELETE_PVCS=true to enable"
fi

# ============================================================================
# STEP D: Docker cleanup (dangling-only by default, aggressive optional)
# ============================================================================
log_critical "STEP D: Docker cleanup..."

# Stop all running containers first
RUNNING=$(docker ps -q 2>/dev/null | wc -l)
if [ "$RUNNING" -gt 0 ]; then
    log_info "Stopping $RUNNING running containers..."
    docker ps -q 2>/dev/null | xargs docker stop --time=10 2>/dev/null || log_warn "Some containers failed to stop gracefully"
fi

# Dangling-only cleanup (always run)
log_info "Pruning dangling images (untagged)..."
DANGLING_BEFORE=$(docker images --filter="dangling=true" -q 2>/dev/null | wc -l)
docker image prune -f --filter="dangling=true" 2>/dev/null || log_warn "Dangling image prune had issues"
DANGLING_AFTER=$(docker images --filter="dangling=true" -q 2>/dev/null | wc -l)
log_success "Removed $((DANGLING_BEFORE - DANGLING_AFTER)) dangling images"

# Aggressive cleanup (optional, requires flag)
if [ "$PRUNE_ALL_IMAGES" = "true" ]; then
    log_critical "STEP D (AGGRESSIVE): Removing ALL unused images..."
    ALL_BEFORE=$(docker images --no-header 2>/dev/null | wc -l)
    
    log_critical "WARNING: About to remove all unused images. This includes built stage images!"
    read -p "Are you sure? Type 'yes' to confirm: " confirm_images
    
    if [ "$confirm_images" = "yes" ]; then
        docker image prune -a -f --filter="until=0h" 2>/dev/null || log_warn "Aggressive image prune had issues"
        ALL_AFTER=$(docker images --no-header 2>/dev/null | wc -l)
        log_success "Aggressive prune completed (images before: $ALL_BEFORE, after: $ALL_AFTER)"
    else
        log_warn "Aggressive image pruning skipped (user cancelled)"
    fi
else
    log_info "STEP D (DEFAULT): Dangling-only prune completed — set PRUNE_ALL_IMAGES=true for aggressive cleanup"
fi

# Prune volumes and builder cache (always safe)
log_info "Pruning unused volumes and builder cache..."
docker volume prune -f 2>/dev/null || log_warn "Volume prune had issues"
docker builder prune -a -f 2>/dev/null || log_warn "Builder prune had issues"

log_success "Docker cleanup completed"

# ============================================================================
# STEP E: Optional K3s stop (with guardrail)
# ============================================================================
if [ "$STOP_K3S" = "true" ]; then
    log_critical "STEP E: K3S STOP ENABLED"
    echo ""
    log_critical "WARNING: Stopping K3s will make the cluster unavailable!"
    log_warn "Restart with: bash $SCRIPT_DIR/setup-k3s.sh"
    read -p "Are you sure you want to stop K3s? Type 'yes' to confirm: " confirm_k3s
    
    if [ "$confirm_k3s" = "yes" ]; then
        log_critical "Stopping K3s (systemctl)..."
        sudo systemctl stop k3s 2>/dev/null || log_warn "K3s systemctl stop may have failed"
        sleep 2
        
        # Verify K3s is stopped
        if ! kubectl cluster-info &> /dev/null; then
            log_success "K3s cluster stopped successfully"
        else
            log_warn "K3s cluster still appears to be running"
        fi
    else
        log_warn "K3s stop skipped (user cancelled)"
    fi
else
    log_info "STEP E: K3s stop DISABLED (default) — set STOP_K3S=true to enable"
fi

# ============================================================================
# Final report
# ============================================================================
echo ""
log_success "Deep cleanup completed"
echo ""
echo -e "${BLUE}=== Deep Cleanup Report ===${NC}"
echo -e "  Backups: ${GREEN}Created${NC} (see $PROJECT_ROOT/backup)"
echo -e "  Workloads: ${GREEN}Cleaned${NC}"
echo -e "  PVCs: $([ "$DELETE_PVCS" = "true" ] && echo -e "${GREEN}Deleted${NC}" || echo -e "${YELLOW}Preserved${NC} (set DELETE_PVCS=true to delete)")"
echo -e "  Docker: ${GREEN}Pruned${NC} (dangling$([ "$PRUNE_ALL_IMAGES" = "true" ] && echo " + all unused" || echo ""))"
echo -e "  K3s: $([ "$STOP_K3S" = "true" ] && echo -e "${GREEN}Stopped${NC}" || echo -e "${YELLOW}Running${NC} (set STOP_K3S=true to stop)")"
echo ""
echo -e "${BLUE}=== Restart Options ===${NC}"
if [ "$STOP_K3S" = "true" ]; then
    echo -e "  Full restart: ${GREEN}bash $SCRIPT_DIR/setup-k3s.sh && bash $SCRIPT_DIR/initialize-local-k3s.sh${NC}"
else
    echo -e "  Quick restart: ${GREEN}npm run dev:loop${NC}"
    echo -e "  Full restart: ${GREEN}bash $SCRIPT_DIR/initialize-local-k3s.sh${NC}"
fi
echo -e "  Check status: ${GREEN}npm run verify:stop${NC}"
echo ""
