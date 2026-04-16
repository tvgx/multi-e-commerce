"""
Delete backup command.
Deletes a specific backup.
"""

import typer
import json
from pathlib import Path
from lib.backups.backup_engine import BackupEngine
from lib.audit.audit_logger import AuditLogger, AuditEventType
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_warning

app = typer.Typer(help="Delete backups")


@app.command()
def delete(
    shop_id: str = typer.Argument(..., help="Shop ID"),
    timestamp: str = typer.Argument(..., help="Backup timestamp to delete"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Delete a specific backup.
    
    Example:
        backup delete <shop-id> 20260406_120000
        backup delete <shop-id> 20260406_120000 --force
    """
    config = get_config()
    
    # Confirmation
    if not force:
        print_warning(f"This will permanently delete backup: {timestamp}")
        if not typer.confirm("Are you sure?"):
            print_error("Deletion cancelled")
            return
    
    # Delete backup
    with print_status(f"Deleting backup {timestamp}..."):
        engine = BackupEngine(config.backup_dir)
        success = engine.delete_backup(shop_id, timestamp)
    
    if not success:
        print_error(f"Failed to delete backup '{timestamp}'")
        typer.Exit(1)
    
    # Log audit event
    audit_logger = AuditLogger(config.audit_log)
    audit_logger.log_operation(
        AuditEventType.BACKUP_DELETED,
        shop_id=shop_id,
        action=f"Deleted backup {timestamp}",
        details={"timestamp": timestamp}
    )
    
    if as_json:
        typer.echo(json.dumps({"status": "success", "timestamp": timestamp}))
    else:
        print_success(f"Backup deleted: {timestamp}")
