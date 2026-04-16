#!/bin/bash
# verify-stop.sh — Post-stop verification and status report
# Purpose: Report state of K3s, Docker, disk, and backups after any shutdown tier
# Time: ~5 seconds
# Usage: bash scripts/verify-stop.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✅${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

check_fail() {
    echo -e "${RED}❌${NC} $1"
}

echo -e "${BLUE}=== Shutdown Verification Report ===${NC}"
echo ""

# ============================================================================
# Check 1: K3s Cluster Status
# ============================================================================
echo -e "${BLUE}Check 1: K3s Cluster${NC}"
if kubectl cluster-info &> /dev/null; then
    check_pass "K3s cluster is accessible"
    
    # Get node status
    NODE_STATUS=$(kubectl get nodes --no-headers 2>/dev/null | head -1 | awk '{print $2}')
    if [ "$NODE_STATUS" = "Ready" ]; then
        check_pass "K3s node is Ready"
    else
        check_warn "K3s node status: $NODE_STATUS (may be NotReady)"
    fi
    
    # Count system pods
    SYSTEM_PODS=$(kubectl get pods -n kube-system --no-headers 2>/dev/null | wc -l)
    check_pass "System pods running: $SYSTEM_PODS"
else
    check_fail "K3s cluster is NOT accessible (stopped or not running)"
fi
echo ""

# ============================================================================
# Check 2: Workload Status
# ============================================================================
echo -e "${BLUE}Check 2: Workload Pods${NC}"
if kubectl cluster-info &> /dev/null; then
    ECOMMERCE_PODS=$(kubectl get pods -n ecommerce --no-headers 2>/dev/null | wc -l)
    CLI_PODS=$(kubectl get pods -n ecommerce-cli --no-headers 2>/dev/null | wc -l)
    MONITOR_PODS=$(kubectl get pods -n monitoring --no-headers 2>/dev/null | wc -l)
    
    if [ "$ECOMMERCE_PODS" -eq 0 ] && [ "$CLI_PODS" -eq 0 ] && [ "$MONITOR_PODS" -eq 0 ]; then
        check_pass "All workload pods are down (ecommerce: 0, cli: 0, monitoring: 0)"
    else
        check_warn "Some workload pods still running (ecommerce: $ECOMMERCE_PODS, cli: $CLI_PODS, monitoring: $MONITOR_PODS)"
    fi
else
    check_fail "Cannot check pod status (K3s not accessible)"
fi
echo ""

# ============================================================================
# Check 3: Docker Status
# ============================================================================
echo -e "${BLUE}Check 3: Docker Containers${NC}"
if command -v docker &> /dev/null; then
    RUNNING=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    STOPPED=$(docker ps -a --no-header 2>/dev/null | grep -c "Exited" || echo 0)
    ALL=$(docker ps -a --no-header 2>/dev/null | wc -l || echo "0")
    
    if [ -z "$RUNNING" ] || [ "$RUNNING" = "0" ]; then
        check_pass "No Docker containers running"
    else
        check_warn "Docker containers still running: $RUNNING (stopped: $STOPPED, total: $ALL)"
    fi
    
    # Check docker daemon
    docker ps &> /dev/null && check_pass "Docker daemon is accessible" || check_fail "Docker daemon not accessible"
else
    check_warn "Docker command not found"
fi
echo ""

# ============================================================================
# Check 4: Disk Usage
# ============================================================================
echo -e "${BLUE}Check 4: Disk Usage${NC}"
DISK_FREE=$(df -h / | tail -1 | awk '{print $4}')
DISK_PERCENT=$(df -h / | tail -1 | awk '{print $5}')
echo -e "  Root partition: ${YELLOW}$DISK_PERCENT${NC} used, ${GREEN}$DISK_FREE${NC} free"

if command -v docker &> /dev/null; then
    DOCKER_USAGE=$(docker system df 2>/dev/null | grep -A 10 "^TYPE" || echo "Docker system df unavailable")
    echo -e "  Docker system:"
    echo "$DOCKER_USAGE" | tail -n +2 | while read line; do
        [ -n "$line" ] && echo "    $line"
    done
else
    check_warn "Docker system df not available"
fi
echo ""

# ============================================================================
# Check 5: Backup Files
# ============================================================================
echo -e "${BLUE}Check 5: Backup Files${NC}"
if [ -d "$PROJECT_ROOT/backup" ]; then
    BACKUP_SIZE=$(du -sh "$PROJECT_ROOT/backup" 2>/dev/null | awk '{print $1}')
    check_pass "Backup directory exists at $PROJECT_ROOT/backup (size: $BACKUP_SIZE)"
    
    # Check for recent ETcd snapshots
    ETCD_BACKUP_DIR="$PROJECT_ROOT/backup/etcd"
    if [ -d "$ETCD_BACKUP_DIR" ]; then
        ETCD_COUNT=$(find "$ETCD_BACKUP_DIR" -type f -name "*.db" 2>/dev/null | wc -l)
        ETCD_RECENT=$(find "$ETCD_BACKUP_DIR" -type f -name "*.db" -mtime -1 2>/dev/null | wc -l)
        if [ "$ETCD_RECENT" -gt 0 ]; then
            check_pass "ETcd snapshots: $ETCD_COUNT total, $ETCD_RECENT recent (< 24h)"
        else
            check_warn "ETcd snapshots: $ETCD_COUNT total, but none recent (may be old)"
        fi
    else
        check_warn "ETcd backup directory not found (may not have been backed up yet)"
    fi
    
    # Check for PVC backups
    PVC_BACKUP_DIR="$PROJECT_ROOT/backup/pvcs"
    if [ -d "$PVC_BACKUP_DIR" ]; then
        PVC_COUNT=$(find "$PVC_BACKUP_DIR" -type f 2>/dev/null | wc -l)
        PVC_RECENT=$(find "$PVC_BACKUP_DIR" -type f -mtime -1 2>/dev/null | wc -l)
        if [ "$PVC_RECENT" -gt 0 ]; then
            check_pass "PVC backups: $PVC_COUNT total, $PVC_RECENT recent (< 24h)"
        else
            check_warn "PVC backups: $PVC_COUNT total, but none recent (may be old)"
        fi
    else
        check_warn "PVC backup directory not found (may not have been backed up yet)"
    fi
else
    check_fail "Backup directory not found at $PROJECT_ROOT/backup"
fi
echo ""

# ============================================================================
# Check 6: PVC Status
# ============================================================================
echo -e "${BLUE}Check 6: PVCs${NC}"
if kubectl cluster-info &> /dev/null; then
    PVC_COUNT=$(kubectl get pvc -A --no-headers 2>/dev/null | wc -l)
    if [ "$PVC_COUNT" -eq 0 ]; then
        check_pass "All PVCs deleted (0 remaining)"
    else
        check_warn "PVCs still present: $PVC_COUNT"
        kubectl get pvc -A --no-headers 2>/dev/null | head -5 | while read line; do
            [ -n "$line" ] && echo "    $line"
        done
        if [ "$PVC_COUNT" -gt 5 ]; then
            echo "    ... and $((PVC_COUNT - 5)) more"
        fi
    fi
else
    check_fail "Cannot check PVCs (K3s not accessible)"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${BLUE}=== Summary ===${NC}"
echo ""

# Determine shutdown tier based on state
RUNNING=${RUNNING:-0}
ECOMMERCE_PODS=${ECOMMERCE_PODS:-0}
PVC_COUNT=${PVC_COUNT:-0}

if [ "$RUNNING" = "0" ] || [ -z "$RUNNING" ]; then
    RUNNING=0
fi
if [ -z "$ECOMMERCE_PODS" ]; then
    ECOMMERCE_PODS=0
fi
if [ -z "$PVC_COUNT" ]; then
    PVC_COUNT=0
fi

if [ "$RUNNING" -eq 0 ] && [ "$ECOMMERCE_PODS" -eq 0 ]; then
    if [ "$PVC_COUNT" -eq 0 ]; then
        echo -e "  Status: ${GREEN}Deep Cleanup${NC} (workloads down, PVCs deleted)"
    else
        echo -e "  Status: ${GREEN}Normal Shutdown${NC} (workloads down, PVCs preserved)"
    fi
elif [ "$ECOMMERCE_PODS" -eq 0 ]; then
    echo -e "  Status: ${YELLOW}Quick Stop${NC} (app pods down, infrastructure may remain)"
else
    echo -e "  Status: ${YELLOW}Partial Shutdown${NC} (some pods still running)"
fi

echo ""
echo -e "${BLUE}=== Next Steps ===${NC}"
if kubectl cluster-info &> /dev/null; then
    if [ "$ECOMMERCE_PODS" -eq 0 ]; then
        echo -e "  • Resume: ${GREEN}npm run dev:loop${NC} (quick restart)"
    fi
else
    echo -e "  • Start K3s: ${GREEN}bash scripts/setup-k3s.sh${NC}"
fi
echo -e "  • Full reset: ${GREEN}bash scripts/initialize-local-k3s.sh${NC}"
echo ""
