"""
Create shop command.
Provisions a brand new shop tenant across PostgreSQL and MongoDB.
"""

import typer
import json
import os
from typing import Optional
from rich.panel import Panel
from database.postgres import create_tenant_owner, create_shop_record
from database.mongo import seed_shop_template, seed_demo_products
from lib.utils.formatting import print_success, print_error, print_status
from lib.validation.shop_validator import validate_shop_creation_data
from lib.audit.audit_logger import AuditEventType, AuditLogger
from lib.dry_run.simulator import DryRunSimulator

app = typer.Typer(help="Create new shops")


@app.command()
def create(
    name: str = typer.Option(..., "--name", "-n", help="Name of the new shop"),
    domain: str = typer.Option(..., "--domain", "-d", help="Custom domain for the shop (e.g., duckstore.com)"),
    owner_email: str = typer.Option(..., "--owner-email", "-e", help="Email of the shop owner"),
    owner_name: str = typer.Option("Store Admin", "--owner-name", help="Full name of the owner"),
    template: str = typer.Option("fashion", "--template", "-t", help="Initial UI Template (fashion/electronics/health)"),
    products_per_page: int = typer.Option(30, "--products-per-page", help="Products displayed per page"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview changes without executing"),
    as_json: bool = typer.Option(False, "--json", help="Output result as JSON"),
):
    """
    Provision a brand new shop tenant.
    
    This command:
    1. Creates a PostgreSQL owner account
    2. Creates a shop record
    3. Seeds MongoDB template
    4. Seeds demo products
    
    Example:
        shop create --name "My Shop" --domain myshop.com --owner-email owner@example.com --template fashion
    """
    # Validate input
    is_valid, error = validate_shop_creation_data(name, domain, owner_email, template)
    if not is_valid:
        print_error(error)
        typer.Exit(1)
    
    # Dry-run preview
    if dry_run:
        preview = {
            "action": "create_shop",
            "name": name,
            "domain": domain,
            "owner_email": owner_email,
            "template": template,
            "products_per_page": products_per_page,
            "status": "DRAFT"
        }
        
        if as_json:
            import json
            typer.echo(json.dumps(preview, indent=2))
        else:
            from rich.console import Console
            console = Console()
            console.print(Panel.fit(
                f"[bold]Shop Name:[/bold] {name}\n"
                f"[bold]Domain:[/bold] {domain}\n"
                f"[bold]Owner Email:[/bold] {owner_email}\n"
                f"[bold]Template:[/bold] {template}\n"
                f"[bold]Products Per Page:[/bold] {products_per_page}",
                title="[yellow]DRY RUN - Preview[/yellow]"
            ))
        return
    
    # Execute shop creation
    try:
        from rich.console import Console
        console = Console()
        
        # Step 1: Create PostgreSQL owner
        with print_status("Creating PostgreSQL owner account..."):
            user_id = create_tenant_owner(owner_email, owner_name)
        print_success(f"Owner account created/found with ID: {user_id}")
        
        # Step 2: Create shop record
        with print_status("Creating shop record..."):
            shop_id = create_shop_record(name, domain, user_id)
        print_success(f"Shop record created with ID: {shop_id}")
        
        # Step 3: Seed MongoDB template
        with print_status("Seeding MongoDB template..."):
            template_path = os.path.join(
                os.path.dirname(__file__), '..', '..', 'templates', f'{template}.json'
            )
            if os.path.exists(template_path):
                with open(template_path, 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
            else:
                template_data = {"sections": []}
            
            seed_shop_template(shop_id, template_data)
        print_success("Template seeded to MongoDB")
        
        # Step 4: Seed demo products
        with print_status("Seeding demo products..."):
            demo_products = [
                {
                    "name": f"{name} Signature T-Shirt",
                    "description": "High-quality cotton t-shirt",
                    "basePrice": {"value": 29.99, "currency": "USD"},
                    "category": ["Apparel", "T-Shirts"]
                },
                {
                    "name": f"{name} Limited Hoodie",
                    "description": "Keep warm in style",
                    "basePrice": {"value": 59.99, "currency": "USD"},
                    "category": ["Apparel", "Hoodies"]
                }
            ]
            count = seed_demo_products(shop_id, demo_products)
        print_success(f"{count} demo products seeded")
        
        # Step 5: Log audit event
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_CREATED,
            shop_id=shop_id,
            user_id=user_id,
            action=f"Created shop: {name}",
            details={
                "name": name,
                "domain": domain,
                "template": template,
                "owner_email": owner_email
            },
            status="success"
        )
        print_success("Operation logged to audit trail")
        
        # Success output
        result = {
            "shop_id": shop_id,
            "name": name,
            "domain": domain,
            "owner_email": owner_email,
            "owner_id": user_id,
            "template": template,
            "onboarding_step": 1,
            "status": "DRAFT"
        }
        
        if as_json:
            typer.echo(json.dumps(result, indent=2))
        else:
            console.print("\n[bold green]🎉 Shop created successfully! 🎉[/bold green]")
            console.print(Panel.fit(
                f"[bold]Shop ID:[/bold] {shop_id}\n"
                f"[bold]Name:[/bold] {name}\n"
                f"[bold]Domain:[/bold] {domain}\n"
                f"[bold]Admin Email:[/bold] {owner_email}",
                title="Shop Details"
            ))
    
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
