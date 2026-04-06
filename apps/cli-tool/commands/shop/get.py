"""
Get shop command.
Retrieve detailed information about a specific shop.
"""

import typer
import json
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_details, print_error, print_success
from lib.utils.auth import get_auth_manager

app = typer.Typer(help="Get shop details")


@app.command()
def get_shop(
    shop_id: str = typer.Argument(..., help="Shop ID or domain"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Get detailed information about a shop.
    
    Can specify shop by ID or domain.
    
    Example:
        shop get <shop-id>
        shop get myshop.com
        shop get <shop-id> --json
    """
    config = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    # Get API client
    set_base_url(config.get_api_url())
    client = get_api_client()
    client.set_auth_token(config.get_session_token())
    
    try:
        from lib.utils.formatting import print_status
        
        # Determine if input is ID or domain
        endpoint = f"/shops/resolve/{shop_id}"
        
        with print_status(f"Fetching shop '{shop_id}'..."):
            response = client.get(endpoint)
        
        shop = response.get("data", response)
        
        if as_json:
            typer.echo(json.dumps(shop, indent=2, default=str))
        else:
            # Format for display
            display_data = {
                "ID": shop.get("id"),
                "Name": shop.get("name"),
                "Domain": shop.get("domain"),
                "Status": shop.get("status"),
                "Template": shop.get("templateType"),
                "Owner ID": shop.get("ownerId"),
                "Onboarding Step": shop.get("onboardingStep"),
                "Domain Verified": shop.get("domainVerified"),
                "Products Per Page": shop.get("productsPerPage"),
                "Created": shop.get("createdAt"),
                "Updated": shop.get("updatedAt"),
            }
            print_details("Shop Details", display_data)
        
        print_success(f"Retrieved shop: {shop.get('name')}")
    
    except Exception as e:
        print_error(f"Failed to get shop: {e}")
        typer.Exit(1)
