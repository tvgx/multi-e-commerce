"""
View audit log command.
Shows audit trail for a shop or globally.
"""

import typer
import json
from lib.audit.audit_logger import AuditLogger
from config import get_config
from lib.utils.formatting import print_table, print_success, print_info

app = typer.Typer(help="View audit logs")


@app.command()
def view(
    shop_id: str = typer.Option(None, "--shop", "-s", help="Shop ID (shows global if not specified)"),
    event_type: str = typer.Option(None, "--event", "-e", help="Filter by event type"),
    user_id: str = typer.Option(None, "--user", "-u", help="Filter by user ID"),
    status: str = typer.Option(None, "--status", help="Filter by status (success/failed)"),
    limit: int = typer.Option(50, "--limit", help="Number of events to show"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    View audit logs for a shop or globally.
    
    Shows operations and sensitive API actions with timestamps and user info.
    
    Example:
        audit view --shop <shop-id>
        audit view --shop <shop-id> --event shop.created
        audit view --user <user-id> --status failed
        audit view  # Shows global recent events
    """
    config = get_config()
    logger = AuditLogger(config.audit_log)
    
    # Get audit events
    if shop_id:
        events = logger.get_shop_audit_log(shop_id)
    elif user_id:
        events = logger.get_user_audit_log(user_id, limit=limit * 2)
    else:
        events = logger.get_global_audit_log(limit=limit * 2)
    
    # Filter events
    filtered = []
    for event in events:
        if event_type and event.get('event_type') != event_type:
            continue
        if user_id and event.get('user_id') != user_id:
            continue
        if status and event.get('status') != status:
            continue
        filtered.append(event)
    
    # Limit results
    filtered = filtered[:limit]
    
    if not filtered:
        print_info("No audit events found matching criteria")
        return
    
    if as_json:
        typer.echo(json.dumps(filtered, indent=2, default=str))
    else:
        # Format for table display
        table_data = []
        for event in filtered:
            table_data.append({
                "timestamp": event.get("timestamp", "")[:19],  # Truncate to date time
                "event": event.get("event_type", ""),
                "shop_id": event.get("shop_id") or "-",
                "user_id": event.get("user_id") or "-",
                "status": event.get("status", ""),
                "action": event.get("action", "")[:40]  # Truncate action
            })
        
        title = f"Audit Log - Shop: {shop_id}" if shop_id else "Global Audit Log"
        print_table(title, table_data)
        print_success(f"Showing {len(filtered)} event(s)")
