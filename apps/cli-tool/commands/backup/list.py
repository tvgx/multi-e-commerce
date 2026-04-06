"""
List backups command.
Lists all backups for a shop.
"""

import typer
import json
from pathlib import Path
from lib.backups.backup_engine import BackupEngine
from config import get_config
from lib.utils.formatting import print_success, print_error, print_table, print_info

app = typer.Typer(help="List backups")


@app.command()
def list(
    shop_id: str = typer.Argument(..., help="Shop ID"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
    limit: int = typer.Option(20, "--limit", help="Number of backups to show"),
):
    """
    List all backups for a shop.
    
    Shows backups in reverse chronological order (newest first).
    
    Example:
        backup list <shop-id>
        backup list <shop-id> --limit 50
        backup list <shop-id> --json
    """
    config = get_config()
    
    engine = BackupEngine(config.backup_dir)
    backups = engine.list_backups(shop_id)
    
    if not backups:
        print_info(f"No backups found for shop '{shop_id}'")
        return
    
    # Limit results
    backups = backups[:limit]
    
    if as_json:
        typer.echo(json.dumps(backups, indent=2, default=str))
    else:
        # Format for table display
        table_data = []
        for backup in backups:
            components = backup.get("components", {})
            status = "✓" if not backup.get("errors") else "⚠"
            
            table_data.append({
                "status": status,
                "timestamp": backup.get("timestamp", "N/A"),
                "components": ", ".join([c for c in components.keys() if components[c].get("status") == "success"]),
                "size (MB)": f"{backup.get('total_size', 0) / (1024*1024):.1f}",
            })
        
        print_table(f"Backups for shop: {shop_id}", table_data)
        print_success(f"Found {len(backups)} backup(s)")
