# 💻 CLI Tool — Overview

**Location**: `/home/troll/workspaces/ecommerce-platform/apps/cli-tool`

**Tech Stack**: Python 3.10+, Click, Requests, PostgreSQL + MongoDB clients

---

## Overview

CLI Tool is the **production backbone** for automation, batch operations, and disaster recovery.

### 5 Phases (All Complete ✅)

1. **Phase 1**: Core architecture (shop commands, validation, output)
2. **Phase 2**: Data integrity (backup/restore, audit logging)
3. **Phase 3**: Automation workflows (wizard, batch operations)
4. **Phase 4**: Health monitoring (auto-fix, diagnostics)
5. **Phase 5**: Integration (K8s CronJobs, CI/CD, scaling)

---

## Quick Start

```bash
cd apps/cli-tool
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python main.py --help
python main.py shop create --name "My Shop" --domain myshop.com --owner-email owner@example.com
```

---

## Key Commands by Category

**Shop Management**:
```bash
python main.py shop create
python main.py shop list
python main.py shop get
python main.py shop update
python main.py shop delete
python main.py shop eject    # Local dev setup
```

**Backup & Disaster Recovery**:
```bash
python main.py backup create
python main.py backup list
python main.py backup restore
python main.py backup rollback
python main.py backup delete
```

**Batch Operations**:
```bash
python main.py batch create --csv shops.csv --parallel 10
```

**Health & Auto-Fix**:
```bash
python main.py health check --full
python main.py health check --auto-fix
```

**Auditing**:
```bash
python main.py audit view --shop <id>
python main.py audit summary
```

---

## Directory Structure

```
├── main.py              # Entry point
├── config.py            # Configuration
├── api_client.py        # HTTP client to API
├── commands/            # Command modules (shop, backup, batch, etc.)
├── lib/
│   ├── db.py           # Database helpers
│   ├── validators.py   # Input validation
│   └── formatters.py   # Output formatting
├── database/           # PostgreSQL + MongoDB clients
└── tests/              # Unit & integration tests
```

---

## Development

- **Run tests**: `pytest`
- **Run with mocks**: `pytest --mock-api`
- **Coverage**: `pytest --cov=src`

---

## Deployment

Runs in K8s as:
- **Manual CLI**: User runs commands locally
- **K8s CronJob**: Daily backup, weekly health checks
- **K8s Job**: Batch operations from ConfigMap

See detailed docs: `commands/`, `api-client.md`, `deployment.md`

---

See [../README.md](../README.md) for all apps
