"""
Update shop command.
Updates shop settings.
"""

import typer
import json
from typing import Optional
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_details
from lib.utils.auth import get_auth_manager
from lib.validation.shop_validator import ShopValidator
from lib.audit.audit_logger import AuditEventType, AuditLogger
from lib.dry_run.simulator import DryRunSimulator, OperationRiskAssessor

app = typer.Typer(help="Update shop settings")


@app.command()
def update(
    shop_id: str = typer.Argument(..., help="Shop ID"),
    name: Optional[str] = typer.Option(None, "--name", "-n", help="New shop name"),
    domain: Optional[str] = typer.Option(None, "--domain", "-d", help="New domain"),
    products_per_page: Optional[int] = typer.Option(None, "--products-per-page", help="Products per page"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview changes without executing"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Update shop settings.
    
    Example:
        shop update <shop-id> --name "New Name"
        shop update <shop-id> --domain newdomain.com --dry-run
    """
    config = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    # Build update data
    update_data = {}
    validator = ShopValidator()
    
    if name is not None:
        is_valid, error = validator.validate_shop_name(name)
        if not is_valid:
            print_error(f"Invalid shop name: {error}")
            typer.Exit(1)
        update_data["name"] = name
    
    if domain is not None:
        is_valid, error = validator.validate_domain(domain)
        if not is_valid:
            print_error(f"Invalid domain: {error}")
            typer.Exit(1)
        update_data["domain"] = domain
    
    if products_per_page is not None:
        is_valid, error = validator.validate_products_per_page(products_per_page)
        if not is_valid:
            print_error(f"Invalid products per page: {error}")
            typer.Exit(1)
        update_data["productsPerPage"] = products_per_page
    
    if not update_data:
        print_error("No fields to update. Provide at least one option (--name, --domain, --products-per-page)")
        typer.Exit(1)
    
    # Dry-run preview
    if dry_run:
        # Risk assessment
        risk_assessor = OperationRiskAssessor()
        risk_level = risk_assessor.get_risk_level("shop.update")
        
        preview = {
            "action": "update_shop",
            "shop_id": shop_id,
            "updates": update_data,
            "risk_level": risk_level
        }
        
        if as_json:
            typer.echo(json.dumps(preview, indent=2))
        else:
            from rich.console import Console
            from rich.panel import Panel
            console = Console()
            updates_str = "\n".join([f"[bold]{k}:[/bold] {v}" for k, v in update_data.items()])
            risk_color = "yellow" if risk_level == "medium" else "green"
            console.print(Panel(
                f"{updates_str}\n\n[bold {risk_color}]Risk Level: {risk_level}[/bold {risk_color}]",
                title="[yellow]DRY RUN - Updates[/yellow]"
            ))
        return
    
    # Execute update
    set_base_url(config.get_api_url())
    client = get_api_client()
    client.set_auth_token(config.get_session_token())
    
    try:
        with print_status(f"Updating shop '{shop_id}'..."):
            response = client.put(f"/shops/{shop_id}", update_data, shop_id=shop_id)
        
        updated_shop = response.get("data", response)
        
        # Log to audit trail
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action=f"Updated shop settings",
            details={"updates": update_data},
            status="success"
        )
        
        if as_json:
            typer.echo(json.dumps(updated_shop, indent=2, default=str))
        else:
            print_success(f"Shop updated successfully")
            display_data = {
                "ID": updated_shop.get("id"),
                "Name": updated_shop.get("name"),
                "Domain": updated_shop.get("domain"),
                "Products Per Page": updated_shop.get("productsPerPage"),
            }
            print_details("Updated Shop", display_data)
    
    except Exception as e:
        # Log failure
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action=f"Failed to update shop settings",
            error=str(e),
            status="failed"
        )
        print_error(f"Failed to update shop: {e}")
        typer.Exit(1)
