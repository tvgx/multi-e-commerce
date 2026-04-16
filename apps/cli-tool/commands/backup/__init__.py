"""
Backup command module.
Aggregates all backup-related subcommands.
"""

import typer
from . import create, list, restore, delete, rollback

# Create main backup app
app = typer.Typer(help="Manage shop backups")

# Add subcommands
app.add_typer(create.app, name="create")
app.add_typer(list.app, name="list")
app.add_typer(restore.app, name="restore")
app.add_typer(delete.app, name="delete")
app.add_typer(rollback.app, name="rollback")
