"""
Eject shop command.
Sets up local development environment for isolated shop development.
"""

import typer
import json
import os
from pathlib import Path
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_info
from lib.utils.auth import get_auth_manager
from database.postgres import execute_query

app = typer.Typer(help="Eject shops for local development")


@app.command()
def eject(
    shop_id: str = typer.Argument(..., help="Shop ID to eject for local development"),
    output_file: str = typer.Option(
        "../storefront/.env.local",
        "--output", "-o",
        help="Output .env file path"
    ),
    as_json: bool = typer.Option(False, "--json", help="Output configuration as JSON"),
):
    """
    Eject a shop for local development.
    
    This sets up an isolated development environment where the storefront
    runs as a standalone shop without affecting others.
    
    Generates a .env.local file with NEXT_PUBLIC_SHOP_ID set to the specified shop.
    
    Example:
        shop eject <shop-id>
        shop eject <shop-id> --output ./env.local
    """
    try:
        # Validate shop exists
        with print_status(f"Validating shop '{shop_id}'..."):
            shops = execute_query(
                f'SELECT id, name, domain FROM "Shop" WHERE id = \'{shop_id}\'',
                fetch=True
            )
            
            if not shops:
                print_error(f"Shop with ID {shop_id} not found")
                typer.Exit(1)
            
            shop = shops[0]
        
        print_success(f"Verified shop: {shop['name']} ({shop['domain']})")
        
        # Validate shop name is not empty
        if not shop.get('name'):
            print_error("Shop name is empty")
            typer.Exit(1)
        
        # Generate .env content
        env_content = f"""# Auto-generated .env.local for local development
# Generated for shop: {shop['name']} ({shop['domain']})

# Shop Configuration
NEXT_PUBLIC_SHOP_ID={shop_id}
NEXT_PUBLIC_SHOP_NAME={shop['name']}
NEXT_PUBLIC_SHOP_DOMAIN={shop['domain']}

# Development Mode
NEXT_PUBLIC_DEV_MODE=true

# API Configuration (update as needed for your environment)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Local development note:
# This configuration allows isolated development of this specific shop
# without affecting other shops in the system.
"""
        
        if as_json:
            config_obj = {
                "shop_id": shop_id,
                "shop_name": shop['name'],
                "shop_domain": shop['domain'],
                "dev_mode": True,
                "api_url": "http://localhost:3000/api"
            }
            typer.echo(json.dumps(config_obj, indent=2))
        else:
            # Create output directory if needed
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write .env.local file
            with print_status(f"Writing configuration to {output_file}..."):
                with open(output_path, 'w') as f:
                    f.write(env_content)
            
            print_success(f"Configuration written to {output_file}")
            print_info(f"Shop ejected for development: {shop['name']}")
            print_info(f"All requests from storefront will target shop: {shop_id}")
            print_info("Ready for isolated development!")
    
    except Exception as e:
        print_error(f"Shop ejection failed: {e}")
        typer.Exit(1)
