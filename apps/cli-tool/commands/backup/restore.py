"""
Restore backup command.
Restores a shop from backup.
"""

import typer
import json
from pathlib import Path
from lib.backups.backup_engine import BackupEngine
from lib.audit.audit_logger import AuditLogger, AuditEventType
from config import get_config
from lib.utils.formatting import (
    print_success, print_error, print_status, print_warning, print_info,
    print_details
)

app = typer.Typer(help="Restore backups")


@app.command()
def restore(
    shop_id: str = typer.Argument(..., help="Shop ID to restore"),
    timestamp: str = typer.Option(None, "--timestamp", "-t", help="Backup timestamp (uses latest if not specified)"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview restore without executing"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Restore a shop from backup.
    
    ⚠ WARNING: This will overwrite current shop data with backup data.
    
    Example:
        backup restore <shop-id>
        backup restore <shop-id> --timestamp 20260406_120000
        backup restore <shop-id> --dry-run
        backup restore <shop-id> --force
    """
    config = get_config()
    
    # Get backup info
    engine = BackupEngine(config.backup_dir)
    
    if timestamp:
        backups = [b for b in engine.list_backups(shop_id) if b.get("timestamp") == timestamp]
        if not backups:
            print_error(f"Backup '{timestamp}' not found for shop '{shop_id}'")
            typer.Exit(1)
        backup = backups[0]
    else:
        backup = engine.get_latest_backup(shop_id)
        if not backup:
            print_error(f"No backups found for shop '{shop_id}'")
            typer.Exit(1)
    
    backup_timestamp = backup.get("timestamp")
    
    # Dry-run preview
    if dry_run:
        preview = {
            "action": "restore_backup",
            "shop_id": shop_id,
            "backup_timestamp": backup_timestamp,
            "components": list(backup.get("components", {}).keys()),
            "warning": "This will overwrite current shop data"
        }
        
        if as_json:
            typer.echo(json.dumps(preview, indent=2))
        else:
            print_info(f"Would restore shop '{shop_id}' from backup: {backup_timestamp}")
            print_details("Backup Info", {
                "Timestamp": backup_timestamp,
                "Size (MB)": f"{backup.get('total_size', 0) / (1024*1024):.1f}",
                "Components": ", ".join(backup.get("components", {}).keys())
            })
        return
    
    # Confirmation
    if not force:
        print_warning(f"⚠ This will restore shop '{shop_id}' from backup: {backup_timestamp}")
        print_warning("This will OVERWRITE all current shop data!")
        if not typer.confirm("Are you sure you want to continue?"):
            print_error("Restore cancelled")
            return
    
    # Perform restore
    with print_status(f"Restoring shop '{shop_id}' from backup {backup_timestamp}..."):
        success = engine.restore_backup(shop_id, backup_timestamp)
    
    if not success:
        print_error("Restore failed")
        typer.Exit(1)
    
    # Log audit event
    audit_logger = AuditLogger(config.audit_log)
    audit_logger.log_operation(
        AuditEventType.BACKUP_RESTORED,
        shop_id=shop_id,
        action=f"Restored shop {shop_id} from backup {backup_timestamp}",
        details={
            "backup_timestamp": backup_timestamp,
            "components": list(backup.get("components", {}).keys())
        }
    )
    
    if as_json:
        typer.echo(json.dumps({
            "status": "success",
            "shop_id": shop_id,
            "backup_timestamp": backup_timestamp
        }))
    else:
        print_success(f"Shop restored from backup: {backup_timestamp}")
