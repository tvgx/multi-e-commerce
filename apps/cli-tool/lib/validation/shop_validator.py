"""
Shop validation utilities.
Validates shop data before operations (names, domains, emails, etc.).
"""

import re
from typing import Tuple, Optional


class ShopValidator:
    """Validate shop-related data."""
    
    @staticmethod
    def validate_shop_name(name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate shop name.
        
        Args:
            name: Shop name
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not name or len(name.strip()) == 0:
            return False, "Shop name cannot be empty"
        
        if len(name) < 2:
            return False, "Shop name must be at least 2 characters"
        
        if len(name) > 100:
            return False, "Shop name must not exceed 100 characters"
        
        # Allow letters, numbers, spaces, and hyphens/underscores
        if not re.match(r"^[a-zA-Z0-9\s\-_]+$", name):
            return False, "Shop name can only contain letters, numbers, spaces, hyphens, and underscores"
        
        return True, None
    
    @staticmethod
    def validate_domain(domain: str) -> Tuple[bool, Optional[str]]:
        """
        Validate custom domain format.
        
        Args:
            domain: Domain name
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not domain or len(domain.strip()) == 0:
            return False, "Domain cannot be empty"
        
        # Simple domain validation (RFC 1123 style)
        domain_pattern = r'^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,}$'
        
        if not re.match(domain_pattern, domain.lower()):
            return False, f"Invalid domain format: {domain}"
        
        if len(domain) > 255:
            return False, "Domain must not exceed 255 characters"
        
        return True, None
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, Optional[str]]:
        """
        Validate email address format.
        
        Args:
            email: Email address
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not email or len(email.strip()) == 0:
            return False, "Email cannot be empty"
        
        # Standard email pattern
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            return False, f"Invalid email format: {email}"
        
        if len(email) > 254:
            return False, "Email must not exceed 254 characters"
        
        return True, None
    
    @staticmethod
    def validate_template_type(template_type: str) -> Tuple[bool, Optional[str]]:
        """
        Validate template type.
        
        Args:
            template_type: Template type name
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        valid_templates = ['fashion', 'electronics', 'health', 'standard']
        
        if not template_type or len(template_type.strip()) == 0:
            return False, "Template type cannot be empty"
        
        if template_type.lower() not in valid_templates:
            return False, f"Invalid template type: {template_type}. Must be one of: {', '.join(valid_templates)}"
        
        return True, None
    
    @staticmethod
    def validate_products_per_page(count: int) -> Tuple[bool, Optional[str]]:
        """
        Validate products per page count.
        
        Args:
            count: Products per page
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not isinstance(count, int):
            return False, "Products per page must be an integer"
        
        if count < 1:
            return False, "Products per page must be at least 1"
        
        if count > 1000:
            return False, "Products per page must not exceed 1000"
        
        return True, None


def validate_shop_creation_data(
    name: str,
    domain: str,
    owner_email: str,
    template: str = "fashion"
) -> Tuple[bool, Optional[str]]:
    """
    Validate all shop creation data.
    
    Args:
        name: Shop name
        domain: Custom domain
        owner_email: Owner email
        template: Template type
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    validator = ShopValidator()
    
    # Validate each field
    is_valid, error = validator.validate_shop_name(name)
    if not is_valid:
        return False, f"Invalid shop name: {error}"
    
    is_valid, error = validator.validate_domain(domain)
    if not is_valid:
        return False, f"Invalid domain: {error}"
    
    is_valid, error = validator.validate_email(owner_email)
    if not is_valid:
        return False, f"Invalid owner email: {error}"
    
    is_valid, error = validator.validate_template_type(template)
    if not is_valid:
        return False, f"Invalid template: {error}"
    
    return True, None
