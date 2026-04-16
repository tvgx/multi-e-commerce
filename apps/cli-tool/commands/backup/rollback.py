"""
Rollback command.
Rolls back a failed operation by restoring from the most recent backup.
"""

import typer
import json
from pathlib import Path
from lib.backups.backup_engine import BackupEngine
from lib.audit.audit_logger import AuditLogger, AuditEventType
from config import get_config
from lib.utils.formatting import (
    print_success, print_error, print_status, print_warning, print_info
)

app = typer.Typer(help="Rollback failed operations")


@app.command()
def rollback(
    shop_id: str = typer.Argument(..., help="Shop ID to rollback"),
    backup_timestamp: str = typer.Option(None, "--backup", "-b", help="Specific backup to restore (uses latest if not specified)"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Rollback a shop to its previous state by restoring the latest backup.
    
    ⚠ WARNING: This will overwrite current shop data!
    
    Use when an operation failed or had unexpected consequences.
    
    Example:
        rollback <shop-id>
        rollback <shop-id> --backup 20260406_120000
        rollback <shop-id> --force
    """
    config = get_config()
    engine = BackupEngine(config.backup_dir)
    
    # Find backup to restore
    if backup_timestamp:
        backups = [b for b in engine.list_backups(shop_id) if b.get("timestamp") == backup_timestamp]
        if not backups:
            print_error(f"Backup '{backup_timestamp}' not found")
            typer.Exit(1)
        backup = backups[0]
    else:
        backup = engine.get_latest_backup(shop_id)
        if not backup:
            print_error(f"No backups found for shop '{shop_id}' to rollback from")
            typer.Exit(1)
    
    backup_timestamp = backup.get("timestamp")
    
    # Confirmation
    if not force:
        print_warning(f"⚠ This will rollback shop '{shop_id}' to backup: {backup_timestamp}")
        if not typer.confirm("Are you sure?"):
            print_error("Rollback cancelled")
            return
    
    # Perform rollback (restore from backup)
    with print_status(f"Rolling back shop '{shop_id}'..."):
        success = engine.restore_backup(shop_id, backup_timestamp)
    
    if not success:
        print_error("Rollback failed")
        typer.Exit(1)
    
    # Log audit event
    audit_logger = AuditLogger(config.audit_log)
    audit_logger.log_operation(
        AuditEventType.BACKUP_RESTORED,
        shop_id=shop_id,
        action=f"Rolled back shop {shop_id} to backup {backup_timestamp}",
        details={
            "backup_timestamp": backup_timestamp,
            "operation_type": "rollback"
        }
    )
    
    if as_json:
        typer.echo(json.dumps({
            "status": "rolled_back",
            "shop_id": shop_id,
            "backup_timestamp": backup_timestamp
        }))
    else:
        print_success(f"Shop rolled back to: {backup_timestamp}")
        print_info("Shop is now restored to its previous state")
