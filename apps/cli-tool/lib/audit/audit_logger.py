"""
Audit logging system for CLI operations.
Maintains immutable audit trail of all shop-related operations and sensitive API actions.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from enum import Enum


class AuditEventType(Enum):
    """Types of audit events."""
    # Shop operations
    SHOP_CREATED = "shop.created"
    SHOP_UPDATED = "shop.updated"
    SHOP_DELETED = "shop.deleted"
    SHOP_EJECTED = "shop.ejected"
    
    # Template operations
    TEMPLATE_CREATED = "template.created"
    TEMPLATE_DELETED = "template.deleted"
    TEMPLATE_APPLIED = "template.applied"
    
    # Domain operations
    DOMAIN_SET = "domain.set"
    DOMAIN_VERIFIED = "domain.verified"
    
    # Backup operations
    BACKUP_CREATED = "backup.created"
    BACKUP_RESTORED = "backup.restored"
    BACKUP_DELETED = "backup.deleted"
    
    # Sensitive operations
    AUTH_LOGIN = "auth.login"
    AUTH_LOGOUT = "auth.logout"
    PERMISSION_GRANTED = "permission.granted"
    PERMISSION_REVOKED = "permission.revoked"
    CONFIG_CHANGED = "config.changed"


class AuditEvent:
    """Represents a single audit event."""
    
    def __init__(
        self,
        event_type: AuditEventType,
        shop_id: Optional[str] = None,
        user_id: Optional[str] = None,
        action: str = "",
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        result: Optional[str] = None,
        error: Optional[str] = None
    ):
        """
        Create an audit event.
        
        Args:
            event_type: Type of event
            shop_id: Associated shop ID
            user_id: User who performed action
            action: Description of action
            details: Additional details
            status: "success", "failed", "started"
            result: Result of operation
            error: Error message if failed
        """
        self.timestamp = datetime.utcnow()
        self.event_type = event_type
        self.shop_id = shop_id
        self.user_id = user_id
        self.action = action
        self.details = details or {}
        self.status = status
        self.result = result
        self.error = error
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "shop_id": self.shop_id,
            "user_id": self.user_id,
            "action": self.action,
            "details": self.details,
            "status": self.status,
            "result": self.result,
            "error": self.error
        }
    
    def to_log_line(self) -> str:
        """Convert to single-line log format."""
        return json.dumps(self.to_dict())


class AuditLogger:
    """
    Maintains immutable audit trail.
    
    Logs to:
    1. ~/.ecommerce-cli/audit.log (append-only, line-delimited JSON)
    2. Per-shop audit files for easy retrieval
    """
    
    def __init__(self, audit_log_path: Path):
        """
        Initialize audit logger.
        
        Args:
            audit_log_path: Path to main audit log file
        """
        self.audit_log_path = audit_log_path
        self.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
    
    def log(self, event: AuditEvent) -> None:
        """
        Log an audit event.
        
        Appends to both global and shop-specific audit logs.
        
        Args:
            event: Audit event to log
        """
        log_line = event.to_log_line()
        
        # Append to global audit log (append-only)
        with open(self.audit_log_path, 'a') as f:
            f.write(log_line + '\n')
        
        # Also write to shop-specific log if shop_id exists
        if event.shop_id:
            shop_audit_file = self.audit_log_path.parent / f"shop_{event.shop_id}.audit"
            with open(shop_audit_file, 'a') as f:
                f.write(log_line + '\n')
    
    def log_operation(
        self,
        event_type: AuditEventType,
        shop_id: Optional[str] = None,
        user_id: Optional[str] = None,
        action: str = "",
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        result: Optional[str] = None,
        error: Optional[str] = None
    ) -> None:
        """
        Log an operation (convenience method).
        
        Args:
            event_type: Type of event
            shop_id: Associated shop ID
            user_id: User who performed action
            action: Description of action
            details: Additional details
            status: "success", "failed", "started"
            result: Result of operation
            error: Error message if failed
        """
        event = AuditEvent(
            event_type=event_type,
            shop_id=shop_id,
            user_id=user_id,
            action=action,
            details=details,
            status=status,
            result=result,
            error=error
        )
        self.log(event)
    
    def get_shop_audit_log(self, shop_id: str) -> List[Dict[str, Any]]:
        """
        Get all audit events for a shop.
        
        Args:
            shop_id: Shop ID
            
        Returns:
            List of audit event dictionaries
        """
        shop_audit_file = self.audit_log_path.parent / f"shop_{shop_id}.audit"
        
        if not shop_audit_file.exists():
            return []
        
        events = []
        try:
            with open(shop_audit_file, 'r') as f:
                for line in f:
                    if line.strip():
                        try:
                            event = json.loads(line)
                            events.append(event)
                        except json.JSONDecodeError:
                            pass
        except Exception:
            pass
        
        return events
    
    def get_global_audit_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get recent global audit events.
        
        Args:
            limit: Number of recent events to return
            
        Returns:
            List of audit event dictionaries (most recent first)
        """
        if not self.audit_log_path.exists():
            return []
        
        events = []
        try:
            with open(self.audit_log_path, 'r') as f:
                for line in f:
                    if line.strip():
                        try:
                            event = json.loads(line)
                            events.append(event)
                        except json.JSONDecodeError:
                            pass
        except Exception:
            pass
        
        # Return most recent events first
        return list(reversed(events[-limit:]))
    
    def get_user_audit_log(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get audit events for a specific user.
        
        Args:
            user_id: User ID
            limit: Number of events to return
            
        Returns:
            List of audit event dictionaries
        """
        events = []
        
        if not self.audit_log_path.exists():
            return []
        
        try:
            with open(self.audit_log_path, 'r') as f:
                for line in f:
                    if line.strip():
                        try:
                            event = json.loads(line)
                            if event.get('user_id') == user_id:
                                events.append(event)
                        except json.JSONDecodeError:
                            pass
        except Exception:
            pass
        
        return list(reversed(events[-limit:]))
    
    def filter_events(
        self,
        event_type: Optional[AuditEventType] = None,
        shop_id: Optional[str] = None,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Filter audit events.
        
        Args:
            event_type: Filter by event type
            shop_id: Filter by shop ID
            user_id: Filter by user ID
            status: Filter by status
            limit: Number of results to return
            
        Returns:
            List of matching audit events
        """
        events = self.get_global_audit_log(limit * 2)  # Get more to filter
        
        filtered = []
        for event in events:
            if event_type and event.get('event_type') != event_type.value:
                continue
            if shop_id and event.get('shop_id') != shop_id:
                continue
            if user_id and event.get('user_id') != user_id:
                continue
            if status and event.get('status') != status:
                continue
            filtered.append(event)
        
        return filtered[:limit]


def get_audit_logger(audit_log_path: Path) -> AuditLogger:
    """Get audit logger instance."""
    return AuditLogger(audit_log_path)
