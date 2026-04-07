# 🏗️ Infrastructure — K8s Manifests & Docker

Kubernetes manifests, Docker images, and infrastructure-as-code.

---

## Directory Structure

```
k8s/
├── namespace.yaml              # Create ecommerce namespace
├── apps/
│   ├── admin.yaml             # Admin dashboard deployment
│   ├── api-core.yaml          # API core deployment
│   └── storefront.yaml        # Storefront deployment
├── cli/
│   ├── 00-namespace.yaml      # CLI namespace
│   ├── 10-jobs.yaml           # Manual jobs config
│   ├── 20-cronjobs.yaml       # Scheduled jobs (backup, health check)
│   └── 30-storage.yaml        # PersistentVolumes
├── infrastructure/
│   ├── cloudflared.yaml       # Cloudflare tunnel (optional)
│   ├── minio.yaml             # MinIO object storage (optional)
│   ├── monitoring.yaml        # Prometheus + Grafana
│   └── redis.yaml             # Redis cache
├── ingress/
│   └── ingress.yaml           # Nginx/Traefik ingress
└── jobs/
    └── backup-cronjob.yaml    # Daily backups
```

---

## Core Manifests

### Namespace Creation

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce
  labels:
    name: ecommerce
---
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce-cli
  labels:
    name: ecommerce-cli
```

**Apply**:
```bash
kubectl apply -f k8s/namespace.yaml
```

### Deployment Template (API Core)

```yaml
# k8s/apps/api-core.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-core
  namespace: ecommerce
  labels:
    app: api-core
spec:
  replicas: 3  # Staging: 2, Dev: 1
  selector:
    matchLabels:
      app: api-core
  template:
    metadata:
      labels:
        app: api-core
    spec:
      serviceAccountName: api-core
      containers:
      - name: api
        image: myregistry.azurecr.io/api-core:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: mongodb-url
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: log-level
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /var/log/app
      volumes:
      - name: logs
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api-core
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: api-core
  namespace: ecommerce
spec:
  selector:
    app: api-core
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-core-hpa
  namespace: ecommerce
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-core
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Apply**:
```bash
kubectl apply -f k8s/apps/api-core.yaml
```

### Ingress (Public Access)

```yaml
# k8s/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: public-ingress
  namespace: ecommerce
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - admin.example.com
    - api.example.com
    - "*.example.com"  # Storefront multi-tenant
    secretName: tls-wildcard
  rules:
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin
            port:
              number: 80
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-core
            port:
              number: 80
  - host: "*.example.com"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: storefront
            port:
              number: 80
```

---

## Docker Images

### Dockerfile (API Core Example)

```dockerfile
# apps/api-core/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build TypeScript
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
```

**Build & push**:
```bash
docker build \
  --build-arg NODE_ENV=production \
  -t myregistry.azurecr.io/api-core:v1.0.0 \
  apps/api-core

docker push myregistry.azurecr.io/api-core:v1.0.0
```

### Image Scanning

```bash
# Scan for vulnerabilities
trivy image myregistry.azurecr.io/api-core:v1.0.0

# Output:
# Total: 12 vulnerabilities (0 CRITICAL, 2 HIGH, 10 MEDIUM)
```

---

## Secrets & ConfigMaps

### Creating Secrets

```bash
# From literals
kubectl create secret generic api-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...' \
  -n ecommerce

# From files
kubectl create secret generic api-config \
  --from-file=config.json \
  -n ecommerce

# From Azure Key Vault
az keyvault secret show \
  --vault-name ecommerce-secrets-prod \
  --name api-db-password \
  --query value -o tsv | \
  kubectl create secret generic api-secrets \
    --from-literal=database-url=- \
    -n ecommerce
```

### ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: ecommerce
data:
  log-level: "info"
  cache-ttl: "3600"
  api-timeout: "30"
  feature-flags: |
    {
      "new-checkout": true,
      "advanced-analytics": false
    }
```

---

## Deployment Checklist

- [ ] Namespace created
- [ ] Secrets configured (DB, JWT, API keys)
- [ ] ConfigMap created (non-sensitive config)
- [ ] Deployment manifest reviewed & applied
- [ ] Service & endpoint ready
- [ ] Ingress routing configured
- [ ] Health checks passing
- [ ] HPA (auto-scaling) active
- [ ] Pod disruption budgets set

---

See [README.md](README.md) for overview | [environments.md](environments.md) | [deployment-procedure.md](deployment-procedure.md)
