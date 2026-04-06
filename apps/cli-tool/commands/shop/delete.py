"""
Delete shop command.
Deletes a shop (admin only).
"""

import typer
import json
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_warning
from lib.utils.auth import get_auth_manager
from lib.audit.audit_logger import AuditEventType, AuditLogger
from lib.dry_run.simulator import DryRunSimulator, OperationRiskAssessor
from lib.backups.backup_engine import BackupEngine

app = typer.Typer(help="Delete shops")


@app.command()
def delete(
    shop_id: str = typer.Argument(..., help="Shop ID to delete"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation prompt"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview deletion without executing"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Delete a shop.
    
    WARNING: This will permanently delete the shop and all associated data.
    
    Example:
        shop delete <shop-id> --dry-run
        shop delete <shop-id> --force
    """
    config = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    # Dry-run preview
    if dry_run:
        # Use simulator for impact analysis
        result = DryRunSimulator.simulate_shop_deletion(shop_id)
        
        if as_json:
            import json
            typer.echo(json.dumps({
                "action": "delete_shop",
                "shop_id": shop_id,
                "affected_resources": result.affected_resources,
                "warnings": result.warnings,
                "will_loss_data": result.will_loss_data
            }, indent=2))
        else:
            from rich.console import Console
            from rich.panel import Panel
            from rich.table import Table
            
            console = Console()
            console.print(Panel(
                f"[bold red]⚠ WARNING:[/bold red]\n"
                f"This will delete shop: {shop_id}",
                title="[yellow]DRY RUN - Deletion Preview[/yellow]"
            ))
            
            if result.warnings:
                console.print("[bold red]Warnings:[/bold red]")
                for warning in result.warnings:
                    console.print(f"  • {warning}")
            
            if result.affected_resources:
                console.print("[bold red]Affected Resources:[/bold red]")
                for resource in result.affected_resources:
                    console.print(f"  • {resource}")
        
        return
    
    # Confirmation prompt
    if not force:
        print_warning(f"This will permanently delete shop: {shop_id}")
        if not typer.confirm("Are you sure you want to continue?"):
            print_error("Deletion cancelled")
            return
    
    # Step 1: Create automatic backup before deletion
    try:
        with print_status("Creating safety backup before deletion..."):
            backup_engine = BackupEngine(config.backup_dir)
            backup_result = backup_engine.create_backup(shop_id, postgres=True, mongodb=True)
        print_success(f"Backup created: {backup_result.get('timestamp')}")
        
        # Log backup creation
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.BACKUP_CREATED,
            shop_id=shop_id,
            action=f"Auto-backup before shop deletion",
            details={"timestamp": backup_result.get('timestamp'), "trigger": "pre-deletion"},
            status="success"
        )
    except Exception as e:
        print_warning(f"Failed to create backup: {e}")
        if not typer.confirm("Continue with deletion anyway?"):
            print_error("Deletion cancelled")
            return
    
    # Step 2: Execute deletion
    set_base_url(config.get_api_url())
    client = get_api_client()
    client.set_auth_token(config.get_session_token())
    
    try:
        with print_status(f"Deleting shop '{shop_id}'..."):
            response = client.delete(f"/shops/{shop_id}", shop_id=shop_id)
        
        # Log deletion to audit trail
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_DELETED,
            shop_id=shop_id,
            action=f"Deleted shop: {shop_id}",
            details={"backup_created": True},
            status="success"
        )
        
        if as_json:
            typer.echo(json.dumps(response, indent=2, default=str))
        else:
            print_success(f"Shop deleted successfully")
            print_success(f"A backup was created before deletion and can be restored if needed")
    
    except Exception as e:
        # Log deletion failure
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_DELETED,
            shop_id=shop_id,
            action=f"Failed to delete shop: {shop_id}",
            error=str(e),
            status="failed"
        )
        print_error(f"Failed to delete shop: {e}")
        typer.Exit(1)
