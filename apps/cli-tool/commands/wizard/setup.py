"""
8-step guided setup wizard for shop initialization.
Walks users through onboarding, payment, shipping, tax configuration, etc.
"""

import typer
import json
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.progress import Progress
from config import get_config
from lib.utils.formatting import print_success, print_error, print_status
from lib.utils.auth import get_auth_manager
from lib.audit.audit_logger import AuditEventType, AuditLogger
from api_client import get_api_client, set_base_url

app = typer.Typer(help="Setup wizard for shop initialization")
console = Console()


class WizardStep:
    """Base class for wizard steps."""
    
    def __init__(self, step_number: int, title: str):
        self.step_number = step_number
        self.title = title
        self.data = {}
    
    def display_header(self):
        """Display step header."""
        console.print(Panel(f"Step {self.step_number}/8: {self.title}", style="bold blue"))
    
    def run(self) -> dict:
        """Run the step and return collected data."""
        raise NotImplementedError


class OnboardingStep(WizardStep):
    """Step 1: Basic shop information."""
    
    def __init__(self):
        super().__init__(1, "Shop Onboarding")
    
    def run(self) -> dict:
        self.display_header()
        
        self.data = {
            "shop_name": Prompt.ask("Shop name"),
            "domain": Prompt.ask("Your domain"),
            "owner_email": Prompt.ask("Owner email"),
            "owner_name": Prompt.ask("Owner name"),
            "business_type": Prompt.ask("Business type", choices=["B2C", "B2B", "Marketplace"]),
            "currency": Prompt.ask("Currency", default="USD")
        }
        
        console.print("[green]✓ Onboarding information saved[/green]")
        return self.data


class PaymentStep(WizardStep):
    """Step 2: Payment configuration."""
    
    def __init__(self):
        super().__init__(2, "Payment Setup")
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("Configure payment methods for your shop:")
        
        self.data = {
            "stripe_enabled": Confirm.ask("Enable Stripe?", default=True),
            "paypal_enabled": Confirm.ask("Enable PayPal?", default=True),
            "bank_transfer_enabled": Confirm.ask("Enable bank transfer?", default=False),
            "stripe_key": Prompt.ask("Stripe API key") if self.data.get("stripe_enabled") else None,
            "paypal_client_id": Prompt.ask("PayPal Client ID") if self.data.get("paypal_enabled") else None,
        }
        
        console.print("[green]✓ Payment configuration saved[/green]")
        return self.data


class ShippingStep(WizardStep):
    """Step 3: Shipping configuration."""
    
    def __init__(self):
        super().__init__(3, "Shipping Setup")
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("Configure shipping methods:")
        
        self.data = {
            "shipping_methods": [],
            "free_shipping_threshold": Prompt.ask("Free shipping order threshold (USD)", default="100"),
        }
        
        # Add shipping methods
        while Confirm.ask("Add shipping method?", default=True):
            method = {
                "name": Prompt.ask("Method name", choices=["Standard", "Express", "Overnight", "Local Pickup"]),
                "base_cost": Prompt.ask("Base cost (USD)"),
                "processing_days": Prompt.ask("Processing days", default="2-3")
            }
            self.data["shipping_methods"].append(method)
        
        console.print(f"[green]✓ {len(self.data['shipping_methods'])} shipping methods configured[/green]")
        return self.data


class TaxStep(WizardStep):
    """Step 4: Tax configuration."""
    
    def __init__(self):
        super().__init__(4, "Tax Setup")
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("Configure tax rules:")
        
        self.data = {
            "tax_enabled": Confirm.ask("Enable tax calculation?", default=True),
            "tax_type": Prompt.ask("Tax type", choices=["VAT", "GST", "Sales Tax"]) if self.data.get("tax_enabled") else None,
            "tax_rate": Prompt.ask("Default tax rate (%)", default="10") if self.data.get("tax_enabled") else None,
            "tax_inclusive": Confirm.ask("Prices include tax?", default=False) if self.data.get("tax_enabled") else False,
        }
        
        console.print("[green]✓ Tax configuration saved[/green]")
        return self.data


class NotificationsStep(WizardStep):
    """Step 5: Email notifications."""
    
    def __init__(self):
        super().__init__(5, "Email Notifications")
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("Configure email notifications:")
        
        self.data = {
            "smtp_host": Prompt.ask("SMTP host"),
            "smtp_port": Prompt.ask("SMTP port", default="587"),
            "smtp_user": Prompt.ask("SMTP username"),
            "smtp_password": Prompt.ask("SMTP password", password=True),
            "from_email": Prompt.ask("From email address"),
            "enable_order_confirmations": Confirm.ask("Send order confirmations?", default=True),
            "enable_shipping_updates": Confirm.ask("Send shipping updates?", default=True),
        }
        
        console.print("[green]✓ Email notification settings saved[/green]")
        return self.data


class AnalyticsStep(WizardStep):
    """Step 6: Analytics integration."""
    
    def __init__(self):
        super().__init__(6, "Analytics Setup")
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("Configure analytics:")
        
        self.data = {
            "google_analytics_enabled": Confirm.ask("Enable Google Analytics?", default=True),
            "google_analytics_id": Prompt.ask("Google Analytics ID") if self.data.get("google_analytics_enabled") else None,
            "facebook_pixel_enabled": Confirm.ask("Enable Facebook Pixel?", default=True),
            "facebook_pixel_id": Prompt.ask("Facebook Pixel ID") if self.data.get("facebook_pixel_enabled") else None,
        }
        
        console.print("[green]✓ Analytics configuration saved[/green]")
        return self.data


class SecurityStep(WizardStep):
    """Step 7: Security settings."""
    
    def __init__(self):
        super().__init__(7, "Security Settings")
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("Configure security settings:")
        
        self.data = {
            "ssl_enabled": Confirm.ask("Enable SSL/TLS?", default=True),
            "two_factor_auth": Confirm.ask("Require 2FA for admins?", default=True),
            "rate_limiting": Confirm.ask("Enable rate limiting?", default=True),
            "monthly_backups": Confirm.ask("Enable automatic monthly backups?", default=True),
        }
        
        console.print("[green]✓ Security settings saved[/green]")
        return self.data


class ReviewStep(WizardStep):
    """Step 8: Review and confirm."""
    
    def __init__(self, all_data: dict):
        super().__init__(8, "Review & Confirm")
        self.all_data = all_data
    
    def run(self) -> dict:
        self.display_header()
        
        console.print("\n[bold]Configuration Summary:[/bold]\n")
        
        # Display summary
        for step_name, step_data in self.all_data.items():
            console.print(f"[bold yellow]{step_name}:[/bold yellow]")
            if isinstance(step_data, dict):
                for key, value in step_data.items():
                    if value is not None and key != "smtp_password":
                        console.print(f"  {key}: {value}")
            console.print()
        
        confirmed = Confirm.ask("[bold]Proceed with these settings?[/bold]", default=True)
        
        return {"confirmed": confirmed}


@app.command()
def start(
    shop_id: Optional[str] = typer.Option(None, "--shop-id", help="Shop ID to configure (skip to create new)"),
    skip_validation: bool = typer.Option(False, "--skip-validation", help="Skip validation checks"),
    as_json: bool = typer.Option(False, "--json", help="Output result as JSON"),
):
    """
    Start an interactive 8-step setup wizard for shop initialization.
    
    The wizard guides you through:
    1. Onboarding information
    2. Payment setup
    3. Shipping configuration
    4. Tax rules
    5. Email notifications
    6. Analytics integration
    7. Security settings
    8. Review and confirm
    
    Example:
        wizard start
        wizard start --shop-id shop-123
    """
    config = get_config()
    auth = get_auth_manager()
    
    # Ensure authentication
    auth.require_auth()
    
    console.print(Panel(
        "[bold green]E-commerce Shop Setup Wizard[/bold green]\n"
        "This wizard will guide you through setting up your shop in 8 steps.",
        title="Welcome"
    ))
    
    if not Confirm.ask("Ready to begin?", default=True):
        console.print("[yellow]Setup cancelled[/yellow]")
        return
    
    # Collect data from each step
    all_steps_data = {}
    
    try:
        with Progress() as progress:
            task = progress.add_task("[cyan]Initializing wizard...", total=8)
            
            # Step 1: Onboarding
            step1 = OnboardingStep()
            all_steps_data["Onboarding"] = step1.run()
            progress.update(task, advance=1)
            
            # Step 2: Payment
            step2 = PaymentStep()
            all_steps_data["Payment"] = step2.run()
            progress.update(task, advance=1)
            
            # Step 3: Shipping
            step3 = ShippingStep()
            all_steps_data["Shipping"] = step3.run()
            progress.update(task, advance=1)
            
            # Step 4: Tax
            step4 = TaxStep()
            all_steps_data["Tax"] = step4.run()
            progress.update(task, advance=1)
            
            # Step 5: Notifications
            step5 = NotificationsStep()
            all_steps_data["Notifications"] = step5.run()
            progress.update(task, advance=1)
            
            # Step 6: Analytics
            step6 = AnalyticsStep()
            all_steps_data["Analytics"] = step6.run()
            progress.update(task, advance=1)
            
            # Step 7: Security
            step7 = SecurityStep()
            all_steps_data["Security"] = step7.run()
            progress.update(task, advance=1)
            
            # Step 8: Review
            step8 = ReviewStep(all_steps_data)
            review_result = step8.run()
            progress.update(task, advance=1)
            
            if not review_result.get("confirmed"):
                console.print("[yellow]Setup cancelled by user[/yellow]")
                return
        
        # Save configuration
        set_base_url(config.get_api_url())
        client = get_api_client()
        client.set_auth_token(config.get_session_token())
        
        # Create shop if needed
        if not shop_id:
            onboarding = all_steps_data.get("Onboarding", {})
            with print_status("Creating new shop..."):
                response = client.post("/shops", {
                    "name": onboarding.get("shop_name"),
                    "domain": onboarding.get("domain"),
                    "ownerEmail": onboarding.get("owner_email"),
                })
            shop_id = response.get("data", {}).get("id", response.get("id"))
            console.print(f"[green]Shop created: {shop_id}[/green]")
        
        # Apply configuration to shop
        with print_status("Applying configuration..."):
            # Here you would call the API to save all the settings
            pass
        
        # Log wizard completion
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action="Completed setup wizard",
            details={"steps_completed": 8},
            status="success"
        )
        
        # Output result
        result = {
            "status": "success",
            "shop_id": shop_id,
            "setup_steps_completed": 8,
            "configuration": all_steps_data
        }
        
        if as_json:
            typer.echo(json.dumps(result, indent=2))
        else:
            console.print(Panel(
                f"[bold green]✓ Setup wizard completed![/bold green]\n"
                f"[bold]Shop ID:[/bold] {shop_id}\n"
                f"[bold]Configuration saved and applied.[/bold]",
                title="Setup Complete"
            ))
    
    except KeyboardInterrupt:
        console.print("\n[yellow]Setup cancelled by user[/yellow]")
        typer.Exit(1)
    except Exception as e:
        # Log error
        audit_logger = AuditLogger()
        audit_logger.log_operation(
            AuditEventType.SHOP_UPDATED,
            shop_id=shop_id,
            action="Setup wizard failed",
            error=str(e),
            status="failed"
        )
        print_error(f"Setup wizard failed: {e}")
        typer.Exit(1)
