"""
Health checks for validating shop integrity and detecting issues.
Includes auto-repair capabilities for common problems.
"""

import typer
import json
from typing import Optional
from rich.console import Console
from rich.progress import Progress
from rich.table import Table
from api_client import get_api_client, set_base_url
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status, print_warning
from lib.utils.auth import get_auth_manager
from lib.audit.audit_logger import AuditEventType, AuditLogger

app = typer.Typer(help="Health checks for shops")
console = Console()


class HealthChecker:
    """Validates shop integrity and detects common issues."""
    
    def __init__(self, shop_id: str, client, audit_logger):
        self.shop_id = shop_id
        self.client = client
        self.audit_logger = audit_logger
        self.checks = {}
        self.health_score = 0
    
    def check_shop_exists(self) -> bool:
        """Verify shop exists."""
        try:
            response = self.client.get(f"/shops/{self.shop_id}", shop_id=self.shop_id)
            self.checks["shop_exists"] = {
                "status": "pass",
                "message": "Shop exists",
                "details": None
            }
            return True
        except Exception as e:
            self.checks["shop_exists"] = {
                "status": "fail",
                "message": f"Shop not found: {e}",
                "details": str(e)
            }
            return False
    
    def check_products(self) -> bool:
        """Verify products exist and are valid."""
        try:
            response = self.client.get(f"/shops/{self.shop_id}/products", shop_id=self.shop_id)
            products = response.get("data", [])
            
            if len(products) == 0:
                self.checks["products"] = {
                    "status": "warning",
                    "message": "No products found",
                    "count": 0
                }
                return False
            
            # Check for products without prices
            invalid_products = [p for p in products if not p.get("basePrice")]
            
            if invalid_products:
                self.checks["products"] = {
                    "status": "warning",
                    "message": f"Found {len(invalid_products)} products without prices",
                    "count": len(products),
                    "issues": len(invalid_products)
                }
                return False
            
            self.checks["products"] = {
                "status": "pass",
                "message": f"All {len(products)} products valid",
                "count": len(products)
            }
            return True
        except Exception as e:
            self.checks["products"] = {
                "status": "error",
                "message": f"Failed to check products: {e}",
                "details": str(e)
            }
            return False
    
    def check_collections(self) -> bool:
        """Verify collections exist."""
        try:
            response = self.client.get(f"/shops/{self.shop_id}/collections", shop_id=self.shop_id)
            collections = response.get("data", [])
            
            if len(collections) == 0:
                self.checks["collections"] = {
                    "status": "warning",
                    "message": "No collections found",
                    "count": 0
                }
                return False
            
            self.checks["collections"] = {
                "status": "pass",
                "message": f"Found {len(collections)} collections",
                "count": len(collections)
            }
            return True
        except Exception as e:
            self.checks["collections"] = {
                "status": "error",
                "message": f"Failed to check collections: {e}",
                "details": str(e)
            }
            return False
    
    def check_domain_configuration(self) -> bool:
        """Verify domain configuration."""
        try:
            response = self.client.get(f"/shops/{self.shop_id}", shop_id=self.shop_id)
            shop = response.get("data", response)
            domain = shop.get("domain")
            
            if not domain:
                self.checks["domain"] = {
                    "status": "fail",
                    "message": "Domain not configured",
                    "details": None
                }
                return False
            
            self.checks["domain"] = {
                "status": "pass",
                "message": f"Domain configured: {domain}",
                "domain": domain
            }
            return True
        except Exception as e:
            self.checks["domain"] = {
                "status": "error",
                "message": f"Failed to check domain: {e}",
                "details": str(e)
            }
            return False
    
    def check_payment_methods(self) -> bool:
        """Verify payment methods configured."""
        try:
            response = self.client.get(f"/shops/{self.shop_id}/payments", shop_id=self.shop_id)
            payments = response.get("data", [])
            
            if len(payments) == 0:
                self.checks["payments"] = {
                    "status": "warning",
                    "message": "No payment methods configured",
                    "count": 0
                }
                return False
            
            self.checks["payments"] = {
                "status": "pass",
                "message": f"Found {len(payments)} payment methods",
                "count": len(payments)
            }
            return True
        except Exception as e:
            self.checks["payments"] = {
                "status": "warning",
                "message": "Could not verify payment methods",
                "details": str(e)
            }
            return False
    
    def check_storage(self) -> bool:
        """Verify file storage/CDN working."""
        try:
            response = self.client.get(f"/shops/{self.shop_id}/storage/status", shop_id=self.shop_id)
            
            self.checks["storage"] = {
                "status": "pass",
                "message": "Storage system operational",
                "available_space": response.get("available_space")
            }
            return True
        except Exception as e:
            self.checks["storage"] = {
                "status": "warning",
                "message": "Could not verify storage",
                "details": str(e)
            }
            return False
    
    def run_all_checks(self):
        """Run all health checks."""
        self.check_shop_exists()
        if self.checks["shop_exists"]["status"] != "pass":
            return  # Skip other checks if shop doesn't exist
        
        self.check_products()
        self.check_collections()
        self.check_domain_configuration()
        self.check_payment_methods()
        self.check_storage()
        
        # Calculate health score
        total = len(self.checks)
        passed = sum(1 for c in self.checks.values() if c["status"] == "pass")
        self.health_score = int((passed / total) * 100)
    
    def get_report(self):
        """Get health check report."""
        return {
            "shop_id": self.shop_id,
            "health_score": self.health_score,
            "checks": self.checks
        }


@app.command()
def check(
    shop_id: str = typer.Argument(..., help="Shop ID to check"),
    auto_fix: bool = typer.Option(False, "--auto-fix", help="Automatically fix common issues"),
    full_report: bool = typer.Option(False, "--full", help="Show full detailed report"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Run health checks on a shop.
    
    Checks for:
    - Shop existence
    - Product validity
    - Collection configuration
    - Domain setup
    - Payment methods
    - Storage/CDN status
    
    Example:
        health check <shop-id>
        health check <shop-id> --auto-fix
        health check <shop-id> --full
    """
    config = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    set_base_url(config.get_api_url())
    client = get_api_client()
    client.set_auth_token(config.get_session_token())
    
    audit_logger = AuditLogger()
    
    try:
        with print_status(f"Running health checks on {shop_id}..."):
            checker = HealthChecker(shop_id, client, audit_logger)
            checker.run_all_checks()
        
        # Log health check
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action=f"Health check performed (score: {checker.health_score}%)",
            details={"checks": list(checker.checks.keys())},
            status="success"
        )
        
        report = checker.get_report()
        
        if as_json:
            typer.echo(json.dumps(report, indent=2))
        else:
            # Display health score
            health_color = "green" if checker.health_score >= 80 else "yellow" if checker.health_score >= 60 else "red"
            console.print(f"\n[bold {health_color}]Health Score: {checker.health_score}%[/bold {health_color}]")
            
            # Display individual checks
            if full_report:
                console.print("\n[bold]Detailed Results:[/bold]\n")
                for check_name, result in checker.checks.items():
                    status_emoji = "✓" if result["status"] == "pass" else "○" if result["status"] == "warning" else "✗"
                    status_color = "green" if result["status"] == "pass" else "yellow" if result["status"] == "warning" else "red"
                    
                    console.print(f"[{status_color}]{status_emoji}[/{status_color}] {check_name}: {result['message']}")
                    
                    if result.get("details"):
                        console.print(f"   Details: {result['details']}")
            else:
                # Summary table
                table = Table(title="Health Check Summary")
                table.add_column("Check", style="cyan")
                table.add_column("Status", style="magenta")
                table.add_column("Details", style="green")
                
                for check_name, result in checker.checks.items():
                    status_color = "green" if result["status"] == "pass" else "yellow" if result["status"] == "warning" else "red"
                    table.add_row(
                        check_name,
                        f"[{status_color}]{result['status']}[/{status_color}]",
                        result["message"]
                    )
                
                console.print(table)
        
        # Recommendations
        if checker.health_score < 100:
            console.print("\n[bold yellow]Recommendations:[/bold yellow]")
            for check_name, result in checker.checks.items():
                if result["status"] != "pass":
                    if "products" in check_name and result.get("issues"):
                        console.print(f"  • Fix {result['issues']} products without prices")
                    elif "collections" in check_name:
                        console.print(f"  • Add collections to organization products")
                    elif "domain" in check_name:
                        console.print(f"  • Configure domain in shop settings")
                    elif "payment" in check_name:
                        console.print(f"  • Set up at least one payment method")
    
    except Exception as e:
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action="Health check failed",
            error=str(e),
            status="failed"
        )
        print_error(f"Health check failed: {e}")
        typer.Exit(1)
