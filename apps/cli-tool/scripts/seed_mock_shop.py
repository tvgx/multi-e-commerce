#!/usr/bin/env python3
"""
Mock Shop Data Seeder
Generates realistic mock data for testing complete shop creation workflow.
- 30+ fashion products with categories
- 4 product categories
- 10 mock orders with line items
- Inventory records with stock levels

Usage:
    python scripts/seed_mock_shop.py --shop-id <shop-uuid>
"""

import os
import sys
import uuid
import json
import argparse
from datetime import datetime, timedelta
from pymongo import MongoClient
from typing import List, Dict, Any
import random

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://admin:password@localhost:27017/ecommerce_ui?authSource=admin")
CATEGORIES = {
    "tops": {
        "name": "Tops",
        "description": "T-Shirts, Shirts, and Blouses",
        "icon": "👕"
    },
    "bottoms": {
        "name": "Bottoms",
        "description": "Pants, Jeans, and Skirts",
        "icon": "👖"
    },
    "outerwear": {
        "name": "Outerwear",
        "description": "Jackets, Coats, and Hoodies",
        "icon": "🧥"
    },
    "accessories": {
        "name": "Accessories",
        "description": "Bags, Belts, and More",
        "icon": "👜"
    }
}

FASHION_PRODUCTS_DATA = [
    # TOPS
    {"name": "Classic White T-Shirt", "category": "tops", "price": 25000, "stock": 150},
    {"name": "Premium Cotton T-Shirt", "category": "tops", "price": 35000, "stock": 200},
    {"name": "Oversized Graphic Tee", "category": "tops", "price": 45000, "stock": 120},
    {"name": "Striped Long Sleeve Shirt", "category": "tops", "price": 55000, "stock": 100},
    {"name": "Linen Summer Shirt", "category": "tops", "price": 65000, "stock": 90},
    {"name": "Casual Polo Shirt", "category": "tops", "price": 48000, "stock": 110},
    {"name": "Vintage Band Tee", "category": "tops", "price": 42000, "stock": 85},
    {"name": "Minimalist White Tank", "category": "tops", "price": 20000, "stock": 180},
    {"name": "Henley Long Sleeve", "category": "tops", "price": 52000, "stock": 95},
    {"name": "Athletic Performance Tee", "category": "tops", "price": 58000, "stock": 140},
    
    # BOTTOMS
    {"name": "Classic Blue Jeans", "category": "bottoms", "price": 85000, "stock": 200},
    {"name": "Black Slim Fit Trousers", "category": "bottoms", "price": 95000, "stock": 160},
    {"name": "Urban Utility Cargo Pants", "category": "bottoms", "price": 120000, "stock": 110},
    {"name": "High-Waist Shorts", "category": "bottoms", "price": 45000, "stock": 130},
    {"name": "Vintage Denim Shorts", "category": "bottoms", "price": 55000, "stock": 150},
    {"name": "Linen Chino Pants", "category": "bottoms", "price": 78000, "stock": 105},
    {"name": "Wide Leg Trousers", "category": "bottoms", "price": 98000, "stock": 85},
    {"name": "Athletic Leggings", "category": "bottoms", "price": 72000, "stock": 190},
    {"name": "Casual Joggers", "category": "bottoms", "price": 62000, "stock": 175},
    {"name": "Pleated Midi Skirt", "category": "bottoms", "price": 88000, "stock": 95},
    
    # OUTERWEAR
    {"name": "Classic Denim Jacket", "category": "outerwear", "price": 150000, "stock": 80},
    {"name": "Minimalist Knit Hoodie", "category": "outerwear", "price": 125000, "stock": 120},
    {"name": "Wool Blazer", "category": "outerwear", "price": 280000, "stock": 50},
    {"name": "Leather Moto Jacket", "category": "outerwear", "price": 450000, "stock": 35},
    {"name": "Oversized Bomber Jacket", "category": "outerwear", "price": 165000, "stock": 70},
    {"name": "Vintage Coach Jacket", "category": "outerwear", "price": 185000, "stock": 60},
    {"name": "Fleece Pullover", "category": "outerwear", "price": 78000, "stock": 140},
    {"name": "Quilted Winter Coat", "category": "outerwear", "price": 320000, "stock": 45},
    {"name": "Trench Coat", "category": "outerwear", "price": 380000, "stock": 40},
    {"name": "Cardigan Sweater", "category": "outerwear", "price": 95000, "stock": 110},
    
    # ACCESSORIES
    {"name": "Canvas Tote Bag", "category": "accessories", "price": 68000, "stock": 200},
    {"name": "Leather Crossbody Bag", "category": "accessories", "price": 185000, "stock": 85},
    {"name": "Baseball Cap", "category": "accessories", "price": 32000, "stock": 250},
    {"name": "Beanie Hat", "category": "accessories", "price": 28000, "stock": 220},
    {"name": "Silk Scarf", "category": "accessories", "price": 58000, "stock": 150},
]

def get_mongo_db():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGODB_URI)
        # Extract database name from URI
        db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
        return client[db_name]
    except Exception as e:
        print(f"❌ MongoDB Connection Error: {e}")
        raise e

def generate_product_images(product_name: str) -> List[str]:
    """Generate placeholder image URLs from Unsplash"""
    image_ids = [
        "photo-1505740420928-5e560c06d30e",  # Generic fashion
        "photo-1521572163474-6864f9cf17ab",  # T-shirt
        "photo-1593642632823-8f785ba67e45",  # Fashion
        "photo-1611003228941-98852ba62227",  # Accessories
        "photo-1559056199-641a0ac8b3f7",  # Fashion closeup
    ]
    selected = random.sample(image_ids, 2)
    return [
        f"https://images.unsplash.com/{img}?auto=format&fit=crop&w=500&q=60" 
        for img in selected
    ]

def create_categories(db, shop_id: str) -> Dict[str, str]:
    """Create product categories in MongoDB"""
    collection = db['categories']
    category_ids = {}
    
    for cat_key, cat_data in CATEGORIES.items():
        category_doc = {
            "shopId": shop_id,
            "slug": cat_key,
            "name": cat_data["name"],
            "description": cat_data["description"],
            "icon": cat_data["icon"],
            "displayOrder": len(category_ids),
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = collection.insert_one(category_doc)
        category_ids[cat_key] = str(result.inserted_id)
    
    print(f"✅ Created {len(category_ids)} categories")
    return category_ids

def create_products(db, shop_id: str) -> List[Dict[str, Any]]:
    """Create 35 fashion products in MongoDB"""
    collection = db['products']
    products = []
    
    for idx, product_data in enumerate(FASHION_PRODUCTS_DATA):
        product_id = str(uuid.uuid4())
        product_doc = {
            "productId": product_id,
            "shopId": shop_id,
            "name": product_data["name"],
            "slug": product_data["name"].lower().replace(" ", "-"),
            "description": f"Premium {product_data['category']} item. {product_data['name']} crafted with attention to detail and quality materials.",
            "descriptionHtml": f"<p>Premium {product_data['category']} item.</p><p><strong>{product_data['name']}</strong></p><p>Crafted with attention to detail and quality materials.</p>",
            "price": product_data["price"],
            "currency": "KRW",
            "category": product_data["category"],
            "imageUrls": generate_product_images(product_data["name"]),
            "videoUrls": [],
            "attributes": {
                "material": random.choice(["Cotton", "Linen", "Wool", "Silk", "Polyester"]),
                "size": random.choice(["XS", "S", "M", "L", "XL", "XXL"]),
                "color": random.choice(["Black", "White", "Navy", "Gray", "Beige", "Green", "Blue"])
            },
            "seoData": {
                "metaTitle": f"{product_data['name']} - Premium Fashion",
                "metaDescription": f"Shop {product_data['name']}. Premium quality {product_data['category']} items.",
                "keywords": ["fashion", product_data["category"], "clothing"]
            },
            "status": "ACTIVE",
            "visibility": "PUBLIC",
            "displayOrder": idx,
            "sku": f"SKU-{random.randint(10000, 99999)}",
            "isNew": random.choice([True, False]),
            "discount": random.choice([0, 5, 10, 15]),
            "createdAt": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            "updatedAt": datetime.utcnow()
        }
        products.append(product_doc)
    
    collection.insert_many(products)
    print(f"✅ Created {len(products)} products")
    return products

def create_inventory(db, shop_id: str, products: List[Dict[str, Any]]):
    """Create inventory records for products"""
    collection = db['inventory']
    inventory_records = []
    
    for product in products:
        stock = random.randint(50, 300)
        inventory_doc = {
            "productId": product["productId"],
            "shopId": shop_id,
            "quantity": stock,
            "reserved": random.randint(0, int(stock * 0.1)),
            "available": stock,
            "reorderLevel": 20,
            "sku": product["sku"],
            "warehouseLocation": f"Shelf-{random.randint(1, 5)}-{random.randint(1, 10)}",
            "lastRestocked": datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        inventory_records.append(inventory_doc)
    
    collection.insert_many(inventory_records)
    print(f"✅ Created inventory for {len(inventory_records)} products")

def create_mock_orders(db, shop_id: str, products: List[Dict[str, Any]]):
    """Create 10 realistic mock orders"""
    collection = db['orders']
    orders = []
    
    for order_idx in range(10):
        order_id = str(uuid.uuid4())
        order_date = datetime.utcnow() - timedelta(days=random.randint(1, 60))
        
        # Select 2-5 random products for this order
        num_items = random.randint(2, 5)
        order_items = []
        total_price = 0
        
        for product in random.sample(products, num_items):
            quantity = random.randint(1, 3)
            item_total = product["price"] * quantity
            total_price += item_total
            
            order_items.append({
                "productId": product["productId"],
                "name": product["name"],
                "price": product["price"],
                "quantity": quantity,
                "lineTotal": item_total,
                "attributes": product["attributes"]
            })
        
        order_status = random.choice(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
        
        order_doc = {
            "orderId": order_id,
            "shopId": shop_id,
            "orderNumber": f"ORD-{order_idx + 1001}",
            "status": order_status,
            "customerEmail": f"customer{order_idx + 1}@example.com",
            "customerName": f"Test Customer {order_idx + 1}",
            "items": order_items,
            "subtotal": total_price,
            "tax": int(total_price * 0.1),
            "shippingCost": 5000 if total_price > 100000 else 10000,
            "total": total_price + int(total_price * 0.1) + (5000 if total_price > 100000 else 10000),
            "currency": "KRW",
            "shippingAddress": {
                "street": f"{random.randint(1, 999)} Test Street",
                "city": random.choice(["Seoul", "Busan", "Incheon", "Daegu"]),
                "state": "Test State",
                "postCode": f"{random.randint(10000, 99999)}",
                "country": "South Korea"
            },
            "trackingNumber": f"TRACK-{random.randint(100000000, 999999999)}",
            "paymentMethod": random.choice(["CREDIT_CARD", "BANK_TRANSFER", "PAYPAL"]),
            "paymentStatus": "COMPLETED" if order_status != "CANCELLED" else "CANCELLED",
            "notes": random.choice(["Rush delivery", "Gift order", "Standard", ""]),
            "createdAt": order_date,
            "updatedAt": order_date + timedelta(days=random.randint(0, 10)),
        }
        orders.append(order_doc)
    
    collection.insert_many(orders)
    print(f"✅ Created {len(orders)} mock orders")

def verify_data(db, shop_id: str):
    """Verify seeded data in MongoDB"""
    print("\n📊 Verification Report:")
    print("=" * 50)
    
    product_count = db['products'].count_documents({"shopId": shop_id})
    print(f"✓ Products: {product_count}")
    
    category_count = db['categories'].count_documents({"shopId": shop_id})
    print(f"✓ Categories: {category_count}")
    
    inventory_count = db['inventory'].count_documents({"shopId": shop_id})
    print(f"✓ Inventory Records: {inventory_count}")
    
    order_count = db['orders'].count_documents({"shopId": shop_id})
    print(f"✓ Orders: {order_count}")
    
    total_stock = db['inventory'].aggregate([
        {"$match": {"shopId": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$quantity"}}}
    ])
    stock_sum = list(total_stock)[0]["total"] if list(total_stock) else 0
    print(f"✓ Total Stock Across Products: {stock_sum}")
    
    avg_price = db['products'].aggregate([
        {"$match": {"shopId": shop_id}},
        {"$group": {"_id": None, "avgPrice": {"$avg": "$price"}}}
    ])
    avg_price_val = list(avg_price)[0]["avgPrice"] if list(avg_price) else 0
    print(f"✓ Average Product Price: ₩{avg_price_val:,.0f}")
    
    print("=" * 50)

def main():
    parser = argparse.ArgumentParser(description="Seed mock fashion shop data")
    parser.add_argument("--shop-id", required=True, help="Shop UUID to associate with mock data")
    parser.add_argument("--verify-only", action="store_true", help="Only show verification report")
    
    args = parser.parse_args()
    shop_id = args.shop_id
    
    print(f"🛍️  Fashion Shop Mock Data Seeder")
    print(f"📍 Target Shop ID: {shop_id}")
    print("=" * 50)
    
    try:
        db = get_mongo_db()
        print("✅ MongoDB Connected")
        
        if args.verify_only:
            verify_data(db, shop_id)
            return
        
        # Create all data
        print("\n📦 Creating Mock Data...")
        create_categories(db, shop_id)
        products = create_products(db, shop_id)
        create_inventory(db, shop_id, products)
        create_mock_orders(db, shop_id, products)
        
        # Verify
        verify_data(db, shop_id)
        
        print("\n✨ Mock shop data created successfully!")
        print(f"   Shop ready for testing: {shop_id}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
