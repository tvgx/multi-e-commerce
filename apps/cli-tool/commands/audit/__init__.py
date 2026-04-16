"""
Audit command module.
Aggregates all audit-related subcommands.
"""

import typer
from . import view, summary

# Create main audit app
app = typer.Typer(help="Manage audit logs")

# Add subcommands
app.add_typer(view.app, name="view")
app.add_typer(summary.app, name="summary")
