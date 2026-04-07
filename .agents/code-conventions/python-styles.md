# 🐍 Python Best Practices

Guidelines for Python code in CLI Tool and automation scripts.

---

## Core Rules

### 1. Use Type Hints

```python
# ❌ Bad (no hints)
def create_shop(name, domain, owner_email):
    return {"id": "123", "name": name}

# ✅ Good (with hints)
from typing import Dict, Optional

def create_shop(
    name: str,
    domain: str,
    owner_email: str
) -> Dict[str, str]:
    return {"id": "123", "name": name}
```

### 2. Docstrings (Google Style)

```python
def calculate_total_price(items: list[dict], tax_rate: float = 0.1) -> float:
    """Calculate total price including tax.

    Args:
        items: List of items with 'price' key.
        tax_rate: Tax percentage (default 0.1 = 10%).

    Returns:
        Total price with tax included.

    Raises:
        ValueError: If items is empty.
        KeyError: If item missing 'price' key.

    Example:
        >>> calculate_total_price([{"price": 100}], 0.1)
        110.0
    """
    if not items:
        raise ValueError("Items list cannot be empty")

    subtotal = sum(item["price"] for item in items)
    return subtotal * (1 + tax_rate)
```

### 3. Virtual Environment

```bash
# Create venv
python3 -m venv venv

# Activate
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install deps
pip install -r requirements.txt

# Add new dependency
pip install new-package
pip freeze > requirements.txt
```

### 4. Code Organization

```
cli-tool/
├── main.py                    # Entry point
├── config.py                  # Configuration
├── requirements.txt           # Dependencies
├── commands/
│   ├── __init__.py
│   ├── shop.py               # shop create, list, delete, etc.
│   ├── backup.py             # backup create, restore, etc.
│   └── audit.py              # audit view, summary
├── lib/
│   ├── __init__.py
│   ├── api_client.py         # HTTP client
│   ├── db.py                 # Database helpers
│   └── validators.py         # Input validation
├── database/
│   └── migrations.py         # Schema migrations
└── tests/
    ├── test_shop_commands.py
    ├── test_api_client.py
    └── test_validators.py
```

### 5. Constants & Environment Variables

```python
import os
from dataclasses import dataclass

@dataclass
class Config:
    """Application configuration."""
    api_base_url: str = os.getenv("API_BASE_URL", "http://localhost:3000")
    api_key: str = os.getenv("API_KEY", "")
    db_url: str = os.getenv("DATABASE_URL", "postgresql://localhost/ecommerce")
    log_level: str = os.getenv("LOG_LEVEL", "info")
    max_retries: int = 3
    timeout: int = 30

if not Config().api_key:
    raise ValueError("API_KEY environment variable required")
```

---

## Error Handling

### Custom Exceptions

```python
class EcommerceError(Exception):
    """Base exception for ecommerce CLI."""
    pass

class APIError(EcommerceError):
    """API communication error."""
    def __init__(self, status_code: int, message: str):
        super().__init__(f"API error {status_code}: {message}")
        self.status_code = status_code

class ValidationError(EcommerceError):
    """Input validation error."""
    pass

class DatabaseError(EcommerceError):
    """Database operation error."""
    pass
```

### Try/Except Pattern

```python
def create_shop(name: str, domain: str) -> Dict:
    """Create a new shop with error handling."""
    try:
        # Validate input
        if not name or not domain:
            raise ValidationError("Name and domain required")

        # Call API
        response = api_client.post("/shops", {"name": name, "domain": domain})

        logging.info(f"Shop created: {response['id']}")
        return response

    except ValidationError as e:
        logging.warning(f"Validation error: {e}")
        raise  # Re-raise for caller to handle

    except APIError as e:
        logging.error(f"API error: {e}")
        if e.status_code == 409:
            raise APIError(e.status_code, "Shop already exists") from e
        raise

    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise EcommerceError(f"Failed to create shop: {e}") from e
```

---

## Naming Conventions

- **Files/Modules**: snake_case (`shop_service.py`, `api_client.py`)
- **Classes**: PascalCase (`ShopService`, `APIClient`)
- **Functions/Methods**: snake_case (`create_shop`, `get_user_by_id`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_BASE_URL`)
- **Private members**: _leading_underscore (`_internal_method`)

---

## CLI Argument Parsing

```python
import argparse

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="E-commerce CLI Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # shop create command
    shop_create = subparsers.add_parser("shop create", help="Create new shop")
    shop_create.add_argument("--name", required=True, help="Shop name")
    shop_create.add_argument("--domain", required=True, help="Shop domain")
    shop_create.add_argument("--dry-run", action="store_true", help="Preview only")

    # shop list command
    shop_list = subparsers.add_parser("shop list", help="List all shops")
    shop_list.add_argument("--env", default="dev", help="Environment")

    args = parser.parse_args()

    # Dispatch to command handler
    if args.command == "shop create":
        from commands.shop import create_shop
        create_shop(args.name, args.domain, args.dry_run)
    elif args.command == "shop list":
        from commands.shop import list_shops
        list_shops(args.env)

if __name__ == "__main__":
    main()
```

---

## Logging

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Usage
logger.info("Starting shop creation")
logger.warning(f"Rate limit approaching: {remaining} requests left")
logger.error("Failed to connect to database")
logger.debug(f"Request payload: {payload}")
```

---

## Testing Patterns

```python
import pytest
from unittest.mock import Mock, patch

class TestShopService:
    """Tests for ShopService."""

    @pytest.fixture
    def mock_api(self):
        """Mock API client."""
        return Mock()

    def test_create_shop_success(self, mock_api):
        """Test successful shop creation."""
        mock_api.post.return_value = {"id": "shop-123", "name": "Test Shop"}

        from lib.shop_service import ShopService
        service = ShopService(mock_api)
        result = service.create("Test Shop", "test.example.com")

        assert result["id"] == "shop-123"
        mock_api.post.assert_called_once()

    def test_create_shop_validation_error(self, mock_api):
        """Test validation error on missing name."""
        from lib.shop_service import ShopService
        service = ShopService(mock_api)

        with pytest.raises(ValidationError):
            service.create("", "test.example.com")

    @patch("lib.shop_service.api_client")
    def test_create_shop_api_error(self, mock_api_module):
        """Test API error handling."""
        mock_api_module.post.side_effect = APIError(500, "Server error")

        from lib.shop_service import ShopService
        service = ShopService(mock_api_module)

        with pytest.raises(APIError):
            service.create("Shop", "test.example.com")
```

---

## Requirements.txt Management

```bash
# List all installed packages with versions
pip freeze > requirements.txt

# Install from file
pip install -r requirements.txt

# Update single package
pip install --upgrade requests
pip freeze > requirements.txt

# Pin major versions for stability
requests==2.31.0
click==8.1.0
pytest==7.4.0
```

### Pin specific versions:

```txt
# requirements.txt
# Core dependencies
requests==2.31.0         # HTTP client
click==8.1.0             # CLI framework
pydantic==2.0.0          # Data validation
sqlalchemy==2.0.0        # ORM

# Database
psycopg2-binary==2.9.0   # PostgreSQL driver
pymongo==4.4.0           # MongoDB driver

# Dev dependencies (optional)
pytest==7.4.0
pytest-cov==4.1.0
black==23.0.0
flake8==6.0.0
```

---

## See Also

- [linting-testing.md](linting-testing.md) — flake8, pytest, coverage
- [commit-messages.md](commit-messages.md) — CLI in commit message
- [../pr-workflow/](../pr-workflow/) — code review for Python
