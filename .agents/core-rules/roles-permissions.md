# Vai trò & quyền

Tóm tắt. Chi tiết đầy đủ: [AGENTS.md](../../AGENTS.md).

| Vai trò | Key | Được làm | Giới hạn |
|---------|-----|----------|----------|
| Developer | `dev-*` | list shop, create `--dry-run`, backup tay, health check | Chỉ dev; không delete/restore/sync |
| Shop Admin | `shop-<id>` | get/update shop của mình, apply template, backup/restore (shop mình) | Trong phạm vi 1 tenant |
| Ops Admin | `admin-ops` | create shop, batch, `auto-fix`, sync (staging→accept), backup/restore | Không delete shop; sync→prod cần 2 approval |
| Platform Admin | `admin-platform` | tất cả, `--force`, delete shop, sync prod (có approval) | Mọi `--force` phải audit + post-mortem |
| K8s SA | `sa-kubernetes` | backup create/delete, health check, audit export | Chỉ job tự động |
| CI/CD | `gh-actions` | build, test, verify deploy | Chỉ pipeline |

## Chuỗi phê duyệt

| Thao tác | Mức | Approver | Số |
|----------|-----|----------|:--:|
| shop delete / restore prod / sync→prod | CRITICAL | Platform Admin + (SRE/Ops Lead) | 2 |
| auto-fix (prod) | CRITICAL | Ops/Platform Admin | 1 |
| batch >10 shop / template apply prod | HIGH | Ops/Feature Lead | 1 |
| apply manifest prod | HIGH | SRE + Tech Lead | 2 |

## Xoay khóa
Platform Admin: 2 tuần (CRITICAL). Ops Admin/Shop Admin: quý. Developer/SA/CI-CD: tháng.

Không chắc role → hỏi trước khi chạy thao tác rủi ro. Tiếp: [escalation-contacts.md](escalation-contacts.md).
