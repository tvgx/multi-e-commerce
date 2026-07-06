#!/usr/bin/env bash
# Auto-deploy cho box Lightsail: giữ checkout = origin/main và container = image
# :latest mới nhất trên ghcr.io. Chạy định kỳ bởi systemd timer
# (xem systemd/ecommerce-autodeploy.timer) — idempotent, tick nào không có gì
# mới thì không làm gì.
#
# Cài đặt trên box (một lần):
#   sudo cp deploy/systemd/ecommerce-autodeploy.{service,timer} /etc/systemd/system/
#   sudo systemctl daemon-reload
#   sudo systemctl enable --now ecommerce-autodeploy.timer
# Theo dõi: journalctl -u ecommerce-autodeploy.service -f
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/ubuntu/multi-e-commerce}"
COMPOSE_FILE="$REPO_DIR/deploy/docker-compose.prod.yaml"

cd "$REPO_DIR"

git fetch --quiet origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "origin/main moved ${LOCAL:0:7} -> ${REMOTE:0:7}, updating checkout"
  # Box là môi trường chạy, không ai sửa code tại chỗ — reset thẳng theo remote.
  # File untracked (deploy/.env, data volume) không bị ảnh hưởng.
  git reset --hard --quiet origin/main
fi

# Kéo digest :latest mới (nếu có) rồi để compose tự nhận ra container nào đổi
# image/config mà recreate — không có gì mới thì up -d là no-op.
docker compose -f "$COMPOSE_FILE" pull --quiet
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
docker image prune -f >/dev/null

echo "deploy tick OK at $(git rev-parse --short HEAD)"
