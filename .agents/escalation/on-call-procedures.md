# On-Call Procedures

## Khi có alert (P1)
1. **Ack** trong PagerDuty, join #incidents.
2. **Triage**: xác định tầng lỗi (API / PostgreSQL / Redis / MongoDB / MinIO / K8s / mạng).
3. **Mitigate**: rollback rollout, restart pod, hoặc failover — ưu tiên khôi phục dịch vụ.
4. **Restore** về trạng thái khỏe → verify health + smoke test.
5. **Communicate**: cập nhật trạng thái định kỳ (~15').
6. **Post-mortem** ≤24h: RCA, vì sao bỏ sót, cải thiện monitor/test.

## Handoff khi xoay ca
Cập nhật PagerDuty, đặt trạng thái "on-call đến <ngày>", chia sẻ runbook/contact, họp bàn giao ngắn, người trước trực sẵn sàng hỗ trợ 24h đầu.

Mức & SLA: [support-levels.md](support-levels.md). Liên hệ: [core-rules/escalation-contacts.md](../core-rules/escalation-contacts.md).
