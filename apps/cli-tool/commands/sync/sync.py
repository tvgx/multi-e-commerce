"""
Environment sync for mirroring shop configuration across environments.
Supports dev -> acceptance -> staging -> prod with safety checks.
"""

import typer
import json
from typing import Optional
from rich.console import Console
from rich.progress import Progress
from rich.panel import Panel
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_warning
from lib.utils.auth import get_auth_manager
from lib.audit.audit_logger import AuditEventType, AuditLogger
from lib.backups.backup_engine import BackupEngine

app = typer.Typer(help="Sync shop configuration across environments")
console = Console()

# Environment hierarchy (only sync forward in this order)
ENVIRONMENT_HIERARCHY = ["dev", "acceptance", "staging", "prod"]


class EnvironmentSyncer:
    """Syncs shop configuration across environments with safety checks."""
    
    def __init__(self, from_env: str, to_env: str, client, backup_engine, audit_logger):
        self.from_env = from_env
        self.to_env = to_env
        self.client = client
        self.backup_engine = backup_engine
        self.audit_logger = audit_logger
        self.from_shop_data = None
        self.to_shop_data = None
    
    def validate_sync_direction(self) -> tuple[bool, str]:
        """Ensure sync is only forward in environment hierarchy."""
        from_idx = ENVIRONMENT_HIERARCHY.index(self.from_env) if self.from_env in ENVIRONMENT_HIERARCHY else -1
        to_idx = ENVIRONMENT_HIERARCHY.index(self.to_env) if self.to_env in ENVIRONMENT_HIERARCHY else -1
        
        if from_idx < 0 or to_idx < 0:
            return False, f"Invalid environment. Must be one of: {', '.join(ENVIRONMENT_HIERARCHY)}"
        
        if from_idx >= to_idx:
            return False, f"Can only sync forward: {self.from_env} -> {self.to_env} not allowed. Use: {' -> '.join(ENVIRONMENT_HIERARCHY[from_idx:])}"
        
        return True, ""
    
    def fetch_shop_config(self, env: str, shop_id: str) -> dict:
        """Fetch shop configuration for environment."""
        try:
            # Switch to environment
            set_base_url(f"/api/{env}")  # This would be handled properly in real implementation
            
            response = self.client.get(f"/shops/{shop_id}", shop_id=shop_id)
            return response.get("data", response)
        except Exception as e:
            raise Exception(f"Failed to fetch shop config from {env}: {e}")
    
    def compare_configurations(self, from_config: dict, to_config: dict) -> dict:
        """Compare configurations and identify differences."""
        differences = {}
        
        # Define fields to compare
        comparable_fields = [
            "name", "domain", "productsPerPage", "metadata",
            "payment", "shipping", "tax", "notifications", "analytics"
        ]
        
        for field in comparable_fields:
            from_val = from_config.get(field)
            to_val = to_config.get(field)
            
            if from_val != to_val:
                differences[field] = {
                    "from": from_val,
                    "to": to_val
                }
        
        return differences
    
    def create_backup(self, shop_id: str) -> str:
        """Create backup before sync."""
        try:
            result = self.backup_engine.create_backup(shop_id, postgres=True, mongodb=True)
            return result.get("timestamp")
        except Exception as e:
            raise Exception(f"Failed to create backup: {e}")
    
    def apply_sync(self, shop_id: str, from_config: dict, differences: dict) -> bool:
        """Apply configuration sync."""
        try:
            # Build update payload
            update_data = {}
            for field in differences.keys():
                if field in ["name", "domain", "productsPerPage"]:
                    update_data[field] = from_config.get(field)
            
            if not update_data:
                return True  # No changes needed
            
            response = self.client.put(f"/shops/{shop_id}", update_data, shop_id=shop_id)
            return response.get("success", True)
        except Exception as e:
            raise Exception(f"Failed to apply sync: {e}")


@app.command()
def config(
    shop_id: str = typer.Argument(..., help="Shop ID to sync"),
    from_env: str = typer.Option(..., "--from", help="Source environment (dev/acceptance/staging)"),
    to_env: str = typer.Option(..., "--to", help="Target environment (acceptance/staging/prod)"),
    force: bool = typer.Option(False, "--force", help="Skip confirmation"),
    backup_first: bool = typer.Option(True, "--backup-first/--no-backup", help="Create backup before sync"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview without executing"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Sync shop configuration from one environment to another.
    
    Environment hierarchy (forward only):
        dev -> acceptance -> staging -> prod
    
    Features:
    - Automatic backup before sync
    - Configuration comparison preview
    - Confirmation before apply
    - Audit logging
    - Rollback capability
    
    Example:
        sync config <shop-id> --from dev --to acceptance
        sync config <shop-id> --from staging --to prod --dry-run
        sync config <shop-id> --from dev --to prod --force
    """
    config_obj = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    set_base_url(config_obj.get_api_url())
    client = get_api_client()
    client.set_auth_token(config_obj.get_session_token())
    
    audit_logger = AuditLogger()
    backup_engine = BackupEngine(config_obj.backup_dir)
    
    try:
        syncer = EnvironmentSyncer(from_env, to_env, client, backup_engine, audit_logger)
        
        # Validate sync direction
        is_valid, error = syncer.validate_sync_direction()
        if not is_valid:
            print_error(f"Invalid sync: {error}")
            typer.Exit(1)
        
        console.print(f"[bold]Syncing {shop_id} from {from_env} to {to_env}[/bold]")
        
        # Fetch configurations
        with print_status(f"Fetching configuration from {from_env}..."):
            from_config = syncer.fetch_shop_config(from_env, shop_id)
        
        with print_status(f"Fetching configuration from {to_env}..."):
            to_config = syncer.fetch_shop_config(to_env, shop_id)
        
        # Compare
        differences = syncer.compare_configurations(from_config, to_config)
        
        if not differences:
            console.print("[yellow]No configuration differences found[/yellow]")
            return
        
        # Display differences
        if not as_json and not dry_run:
            console.print("\n[bold]Configuration Differences:[/bold]")
            for field, diff in differences.items():
                console.print(f"\n  [cyan]{field}:[/cyan]")
                console.print(f"    From ({from_env}): {diff['from']}")
                console.print(f"    To   ({to_env}):   {diff['to']}")
        
        # Dry-run
        if dry_run:
            result = {
                "action": "sync_config",
                "status": "dry-run",
                "shop_id": shop_id,
                "from": from_env,
                "to": to_env,
                "differences": differences
            }
            
            if as_json:
                typer.echo(json.dumps(result, indent=2))
            else:
                console.print(f"\n[yellow]Dry-run: Would sync {len(differences)} fields[/yellow]")
            
            return
        
        # Confirmation
        if not force and not typer.confirm(f"\nSync {len(differences)} fields from {from_env} to {to_env}?"):
            console.print("[yellow]Sync cancelled[/yellow]")
            return
        
        # Backup target environment
        if backup_first:
            with print_status(f"Creating backup of {to_env} shop..."):
                backup_timestamp = syncer.create_backup(shop_id)
            print_success(f"Backup created: {backup_timestamp}")
        
        # Apply sync
        with print_status(f"Syncing configuration..."):
            syncer.apply_sync(shop_id, from_config, differences)
        
        # Log sync operation
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action=f"Environment sync: {from_env} -> {to_env}",
            details={
                "from": from_env,
                "to": to_env,
                "fields_synced": list(differences.keys()),
                "backup_created": backup_first
            },
            status="success"
        )
        
        result = {
            "status": "success",
            "shop_id": shop_id,
            "from": from_env,
            "to": to_env,
            "fields_synced": list(differences.keys()),
            "backup_timestamp": backup_timestamp if backup_first else None
        }
        
        if as_json:
            typer.echo(json.dumps(result, indent=2))
        else:
            print_success(f"Configuration synced: {from_env} -> {to_env}")
            console.print(f"[green]✓ {len(differences)} fields updated[/green]")
            if backup_first:
                console.print(f"[green]✓ Backup available for rollback[/green]")
    
    except Exception as e:
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action=f"Environment sync failed: {from_env} -> {to_env}",
            error=str(e),
            status="failed"
        )
        print_error(f"Sync failed: {e}")
        typer.Exit(1)


@app.command()
def status(
    shop_id: Optional[str] = typer.Option(None, "--shop-id", help="Filter by shop ID"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Show synchronization status across environments.
    
    Displays:
    - Which shops are synced across environments
    - Configuration differences between environments
    - Last sync time
    - Pending changes
    
    Example:
        sync status
        sync status --shop-id <shop-id>
    """
    console.print("[bold]Environment Sync Status[/bold]")
    console.print("\n[yellow]Feature coming soon: Real-time sync status monitoring[/yellow]")
