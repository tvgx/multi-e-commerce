import typer
import json
import os
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from database.postgres import create_tenant_owner, create_shop_record, execute_query
from database.mongo import seed_shop_template, seed_demo_products

app = typer.Typer(help="Manage E-commerce Tenants and Shops")
console = Console()

@app.command("create")
def create_shop(
    name: str = typer.Option(..., "--name", "-n", help="Name of the new shop"),
    domain: str = typer.Option(..., "--domain", "-d", help="Custom domain for the shop (e.g., duckstore.com)"),
    owner_email: str = typer.Option(..., "--owner-email", "-e", help="Email of the branch owner"),
    owner_name: str = typer.Option("Store Admin", "--owner-name", help="Full name of the owner"),
    template: str = typer.Option("fashion", "--template", "-t", help="Initial UI Template to clone")
):
    """
    Provision a brand new shop tenant across PostgreSQL and MongoDB automatically.
    """
    console.print(f"[bold blue]Starting provisioning for '{name}' at domain '{domain}'...[/bold blue]")
    
    try:
        # Step 1: PostgreSQL User
        with console.status("[yellow]Creating Postgres Owner Account...[/yellow]"):
            user_id = create_tenant_owner(owner_email, owner_name)
        console.print(f"[green]✔ Owner Account created/found with ID: {user_id}[/green]")
        
        # Step 2: PostgreSQL Shop Record
        with console.status("[yellow]Initializing Shop Record inside Postgres...[/yellow]"):
            shop_id = create_shop_record(name, domain, user_id)
        console.print(f"[green]✔ Shop Record created with ID: {shop_id}[/green]")
        
        # Step 3: MongoDB Template Seeding
        with console.status("[yellow]Cloning Master Template to MongoDB...[/yellow]"):
            template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', f'{template}.json')
            if not os.path.exists(template_path):
                console.print(f"[red]Template '{template}' not found at {template_path}. Using default.[/red]")
                template_data = {"sections": []}
            else:
                with open(template_path, 'r', encoding='utf-8') as f:
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
        console.print(Panel.fit(f"Shop ID: {shop_id}\nDomain: {domain}\nAdmin Email: {owner_email}", title="Shop Details"))
        
    except Exception as e:
        console.print(f"\n[bold red]Provisioning Failed: {e}[/bold red]")
        typer.Exit(1)

@app.command("eject")
def eject_codebase(
    shop_root_id: str = typer.Option(..., "--id", "-id", help="The UUID of the Shop to eject"),
):
    """
    Eject/Export codebase config for a specific shop for localized development without affecting others.
    It writes NEXT_PUBLIC_SHOP_ID into apps/storefront/.env.local so it runs as a standalone shop.
    """
    console.print(f"[blue]Initializing isolated Codebase Ejection for Shop ID: {shop_root_id}[/blue]")
    try:
        # Validate shop exists
        with console.status("[yellow]Validating Shop Context...[/yellow]"):
            shops = execute_query(f"SELECT id, name, domain FROM \"Shop\" WHERE id = '{shop_root_id}'", fetch=True)
            if not shops:
                 console.print(f"[red]Error: Shop with ID {shop_root_id} not found in Database![/red]")
                 typer.Exit(1)
                 return
            shop = shops[0]
            console.print(f"[green]✔ Verified Shop: {shop['name']} ({shop['domain']})[/green]")

        # Write to storefront env
        storefront_env_path = os.path.join(os.path.dirname(__file__), '..', '..', 'storefront', '.env.local')
        with console.status("[yellow]Configuring Storefront Environment...[/yellow]"):
            with open(storefront_env_path, "w") as f:
                f.write(f"# Auto-generated by EJECT command\n")
                f.write(f"NEXT_PUBLIC_DEV_SHOP_ID={shop_root_id}\n")
                f.write(f"NEXT_PUBLIC_DEV_SHOP_DOMAIN={shop['domain']}\n")
            console.print(f"[green]✔ Configured {storefront_env_path}[/green]")
        
        console.print("\n[bold green]🎉 Codebase Successfully Ejected! 🎉[/bold green]")
        console.print(f"You can now run `npm run dev` in apps/storefront.")
        console.print(f"The UI and API calls will automatically fit the `{shop['name']}` scope.")
        
    except Exception as e:
        console.print(f"[red]Ejection Failed: {e}[/red]")
        typer.Exit(1)

if __name__ == "__main__":
    app()
