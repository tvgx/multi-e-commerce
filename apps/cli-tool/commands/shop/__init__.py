"""
Shop command module.
Aggregates all shop-related subcommands.
"""

import typer
from . import create, list_, get, update, delete, eject

# Create main shop app
app = typer.Typer(help="Manage E-commerce shops")

# Add subcommands
app.add_typer(create.app, name="create")
app.add_typer(list_.app, name="list")
app.add_typer(get.app, name="get")
app.add_typer(update.app, name="update")
app.add_typer(delete.app, name="delete")
app.add_typer(eject.app, name="eject")
