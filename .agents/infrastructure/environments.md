# Environments

Luồng promote một chiều: **dev → acceptance → staging → production**. Không sync ngược prod→staging.

| Env | Dùng để | Secret | Deploy |
|-----|---------|--------|--------|
| dev (local) | phát triển | `.env` | `docker/docker-compose.yaml` hoặc `npm run dev` |
| acceptance/staging | test tích hợp + smoke | K8s Secrets | qua CI sau khi merge |
| production | thật | Azure Key Vault | PR → approval → trong cửa sổ deploy |

Cổng dev: api-core 3000, admin 3001, storefront 3002. Phụ thuộc hạ tầng: PostgreSQL, Redis, MongoDB, MinIO/S3.
