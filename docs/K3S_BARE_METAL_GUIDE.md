---
title: "Bare-Metal K3s Single-Node Staging Deployment"
version: "1.0"
date: "2026-04-14"
---

# Hướng dẫn Triển khai Bare-Metal K3s Single-Node

## Tóm tắt thay đổi

Triển khai chuyển hẳn staging từ cloud (Azure AKS) sang bare-metal máy cá nhân (WSL + K3s single control-plane).

### Các thay đổi chính

| Phase | Files | Mô tả |
|-------|-------|-------|
| **Phase 3** | `.github/workflows/deploy-staging.yml` | Chuyển runner sang self-hosted (labels: self-hosted, linux, baremetal) + kubeconfig fallback |
| **Phase 3** | `scripts/setup-k3s.sh` | Cải thiện idempotent, thêm storage class verification |
| **Phase 3** | `scripts/create-k8s-secrets.sh` | Unsafe defaults cho local DB/Mongo (postgres-shard-1, fallback local) |
| **Phase 3** | `scripts/initialize-local-k3s.sh` | Script bootstrap một lệnh: K3s → build images → apply manifests → wait rollout |
| **Phase 5** | `k8s/cli/30-storage.yaml` | Đổi PVC từ `standard` RWX → `local-path` RWO, giảm sizing (100Gi → 20Gi thực tế WSL) |
| **Phase 5** | `k8s/infrastructure/monitoring.yaml` | Thêm persistent PVC cho Prometheus (10Gi) + Grafana (2Gi) |
| **Phase 5** | `k8s/namespace.yaml` | Tăng quota: 4→12 CPU, 8→24Gi RAM (phù hợp WSL 16GB) |
| **Phase 6** | `k8s/ingress/ingress.yaml` | Thêm setup guide local, Grafana host, `ingressClassName` |
| **Phase 6** | `k8s/infrastructure/cloudflared.yaml` | Thêm conditional logic + empty secret template (ngăn lỗi crash nếu TUNNEL_TOKEN bộ) |

---

## Workflow Triển khai Local K3s

### Bước 1: Chuẩn hóa máy chủ WSL (Setup một lần)

```bash
# 1. IP tĩnh LAN (optional, tùy cách set WSL)
# 2. SSH key-only (tắt password login)
# 3. UFW chỉ mở 22, 80, 443
# 4. NTP sync, logrotate, fail2ban (tùy chọn)

# Hoặc bỏ qua nếu chỉ lab local
```

### Bước 2: Bootstrap K3s single-node

```bash
cd /home/troll/workspaces/ecommerce-platform

# Chạy script ONE-SHOT (tự động cấu hình hết)
bash scripts/initialize-local-k3s.sh

# Hoặc từng bước:
# bash scripts/setup-k3s.sh
# bash scripts/build-images.sh all
# kubectl apply -f k8s/namespace.yaml
# export DB_PASSWORD='...' && bash scripts/create-k8s-secrets.sh
# kubectl apply -f k8s/infrastructure/ k8s/apps/ k8s/ingress/
```

### Bước 3: Setup local DNS (máy tính)

**Linux / macOS:**
```bash
sudo nano /etc/hosts

# Thêm dòng:
127.0.0.1 ecommerce.local
127.0.0.1 api.ecommerce.local
127.0.0.1 admin.ecommerce.local
127.0.0.1 grafana.ecommerce.local
```

**Windows (WSL):**
- Edit `C:\Windows\System32\drivers\etc\hosts`
- Thêm cùng các dòng trên

**Hoặc dùng port-forward:**
```bash
kubectl port-forward -n kube-system svc/traefik 80:80 &

# Rồi dùng: http://localhost/admin (mặc dù URL không match, Traefik sẽ route)
```

### Bước 4: Kiểm tra cluster

```bash
# Xem node + pods
kubectl get nodes
kubectl get pods -A

# Xem PVC
kubectl get pvc -n ecommerce
kubectl get pvc -n ecommerce-cli
kubectl get pvc -n monitoring

# Xem ingress
kubectl get ingress -n ecommerce

# Xem Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000 &
# Truy cập: http://localhost:3000
```

---

## Vận hành hàng ngày

### Kiểm tra healthy

```bash
# Nhanh từ local
kubectl get pods -n ecommerce

# Chi tiết
kubectl get events -n ecommerce --sort-by='.lastTimestamp'

# Logs
kubectl logs -n ecommerce deployment/api-core -f

# Health score
kubectl exec -n ecommerce deployment/cli -- python main.py health check --full
```

### Backup dữ liệu

CronJob tự động chạy daily @ 02:00 UTC:
```bash
# Kiểm tra job
kubectl get cronjob -n ecommerce-cli

# Xem logs
kubectl logs -n ecommerce-cli job/ecommerce-cli-backup-daily-* -f

# Backup manual
kubectl exec -n ecommerce-cli deployment/cli -- python main.py backup create <shop-id>
```

### Restart pod (khi cần)

```bash
# Rolling restart
kubectl rollout restart deployment/api-core -n ecommerce

# Port-forward tạm thời
kubectl port-forward -n ecommerce pod/api-core-xxxxx 3001:3001
```

---

## Dry-Run trước khi deploy từ CI/CD

GitHub Actions trigger:

```bash
# 1. Đẩy code lên main
git push origin main

# 2. GitHub Actions tự động:
#    - Chạy tests (ubuntu-latest)
#    - Build image Docker
#    - Trigger deploy-staging workflow
#    - Runner self-hosted (trong WSL) chạy:
#      - Checkout
#      - Validate manifest (--dry-run)
#      - Build + import image local (scripts/build-images.sh)
#      - Apply manifests
#      - Wait rollout status

# 3. Kiểm tra từ local
kubectl get pods -n ecommerce -w
```

---

## Cloudflare Tunnel (Optional)

Nếu muốn public access (không chỉ local):

```bash
# 1. Tạo tunnel trên https://one.dash.cloudflare.com/
# Token ví dụ: eyJhIjoxMjM...

# 2. Tạo secret
kubectl create secret generic cloudflared-token \
  -n ecommerce \
  --from-literal=TUNNEL_TOKEN='eyJhIjoxMjM...'

# 3. Apply deployment
kubectl apply -f k8s/infrastructure/cloudflared.yaml

# 4. Kiểm tra
kubectl logs -n ecommerce deployment/cloudflared -f
```

Nếu TUNNEL_TOKEN trống, pod sẽ skip tunnel (không crash).

---

## Nâng cấp từ Single-Node sang Multi-Node (Tương lai)

Khi có thêm máy/node mới:

### Checklist Multi-Node

- [ ] **Setup node mới:** Cài K3s agent (join vào cluster master)
  ```bash
  # Trên node mới
  curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
    K3S_TOKEN=<token-from-master> sh -
  ```

- [ ] **Kiểm tra tất cả node:**
  ```bash
  kubectl get nodes -o wide
  # Tất cả phải Ready
  ```

- [ ] **Cấu hình affinity (optional):**
  - Stateless pods: có thể chạy ở bất kỳ node
  - Stateful pods (e.g., DB): pinned vào node cụ thể

- [ ] **Thêm Pod Disruption Budget (PDB):**
  ```yaml
  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata:
    name: api-core-pdb
    namespace: ecommerce
  spec:
    minAvailable: 1
    selector:
      matchLabels:
        app: api-core
  ```

- [ ] **Tăng replicas:**
  ```bash
  kubectl scale deployment/api-core --replicas=3 -n ecommerce
  ```

- [ ] **Setup network policies (nếu cần):**
  - K3s default: cho phép tất cả
  - Nên setup whitelist cho tính bảo mật

- [ ] **Monitoring multi-node:**
  - Prometheus scrape từ tất cả node
  - Grafana dashboards: per-node + cluster overview

---

## Troubleshooting

### Pod pending (PVC)

```bash
kubectl describe pvc <pvc-name> -n ecommerce

# Nếu local-path không match, kiểm tra:
kubectl get storageclass
kubectl describe storageclass local-path
```

### Ingress không hoạt động

```bash
# Kiểm tra Traefik
kubectl get pods -n kube-system | grep traefik

kubectl logs -n kube-system deployment/traefik -f

# Kiểm tra ingress
kubectl describe ingress ecommerce-ingress -n ecommerce
```

### Kubeconfig lỗi

```bash
# Local K3s
export KUBECONFIG=~/.kube/config
kubectl config current-context

# Hoặc từ /etc/rancher/k3s/k3s.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

### GitHub runner không kết nối

```bash
# Trên WSL, kiểm tra runner service
sudo systemctl status actions-runner

# Logs runner
tail -f ~/actions-runner/_diag/*.log
```

---

## Security Notes (Single-Node Development)

⚠️ **Chỉ cho lab local, KHÔNG production:**

- Kubeconfig `~/.kube/config` có full access → giữ bí mật
- Port 6443 (kube-api) chỉ mở nội bộ LAN
- Secret cloudflared-token không commit vào git
- DB password lưu securely (env var hoặc vault)

---

## Tiếp theo (Multi-Phase)

1. **Phase 8:** Setup node mới (join cluster)
2. **Phase 9:** Anti-affinity + PDB
3. **Phase 10:** Network policies
4. **Phase 11:** Upgrade monitoring (multi-node dashboards)
5. **Phase 12:** Production hardening (TLS cert, auth, RBAC)

---

**Version:** 1.0 | **Date:** April 14, 2026 | **Status:** Implementation Complete
