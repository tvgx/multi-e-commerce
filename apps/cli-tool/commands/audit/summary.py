"""
Audit summary command.
Shows statistics and summary of audit logs.
"""

import typer
import json
from collections import defaultdict
from lib.audit.audit_logger import AuditLogger
from config import get_config
from lib.utils.formatting import print_table, print_success, print_details, print_info

app = typer.Typer(help="Audit statistics")


@app.command()
def summary(
    shop_id: str = typer.Option(None, "--shop", "-s", help="Shop ID (global if not specified)"),
    as_json: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """
    Show audit log summary and statistics.
    
    Displays:
    - Event type distribution
    - Success vs failed operations
    - Most recent events
    - User activity summary
    
    Example:
        audit summary
        audit summary --shop <shop-id>
        audit summary --json
    """
    config = get_config()
    logger = AuditLogger(config.audit_log)
    
    # Get audit events
    if shop_id:
        events = logger.get_shop_audit_log(shop_id)
    else:
        events = logger.get_global_audit_log(limit=1000)
    
    if not events:
        print_info("No audit events found")
        return
    
    # Calculate statistics
    stats = {
        "total_events": len(events),
        "event_types": defaultdict(int),
        "status_distribution": defaultdict(int),
        "users": set(),
        "shops": set(),
        "success_rate": 0
    }
    
    for event in events:
        stats["event_types"][event.get("event_type", "unknown")] += 1
        stats["status_distribution"][event.get("status", "unknown")] += 1
        if event.get("user_id"):
            stats["users"].add(event["user_id"])
        if event.get("shop_id"):
            stats["shops"].add(event["shop_id"])
    
    # Calculate success rate
    success_count = stats["status_distribution"].get("success", 0)
    if stats["total_events"] > 0:
        stats["success_rate"] = (success_count / stats["total_events"]) * 100
    
    if as_json:
        output = {
            "total_events": stats["total_events"],
            "event_types": dict(stats["event_types"]),
            "status_distribution": dict(stats["status_distribution"]),
            "unique_users": len(stats["users"]),
            "unique_shops": len(stats["shops"]),
            "success_rate_percent": round(stats["success_rate"], 1)
        }
        typer.echo(json.dumps(output, indent=2))
    else:
        # Format for display
        event_type_data = [
            {"event_type": k, "count": v}
            for k, v in sorted(stats["event_types"].items(), key=lambda x: x[1], reverse=True)
        ]
        
        print_table("Event Type Distribution", event_type_data)
        
        summary_data = {
            "Total Events": stats["total_events"],
            "Success Rate": f"{stats['success_rate']:.1f}%",
            "Successful": stats["status_distribution"].get("success", 0),
            "Failed": stats["status_distribution"].get("failed", 0),
            "Unique Users": len(stats["users"]),
            "Unique Shops": len(stats["shops"])
        }
        
        print_details("Audit Summary", summary_data)
        print_success("Summary complete")
