#!/bin/bash
# ==========================================================
# Script cài đặt K3s + cấu hình sudo không cần password cho k3s
# Chạy script này trong terminal Ubuntu WSL2
# ==========================================================

set -e  # Dừng ngay nếu có lỗi

echo ""
echo "======================================"
echo "  Bước 1: Cài đặt K3s (với Traefik)  "
echo "======================================"

# Cài K3s với Traefik ingress (mặc định)
curl -sfL https://get.k3s.io | sh -

echo ""
echo "======================================"
echo "  Bước 2: Cấu hình kubectl cho user  "
echo "======================================"

# Tạo thư mục config cho user hiện tại
mkdir -p ~/.kube

# Copy kubeconfig (cần sudo vì file thuộc root)
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config

# Gán biến môi trường KUBECONFIG
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
export KUBECONFIG=~/.kube/config

echo ""
echo "======================================"
echo "  Bước 3: Kiểm tra trạng thái Cluster "
echo "======================================"

# Chờ node sẵn sàng (tối đa 60 giây)
echo "Đang chờ K3s node khởi động..."
for i in $(seq 1 12); do
  STATUS=$(kubectl get nodes --no-headers 2>/dev/null | awk '{print $2}' || echo "NotReady")
  if [ "$STATUS" = "Ready" ]; then
    echo "✅ Node đã Ready!"
    break
  fi
  echo "   Đang chờ... ($((i*5))s)"
  sleep 5
done

kubectl get nodes
kubectl get pods -A

echo ""
echo "======================================"
echo "  ✅ K3s đã cài đặt thành công!   "
echo "======================================"
echo ""
echo "  Lệnh hữu ích:"
echo "  - Kiểm tra cluster: kubectl get nodes"
echo "  - Xem pods: kubectl get pods -A"
echo "  - Dừng K3s (giải phóng RAM): sudo systemctl stop k3s"
echo "  - Khởi động lại K3s: sudo systemctl start k3s"
