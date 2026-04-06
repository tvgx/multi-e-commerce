#!/usr/bin/env python3
"""
Shop Integration Test & Verification Script
Tests API endpoints and database queries to verify complete shop setup.

Usage:
    python scripts/verify_shop_setup.py --shop-id <shop-uuid> [--api-base http://localhost:3000]
"""

import os
import sys
import argparse
import json
import time
from datetime import datetime
import requests
from pymongo import MongoClient
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

# Config
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://admin:password@localhost:27017/ecommerce_ui?authSource=admin")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@localhost:5432/shop_db_1?schema=public")

class ShopVerifier:
    def __init__(self, shop_id: str, api_base: str = "http://localhost:3000", verbose: bool = False):
        self.shop_id = shop_id
        self.api_base = api_base.rstrip('/')
        self.verbose = verbose
        self.results = {
            "database": {},
            "api": {},
            "integration": {}
        }
        self.errors = []
    
    def log(self, message: str, level: str = "INFO"):
        """Pretty print logs"""
        prefix = {
            "INFO": "ℹ️ ",
            "OK": "✅",
            "WARN": "⚠️ ",
            "ERROR": "❌",
            "DEBUG": "🔍"
        }.get(level, "→ ")
        print(f"{prefix} {message}")
    
    # ==================== DATABASE TESTS ====================
    
    def test_postgresql(self) -> bool:
        """Test PostgreSQL shop and user records"""
        self.log("Testing PostgreSQL...", "DEBUG")
        try:
            conn = psycopg2.connect(DATABASE_URL)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check shop exists
                cur.execute('SELECT id, name, domain, status FROM "Shop" WHERE id = %s', (self.shop_id,))
                shop = cur.fetchone()
                
                if not shop:
                    self.log("Shop not found in PostgreSQL", "ERROR")
                    self.results["database"]["postgres_shop"] = "FAILED"
                    return False
                
                self.results["database"]["postgres_shop"] = "OK"
                self.log(f"  - Shop found: {shop['name']} ({shop['status']})", "OK")
                
                # Check user exists
                cur.execute('SELECT id, email, role FROM "User" WHERE id = %s', (shop['ownerId'],))
                user = cur.fetchone()
                
                if not user:
                    self.log("Owner user not found in PostgreSQL", "ERROR")
                    self.results["database"]["postgres_user"] = "FAILED"
                    return False
                
                self.results["database"]["postgres_user"] = "OK"
                self.log(f"  - Owner found: {user['email']} ({user['role']})", "OK")
                
            conn.close()
            return True
        except Exception as e:
            self.log(f"PostgreSQL error: {e}", "ERROR")
            self.errors.append(f"PostgreSQL: {str(e)}")
            self.results["database"]["postgres"] = "ERROR"
            return False
    
    def test_mongodb_products(self) -> bool:
        """Test MongoDB product seeding"""
        self.log("Testing MongoDB Products...", "DEBUG")
        try:
            client = MongoClient(MONGODB_URI)
            db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
            db = client[db_name]
            
            # Count products
            product_count = db['products'].count_documents({"shopId": self.shop_id})
            if product_count < 30:
                self.log(f"Not enough products: {product_count} (expected ≥30)", "WARN")
                self.results["database"]["mongodb_products_count"] = f"{product_count}/30+"
            else:
                self.results["database"]["mongodb_products_count"] = f"{product_count} ✓"
                self.log(f"  - Products count: {product_count}", "OK")
            
            # Sample product
            sample = db['products'].find_one({"shopId": self.shop_id})
            if sample:
                self.results["database"]["mongodb_product_sample"] = "OK"
                self.log(f"  - Sample product: {sample.get('name', 'N/A')}", "OK")
            else:
                self.results["database"]["mongodb_product_sample"] = "FAILED"
                self.log("No products found in MongoDB", "ERROR")
                return False
            
            return True
        except Exception as e:
            self.log(f"MongoDB error: {e}", "ERROR")
            self.errors.append(f"MongoDB: {str(e)}")
            self.results["database"]["mongodb"] = "ERROR"
            return False
    
    def test_mongodb_inventory(self) -> bool:
        """Test MongoDB inventory records"""
        self.log("Testing MongoDB Inventory...", "DEBUG")
        try:
            client = MongoClient(MONGODB_URI)
            db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
            db = client[db_name]
            
            inventory_count = db['inventory'].count_documents({"shopId": self.shop_id})
            if inventory_count < 30:
                self.log(f"Not enough inventory records: {inventory_count}", "WARN")
                self.results["database"]["mongodb_inventory_count"] = f"{inventory_count}/30+"
            else:
                self.results["database"]["mongodb_inventory_count"] = f"{inventory_count} ✓"
                self.log(f"  - Inventory records: {inventory_count}", "OK")
            
            # Total stock
            stock_agg = list(db['inventory'].aggregate([
                {"$match": {"shopId": self.shop_id}},
                {"$group": {"_id": None, "total": {"$sum": "$quantity"}}}
            ]))
            total_stock = stock_agg[0]["total"] if stock_agg else 0
            self.results["database"]["mongodb_total_stock"] = f"₩{total_stock:,}"
            self.log(f"  - Total stock: {total_stock} units", "OK")
            
            return True
        except Exception as e:
            self.log(f"Inventory check error: {e}", "ERROR")
            self.errors.append(f"MongoDB Inventory: {str(e)}")
            return False
    
    def test_mongodb_orders(self) -> bool:
        """Test MongoDB order records"""
        self.log("Testing MongoDB Orders...", "DEBUG")
        try:
            client = MongoClient(MONGODB_URI)
            db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
            db = client[db_name]
            
            order_count = db['orders'].count_documents({"shopId": self.shop_id})
            if order_count < 10:
                self.log(f"Not enough orders: {order_count} (expected ≥10)", "WARN")
                self.results["database"]["mongodb_orders_count"] = f"{order_count}/10+"
            else:
                self.results["database"]["mongodb_orders_count"] = f"{order_count} ✓"
                self.log(f"  - Orders: {order_count}", "OK")
            
            return True
        except Exception as e:
            self.log(f"Orders check error: {e}", "ERROR")
            self.errors.append(f"MongoDB Orders: {str(e)}")
            return False
    
    # ==================== API TESTS ====================
    
    def test_api_endpoint(self, method: str, endpoint: str, expected_status: int = 200, 
                         headers: Dict = None, json_data: Dict = None) -> bool:
        """Test a single API endpoint"""
        url = f"{self.api_base}{endpoint}"
        headers = headers or {"Content-Type": "application/json"}
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=5)
            elif method.upper() == "POST":
                response = requests.post(url, json=json_data, headers=headers, timeout=5)
            else:
                return False
            
            success = response.status_code == expected_status
            if success:
                self.log(f"  - {method} {endpoint} → {response.status_code}", "OK")
                self.results["api"][endpoint] = "OK"
            else:
                self.log(f"  - {method} {endpoint} → {response.status_code} (expected {expected_status})", "WARN")
                self.results["api"][endpoint] = f"Status {response.status_code}"
            
            return success
        except Exception as e:
            self.log(f"  - {method} {endpoint} → Error: {str(e)[:50]}", "WARN")
            self.results["api"][endpoint] = "ERROR"
            return False
    
    def test_api_endpoints(self) -> bool:
        """Test all shop-related API endpoints"""
        self.log("Testing API Endpoints...", "DEBUG")
        
        headers = {
            "Content-Type": "application/json",
            "x-shop-id": self.shop_id  # Multi-tenancy header
        }
        
        all_ok = True
        endpoints = [
            ("GET", f"/api/shops/{self.shop_id}", 200),
            ("GET", f"/api/shops/{self.shop_id}/products", 200),
            ("GET", f"/api/shops/{self.shop_id}/products?limit=10", 200),
            ("GET", f"/api/shops/{self.shop_id}/categories", 200),
            ("GET", f"/api/shops/{self.shop_id}/orders", 200),
        ]
        
        for method, endpoint, expected_status in endpoints:
            ok = self.test_api_endpoint(method, endpoint, expected_status, headers=headers)
            all_ok = all_ok and ok
        
        return all_ok
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_product_consistency(self) -> bool:
        """Verify product data consistency across databases"""
        self.log("Testing Product Consistency...", "DEBUG")
        try:
            client = MongoClient(MONGODB_URI)
            db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
            db = client[db_name]
            
            products = list(db['products'].find({"shopId": self.shop_id}).limit(5))
            if not products:
                self.log("No products to verify", "WARN")
                return False
            
            # Check each product has required fields
            required_fields = ["productId", "shopId", "name", "price", "imageUrls", "createdAt"]
            missing_fields = []
            
            for product in products:
                for field in required_fields:
                    if field not in product:
                        missing_fields.append((product.get("name", "Unknown"), field))
            
            if missing_fields:
                self.log(f"Missing fields: {missing_fields}", "WARN")
                self.results["integration"]["product_consistency"] = "INCOMPLETE"
                return False
            
            self.results["integration"]["product_consistency"] = "OK"
            self.log(f"  - All required fields present in {len(products)} sample products", "OK")
            return True
        except Exception as e:
            self.log(f"Consistency check error: {e}", "ERROR")
            self.errors.append(f"Consistency: {str(e)}")
            return False
    
    def test_inventory_consistency(self) -> bool:
        """Verify inventory data consistency"""
        self.log("Testing Inventory Consistency...", "DEBUG")
        try:
            client = MongoClient(MONGODB_URI)
            db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
            db = client[db_name]
            
            products = db['products'].find({"shopId": self.shop_id}).limit(5)
            product_ids = {p["productId"] for p in products}
            
            inventory_items = list(db['inventory'].find({
                "$and": [
                    {"shopId": self.shop_id},
                    {"productId": {"$in": list(product_ids)}}
                ]
            }))
            
            if len(inventory_items) != len(product_ids):
                self.log(f"Inventory mismatch: {len(inventory_items)} items vs {len(product_ids)} products", "WARN")
                self.results["integration"]["inventory_consistency"] = "PARTIAL"
            else:
                self.results["integration"]["inventory_consistency"] = "OK"
                self.log(f"  - Inventory records match products ({len(inventory_items)})", "OK")
            
            return True
        except Exception as e:
            self.log(f"Inventory consistency error: {e}", "ERROR")
            self.errors.append(f"Inventory Consistency: {str(e)}")
            return False
    
    # ==================== MAIN RUNNER ====================
    
    def run_all_tests(self):
        """Run all verification tests"""
        print("\n" + "="*60)
        print("🧪 SHOP INTEGRATION TEST SUITE")
        print("="*60 + "\n")
        
        print(f"📍 Shop ID: {self.shop_id}")
        print(f"🌐 API Base: {self.api_base}\n")
        
        # Database tests
        print("🗄️  DATABASE TESTS")
        print("-" * 60)
        self.test_postgresql()
        time.sleep(0.5)  # Brief pause between tests
        self.test_mongodb_products()
        self.test_mongodb_inventory()
        self.test_mongodb_orders()
        
        # API tests
        print("\n📡 API TESTS")
        print("-" * 60)
        self.test_api_endpoints()
        
        # Integration tests
        print("\n🔗 INTEGRATION TESTS")
        print("-" * 60)
        self.test_product_consistency()
        self.test_inventory_consistency()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        
        total_tests = (
            len(self.results["database"]) + 
            len(self.results["api"]) + 
            len(self.results["integration"])
        )
        
        passed = sum(1 for r in self.results.values() if isinstance(r, dict) for v in r.values() if v == "OK")
        
        print(f"\n✓ Passed: {passed}/{total_tests}")
        print(f"✗ Errors: {len(self.errors)}")
        
        if self.errors:
            print("\n⚠️  Errors encountered:")
            for error in self.errors:
                print(f"   • {error}")
        
        print("\n" + "="*60 + "\n")
        
        return len(self.errors) == 0

def main():
    parser = argparse.ArgumentParser(description="Verify complete shop setup")
    parser.add_argument("--shop-id", required=True, help="Shop UUID to verify")
    parser.add_argument("--api-base", default="http://localhost:3000", help="API base URL")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    verifier = ShopVerifier(
        shop_id=args.shop_id,
        api_base=args.api_base,
        verbose=args.verbose
    )
    
    success = verifier.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
