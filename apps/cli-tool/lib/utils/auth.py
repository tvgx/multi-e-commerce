"""
Authentication utilities for CLI.
Handles user authentication, token management, and permission checking.
"""

from typing import Optional, Dict, Any
import typer
from config import get_config
from lib.utils.formatting import print_error, print_success


class AuthManager:
    """Manages CLI user authentication and authorization."""
    
    def __init__(self):
        self.config = get_config()
    
    def get_auth_header(self) -> Dict[str, str]:
        """
        Get authorization header for API requests.
        
        Returns:
            Dictionary with Authorization header, or empty dict if not authenticated
        """
        token = self.config.get_session_token()
        if not token:
            return {}
        return {"Authorization": f"Bearer {token}"}
    
    def get_tenant_headers(self, shop_id: str = None) -> Dict[str, str]:
        """
        Get multi-tenancy headers for API requests.
        
        Args:
            shop_id: Optional shop ID to scope request to specific tenant
            
        Returns:
            Dictionary with tenant headers
        """
        headers = {}
        if shop_id:
            headers['x-shop-id'] = shop_id
            headers['x-tenant-id'] = shop_id
        return headers
    
    def is_authenticated(self) -> bool:
        """Check if user has valid authentication token."""
        return self.config.get_session_token() is not None
    
    def require_auth(self) -> None:
        """
        Ensure user is authenticated.
        Exits with error if not authenticated.
        """
        if not self.is_authenticated():
            print_error("Authentication required. Please login first.")
            typer.Exit(1)
    
    def verify_role(self, required_role: Optional[str] = None) -> bool:
        """
        Verify user has required role.
        
        Args:
            required_role: Required role (ADMIN, OWNER, DEVELOPER)
            
        Returns:
            True if authorized, False otherwise
        """
        # This would be implemented by checking user info from API
        # For now, just check if authenticated
        if not self.is_authenticated():
            return False
        
        # TODO: Call API to get user role and verify
        return True


def get_auth_manager() -> AuthManager:
    """Get authentication manager instance."""
    return AuthManager()
