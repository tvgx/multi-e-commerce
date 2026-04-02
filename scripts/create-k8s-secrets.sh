#!/bin/bash
# ==========================================================
# create-k8s-secrets.sh
# Tạo Kubernetes Secrets cho ecommerce platform
# CHẠY TRONG: WSL2 (sau khi K3s đã up)
# ==========================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NAMESPACE="${NAMESPACE:-ecommerce}"

echo "======================================"
echo "  Tạo K8s Secrets cho ecommerce      "
echo "======================================"

# Input từ biến môi trường (không hardcode secrets vào git)
DB_HOST="${DB_HOST:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
MONGO_URI="${MONGO_URI:-}"

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"

DATABASE_URL_SHARD_1="${DATABASE_URL_SHARD_1:-}"
DATABASE_URL_SHARD_2="${DATABASE_URL_SHARD_2:-}"

if [ -z "$DATABASE_URL_SHARD_1" ] || [ -z "$DATABASE_URL_SHARD_2" ]; then
  if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Thiếu biến môi trường: DB_HOST, DB_PASSWORD hoặc DATABASE_URL_SHARD_1/2"
    echo "Ví dụ:"
    echo "  export DB_HOST='db.example.com'"
    echo "  export DB_PASSWORD='your_password'"
    echo "  export MONGO_URI='mongodb+srv://...'"
    exit 1
  fi

  DATABASE_URL_SHARD_1="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public"
  DATABASE_URL_SHARD_2="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public"
fi

if [ -z "$MONGO_URI" ]; then
  echo "❌ Thiếu biến môi trường MONGO_URI"
  exit 1
fi

# Đảm bảo namespace tồn tại
kubectl apply -f "${PROJECT_ROOT}/k8s/namespace.yaml"

# Tạo hoặc cập nhật Secret
kubectl create secret generic api-core-secret \
  -n "${NAMESPACE}" \
  --from-literal=DATABASE_URL_SHARD_1="${DATABASE_URL_SHARD_1}" \
  --from-literal=DATABASE_URL_SHARD_2="${DATABASE_URL_SHARD_2}" \
  --from-literal=MONGODB_URI="${MONGO_URI}" \
  --save-config \
  --dry-run=client \
  -o yaml | kubectl apply -f -

echo ""
echo "✅ Secret 'api-core-secret' đã được tạo/cập nhật trong namespace '${NAMESPACE}'"
echo ""
echo "Kiểm tra:"
kubectl get secret api-core-secret -n "${NAMESPACE}"
