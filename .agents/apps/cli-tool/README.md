# cli-tool — Tự động hoá & đồng bộ

Hai phần trong cùng thư mục:

- **CLI Python** (`main.py`, `commands/`, `api_client.py`, `requirements.txt`): vận hành & tự động hoá — tạo/sửa/xoá shop, batch theo CSV, backup/restore, health-check, audit. Gọi api-core qua HTTP. Chạy: `python main.py --help`.
- **Layout sync Node** (`package.json` = `cli-tool-node`, scripts `tsx`): đồng bộ layout giữa code và MongoDB cho dev builder — `npm run sync:layout`, `npm run watch:layout` (chokidar + socket.io-client + `@ecommerce/schema`).

Lệnh Python theo nhóm: `shop create|list|get|update|delete`, `backup create|restore|rollback`, `batch create --csv`, `health check --auto-fix`, `audit view`.

Triển khai: chạy tay hoặc K8s CronJob/Job (backup định kỳ, batch từ ConfigMap). API tham chiếu: [api-doc](../../../api-doc/).
