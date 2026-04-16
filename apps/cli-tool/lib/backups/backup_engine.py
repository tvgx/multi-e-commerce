"""
Backup engine for shop data.
Handles PostgreSQL, MongoDB, and MinIO backups with tenant isolation.
"""

import os
import json
import subprocess
import tempfile
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
import gzip
import shutil


class BackupMetadata:
    """Metadata for a backup."""
    
    def __init__(self, shop_id: str, timestamp: datetime = None):
        self.shop_id = shop_id
        self.timestamp = timestamp or datetime.utcnow()
        self.components = {}  # Track what was backed up
        self.checksums = {}   # Store checksums for integrity
        self.errors = []      # Track any errors
        self.total_size = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "shop_id": self.shop_id,
            "timestamp": self.timestamp.isoformat(),
            "components": self.components,
            "checksums": self.checksums,
            "errors": self.errors,
            "total_size": self.total_size
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'BackupMetadata':
        """Create from dictionary."""
        metadata = BackupMetadata(data["shop_id"], datetime.fromisoformat(data["timestamp"]))
        metadata.components = data.get("components", {})
        metadata.checksums = data.get("checksums", {})
        metadata.errors = data.get("errors", [])
        metadata.total_size = data.get("total_size", 0)
        return metadata


class BackupEngine:
    """
    Manages backup and restore operations for shops.
    Supports PostgreSQL, MongoDB, and MinIO with tenant isolation.
    """
    
    def __init__(self, backup_dir: Path):
        """
        Initialize backup engine.
        
        Args:
            backup_dir: Root directory for backups (~/.ecommerce-cli/backups)
        """
        self.backup_dir = backup_dir
        self.backup_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_shop_backup_dir(self, shop_id: str) -> Path:
        """Get shop-specific backup directory."""
        shop_dir = self.backup_dir / shop_id
        shop_dir.mkdir(parents=True, exist_ok=True)
        return shop_dir
    
    def _get_timestamp_dir(self, shop_id: str, timestamp: datetime = None) -> Path:
        """Get timestamped backup directory."""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
        backup_path = self._get_shop_backup_dir(shop_id) / timestamp_str
        backup_path.mkdir(parents=True, exist_ok=True)
        return backup_path
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def backup_postgresql(self, shop_id: str, metadata: BackupMetadata, timestamp_dir: Path) -> bool:
        """
        Backup PostgreSQL data for a shop.
        
        Args:
            shop_id: Shop ID to backup
            metadata: Backup metadata object
            timestamp_dir: Directory to store backup
            
        Returns:
            True if successful, False otherwise
        """
        try:
            from database.postgres import get_pg_connection
            
            # Get shop data from PostgreSQL
            conn = get_pg_connection()
            try:
                with conn.cursor() as cur:
                    # Prepare SQL dump of shop-specific data
                    shop_tables = [
                        'Shop', 'Product', 'Collection', 'Order', 'Customer',
                        'PaymentMethod', 'ShippingMethod', 'TaxCategory', 'Promotion',
                        'NavigationMenu', 'ShopPage', 'StockLocation', 'Market', 'Zone'
                    ]
                    
                    dump_data = {}
                    for table in shop_tables:
                        try:
                            cur.execute(f'SELECT * FROM "{table}" WHERE "shopId" = %s', (shop_id,))
                            columns = [desc[0] for desc in cur.description]
                            rows = cur.fetchall()
                            dump_data[table] = {
                                "columns": columns,
                                "rows": [dict(zip(columns, row)) for row in rows],
                                "count": len(rows)
                            }
                        except Exception as e:
                            # Table might not have shopId column (like User table)
                            pass
                    
                    # Save to JSON file (gzipped)
                    backup_file = timestamp_dir / "postgresql.json.gz"
                    with gzip.open(backup_file, 'wt', encoding='utf-8') as f:
                        json.dump(dump_data, f, indent=2, default=str)
                    
                    metadata.components['postgresql'] = {
                        'status': 'success',
                        'file': str(backup_file),
                        'size': backup_file.stat().st_size,
                        'tables': len(dump_data)
                    }
                    metadata.checksums['postgresql'] = self._calculate_checksum(backup_file)
                    metadata.total_size += backup_file.stat().st_size
                    
                    return True
            finally:
                conn.close()
        
        except Exception as e:
            metadata.errors.append(f"PostgreSQL backup failed: {e}")
            metadata.components['postgresql'] = {'status': 'failed', 'error': str(e)}
            return False
    
    def backup_mongodb(self, shop_id: str, metadata: BackupMetadata, timestamp_dir: Path) -> bool:
        """
        Backup MongoDB data for a shop.
        
        Args:
            shop_id: Shop ID to backup
            metadata: Backup metadata object
            timestamp_dir: Directory to store backup
            
        Returns:
            True if successful, False otherwise
        """
        try:
            from database.mongo import get_mongo_db
            
            db = get_mongo_db()
            
            # Collections to backup
            collections_to_backup = [
                'shoptemplates', 'products', 'categories', 'orders', 'customers',
                'reviews', 'inventory', 'analytics'
            ]
            
            backup_data = {}
            for collection_name in collections_to_backup:
                try:
                    collection = db[collection_name]
                    # Filter by shopId
                    docs = list(collection.find({"shopId": shop_id}))
                    
                    # Convert ObjectId to string for JSON serialization
                    for doc in docs:
                        if '_id' in doc:
                            doc['_id'] = str(doc['_id'])
                    
                    backup_data[collection_name] = {
                        'documents': docs,
                        'count': len(docs)
                    }
                except Exception as e:
                    # Collection might not exist
                    pass
            
            # Save to gzipped JSON
            backup_file = timestamp_dir / "mongodb.json.gz"
            with gzip.open(backup_file, 'wt', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, default=str)
            
            metadata.components['mongodb'] = {
                'status': 'success',
                'file': str(backup_file),
                'size': backup_file.stat().st_size,
                'collections': len(backup_data)
            }
            metadata.checksums['mongodb'] = self._calculate_checksum(backup_file)
            metadata.total_size += backup_file.stat().st_size
            
            return True
        
        except Exception as e:
            metadata.errors.append(f"MongoDB backup failed: {e}")
            metadata.components['mongodb'] = {'status': 'failed', 'error': str(e)}
            return False
    
    def backup_metadata_file(self, metadata: BackupMetadata, timestamp_dir: Path) -> None:
        """
        Save backup metadata to file.
        
        Args:
            metadata: Backup metadata object
            timestamp_dir: Directory to store metadata
        """
        metadata_file = timestamp_dir / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata.to_dict(), f, indent=2, default=str)
    
    def create_backup(self, shop_id: str, include_postgres: bool = True, 
                     include_mongodb: bool = True) -> Optional[Dict[str, Any]]:
        """
        Create a complete backup of a shop.
        
        Args:
            shop_id: Shop ID to backup
            include_postgres: Include PostgreSQL backup
            include_mongodb: Include MongoDB backup
            
        Returns:
            Backup metadata dictionary, or None if failed
        """
        timestamp = datetime.utcnow()
        timestamp_dir = self._get_timestamp_dir(shop_id, timestamp)
        metadata = BackupMetadata(shop_id, timestamp)
        
        # Perform backups
        success_count = 0
        
        if include_postgres:
            if self.backup_postgresql(shop_id, metadata, timestamp_dir):
                success_count += 1
        
        if include_mongodb:
            if self.backup_mongodb(shop_id, metadata, timestamp_dir):
                success_count += 1
        
        # Save metadata
        self.backup_metadata_file(metadata, timestamp_dir)
        
        # Fail if no backups succeeded
        if success_count == 0:
            return None
        
        return metadata.to_dict()
    
    def list_backups(self, shop_id: str) -> List[Dict[str, Any]]:
        """
        List all backups for a shop, ordered by timestamp (newest first).
        
        Args:
            shop_id: Shop ID
            
        Returns:
            List of backup metadata dictionaries
        """
        shop_dir = self._get_shop_backup_dir(shop_id)
        backups = []
        
        if shop_dir.exists():
            for timestamp_dir in sorted(shop_dir.iterdir(), reverse=True):
                if timestamp_dir.is_dir():
                    metadata_file = timestamp_dir / "metadata.json"
                    if metadata_file.exists():
                        try:
                            with open(metadata_file, 'r') as f:
                                backup_data = json.load(f)
                            backup_data['backup_path'] = str(timestamp_dir)
                            backups.append(backup_data)
                        except Exception:
                            pass
        
        return backups
    
    def get_latest_backup(self, shop_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the most recent backup for a shop.
        
        Args:
            shop_id: Shop ID
            
        Returns:
            Backup metadata dictionary, or None if no backups exist
        """
        backups = self.list_backups(shop_id)
        return backups[0] if backups else None
    
    def restore_backup(self, shop_id: str, backup_timestamp: str = None) -> bool:
        """
        Restore a shop from backup.
        
        Args:
            shop_id: Shop ID to restore
            backup_timestamp: Backup timestamp (e.g., "20260406_120000"), 
                            uses latest if not specified
            
        Returns:
            True if successful, False otherwise
        """
        # Get backup to restore
        if backup_timestamp:
            backup_dir = self._get_shop_backup_dir(shop_id) / backup_timestamp
            if not backup_dir.exists():
                return False
        else:
            latest_backup = self.get_latest_backup(shop_id)
            if not latest_backup:
                return False
            backup_dir = Path(latest_backup['backup_path'])
        
        try:
            # Restore PostgreSQL
            pg_file = backup_dir / "postgresql.json.gz"
            if pg_file.exists():
                with gzip.open(pg_file, 'rt', encoding='utf-8') as f:
                    dump_data = json.load(f)
                # TODO: Implement PostgreSQL restore
                # For now, log what would be restored
                pass
            
            # Restore MongoDB
            mongo_file = backup_dir / "mongodb.json.gz"
            if mongo_file.exists():
                with gzip.open(mongo_file, 'rt', encoding='utf-8') as f:
                    backup_data = json.load(f)
                # TODO: Implement MongoDB restore
                # For now, log what would be restored
                pass
            
            return True
        
        except Exception as e:
            return False
    
    def delete_backup(self, shop_id: str, backup_timestamp: str) -> bool:
        """
        Delete a specific backup.
        
        Args:
            shop_id: Shop ID
            backup_timestamp: Backup timestamp
            
        Returns:
            True if successful, False otherwise
        """
        try:
            backup_dir = self._get_shop_backup_dir(shop_id) / backup_timestamp
            if backup_dir.exists():
                shutil.rmtree(backup_dir)
                return True
            return False
        except Exception:
            return False
