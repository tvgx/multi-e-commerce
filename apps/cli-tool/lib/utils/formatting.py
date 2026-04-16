"""
Output formatting utilities for CLI.
Provides consistent table, JSON, and status formatting across commands.
"""

import json
from typing import List, Dict, Any
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

console = Console()


def print_table(
    title: str,
    data: List[Dict[str, Any]],
    columns: List[str] = None,
    as_json: bool = False
) -> None:
    """
    Pretty-print data as a table or JSON.
    
    Args:
        title: Table title
        data: List of dictionaries to display
        columns: Specific columns to show (if None, use all keys from first row)
        as_json: If True, output as JSON instead of table
    """
    if not data:
        console.print(f"[yellow]No data to display[/yellow]")
        return
    
    if as_json:
        console.print(json.dumps(data, indent=2, default=str))
        return
    
    # Determine columns
    if columns is None:
        columns = list(data[0].keys())
    
    # Create table
    table = Table(title=title, box=box.ROUNDED)
    for col in columns:
        table.add_column(col, style="cyan")
    
    # Add rows
    for row in data:
        table.add_row(*[str(row.get(col, "")) for col in columns])
    
    console.print(table)


def print_details(
    title: str,
    data: Dict[str, Any],
    as_json: bool = False
) -> None:
    """
    Pretty-print detailed object information.
    
    Args:
        title: Panel title
        data: Dictionary to display
        as_json: If True, output as JSON
    """
    if as_json:
        console.print(json.dumps(data, indent=2, default=str))
        return
    
    # Format key-value pairs
    formatted = "\n".join([f"[bold]{k}:[/bold] {v}" for k, v in data.items()])
    console.print(Panel(formatted, title=title))


def print_success(message: str) -> None:
    """Print success message."""
    console.print(f"[green]✔ {message}[/green]")


def print_error(message: str) -> None:
    """Print error message."""
    console.print(f"[red]✗ {message}[/red]")


def print_warning(message: str) -> None:
    """Print warning message."""
    console.print(f"[yellow]⚠ {message}[/yellow]")


def print_info(message: str) -> None:
    """Print info message."""
    console.print(f"[blue]ℹ {message}[/blue]")


def print_status(message: str):
    """Context manager for status output."""
    return console.status(f"[yellow]{message}[/yellow]")


def json_output(data: Any, pretty: bool = True) -> str:
    """Convert data to JSON string."""
    if pretty:
        return json.dumps(data, indent=2, default=str)
    return json.dumps(data, default=str)
