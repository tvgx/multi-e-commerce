# Liên hệ & Escalation

## Kênh theo tình huống

| Tình huống | Kênh | Mức | SLA |
|-----------|------|-----|-----|
| Hỏi nhanh | #engineering | Thấp | 1h+ |
| Cần review | tag reviewer trong PR | TB | 1–4h |
| Staging hỏng | #ops + on-call | Cao | 30' |
| Prod down (P1) | PagerDuty + #incidents | CRITICAL | 5' |
| Prod giảm chất lượng (P2) | #ops + on-call | Cao | 15' |
| Việc thấp (P3) | GitHub issue | Thấp | Sprint sau |

## Mức escalation
- **L1 Team Lead** — kẹt code/thiết kế. SLA 2–4h.
- **L2 Ops Admin** — staging deploy lỗi, migration, test restore. SLA 1h.
- **L3 Platform Admin** — prod down, mất dữ liệu, sự cố bảo mật. SLA 5–15'; cần change ticket; post-mortem trong 24h.

## On-call
SRE on-call (24/7, qua PagerDuty, có quyền platform + `--force`); Ops on-call (#ops-oncall, giờ hành chính + cửa sổ escalation).

## Quy trình P1
PagerDuty page SRE → ack ở #incidents → triage (API/DB/K8s/network) → mitigate (rollback/restart/failover) → restore → post-mortem ≤24h.

## Ngoài giờ
Cửa sổ deploy 09:00–17:00 UTC (T2–T6). Ngoài giờ chỉ khẩn cấp: chạy `--force --reason "P1-<ticket>"` → auto-escalate SRE → cửa sổ review 6h → không duyệt thì auto-rollback → post-mortem ≤24h.

> Bảng tên/điện thoại cụ thể: cập nhật theo team thật (PagerDuty/Slack). Chi tiết: [escalation/](../escalation/).
