# Operations Risk Matrix

| Thao tác | Mức | Approval | Quy trình |
|----------|-----|:--------:|-----------|
| `shop delete` | CRITICAL | 2 | [critical](approval-workflow-critical.md) |
| `backup restore` (prod) | CRITICAL | 2 | critical |
| `sync config` → prod | CRITICAL | 2 | critical |
| `health check --auto-fix` (prod) | CRITICAL | 1 | critical |
| apply manifest (prod) | HIGH | 2 (SRE+Tech Lead) | [standard](approval-workflow-standard.md) |
| `batch create` >10 shop | HIGH | 1 | standard |
| `template apply` (prod) | HIGH | 1 | standard |
| backup create / health check (read) | LOW | 0 | tự làm |

Mọi mức HIGH/CRITICAL: bắt buộc dry-run + backup + audit.
