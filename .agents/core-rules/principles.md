# Nguyên tắc cốt lõi

Áp dụng cho mọi developer, ops, agent tự động.

1. **Không push thẳng `main`** — mọi code qua PR → review → merge. Kể cả hotfix (PR fast-track). Lý do: audit, review, CI, dễ rollback.
2. **Kiểm [AGENTS.md](../../AGENTS.md) trước thao tác môi trường/quyền** — xác định role, quyền, chuỗi approval, audit.
3. **Không ghi secret vào code/log** — dev: `.env` (gitignore); staging: K8s Secrets; prod: Azure Key Vault. Xoay khóa định kỳ.
4. **Audit mọi thao tác rủi ro** — `shop delete`, `backup restore` (prod), `sync config`→prod, `auto-fix` (prod), batch >10 shop, apply manifest prod. Log: ai/khi nào/lý do/approval/kết quả. Lưu prod ≥90 ngày.
5. **Dry-run trước** — `--dry-run` xem trước → backup → xin approval → thực hiện.
6. **Audit log bất biến** — append-only, không sửa/xóa; mã hóa in-transit + at-rest.
7. **Đường escalation rõ** — Dev → Team lead → Ops Admin → Platform Admin → SRE on-call (xem [escalation/](../escalation/)).
8. **Cộng tác > đơn độc** — PR mô tả rõ (impact, test, rollback); thông báo thay đổi lớn; post-mortem để học.
9. **Không quick-fix** — cấm: hardcode URL/credentials/config; bỏ qua `BaseResponseDto` (trả raw); dùng `any` né type; stub không implement; tắt guard/validation "để test" rồi quên revert; nuốt lỗi try/catch. Trước khi code hỏi: *"Còn đúng sau 6 tháng khi scale & người khác maintain không?"* — Không/không chắc → dừng, làm đúng.

```ts
// ❌ trả raw          // ✅ bọc envelope
return this.svc.x(d);  const r = await this.svc.x(d); return BaseResponseDto.success(r);
// ❌ hardcode         // ✅ env có fallback
'http://localhost:9000' process.env.STORAGE_BASE_URL
```

Tiếp: [roles-permissions.md](roles-permissions.md).
