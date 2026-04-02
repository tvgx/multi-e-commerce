#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NAMESPACE="${NAMESPACE:-ecommerce}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Missing command: kubectl"
  exit 1
fi

if [ -z "${CF_TUNNEL_TOKEN:-}" ]; then
  echo "Missing CF_TUNNEL_TOKEN"
  echo "Get token from Cloudflare Zero Trust > Networks > Tunnels > your tunnel > Run tunnel"
  exit 1
fi

kubectl apply -f "${PROJECT_ROOT}/k8s/namespace.yaml"

kubectl create secret generic cloudflared-token \
  -n "${NAMESPACE}" \
  --from-literal=TUNNEL_TOKEN="${CF_TUNNEL_TOKEN}" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

kubectl apply -f "${PROJECT_ROOT}/k8s/infrastructure/cloudflared.yaml"
kubectl rollout status deploy/cloudflared -n "${NAMESPACE}" --timeout=180s

echo ""
echo "cloudflared tunnel is running in namespace ${NAMESPACE}."
echo "Now configure Public Hostnames in Cloudflare tunnel dashboard:"
echo "  api.<your-domain>    -> http://traefik.kube-system.svc.cluster.local"
echo "  admin.<your-domain>  -> http://traefik.kube-system.svc.cluster.local"
echo "  shop.<your-domain>   -> http://traefik.kube-system.svc.cluster.local"
echo ""
echo "In Cloudflare each hostname should forward Host header to one of:"
echo "  api.ecommerce.local"
echo "  admin.ecommerce.local"
echo "  ecommerce.local"
