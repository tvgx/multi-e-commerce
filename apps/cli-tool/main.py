import typer
from commands.shop import app as shop_app
from commands.template import app as template_app
from commands.domain import app as domain_app
from commands.backup import app as backup_app
from commands.audit import app as audit_app
from commands.wizard import app as wizard_app
from commands.batch import app as batch_app
from commands.health import app as health_app
from commands.sync import app as sync_app
from rich.console import Console
from config import get_config

app = typer.Typer(
    name="ecommerce-cli",
    help="CLI Tool for Auto-Provisioning E-Commerce Zero-File System"
)

# Core commands
app.add_typer(shop_app, name="shop", help="Manage individual shops/tenants")
app.add_typer(template_app, name="template", help="Manage shop templates")
app.add_typer(domain_app, name="domain", help="Manage shop domains")

# Data protection
app.add_typer(backup_app, name="backup", help="Manage shop backups")
app.add_typer(audit_app, name="audit", help="View audit logs and operations")

# Automation workflows (Phase 3)
app.add_typer(wizard_app, name="wizard", help="Interactive setup wizard for new shops")
app.add_typer(batch_app, name="batch", help="Batch operations (create/update multiple shops)")
app.add_typer(health_app, name="health", help="Health checks and diagnostics")
app.add_typer(sync_app, name="sync", help="Synchronize configuration across environments")

console = Console()

@app.command()
def health():
    """
    Quick status ping.
    """
    console.print("[green]System CLI is active and ready to provision resources.[/green]")


@app.command()
def config(
    env: str = typer.Option(None, "--set-env", help="Set current environment (dev/acceptance/staging/prod)"),
    show: bool = typer.Option(False, "--show", help="Show current configuration"),
):
    """
    Manage CLI configuration.
    """
    config_manager = get_config()
    
    if env:
        try:
            config_manager.set_environment(env)
            console.print(f"[green]Environment set to: {env}[/green]")
            console.print(f"API URL: {config_manager.get_api_url()}")
        except ValueError as e:
            console.print(f"[red]Error: {e}[/red]")
            typer.Exit(1)
    
    if show:
        from lib.utils.formatting import print_details
        config_data = {
            "Environment": config_manager.get_environment(),
            "API URL": config_manager.get_api_url(),
            "Config File": str(config_manager.config_file),
            "Backups Directory": str(config_manager.backup_dir),
            "Audit Log": str(config_manager.audit_log),
        }
        print_details("CLI Configuration", config_data)


if __name__ == "__main__":
    app()
