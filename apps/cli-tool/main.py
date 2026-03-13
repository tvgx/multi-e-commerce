import typer
from commands.shop_cmd import app as shop_app
from rich.console import Console

app = typer.Typer(
    name="ecommerce-cli",
    help="CLI Tool for Auto-Provisioning E-Commerce Zero-File System"
)

# Add sub-commands
app.add_typer(shop_app, name="shop", help="Manage individual shops/tenants")

console = Console()

@app.command()
def health():
    """
    Quick status ping.
    """
    console.print("[green]System CLI is active and ready to provision resources.[/green]")

if __name__ == "__main__":
    app()
