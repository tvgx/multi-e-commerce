# Support Levels (Severity)

| Mức | Nghĩa | Kênh | SLA phản hồi | Hậu |
|-----|-------|------|:-----------:|-----|
| **P1** | Prod down / mất dữ liệu / sự cố bảo mật | PagerDuty + #incidents | 5' | Post-mortem ≤24h |
| **P2** | Prod giảm chất lượng / staging hỏng | #ops + on-call | 15–30' | Ghi nhận, review nếu lặp |
| **P3** | Lỗi nhỏ, không chặn | GitHub issue | Sprint sau | — |

Xác định mức trước → chọn kênh → theo runbook ([on-call-procedures.md](on-call-procedures.md) / [troubleshooting/](../troubleshooting/)).
