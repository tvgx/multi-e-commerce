"""
Domain command module.
Aggregates all domain-related subcommands.
"""

import typer
from . import set, verify, dns_config

# Create main domain app
app = typer.Typer(help="Manage shop domains")

# Add subcommands
app.add_typer(set.app, name="set")
app.add_typer(verify.app, name="verify")
app.add_typer(dns_config.app, name="dns-config")
