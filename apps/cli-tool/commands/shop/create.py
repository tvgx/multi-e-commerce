"""
Create shop command.
Provisions a brand new shop tenant across PostgreSQL and MongoDB using API Core.
"""

import typer
import json
import os
from typing import Optional
from rich.panel import Panel
from rich.console import Console

from config import get_config
from api_client import set_base_url, get_api_client, ApiClientError
from lib.utils.formatting import print_success, print_error, print_status
from lib.validation.shop_validator import validate_shop_creation_data
from lib.audit.audit_logger import AuditEventType, AuditLogger

app = typer.Typer(help="Create new shops")


@app.command()
def create(
    name: str = typer.Option(..., "--name", "-n", help="Name of the new shop"),
    domain: str = typer.Option(..., "--domain", "-d", help="Custom domain for the shop (e.g., duckstore.com)"),
    owner_email: str = typer.Option(..., "--owner-email", "-e", help="Email of the shop owner"),
    owner_name: str = typer.Option("Store Admin", "--owner-name", help="Full name of the owner"),
    template: str = typer.Option("fashion", "--template", "-t", help="Initial UI Template (fashion/electronics/health)"),
    products_per_page: int = typer.Option(30, "--products-per-page", help="Products displayed per page"),
    seed_demo_products: bool = typer.Option(True, "--seed-demo-products", help="Seed demo products"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview changes without executing"),
    as_json: bool = typer.Option(False, "--json", help="Output result as JSON"),
):
    """
    Provision a brand new shop tenant via API Core.
    
    This command:
    1. Validates input
    2. Sends provisioning request to API Core
    3. API Core handles Database operations and Cache revalidation
    
    Example:
        shop create --name "My Shop" --domain myshop.com --owner-email owner@example.com --template fashion
    """
    # Validate input
    is_valid, error = validate_shop_creation_data(name, domain, owner_email, template)
    if not is_valid:
        print_error(error)
        typer.Exit(1)
    
    payload = {
        "shopName": name,
        "domain": domain,
        "email": owner_email,
        "ownerName": owner_name,
        "template": template,
        "seedDemoProducts": seed_demo_products
    }

    # Dry-run preview
    if dry_run:
        preview = {
            "action": "create_shop",
            **payload,
            "products_per_page": products_per_page,
            "status": "DRAFT"
        }
        
        if as_json:
            typer.echo(json.dumps(preview, indent=2))
        else:
            console = Console()
            console.print(Panel.fit(
                f"[bold]Shop Name:[/bold] {name}\n"
                f"[bold]Domain:[/bold] {domain}\n"
                f"[bold]Owner Email:[/bold] {owner_email}\n"
                f"[bold]Template:[/bold] {template}\n"
                f"[bold]Demo Products:[/bold] {seed_demo_products}",
                title="[yellow]DRY RUN - Preview[/yellow]"
            ))
        return
    
    # Execute shop creation via API Core
    try:
        console = Console()
        
        # Initialize API Client
        config = get_config()
        set_base_url(config.get_api_url())
        api_client = get_api_client()
        
        # Apply API key if available
        if config.config.get('api_key'):
            api_client.set_auth_token(config.config.get('api_key'))
        elif config.get_session_token():
            api_client.set_auth_token(config.get_session_token())
            
        with print_status("Provisioning shop via API Core..."):
            response = api_client.post("/v1/tenants/register", payload)
            
        # Parse Response
        if not response or not response.get('success'):
            raise Exception(response.get('message', 'Unknown API Error'))
            
        data = response.get('data', {})
        shop_id = data.get('tenantId')
        
        print_success("Shop successfully provisioned in PostgreSQL and MongoDB")
        print_success("Navigation Menus initialized")
        if seed_demo_products:
            print_success("Demo products seeded")
        print_success("Next.js Storefront Cache invalidated")
        
        # Log audit event
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_CREATED,
            shop_id=shop_id,
            user_id="cli-user",
            action=f"Created shop via API: {name}",
            details=payload,
            status="success"
        )
        print_success("Operation logged to audit trail")
        
        if as_json:
            typer.echo(json.dumps(data, indent=2))
        else:
            console.print("\n[bold green]🎉 Shop created successfully! 🎉[/bold green]")
            console.print(Panel.fit(
                f"[bold]Shop ID:[/bold] {shop_id}\n"
                f"[bold]Name:[/bold] {data.get('shopName', name)}\n"
                f"[bold]Domain:[/bold] {data.get('domain', domain)}\n"
                f"[bold]Admin Email:[/bold] {data.get('email', owner_email)}",
                title="Shop Details"
            ))
            
    except ApiClientError as e:
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_CREATED,
            action=f"Failed to create shop: {name}",
            error=str(e),
            status="failed"
        )
        print_error(f"API Error: {e}")
        typer.Exit(1)
    except Exception as e:
        # Log failure to audit trail
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_CREATED,
            action=f"Failed to create shop: {name}",
            error=str(e),
            status="failed"
        )
        print_error(f"Shop creation failed: {e}")
        typer.Exit(1)

