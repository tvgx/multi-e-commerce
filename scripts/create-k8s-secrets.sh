#!/bin/bash
# ==========================================================
# create-k8s-secrets.sh
# Tạo Kubernetes Secrets cho ecommerce platform
# CHẠY TRONG: WSL2 (sau khi K3s đã up + namespace created)
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NAMESPACE="${NAMESPACE:-ecommerce}"

echo ""
echo "======================================"
echo "  Creating K8s Secrets"
echo "======================================"

# Verify namespace exists
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  log_error "Namespace '$NAMESPACE' does not exist."
  log_error "Run: kubectl apply -f k8s/namespace.yaml"
  exit 1
fi
log_info "Using namespace: $NAMESPACE"

# Input từ biến môi trường (không hardcode secrets vào git)
DB_HOST="${DB_HOST:-postgres.ecommerce.svc.cluster.local}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_USER="${DB_USER:-ecommerce}"
DB_NAME="${DB_NAME:-ecommerce}"
DB_PORT="${DB_PORT:-5432}"

MONGO_HOSTNAME="${MONGO_HOSTNAME:-mongodb.ecommerce.svc.cluster.local}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-ecommerce}"
MONGO_PASSWORD="${MONGO_PASSWORD:-}"
MONGO_DB="${MONGO_DB:-ecommerce_ui}"

# Auto-construct URLs if not provided
DATABASE_URL_SHARD_1="${DATABASE_URL_SHARD_1:-}"
DATABASE_URL_SHARD_2="${DATABASE_URL_SHARD_2:-}"
MONGODB_URI="${MONGODB_URI:-}"

if [[ -z "$DATABASE_URL_SHARD_1" ]]; then
  if [[ -z "$DB_PASSWORD" ]]; then
    log_error "Database credentials missing!"
    log_error "Provide one of:"
    log_error "  1. DB_PASSWORD + DB_HOST (auto-construct URLs)"
    log_error "  2. DATABASE_URL_SHARD_1 + DATABASE_URL_SHARD_2 (direct URLs)"
    echo ""
    echo "Example:"
    echo "  export DB_PASSWORD='your_secure_password'"
    echo "  export DB_HOST='postgres.example.com'"
    echo "  bash scripts/create-k8s-secrets.sh"
    exit 1
  fi

  # Auto-construct DATABASE_URL
  DATABASE_URL_SHARD_1="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public&sslmode=disable"
  DATABASE_URL_SHARD_2="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public&sslmode=disable"
  log_info "Auto-constructed DATABASE_URL"
fi

if [[ -z "$MONGODB_URI" ]]; then
  if [[ -z "$MONGO_PASSWORD" ]]; then
    # Fallback: No-auth MongoDB (for local development only)
    MONGODB_URI="mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?retryWrites=true"
    log_warn "MONGO_PASSWORD not provided. Using no-auth connection (development only!)"
    log_warn "For production, set: export MONGO_PASSWORD='...'"
  else
    MONGODB_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin&retryWrites=true"
    log_info "Auto-constructed MONGODB_URI"
  fi
fi

# Validate URLs (basic check)
if ! [[ "$DATABASE_URL_SHARD_1" =~ ^postgresql:// ]]; then
  log_error "Invalid DATABASE_URL_SHARD_1 format. Must start with 'postgresql://'"
  exit 1
fi

if ! [[ "$MONGODB_URI" =~ ^mongodb:// ]]; then
  log_error "Invalid MONGODB_URI format. Must start with 'mongodb://'"
  exit 1
fi

log_info "Credentials configured:"
echo "  DB Host: $DB_HOST"
echo "  Mongo Host: $MONGO_HOSTNAME"

echo "  Mongo Host: $MONGO_HOSTNAME"

# Create or update Secret
echo ""
log_info "Creating/updating secret 'api-core-secret'..."

if ! kubectl create secret generic api-core-secret \
  -n "${NAMESPACE}" \
  --from-literal=DATABASE_URL_SHARD_1="${DATABASE_URL_SHARD_1}" \
  --from-literal=DATABASE_URL_SHARD_2="${DATABASE_URL_SHARD_2}" \
  --from-literal=MONGODB_URI="${MONGODB_URI}" \
  --save-config \
  --dry-run=client \
  -o yaml | kubectl apply -f -; then
  log_error "Failed to create/update secret."
  exit 1
fi

log_info "✅ Secret created/updated successfully"
log_info ""
log_info "Secret details:"
kubectl get secret api-core-secret -n "$NAMESPACE" -o jsonpath='{.data}' | wc -c | xargs -I {} echo "  Size: {} bytes"
kubectl describe secret api-core-secret -n "$NAMESPACE" | grep "Type\|Data"

echo ""
log_info "Next: Run 'bash scripts/initialize-local-k3s.sh' to deploy apps"

echo ""
echo "✅ Secret 'api-core-secret' đã được tạo/cập nhật trong namespace '${NAMESPACE}'"
echo ""
echo "Kiểm tra:"
kubectl get secret api-core-secret -n "${NAMESPACE}"
