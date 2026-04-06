"""
List shops command.
Lists shops owned by user or all shops (admin only).
"""

import typer
import json
from typing import Optional
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_table, print_error, print_success
from lib.utils.auth import get_auth_manager

app = typer.Typer(help="List shops")


@app.command()
def list(
    all_shops: bool = typer.Option(False, "--all", help="Show all shops (admin only)"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
    limit: int = typer.Option(50, "--limit", help="Limit number of results"),
    status: Optional[str] = typer.Option(None, "--status", help="Filter by status (DRAFT/PUBLISHED)"),
):
    """
    List shops.
    
    By default shows shops owned by current user.
    With --all flag, shows all shops (requires admin role).
    
    Example:
        shop list
        shop list --all
        shop list --status PUBLISHED --json
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
        # Determine endpoint
        if all_shops:
            endpoint = "/shops/system/all-shops"
        else:
            endpoint = "/shops/my-shops"
        
        # Build query parameters
        params = {"limit": limit}
        if status:
            params["status"] = status
        
        # Fetch shops
        from lib.utils.formatting import print_status
        with print_status("Fetching shops..."):
            response = client.get(endpoint, params=params)
        
        shops = response.get("data", response if isinstance(response, list) else [])
        
        if not shops:
            print("No shops found.")
            return
        
        # Format output
        if as_json:
            typer.echo(json.dumps(shops, indent=2, default=str))
        else:
            columns = ["id", "name", "domain", "status", "template", "createdAt"]
            print_table(
                f"Shops ({len(shops)})",
                shops,
                columns=columns
            )
        
        print_success(f"Found {len(shops)} shop(s)")
    
    except Exception as e:
        print_error(f"Failed to list shops: {e}")
        typer.Exit(1)
