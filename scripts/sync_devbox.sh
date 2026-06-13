#!/bin/bash

# ==============================================================================
# Script Đồng Bộ Real-time: WSL2 -> Devbox
# Tự động đẩy file ngay khi có thay đổi trong thư mục dự án
# Yêu cầu: inotify-tools (sudo apt install inotify-tools)
# ==============================================================================

# Thư mục gốc chứa source code (thư mục chạy script)
LOCAL_DIR=$(pwd)

# Thư mục đích trên devbox
REMOTE_USER="nqtuan"
REMOTE_HOST="devbox"
REMOTE_DIR="~/tvgx"

# Danh sách bỏ qua (không đồng bộ để tối ưu, devbox sẽ tự install/build)
EXCLUDE_LIST=(
    "--exclude=.git/"
    "--exclude=node_modules/"
    "--exclude=.next/"
    "--exclude=.turbo/"
    "--exclude=dist/"
    "--exclude=build/"
    "--exclude=*.log"
)

echo "=========================================="
echo " Bắt đầu đồng bộ WSL2 -> $REMOTE_HOST"
echo " Thư mục Local: $LOCAL_DIR"
echo " Thư mục Đích:  $REMOTE_DIR"
echo "=========================================="

# 1. Kiểm tra inotify-tools
if ! command -v inotifywait &> /dev/null; then
    echo "❌ Lỗi: Chưa cài đặt inotify-tools."
    echo "Vui lòng chạy lệnh sau để cài đặt: sudo apt-get install inotify-tools"
    exit 1
fi

# 2. Bước copy toàn bộ lần đầu tiên (nếu devbox chưa có file)
echo "[1/2] Đang thực hiện đồng bộ toàn bộ codebase lần đầu..."
rsync -avz --delete "${EXCLUDE_LIST[@]}" -e "ssh" "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"
echo "Đã đồng bộ toàn bộ!"

# 2. Bước chạy vòng lặp lắng nghe thay đổi real-time
echo "[2/2] Đang lắng nghe thay đổi file (nhấn Ctrl+C để dừng)..."

inotifywait -m -r -e modify,create,delete,move --format '%w%f' \
    --excludei '/(\.git|node_modules|\.next|\.turbo|dist|build)/' \
    "$LOCAL_DIR" | while read -r FILE
do
    # Lấy đường dẫn tương đối để đồng bộ đúng chỗ
    REL_PATH="${FILE#$LOCAL_DIR/}"
    
    echo "🔄 File thay đổi: $REL_PATH -> Đang đẩy lên devbox..."
    
    # Dùng rsync để đẩy (có thể tối ưu chỉ đẩy file thay đổi, nhưng rsync sẽ tự nhận diện)
    rsync -avz --delete "${EXCLUDE_LIST[@]}" -e "ssh" "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/" > /dev/null 2>&1
    
    echo "✅ Xong."
done
