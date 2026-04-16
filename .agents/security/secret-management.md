# 🔐 Security — Secret Management

Managing API keys, credentials, and sensitive data across dev/staging/prod.

---

## Where Do Secrets Live?

| Secret Type | Storage | Access | Rotation |
|-------------|---------|--------|----------|
| **API Keys** | Azure Key Vault (prod), .env.local (dev) | RBAC | Monthly |
| **Database Passwords** | K8s Secrets (encrypted) | Pod identity | Quarterly |
| **OAuth Tokens** | Application DB (encrypted field) | Middleware | Auto-refresh |
| **Certificates** | K8s TLS secrets | Controller | Auto-renew |
| **SSH Keys** | GitHub deploy keys + Azure | Limited admins | On rotation |

---

## Development Secrets (.env.local)

**Location**: Each app root (`/apps/admin/.env.local`, etc.)

**Never commit** `.env.local` or `.env.*.local` files

```bash
# .gitignore (already configured)
*.local
.env.local
.env.*.local
.env.production.local
```

**Setup for new developer**:

```bash
cd apps/admin
cp .env.example .env.local
# Edit .env.local with local values:
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

---

## Staging & Production Secrets (Azure Key Vault)

**Access**: Ops Admin + Platform Admin only

**List secrets**:
```bash
az keyvault secret list --vault-name ecommerce-secrets-prod
```

**Get secret**:
```bash
az keyvault secret show --vault-name ecommerce-secrets-prod --name api-db-password
```

**Set secret**:
```bash
az keyvault secret set \
  --vault-name ecommerce-secrets-prod \
  --name api-db-password \
  --value "new-password-here"
```

**Secret naming convention**: `app-component-purpose`

Examples:
- `admin-auth-secret`
- `api-db-password`
- `storefront-cdn-key`
- `cli-tool-api-token`

---

## Kubernetes Secrets

Auto-injected into pods via mounted volume:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: ecommerce
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=  # base64 encoded
  API_KEY: YWJjZGVmZ2hpams=
```

**Creating K8s Secrets from Azure**:

```bash
# Fetch secrets and create K8s secret
kubectl create secret generic api-secrets \
  --from-literal=DB_PASSWORD=$(az keyvault secret show \
    --vault-name ecommerce-secrets-prod \
    --name api-db-password \
    --query value -o tsv) \
  -n ecommerce
```

**Mounting in Pod**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-core
spec:
  containers:
  - name: api
    image: api-core:latest
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: api-secrets
          key: DB_PASSWORD
```

---

## API Keys (Service Accounts)

**Format**: `sa-kubernetes-<random>`, `gh-actions-<random>`

**For K8s Service Account**:

```bash
# Create service account
kubectl create serviceaccount ecommerce-cli -n ecommerce

# Get token (auto-generated)
kubectl get secret $(kubectl get secret -n ecommerce | grep ecommerce-cli-token | awk '{print $1}') \
  -n ecommerce -o jsonpath={.data.token} | base64 -d
```

**For GitHub Actions**:
1. Create fine-grained Personal Access Token (GitHub Settings → Developer settings)
2. Store in GitHub Secrets: `Settings → Secrets and variables → Actions`
3. Use in workflow: `${{ secrets.GH_API_TOKEN }}`

---

## Rotation Schedule

### Development Keys

**No rotation required** (local only)

### Staging Keys

**Monthly rotation**:
```bash
# Create new secret
az keyvault secret set --vault-name ecommerce-secrets-staging \
  --name api-db-password --value "$(openssl rand -base64 32)"

# Update K8s secret
kubectl patch secret api-secrets -p \
  '{"data":{"DB_PASSWORD":"'$(echo -n '"new-pass"' | base64)'"}}' \
  -n ecommerce-staging
```

### Production Keys

**Bi-weekly rotation** (critical), monthly for others:

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update Azure Key Vault
az keyvault secret set --vault-name ecommerce-secrets-prod \
  --name api-db-password --value "$NEW_SECRET"

# 3. Update K8s secret (rolling restart)
kubectl patch secret api-secrets -p \
  '{"data":{"DB_PASSWORD":"'$(echo -n "$NEW_SECRET" | base64)'"}}' \
  -n ecommerce

# 4. Rolling restart pods to pick up new secret
kubectl rollout restart deployment/api-core -n ecommerce

# 5. Monitor rollout
kubectl rollout status deployment/api-core -n ecommerce
```

**Audit**: Log all rotations in `../escalation/` (rotation trail maintained by Azure)

---

## Accessing Secrets in Code

### Node.js (Admin, Storefront)

```typescript
// Load from .env.local (development)
const apiKey = process.env.NEXT_PUBLIC_API_URL;

// In production, K8s injects via env var
const dbPassword = process.env.DATABASE_URL;
```

**Do NOT log secrets**:
```typescript
// ❌ WRONG
console.log('DB Password:', dbPassword);

// ✅ CORRECT
console.log('Connecting to database...');  // Log action, not value
```

### Python (CLI Tool)

```python
import os
from dotenv import load_dotenv

# Load .env.local (dev)
load_dotenv()

api_key = os.getenv('API_KEY')
if not api_key:
    raise ValueError('API_KEY not set in environment')
```

### NestJS (API Core)

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  constructor(private config: ConfigService) {}
  
  getConnectionString() {
    const password = this.config.get('DATABASE_PASSWORD');
    const host = this.config.get('DATABASE_HOST');
    return `postgresql://user:${password}@${host}:5432/db`;
  }
}
```

---

## Secrets Scanning

### Pre-Commit Hook

Prevent accidental commits of secrets:

```bash
# Install pre-commit scanner
brew install gitleaks

# Scan working directory
gitleaks detect --source . -v

# Or in CI (GitHub Actions)
name: Secret Scanning
on: [push, pull_request]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: gitleaks/gitleaks-action@v2
```

### Regular Audits

**Monthly**: Check for hardcoded secrets in codebase

```bash
# Search for common secret patterns
grep -r "password\s*=" apps/ || true
grep -r "api[_-]key\s*=" apps/ || true
grep -r "token\s*=" apps/ || true
```

---

## Checklist: Adding New Secret

- [ ] Generate strong random value (`openssl rand -base64 32`)
- [ ] Store in Azure Key Vault (prod) or `.env.local` (dev)
- [ ] Add to `.env.example` with placeholder (e.g., `SECRET_KEY=your-key-here`)
- [ ] Create K8s secret if needed
- [ ] Document in this file (where it's used)
- [ ] Add rotation schedule
- [ ] Test in dev/staging
- [ ] Deploy to production
- [ ] Verify logs don't leak the secret

---

See [README.md](README.md) for overview
