#!/usr/bin/env bash
# Profile api-core ở mức FUNCTION bằng V8 CPU profiler (--cpu-prof).
# Sinh 1 file .cpuprofile mở thẳng trong VSCode:
#   - Self time  -> function nào TỰ NÓ chậm
#   - Total time + call tree (caller->callee) -> function nào KÉO THEO function khác chậm
#
# Yêu cầu: local stack (postgres/redis/minio) đã chạy, và đã `npm run build` cho api-core.
#
# Dùng:
#   bash scripts/profile-api.sh /api/shops/bootstrap/ahehe
#   bash scripts/profile-api.sh /api/products/shop/<shopId> 30 20   # path, giây, kết nối song song
set -euo pipefail

PATH_TO_HIT="${1:-/api/shops/bootstrap/ahehe}"
DURATION="${2:-20}"          # số giây đập tải
CONNECTIONS="${3:-20}"       # số kết nối song song
PORT=3000
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$ROOT/.cpuprofile"
mkdir -p "$OUTDIR"

cd "$ROOT/apps/api-core"

echo "▶ Khởi động api-core với V8 CPU profiler…"
# --cpu-prof: bật profiler; ghi file khi process thoát sạch (SIGINT).
node --cpu-prof --cpu-prof-dir "$OUTDIR" --cpu-prof-name "api-$(date +%H%M%S).cpuprofile" \
  dist/src/main.js &
API_PID=$!

cleanup() { kill -INT "$API_PID" 2>/dev/null || true; }
trap cleanup EXIT

echo "▶ Chờ API sẵn sàng (port $PORT)…"
for i in $(seq 1 60); do
  if curl -s -o /dev/null --max-time 1 "http://localhost:$PORT/api/docs"; then break; fi
  sleep 1
  if [ "$i" = "60" ]; then echo "✗ API không lên sau 60s"; exit 1; fi
done

echo "▶ Đập tải ${DURATION}s x ${CONNECTIONS} conn vào: $PATH_TO_HIT"
"$ROOT/node_modules/.bin/autocannon" -d "$DURATION" -c "$CONNECTIONS" \
  "http://localhost:$PORT${PATH_TO_HIT}" || true

echo "▶ Dừng API để flush .cpuprofile…"
kill -INT "$API_PID" 2>/dev/null || true
wait "$API_PID" 2>/dev/null || true
trap - EXIT

echo ""
echo "✓ Xong. File profile:"
ls -t "$OUTDIR"/*.cpuprofile | head -1
echo ""
echo "→ Mở file .cpuprofile đó trong VSCode (double-click)."
echo "  • Cột 'Self Time'  = function tự nó chậm."
echo "  • Xem 'Call Tree'  = function cha kéo theo function con chậm."
