# Dry-Run

Mọi thao tác rủi ro chạy `--dry-run` trước để xem hệ quả mà không thay đổi gì.

```bash
shop delete --id <id> --dry-run          # liệt kê SP/đơn/dung lượng sẽ xoá
backup restore --shop <id> --backup-id <id> --dry-run
sync config --from staging --to prod --dry-run   # show diff
```

Đọc kỹ output (số bản ghi, dung lượng, diff) → nếu đúng kỳ vọng mới qua bước backup + approval. Thao tác K8s: dùng `kubectl diff`/`--dry-run=server` thay vì apply trực tiếp.
