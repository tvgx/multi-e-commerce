# 🏛️ Core Rules — Nguyên Tắc Cốt Lõi

Những quy tắc nền tảng áp dụng cho **mỗi** developer, ops, agent tự động, và quy trình trong dự án này.

---

## 1. Không bao giờ Push Trực tiếp lên `main`

**Rule**: All code → PR → Approval → Merge  
**Exception**: Không có exception. Even emergency hotfix → PR (fast-tracked).

```bash
# ❌ NEVER DO THIS
git push origin main

# ✅ ALWAYS DO THIS
git checkout -b hotfix/critical-issue
git commit -m "fix(...): ..."
git push origin hotfix/critical-issue
# → Open PR, get approval (expedited), merge
```

**Why?**
- Audit trail: Mỗi thay đổi được track ai, khi nào, lý do gì
- Code review: Catch bugs, security issues, performance problems
- CI/CD: Automatic testing before merge
- Rollback: Easy to identify & revert if needed

---

## 2. Luôn Tuân Theo AGENTS.md Trước Khi Thực Hiện Thao Tác Môi Trường

**Rule**: Kiểm tra [/AGENTS.md](../AGENTS.md) để xác định:
- Role của bạn (Developer, Shop Admin, Ops Admin, Platform Admin, SA, CI/CD)
- Quyền được cấp (allowed commands per role)
- Approval chain (bao nhiêu người phải approve)
- Audit trail (mọi thao tác được log)

**Common Questions**:
- "Tôi có thể chạy `shop delete` không?" → Check AGENTS.md (đáp: Yes nếu Platform Admin, No nếu Developer)
- "Thao tác này cần bao nhiêu approvals?" → Check AGENTS.md (approval matrix)
- "Chúng tôi có thể sync config từ production → staging không?" → Check AGENTS.md (đáp: No, one-way only dev→prod)

---

## 3. Không Bao Giờ Ghi Secret Vào Code hoặc Logs

**Rule**: Secrets = external, encrypted, rotated.

**Lưu trữ Secrets**:
| Environment | Storage | Encryption | Rotation |
|---|---|---|---|
| **Development** | `.env` (local, `.gitignore`) | None (file) | N/A |
| **Staging** | K8s Secrets + GitHub Secrets | At-rest (etcd TLS) | Monthly |
| **Production** | Azure Key Vault + GitHub Secrets | AES-256, HSM | Bi-weekly |

**Examples**:
```bash
# ❌ NEVER
echo "DB_PASSWORD=supersecret123" > config.ts
git commit -m "add db password"

# ✅ ALWAYS
# .env (gitignored)
DB_PASSWORD=supersecret123

# Or use env vars in CI/CD
export DB_PASSWORD=$(az keyvault secret show --vault-name mykeyvault --name db-password --query value -o tsv)
```

**Secret Scanning** → GitHub automatically detects leaked tokens, revokes them, alerts you.

---

## 4. Audit Log Mọi Thao Tác Rủi Cao

**High-Risk Operations** (bắt buộc audit):
- `shop delete`, `backup restore` (production), `sync config` → production
- `health check --auto-fix` (production), `batch create` (> 10 shops)
- Kubernetes manifest apply (production)

**Audit Log Ghi Nhận**:
```json
{
  "timestamp": "2026-04-07T14:32:00Z",
  "user_id": "dev@company.com",
  "action": "SHOP_DELETED",
  "shop_id": "shop-456",
  "reason": "Customer requested close",
  "backup_created": true,
  "approval_chain": ["alice@company.com", "bob@company.com"],
  "status": "success"
}
```

**Retention**:
- Dev: 7 days
- Staging: 30 days
- Production: 90 days + archive

---

## 5. Dry-Run Trước Khi Thực Hiện Thao Tác Rủi Cao

**Rule**: Mọi thao tác high-risk phải chạy `--dry-run` trước (nếu có).

```bash
# Step 1: Dry-run (preview)
shop delete --id shop-123 --dry-run
# Output: "Would delete shop shop-123, 500 products, 1000 orders, 50 GB data"

# Step 2: Create backup
backup create --shop shop-123 --name "pre-delete-snapshot"

# Step 3: Ask approval (PR + issue)
# → Get 2 approvals

# Step 4: Execute
shop delete --id shop-123 --force --reason "customer-close-request" --approvers "alice,bob"
```

---

## 6. Giữ Audit Trail Immutable (Không Thay Đổi)

**Rule**: Audit logs là output-only, append-only.
- Không xóa, không sửa lịch sử
- Encrypted in transit (TLS 1.3) + at-rest (AES-256)
- Monthly export cho compliance (GDPR, SOC2)

---

## 7. Escalation Path Rõ Ràng

**Khi có vấn đề**:

```
Level 1 (Developer) — Spot issues in dev
  → Tự fix nếu có thể
  → Escalate to team lead nếu cần guidance

Level 2 (Ops Admin) — Staging/production monitoring
  → Investigate, tạo incident ticket
  → Can escalate to platform admin

Level 3 (Platform Admin) — Fix production
  → Requires change ticket
  → Post-mortem trong 24 hours

Emergency (Out-of-hours) → On-call SRE
  → Can use --force flag (requires incident ticket)
  → Auto-rollback nếu không approve in 6 hours
```

Xem [escalation/](../escalation/) cho chi tiết.

---

## 8. Collaboration > Isolation

**Rule**: Communicate & document.
- PR descriptions phải rõ ràng (impact, testing, rollback plan)
- Slack #engineering cho big changes
- Post-mortem công khai để team học hỏi

---

## 9. Không Dùng Cách Nhanh — Ưu Tiên Ổn Định, Hoàn Chỉnh, Lâu Dài

**Rule**: **TUYỆT ĐỐI KHÔNG** chọn giải pháp nhanh (quick fix / shortcut) khi có giải pháp đúng đắn hơn. Mọi quyết định kỹ thuật phải đặt sự ổn định, tính hoàn chỉnh và tầm nhìn dài hạn của dự án lên trên tiện lợi nhất thời.

**Các hành vi bị cấm**:

- Hardcode giá trị tạm thời rồi "sẽ sửa sau" (`localhost:9000`, magic strings, mock data trong production code)
- Bypass validation, auth guard, hoặc middleware "để test nhanh" rồi quên không revert
- Trả về raw data từ API thay vì chuẩn hóa theo response format đã định nghĩa
- Dùng `any` trong TypeScript để tránh phải xử lý type đúng cách
- Tạo endpoint giả / stub function không có implementation thật
- Copy-paste logic thay vì trừu tượng hóa đúng chỗ
- Tắt error handling "tạm thời" (`try/catch` nuốt lỗi, bỏ qua validation)

**Câu hỏi bắt buộc trước khi viết code**:

> *"Giải pháp này có hoạt động đúng trong 6 tháng nữa, khi dự án scale lên và người khác maintain không?"*

Nếu câu trả lời là **Không** hoặc **Không chắc** → **dừng lại, tìm giải pháp đúng đắn**.

**Ví dụ đúng/sai**:

```typescript
// ❌ SAI — Quick fix: controller trả raw data, client tự đoán format
async uploadFile(...) {
  return this.mediaService.uploadFile(file, dto); // raw Prisma record
}

// ✅ ĐÚNG — Đúng contract: wrap trong BaseResponseDto như mọi endpoint khác
async uploadFile(...) {
  const media = await this.mediaService.uploadFile(file, dto);
  return BaseResponseDto.success(media);
}
```

```typescript
// ❌ SAI — Hardcode URL môi trường dev vào source code
const MINIO_BASE = 'http://localhost:9000/assets';

// ✅ ĐÚNG — Đọc từ env, có fallback hợp lý
const MINIO_BASE = process.env.STORAGE_BASE_URL;
```

**Why?**

- Mỗi shortcut tạo ra **technical debt** — chồng đủ nhiều là cả hệ thống không thể maintain
- Bug từ quick fix thường xuất hiện muộn, khó trace (như lỗi `data.data?.url` âm thầm fail)
- Dự án SaaS multi-tenant không có chỗ cho code "chạy được nhưng sai"

---

## 📋 Summary

| Nguyên Tắc | Mục Đích | Exception |
|---|---|---|
| No direct push to main | Code review + audit | Không |
| Check AGENTS.md | Permission enforcement | Không (hỏi trước) |
| No secrets in code | Security | Không (external storage) |
| Audit high-risk ops | Compliance + traceability | Không |
| Dry-run first | Safe preview | Chỉ khi --dry-run không available |
| Immutable audit logs | Evidence for incidents | Không (append-only) |
| Clear escalation | Incident response | Không (đã định nghĩa) |
| Collaborate | Team alignment | Không (async is OK) |
| Không dùng quick fix | Stability + maintainability | Không |

---

**Tiếp theo?** → [roles-permissions.md](roles-permissions.md) — hiểu role của bạn
