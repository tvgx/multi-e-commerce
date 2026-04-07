# 🔐 Security — Threat Scanning & Compliance

Automated scanning, alerting, and compliance verification.

---

## Automated Scanning

### Dependency Vulnerability Scanning

GitHub native (enabled in repo):

```
Settings → Security & analysis → Dependabot alerts
```

**What it scans**:
- `package.json` dependencies (npm)
- `requirements.txt` (pip)
- Docker base images

**When it runs**:
- On every push
- Weekly scheduled scan
- PR opens with auto-fixes (if available)

**PR Example**:
```
Title: Upgrade lodash from 4.17.20 to 4.17.21

[security] Fix known vulnerability in lodash
https://github.com/advisories/GHSA-...
```

### Code Quality & Security

**SonarQube integration** (if enabled):

```bash
# Local scan before PR
sonarqube-runner \
  --sources ./apps/api-core/src \
  --tests ./apps/api-core/test \
  --projectKey api-core
```

**Coverage requirements**:
- Statements: 70% minimum
- Branches: 60% minimum
- Critical security issues: 0 allowed

### Secret Scanning

**GitHub native secret scanning**:

```
Settings → Security & analysis → Secret scanning
```

**Patterns detected**:
- AWS access keys
- Stripe API keys
- GitHub tokens
- Private SSH keys
- Slack tokens

**When detected**:
1. Alert sent to repo admins
2. Automatic notification to author to rotate key
3. Commit history checked for exposure
4. Key logged as compromised

**If exposed**:
```bash
# Immediately after detecting exposure:

# 1. Rotate key
az keyvault secret set --vault-name ecommerce-secrets-prod \
  --name compromised-key --value "<new-random-key>"

# 2. Remove from commit history
git filter-branch --tree-filter 'grep -r "old-key" || true' -- --all

# 3. Force push (be careful!)
git push origin --force --all

# 4. Log incident in security tracker
# Timeline: detected at T+0, rotated at T+15 min
```

---

## Container Image Scanning

### Docker Image Vulnerability Scan

**On build**:
```bash
# GitHub Actions workflow
- name: Scan Docker image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'api-core:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload scan results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

**Blocking rules**:
- Any CRITICAL vulnerability → Build fails
- Any HIGH + in-use component → Manual review required

**Example failure**:
```
trivy image api-core:v1.2.3
2026-04-07T10:30:00.000Z [CRITICAL] CVE-2025-0001 (curl 7.64.0)
Build failed: 1 critical vulnerability found
```

---

## Network Security

### API Rate Limiting

Per-IP, per-key, per-endpoint:

```
Development:    Unlimited
Staging:        1000 req/min (burst 5000)
Production:     100 req/min per user (burst 500)
```

**Headers returned on rate limit approaching**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1680866400
```

**When limit reached** (HTTP 429):
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfter": 3600
}
```

### DDoS Protection

**Cloudflare** (if enabled):
- Rate limiting rules
- Bot management
- WAF (Web Application Firewall)

**K8s level**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-ingress
spec:
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ecommerce
    ports:
    - protocol: TCP
      port: 3000
```

---

## Compliance Checklist

### GDPR Requirements

**Data Collection**:
- [ ] Privacy policy visible
- [ ] Cookie consent banner
- [ ] Explicit opt-in for marketing emails

**Data Access & Export**:
- [ ] User can download personal data (API endpoint)
- [ ] Automated export format (CSV, JSON, PDF)
- [ ] Delivered within 30 days

**Data Deletion**:
- [ ] User can request deletion (right to be forgotten)
- [ ] Soft delete + audit trail
- [ ] Hard delete after 90 days
- [ ] Related data cleaned up (orders, analytics, logs)

### SOC 2 Requirements

**Access Control**:
- [ ] MFA enabled for all admin accounts
- [ ] API key rotation enforced (quarterly minimum)
- [ ] Role-based access control implemented
- [ ] Audit trail for all sensitive operations

**Data Security**:
- [ ] Encryption in transit (TLS 1.3)
- [ ] Encryption at rest (AES-256)
- [ ] Secure key management (Azure Key Vault)
- [ ] No hardcoded secrets in code

**Incident Response**:
- [ ] Security contact defined
- [ ] Incident response plan documented
- [ ] Vulnerability disclosure process
- [ ] Regular security audits (quarterly)

### PCI DSS Requirements

**If processing credit cards** (payment processor handles it):
- [ ] Never store full card numbers (use tokens)
- [ ] HTTPS only for payments
- [ ] No sensitive auth data in logs
- [ ] Quarterly vendor security assessments

---

## Regular Audits

### Monthly Security Review

```bash
# 1. Check for unpatched dependencies
npm audit

# 2. Scan for hardcoded secrets
gitleaks detect --source .

# 3. Review recent audit logs
python main.py audit summary --last-days 30

# 4. Check key rotations
az keyvault key list --vault-name ecommerce-secrets-prod \
  --query "[?properties.updated >= '2026-03-07']"

# 5. Monitor failed auth attempts
kubectl logs -n ecommerce deployment/api-core | grep "401\|403" | wc -l
```

### Quarterly External Audit

- [ ] Hire security firm for penetration testing
- [ ] Review findings & create remediation tickets
- [ ] Track compliance certifications (SOC 2, ISO 27001)
- [ ] Document audit results

---

## Incident Response

### Security Incident Detected

**Severity Levels**:
- **Critical**: Data breach, ransomware, active compromise
- **High**: Vulnerability exploitation, DoS attack
- **Medium**: Failed attack, exposed secret (non-critical)
- **Low**: Vulnerability (not exploitable), minor misconfiguration

### Response Steps

1. **Immediate (T+0 min)**
   - [ ] Alert Security team (Slack #security-incident)
   - [ ] Isolate affected systems
   - [ ] Start incident log

2. **Short-term (T+15 min)**
   - [ ] Assess scope & impact
   - [ ] Rotate compromised credentials
   - [ ] Block suspicious IP addresses
   - [ ] Create detailed timeline

3. **Medium-term (T+1 hour)**
   - [ ] Incident lead assigned
   - [ ] Notify stakeholders (product, legal)
   - [ ] Begin forensic analysis
   - [ ] Prepare customer notification (if needed)

4. **Long-term (T+24 hours)**
   - [ ] Root cause analysis
   - [ ] Remediation plan
   - [ ] Post-mortem meeting
   - [ ] Update security policies

---

See [README.md](README.md) for overview
