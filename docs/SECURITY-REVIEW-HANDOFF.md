# Security Review Handoff — branch `child`

_Generated 2026-06-19 from a focused security review of the changes newly introduced on this branch (non-test, non-doc source files). Methodology: candidate identification → parallel false-positive validation → filter to ≥8/10 exploitability._

## TL;DR

**No HIGH/MEDIUM confidence *exploitable* vulnerabilities confirmed.** Two candidates were raised and both filtered out. One of them (password-reset shop scoping) is **not an exploitable takeover** but **is a real correctness defect worth fixing** — that's the only actionable item below.

---

## [x] SEC-1 — Storefront password reset is not shop-scoped (FIXED 2026-06-19)

> **Resolved.** `forgotPassword` now stores the verification `identifier` as `${shopId}:${email}`, and `resetPassword` splits the shopId back out and resolves the customer via the composite unique key `findUnique({ where: { shopId_email: { shopId, email } } })` (rejects a malformed/legacy bare-email identifier with `PARAM_VALUE_INVALID`). Covered by `storefront-auth.service.spec.ts` (shop-scoped identifier on forgot, composite-key lookup on reset, malformed-identifier rejection). api-core suite: 32 suites / 389 tests green; `tsc` exit 0.

### Original finding (for reference)

- **Severity:** Low (correctness / defense-in-depth). Not an account-takeover vuln.
- **Exploitability:** 3/10 — chain is broken by the email-delivery factor (see below).
- **Files:**
  - `apps/api-core/src/modules/storefront-auth/storefront-auth.service.ts:180-251` (`forgotPassword`, `resetPassword`)
  - `apps/api-core/src/modules/storefront-auth/storefront-auth.controller.ts:58-66` (both endpoints unauthenticated — expected for a reset flow)

### What's real
This is a multi-tenant app — `Customer` is keyed `@@unique([shopId, email])`, so the same email can be a different customer row in different shops. The reset flow ignores the shop:
- `forgotPassword` stores the verification with `identifier: email` only — **no `shopId`** (`storefront-auth.service.ts:198`).
- `resetPassword` resolves the target with `prisma.customer.findFirst({ where: { email: verification.identifier } })` — **email only, no `shopId`, no `orderBy`** (`storefront-auth.service.ts:223-225`).

So a reset requested in one shop's context can non-deterministically land on a same-email customer row in a *different* shop. For a person who legitimately holds accounts under one mailbox at multiple shops, a reset at shop A can silently set the password on their shop-B account instead → self-inflicted lockout / wrong-account write. Correctness bug.

### Why it is NOT an exploitable account takeover
The token's `identifier` and its email-delivery address are the **same field** — both are the `email` argument (stored line 198, emailed line 209). `resetPassword` then matches the customer by exactly that identifier email (line 224). Therefore:
- To get a valid token whose identifier is a victim's email, an attacker must call `forgotPassword` with the victim's email → the token is emailed **only to the victim's real mailbox**.
- An attacker can never receive a token for an email they don't control, and `findFirst` only ever matches accounts under that same controlled email.
- The `forgotPassword` response is a generic message (no token leak); the token is not logged.

The email channel is an intact authentication factor; no cross-principal boundary is crossed. (The original sub-agent flagged this 9/10 by incorrectly assuming the attacker receives the token — registering an email at your own shop does not give you control of that mailbox.)

### Fix (correctness hardening)
Bind the reset to the shop and resolve by composite key:
1. In `forgotPassword`, store `identifier` as `${shopId}:${email}` (the `Customer` model comment already anticipates this format), or add a dedicated `shopId` column to `CustomerVerification`.
2. In `resetPassword`, parse the shop back out and resolve with the composite unique key instead of `findFirst`:
   ```ts
   const customer = await this.prisma.customer.findUnique({
     where: { shopId_email: { shopId, email } },
   });
   ```

---

## Filtered out — no action needed

### SEC-FP-1 — "Cross-tenant overwrite via global-unique `figma_node_id`" → FALSE POSITIVE (2/10)
- Files: `apps/design-agent/src/extractor/schemas/page-layout.schema.ts`, `apps/design-agent/src/extractor/mongo.repository.ts`
- The claim that the field still carries `unique: true` is stale. Actual working-tree state: `figma_node_id` is `@Prop({ type: String, required: true, index: true })` (no field-level `unique`); a compound `PageLayoutSchema.index({ figma_node_id: 1, tenant_id: 1 }, { unique: true })` was added; `upsertPage` filters `{ figma_node_id, tenant_id }`. The new migration drops the legacy `figma_node_id_1` index, neutralizing the `autoIndex` concern.
- Trust boundary: the only caller path (`POST /design-agent/extract-theme`) is gated by an `x-internal-key` server-to-server header, invoked solely by api-core `importFromFigma` (enforces `assertShopOwner`, hardcodes `tenant_id: null`). No attacker-controlled tenant boundary.

---

## Examined and confirmed sound (no findings)
- **`payment.service.ts` `handleWebhook`** — inert stub, no state mutation, no "mark paid" path. `confirmPayment` is gated by an unguessable `randomUUID` single-use, expiring token.
- **Multi-tenant CRUD** (`catalog` rating `groupBy`, `inventory.decrementStock`, `customer-address.update`, `cart`, `order`, `theme-market.applyTheme`, `layout.createMasterTemplate`) — all queries scope by tenant `shopId` plus a DB-resolved `customerId`/owner role; an `x-shop-id` header swap yields empty results, not cross-tenant access.
- **`auth.service.changePassword`** — forwards the authenticated session to better-auth (current password verified).
- **design-agent `chatbot` / `rag` / `extractor`** — Mongo filters built from server-side typed values with mandatory `tenant_id` hard filters; no NoSQL injection.
- **Admin tsx / `ProductForm` / `useProducts` / `create-product.dto`** — no `dangerouslySetInnerHTML`, `eval`, or secret/PII exposure.
