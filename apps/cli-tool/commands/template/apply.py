"""
Apply/switch template command (placeholder for Phase 2).
"""

import typer
from lib.utils.formatting import print_info

app = typer.Typer(help="Apply templates to shops")


@app.command()
def apply(
    shop_id: str = typer.Argument(..., help="Shop ID"),
    template: str = typer.Option(..., "--template", "-t", help="Template name"),
):
    """
    Apply/switch a template on an existing shop.
    
    [Phase 2 Feature]
    
    Example:
        template apply <shop-id> --template fashion
    """
    print_info("Template switching planned for Phase 2 (Data Integrity)")
    typer.Exit(0)
