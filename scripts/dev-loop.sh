#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NAMESPACE="${NAMESPACE:-ecommerce}"
COMPOSE_FILE="${PROJECT_ROOT}/docker/docker-compose.yaml"

usage() {
  cat <<'EOF'
Usage:
  scripts/dev-loop.sh up [all|api-core|admin|storefront]
  scripts/dev-loop.sh rebuild [all|api-core|admin|storefront]
  scripts/dev-loop.sh status
  scripts/dev-loop.sh logs [api-core|admin|storefront|redis]
  scripts/dev-loop.sh down

Environment variables for first-time setup:
  DB_HOST, DB_PASSWORD, MONGO_URI
  or DATABASE_URL_SHARD_1, DATABASE_URL_SHARD_2, MONGO_URI

Optional:
  NAMESPACE=ecommerce
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    exit 1
  fi
}

apply_runtime() {
  kubectl apply -f "${PROJECT_ROOT}/k8s/namespace.yaml"
  kubectl apply -f "${PROJECT_ROOT}/k8s/infrastructure/redis.yaml"
  kubectl apply -f "${PROJECT_ROOT}/k8s/apps/"
  kubectl apply -f "${PROJECT_ROOT}/k8s/ingress/ingress.yaml"
}

wait_runtime() {
  kubectl rollout status deploy/redis -n "${NAMESPACE}" --timeout=180s
  kubectl rollout status deploy/api-core -n "${NAMESPACE}" --timeout=300s
  kubectl rollout status deploy/admin -n "${NAMESPACE}" --timeout=300s
  kubectl rollout status deploy/storefront -n "${NAMESPACE}" --timeout=300s
}

ensure_api_secret() {
  if kubectl get secret api-core-secret -n "${NAMESPACE}" >/dev/null 2>&1; then
    return
  fi

  if [ -z "${MONGO_URI:-}" ]; then
    echo "Secret api-core-secret chưa tồn tại và thiếu biến MONGO_URI."
    echo "Export biến môi trường rồi chạy lại lệnh up."
    exit 1
  fi

  if { [ -n "${DATABASE_URL_SHARD_1:-}" ] && [ -n "${DATABASE_URL_SHARD_2:-}" ]; } || { [ -n "${DB_HOST:-}" ] && [ -n "${DB_PASSWORD:-}" ]; }; then
    bash "${PROJECT_ROOT}/scripts/create-k8s-secrets.sh"
    return
  fi

  echo "Secret api-core-secret chưa tồn tại."
  echo "Cần export DB_HOST + DB_PASSWORD hoặc DATABASE_URL_SHARD_1/2, và MONGO_URI."
  exit 1
}

rollout_restart_target() {
  local target="$1"
  case "$target" in
    all)
      kubectl rollout restart deploy/api-core -n "${NAMESPACE}"
      kubectl rollout restart deploy/admin -n "${NAMESPACE}"
      kubectl rollout restart deploy/storefront -n "${NAMESPACE}"
      ;;
    api-core|admin|storefront)
      kubectl rollout restart "deploy/${target}" -n "${NAMESPACE}"
      ;;
    *)
      echo "Invalid target: ${target}"
      usage
      exit 1
      ;;
  esac
}

main() {
  local cmd="${1:-}"
  local target="${2:-all}"

  case "$cmd" in
    up)
      require_cmd docker
      require_cmd kubectl
      require_cmd k3s

      docker compose -f "${COMPOSE_FILE}" up -d
      ensure_api_secret
      bash "${PROJECT_ROOT}/scripts/build-images.sh" "${target}"
      apply_runtime
      wait_runtime
      kubectl get pods -n "${NAMESPACE}"
      kubectl get ingress -n "${NAMESPACE}"
      ;;
    rebuild)
      require_cmd kubectl
      require_cmd k3s
      bash "${PROJECT_ROOT}/scripts/build-images.sh" "${target}"
      rollout_restart_target "${target}"
      wait_runtime
      ;;
    status)
      kubectl get pods -n "${NAMESPACE}"
      kubectl get svc -n "${NAMESPACE}"
      kubectl get ingress -n "${NAMESPACE}"
      ;;
    logs)
      local app="${2:-api-core}"
      kubectl logs -n "${NAMESPACE}" "deploy/${app}" -f
      ;;
    down)
      kubectl delete -f "${PROJECT_ROOT}/k8s/ingress/ingress.yaml" --ignore-not-found=true
      kubectl delete -f "${PROJECT_ROOT}/k8s/apps/" --ignore-not-found=true
      kubectl delete -f "${PROJECT_ROOT}/k8s/infrastructure/redis.yaml" --ignore-not-found=true
      docker compose -f "${COMPOSE_FILE}" down
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
