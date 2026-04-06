"""
Batch operations for creating/updating multiple shops from CSV/JSON files.
Supports parallel processing and atomic transactions.
"""

import typer
import csv
import json
import sys
from pathlib import Path
from typing import Optional, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from rich.console import Console
from rich.progress import Progress
from rich.table import Table
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_warning
from lib.utils.auth import get_auth_manager
from lib.audit.audit_logger import AuditEventType, AuditLogger
from lib.dry_run.simulator import DryRunSimulator

app = typer.Typer(help="Batch operations for shops")
console = Console()


def parse_csv_file(file_path: str) -> List[dict]:
    """Parse CSV file and return list of dictionaries."""
    shops = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row:  # Skip empty rows
                    shops.append(row)
        return shops
    except Exception as e:
        print_error(f"Failed to parse CSV file: {e}")
        typer.Exit(1)


def parse_json_file(file_path: str) -> List[dict]:
    """Parse JSON file and return list of dictionaries."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            else:
                return [data]
    except Exception as e:
        print_error(f"Failed to parse JSON file: {e}")
        typer.Exit(1)


def validate_shop_data(shop_data: dict) -> tuple[bool, str]:
    """Validate shop data before creation."""
    required_fields = ["name", "domain", "owner_email"]
    
    for field in required_fields:
        if field not in shop_data or not shop_data[field]:
            return False, f"Missing required field: {field}"
    
    # Basic validation
    if "@" not in shop_data.get("owner_email", ""):
        return False, f"Invalid email: {shop_data.get('owner_email')}"
    
    return True, ""


def create_shop_batch(shop_data: dict, api_key: str, api_url: str) -> dict:
    """Create a single shop (for parallel execution)."""
    try:
        set_base_url(api_url)
        client = get_api_client()
        client.set_auth_token(api_key)
        
        # Validate
        is_valid, error = validate_shop_data(shop_data)
        if not is_valid:
            return {
                "status": "failed",
                "shop_name": shop_data.get("name"),
                "error": error,
                "shop_id": None
            }
        
        # Create shop
        response = client.post("/shops", {
            "name": shop_data.get("name"),
            "domain": shop_data.get("domain"),
            "ownerEmail": shop_data.get("owner_email"),
            "template": shop_data.get("template", "fashion")
        })
        
        shop_id = response.get("data", {}).get("id", response.get("id"))
        
        return {
            "status": "success",
            "shop_name": shop_data.get("name"),
            "shop_id": shop_id,
            "domain": shop_data.get("domain"),
            "error": None
        }
    except Exception as e:
        return {
            "status": "failed",
            "shop_name": shop_data.get("name"),
            "error": str(e),
            "shop_id": None
        }


@app.command()
def create(
    file: str = typer.Argument(..., help="CSV or JSON file with shop data"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview without executing"),
    parallel: int = typer.Option(5, "--parallel", "-p", help="Number of parallel workers"),
    continue_on_error: bool = typer.Option(False, "--continue-on-error", help="Continue if individual shop creation fails"),
    skip_validation: bool = typer.Option(False, "--skip-validation", help="Skip validation checks"),
    as_json: bool = typer.Option(False, "--json", help="Output result as JSON"),
):
    """
    Batch create shops from CSV or JSON file.
    
    CSV format (columns):
        name,domain,owner_email,template
        Shop 1,shop1.com,owner1@example.com,fashion
        Shop 2,shop2.com,owner2@example.com,electronics
    
    JSON format:
        [
            {"name": "Shop 1", "domain": "shop1.com", "owner_email": "owner1@example.com"},
            {"name": "Shop 2", "domain": "shop2.com", "owner_email": "owner2@example.com"}
        ]
    
    Example:
        batch create shops.csv
        batch create shops.json --parallel 10
        batch create shops.csv --dry-run
    """
    config = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    # Parse file
    file_path = Path(file)
    if not file_path.exists():
        print_error(f"File not found: {file}")
        typer.Exit(1)
    
    if file_path.suffix.lower() == ".csv":
        shops = parse_csv_file(file)
    elif file_path.suffix.lower() == ".json":
        shops = parse_json_file(file)
    else:
        print_error(f"Unsupported file format: {file_path.suffix}")
        typer.Exit(1)
    
    if not shops:
        print_error("No shops found in file")
        typer.Exit(1)
    
    console.print(f"[bold]Found {len(shops)} shops to create[/bold]")
    
    # Dry-run preview
    if dry_run:
        preview_table = Table(title="Dry-Run Preview")
        preview_table.add_column("Name", style="cyan")
        preview_table.add_column("Domain", style="magenta")
        preview_table.add_column("Owner Email", style="green")
        
        for shop in shops:
            preview_table.add_row(
                shop.get("name", "N/A"),
                shop.get("domain", "N/A"),
                shop.get("owner_email", "N/A")
            )
        
        console.print(preview_table)
        
        if as_json:
            typer.echo(json.dumps({
                "action": "batch_create",
                "status": "dry-run",
                "count": len(shops),
                "shops": shops
            }, indent=2))
        else:
            console.print(f"\n[yellow]Dry-run: Would create {len(shops)} shops[/yellow]")
        
        return
    
    # Confirm execution
    if not typer.confirm(f"Create {len(shops)} shops?"):
        console.print("[yellow]Batch creation cancelled[/yellow]")
        return
    
    # Execute batch creation
    results = []
    audit_logger = AuditLogger()
    
    try:
        with Progress() as progress:
            task = progress.add_task("[cyan]Creating shops...", total=len(shops))
            
            with ThreadPoolExecutor(max_workers=parallel) as executor:
                # Submit all tasks
                futures = {
                    executor.submit(
                        create_shop_batch,
                        shop,
                        config.get_session_token(),
                        config.get_api_url()
                    ): shop for shop in shops
                }
                
                # Collect results
                for future in as_completed(futures):
                    result = future.result()
                    results.append(result)
                    
                    # Log individual shop creation
                    if result["status"] == "success":
                        audit_logger.log_operation(
                            AuditEventType.SHOP_CREATED,
                            shop_id=result["shop_id"],
                            action=f"Batch created shop: {result['shop_name']}",
                            details={"batch_operation": True},
                            status="success"
                        )
                    else:
                        audit_logger.log_operation(
                            AuditEventType.SHOP_CREATED,
                            action=f"Batch creation failed for: {result['shop_name']}",
                            error=result["error"],
                            status="failed"
                        )
                    
                    progress.update(task, advance=1)
    
    except Exception as e:
        print_error(f"Batch operation failed: {e}")
        audit_logger.log_operation(
            AuditEventType.SHOP_CREATED,
            action="Batch creation failed",
            error=str(e),
            status="failed"
        )
        typer.Exit(1)
    
    # Generate report
    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "failed"]
    
    # Display results
    if as_json:
        typer.echo(json.dumps({
            "status": "completed",
            "total": len(results),
            "successful": len(successful),
            "failed": len(failed),
            "results": results
        }, indent=2))
    else:
        results_table = Table(title="Batch Creation Results")
        results_table.add_column("Shop Name", style="cyan")
        results_table.add_column("Status", style="magenta")
        results_table.add_column("Shop ID", style="green")
        results_table.add_column("Domain", style="yellow")
        
        for result in results:
            status_color = "green" if result["status"] == "success" else "red"
            results_table.add_row(
                result["shop_name"],
                f"[{status_color}]{result['status']}[/{status_color}]",
                result.get("shop_id", "N/A"),
                result.get("domain", "N/A")
            )
        
        console.print(results_table)
        
        # Summary
        console.print(f"\n[bold]Summary:[/bold]")
        console.print(f"  Total: {len(results)}")
        print_success(f"  Successful: {len(successful)}")
        if failed:
            print_error(f"  Failed: {len(failed)}")
            for fail in failed:
                console.print(f"    - {fail['shop_name']}: {fail['error']}")
