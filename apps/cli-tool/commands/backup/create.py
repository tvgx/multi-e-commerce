"""
Create backup command.
Creates a backup of shop data (PostgreSQL, MongoDB).
"""

import typer
import json
from pathlib import Path
from lib.backups.backup_engine import BackupEngine
from lib.audit.audit_logger import AuditLogger, AuditEventType
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_table

app = typer.Typer(help="Create backups")


@app.command()
def create(
    shop_id: str = typer.Argument(..., help="Shop ID to backup"),
    postgres: bool = typer.Option(True, "--postgres/--no-postgres", help="Include PostgreSQL backup"),
    mongodb: bool = typer.Option(True, "--mongodb/--no-mongodb", help="Include MongoDB backup"),
    as_json: bool = typer.Option(False, "--json", help="Output result as JSON"),
):
    """
    Create a backup of a shop.
    
    Creates tenant-isolated backup including:
    - PostgreSQL database backup (shop-specific tables)
    - MongoDB backup (shop collections)
    
    Backups are stored in: ~/.ecommerce-cli/backups/{shop_id}/{timestamp}/
    
    Example:
        backup create <shop-id>
        backup create <shop-id> --postgres --no-mongodb
        backup create <shop-id> --json
    """
    config = get_config()
    
    with print_status(f"Creating backup for shop '{shop_id}'..."):
        engine = BackupEngine(config.backup_dir)
        result = engine.create_backup(
            shop_id,
            include_postgres=postgres,
            include_mongodb=mongodb
        )
    
    if result is None:
        print_error("Backup creation failed")
        typer.Exit(1)
    
    # Log audit event
    audit_logger = AuditLogger(config.audit_log)
    audit_logger.log_operation(
        AuditEventType.BACKUP_CREATED,
        shop_id=shop_id,
        action=f"Created backup for shop {shop_id}",
        details={
            "postgres": postgres,
            "mongodb": mongodb,
            "timestamp": result.get("timestamp")
        }
    )
    
    if as_json:
        typer.echo(json.dumps(result, indent=2, default=str))
    else:
        # Format components for display
        components = result.get("components", {})
        comp_data = [
            {
                "component": name,
                "status": data.get("status", "unknown"),
                "size": f"{data.get('size', 0) / 1024:.1f} KB" if data.get("size") else "N/A",
                "items": data.get("tables") or data.get("collections", 0)
            }
            for name, data in components.items()
        ]
        
        print_table("Backup Components", comp_data)
        print_success(f"Backup created: {result.get('timestamp')}")
