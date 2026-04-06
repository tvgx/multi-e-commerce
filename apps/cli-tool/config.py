"""
Configuration management for CLI tool.
Handles environment-specific configs, API endpoints, and user sessions.
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict, Any

class CLIConfig:
    """
    Manages CLI configuration for different environments.
    Loads from environment variables, config files, and user session storage.
    """
    
    # Default API endpoints for each environment
    ENDPOINTS = {
        "dev": "http://localhost:3000/api",
        "acceptance": "https://api-acceptance.example.com/api",
        "staging": "https://api-staging.example.com/api",
        "prod": "https://api.example.com/api"
    }
    
    def __init__(self):
        self.cli_home = Path.home() / ".ecommerce-cli"
        self.config_file = self.cli_home / "config.json"
        self.session_file = self.cli_home / "session.json"
        self.backup_dir = self.cli_home / "backups"
        self.audit_log = self.cli_home / "audit.log"
        
        # Create config directories if not exist
        self.cli_home.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file or environment."""
        config = {}
        
        # Load from config file if exists
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load config file: {e}")
        
        # Override with environment variables
        config['environment'] = os.getenv('CLI_ENV', config.get('environment', 'dev'))
        config['api_url'] = os.getenv('API_URL', config.get('api_url', self.ENDPOINTS[config['environment']]))
        config['api_key'] = os.getenv('API_KEY', config.get('api_key'))
        
        return config
    
    def save_config(self):
        """Save current configuration to file."""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get_api_url(self) -> str:
        """Get API base URL for current environment."""
        return self.config.get('api_url', self.ENDPOINTS.get(self.get_environment(), ''))
    
    def get_environment(self) -> str:
        """Get current environment (dev/acceptance/staging/prod)."""
        return self.config.get('environment', 'dev')
    
    def set_environment(self, env: str):
        """Set current environment."""
        if env not in self.ENDPOINTS:
            raise ValueError(f"Invalid environment: {env}. Must be one of: {list(self.ENDPOINTS.keys())}")
        self.config['environment'] = env
        self.config['api_url'] = self.ENDPOINTS[env]
        self.save_config()
    
    def get_session_token(self) -> Optional[str]:
        """Get stored session token."""
        session = self._load_session()
        return session.get('token')
    
    def save_session_token(self, token: str, user_id: str = None):
        """Save session token."""
        session = {'token': token, 'user_id': user_id}
        with open(self.session_file, 'w') as f:
            json.dump(session, f)
    
    def clear_session(self):
        """Clear stored session token."""
        if self.session_file.exists():
            self.session_file.unlink()
    
    def _load_session(self) -> Dict[str, Any]:
        """Load session from file."""
        if self.session_file.exists():
            try:
                with open(self.session_file, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}


# Global config instance
_config: Optional[CLIConfig] = None


def get_config() -> CLIConfig:
    """Get or create global config instance."""
    global _config
    if _config is None:
        _config = CLIConfig()
    return _config
