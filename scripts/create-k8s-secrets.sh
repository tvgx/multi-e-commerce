#!/bin/bash
# ==========================================================
# create-k8s-secrets.sh
# Tạo Kubernetes Secrets cho ecommerce platform
# CHẠY TRONG: WSL2 (sau khi K3s đã up)
# ==========================================================

set -e

echo "======================================"
echo "  Tạo K8s Secrets cho ecommerce      "
echo "======================================"

# ⚠️ Điền credentials thực vào đây (ĐỪNG commit file này sau khi sửa)
DB_PASSWORD="lordfedder222"
DB_HOST="db.dabexhaqtamfxcwpujuy.supabase.co"
MONGO_URI="mongodb+srv://korewalordFeederdesu:xkeQaMVQywCgFJEy@jsondb1.ddnq5v9.mongodb.net/?appName=JSONdb1"

# Đảm bảo namespace tồn tại
kubectl apply -f /mnt/d/Xuan/20252/DATN/ecommerce-platform/k8s/namespace.yaml

# Tạo hoặc cập nhật Secret
kubectl create secret generic api-core-secret \
  -n ecommerce \
  --from-literal=DATABASE_URL_SHARD_1="postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:5432/postgres?schema=public" \
  --from-literal=DATABASE_URL_SHARD_2="postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:5432/postgres?schema=public" \
  --from-literal=MONGODB_URI="${MONGO_URI}" \
  --save-config \
  --dry-run=client \
  -o yaml | kubectl apply -f -

echo ""
echo "✅ Secret 'api-core-secret' đã được tạo/cập nhật trong namespace 'ecommerce'"
echo ""
echo "Kiểm tra:"
kubectl get secret api-core-secret -n ecommerce
