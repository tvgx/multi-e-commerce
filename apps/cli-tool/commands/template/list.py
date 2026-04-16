"""
List templates command.
Lists available templates.
"""

import typer
import json
import os
from pathlib import Path
from lib.utils.formatting import print_table, print_success, print_error

app = typer.Typer(help="List templates")


@app.command()
def list(
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    List available templates.
    
    Example:
        template list
        template list --json
    """
    try:
        # Get templates directory
        templates_dir = Path(__file__).parent.parent.parent / "templates"
        
        templates = []
        if templates_dir.exists():
            for template_file in templates_dir.glob("*.json"):
                template_name = template_file.stem
                templates.append({
                    "name": template_name,
                    "file": template_file.name,
                    "path": str(template_file)
                })
        
        if not templates:
            print_error("No templates found in templates directory")
            typer.Exit(1)
        
        if as_json:
            typer.echo(json.dumps(templates, indent=2))
        else:
            print_table("Available Templates", templates, columns=["name", "file"])
        
        print_success(f"Found {len(templates)} template(s)")
    
    except Exception as e:
        print_error(f"Failed to list templates: {e}")
        typer.Exit(1)
