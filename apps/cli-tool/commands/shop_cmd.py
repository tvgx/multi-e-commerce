import typer
import json
import os
from rich.console import Console
from database.postgres import create_tenant_owner, create_shop_record
from database.mongo import seed_shop_template, seed_demo_products

app = typer.Typer(help="Manage E-commerce Tenants and Shops")
console = Console()

@app.command("create")
def create_shop(
    name: str = typer.Option(..., "--name", "-n", help="Name of the new shop"),
    owner_email: str = typer.Option(..., "--owner-email", "-e", help="Email of the branch owner"),
    owner_name: str = typer.Option("Store Admin", "--owner-name", help="Full name of the owner"),
    template: str = typer.Option("fashion", "--template", "-t", help="Initial UI Template to clone")
):
    """
    Provision a brand new shop tenant across PostgreSQL and MongoDB automatically.
    """
    console.print(f"[bold blue]Starting provisioning for '{name}'...[/bold blue]")
    
    try:
        # Step 1: PostgreSQL User
        with console.status("[yellow]Creating Postgres Owner Account...[/yellow]"):
            user_id = create_tenant_owner(owner_email, owner_name)
        console.print(f"[green]✔ Owner Account created/found with ID: {user_id}[/green]")
        
        # Step 2: PostgreSQL Shop Record
        with console.status("[yellow]Initializing Shop Record inside Postgres...[/yellow]"):
            shop_id = create_shop_record(name, user_id)
        console.print(f"[green]✔ Shop Record created with ID: {shop_id}[/green]")
        
        # Step 3: MongoDB Template Seeding
        with console.status("[yellow]Cloning Master Template to MongoDB...[/yellow]"):
            template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', f'{template}.json')
            if not os.path.exists(template_path):
                console.print(f"[red]Template '{template}' not found at {template_path}. Using default.[/red]")
                template_data = {"sections": []}
            else:
                with open(template_path, 'r') as f:
                    template_data = json.load(f)
                    
            seed_shop_template(shop_id, template_data)
        console.print(f"[green]✔ UI ShopTemplate seeded successfully into MongoDB[/green]")
        
        # Step 4: MongoDB Demo Products 
        with console.status("[yellow]Seeding Demo Products into MongoDB...[/yellow]"):
            demo_products = [
                {
                    "name": f"{name} Signature T-Shirt",
                    "description": "A high-quality cotton t-shirt built for your new shop.",
                    "basePrice": {
                        "value": 29.99,
                        "currency": "USD"
                    },
                    "category": ["Apparel", "T-Shirts"]
                },
                 {
                    "name": f"{name} Limited Hoodie",
                    "description": "Keep warm in style.",
                    "basePrice": {
                        "value": 59.99,
                        "currency": "USD"
                    },
                    "category": ["Apparel", "Hoodies"]
                }
            ]
            count = seed_demo_products(shop_id, demo_products)
        console.print(f"[green]✔ {count} Demo Products provisioned[/green]")
        
        console.print("\n[bold green]🎉 Tenant Provisioning Completed Successfully! 🎉[/bold green]")
        console.print(f"Shop ID: [cyan]{shop_id}[/cyan]")
        console.print(f"Admin Email: [cyan]{owner_email}[/cyan]")
        
    except Exception as e:
        console.print(f"\n[bold red]Provisioning Failed: {e}[/bold red]")
        typer.Exit(1)
        
if __name__ == "__main__":
    app()
