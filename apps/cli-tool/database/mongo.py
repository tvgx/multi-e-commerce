import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/ecommerce_ui")

def get_mongo_db():
    try:
        client = MongoClient(MONGODB_URI)
        # Assuming connection string includes database name
        db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'ecommerce_ui'
        return client[db_name]
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        raise e

def seed_shop_template(shop_id, template_data):
    db = get_mongo_db()
    collection = db['shoptemplates']
    
    document = {
        "shopId": shop_id,
        "isMaster": False,
        "publishedData": template_data,
        "history": [],
        "createdAt": __import__('datetime').datetime.utcnow(),
        "updatedAt": __import__('datetime').datetime.utcnow()
    }
    
    collection.insert_one(document)
    return True

def seed_demo_products(shop_id, products_list):
    db = get_mongo_db()
    collection = db['products']
    
    for p in products_list:
        p['shopId'] = shop_id
        p['status'] = 'ACTIVE'
        p['createdAt'] = __import__('datetime').datetime.utcnow()
        p['updatedAt'] = __import__('datetime').datetime.utcnow()
        
    if products_list:
        collection.insert_many(products_list)
        return len(products_list)
    return 0
