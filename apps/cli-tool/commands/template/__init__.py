"""
Template command module.
Aggregates all template-related subcommands.
"""

import typer
from . import list, create, apply

# Create main template app
app = typer.Typer(help="Manage shop templates")

# Add subcommands
app.add_typer(list.app, name="list")
app.add_typer(create.app, name="create")
app.add_typer(apply.app, name="apply")
