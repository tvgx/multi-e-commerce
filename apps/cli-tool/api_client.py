"""
Enhanced API client for E-Commerce CLI.
Handles authentication, multi-tenancy headers, error handling, and retry logic.
"""

import requests
from typing import Optional, Dict, Any, Tuple
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json


class ApiClientError(Exception):
    """Base exception for API client errors."""
    pass


class AuthenticationError(ApiClientError):
    """Raised when authentication fails."""
    pass


class NotFoundError(ApiClientError):
    """Raised when resource is not found."""
    pass


class ValidationError(ApiClientError):
    """Raised when validation fails."""
    pass


class ApiClient:
    """
    API client for E-Commerce platform.
    Handles authentication, multi-tenancy, retries, and error handling.
    """
    
    def __init__(self, base_url: str, timeout: int = 30):
        """
        Initialize API client.
        
        Args:
            base_url: Base URL for API (e.g., http://localhost:3000/api)
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.session = self._create_session()
    
    def _create_session(self) -> requests.Session:
        """Create requests session with retry strategy."""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def set_auth_token(self, token: str, user_id: str = None) -> None:
        """
        Set authentication token for subsequent requests.
        
        Args:
            token: JWT token
            user_id: Optional user ID
        """
        self.token = token
        self.user_id = user_id
    
    def _get_headers(self, shop_id: Optional[str] = None) -> Dict[str, str]:
        """
        Get headers for API requests.
        
        Args:
            shop_id: Optional shop ID for tenant routing
            
        Returns:
            Dictionary of request headers
        """
        headers = {"Content-Type": "application/json"}
        
        # Add authorization if token exists
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        # Add multi-tenancy headers if shop_id provided
        if shop_id:
            headers["x-shop-id"] = shop_id
            headers["x-tenant-id"] = shop_id
        
        return headers
    
    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """
        Handle API response and raise appropriate errors.
        
        Args:
            response: Response object
            
        Returns:
            Parsed JSON response
            
        Raises:
            AuthenticationError: If unauthorized
            NotFoundError: If resource not found
            ValidationError: If validation fails
            ApiClientError: For other errors
        """
        try:
            data = response.json()
        except json.JSONDecodeError:
            data = {"message": response.text}
        
        if response.status_code == 401:
            raise AuthenticationError(f"Authentication failed: {data.get('message', 'Invalid credentials')}")
        
        elif response.status_code == 403:
            raise AuthenticationError(f"Access denied: {data.get('message', 'Insufficient permissions')}")
        
        elif response.status_code == 404:
            raise NotFoundError(f"Resource not found: {data.get('message', '')}")
        
        elif response.status_code == 400:
            raise ValidationError(f"Validation error: {data.get('message', '')}")
        
        elif response.status_code >= 500:
            raise ApiClientError(f"Server error ({response.status_code}): {data.get('message', '')}")
        
        elif not response.ok:
            raise ApiClientError(f"Request failed ({response.status_code}): {data.get('message', '')}")
        
        return data
    
    def get(self, endpoint: str, shop_id: Optional[str] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make GET request to API.
        
        Args:
            endpoint: API endpoint (e.g., /shops)
            shop_id: Optional shop ID for tenant routing
            params: Optional query parameters
            
        Returns:
            Response data
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(shop_id)
        
        response = self.session.get(url, headers=headers, params=params, timeout=self.timeout)
        return self._handle_response(response)
    
    def post(self, endpoint: str, data: Dict[str, Any], shop_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Make POST request to API.
        
        Args:
            endpoint: API endpoint
            data: Request body data
            shop_id: Optional shop ID for tenant routing
            
        Returns:
            Response data
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(shop_id)
        
        response = self.session.post(url, json=data, headers=headers, timeout=self.timeout)
        return self._handle_response(response)
    
    def put(self, endpoint: str, data: Dict[str, Any], shop_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Make PUT request to API.
        
        Args:
            endpoint: API endpoint
            data: Request body data
            shop_id: Optional shop ID for tenant routing
            
        Returns:
            Response data
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(shop_id)
        
        response = self.session.put(url, json=data, headers=headers, timeout=self.timeout)
        return self._handle_response(response)
    
    def delete(self, endpoint: str, shop_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Make DELETE request to API.
        
        Args:
            endpoint: API endpoint
            shop_id: Optional shop ID for tenant routing
            
        Returns:
            Response data
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(shop_id)
        
        response = self.session.delete(url, headers=headers, timeout=self.timeout)
        return self._handle_response(response)


# Global client instance
_client: Optional[ApiClient] = None


def get_api_client() -> ApiClient:
    """
    Get or create global API client instance.
    Must call set_base_url() first before using.
    """
    global _client
    if _client is None:
        raise RuntimeError("API client not initialized. Call set_base_url() first.")
    return _client


def set_base_url(url: str) -> ApiClient:
    """
    Initialize global API client with base URL.
    
    Args:
        url: Base URL for API
        
    Returns:
        Initialized API client
    """
    global _client
    _client = ApiClient(url)
    return _client
