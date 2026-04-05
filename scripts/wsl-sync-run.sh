#!/usr/bin/env bash
set -euo pipefail

# Sync the current repo from /mnt/* into Linux filesystem, then run a command there.
ROOT_DIR="$(git rev-parse --show-toplevel)"
TARGET_DIR="${WSL_MIRROR_DIR:-$HOME/workspaces/ecommerce-platform}"
NODE_VERSION="${WSL_NODE_VERSION:-22.22.1}"
SYNC_ONLY=false
SKIP_INSTALL=false

usage() {
  cat <<'EOF'
Usage:
  bash scripts/wsl-sync-run.sh [--sync-only] [--skip-install] [command...]

Examples:
  bash scripts/wsl-sync-run.sh --sync-only
  bash scripts/wsl-sync-run.sh npm run build
  bash scripts/wsl-sync-run.sh npm --workspace apps/admin run build

Options:
  --sync-only     Sync source to mirror and exit
  --skip-install  Skip npm install in mirror

Env vars:
  WSL_MIRROR_DIR   Override target mirror path (default: ~/workspaces/ecommerce-platform)
  WSL_NODE_VERSION Override node version (default: 22.22.1)
EOF
}

ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --sync-only)
      SYNC_ONLY=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

mkdir -p "$(dirname "$TARGET_DIR")"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.turbo' \
  --exclude 'apps/cli-tool/venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '*.log' \
  --exclude 'build.log' \
  --exclude 'out.txt' \
  "$ROOT_DIR/" "$TARGET_DIR/"

if [[ "$SYNC_ONLY" == true ]]; then
  echo "Synced to: $TARGET_DIR"
  exit 0
fi

cd "$TARGET_DIR"

# Load nvm if available in non-interactive shell.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  nvm use "$NODE_VERSION" >/dev/null || nvm install "$NODE_VERSION" >/dev/null
fi

if [[ "$SKIP_INSTALL" == false ]]; then
  npm install
fi

if [[ ${#ARGS[@]} -eq 0 ]]; then
  npm run build
else
  "${ARGS[@]}"
fi
