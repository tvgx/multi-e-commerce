import os
import time
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, OperationFailure
from dotenv import load_dotenv

load_dotenv()

# Use MONGO_DB_ATLAS from root .env (MongoDB Atlas for prod), fallback to local MongoDB
MONGODB_URI = os.getenv(
    "MONGO_DB_ATLAS",
    os.getenv("MONGODB_URI", "mongodb://localhost:27017/ecommerce_ui")
)

# Singleton MongoDB client with connection pooling
_mongo_client = None

def _get_mongo_client():
    """
    Returns a singleton MongoDB client with connection pooling.
    Implements exponential backoff retry logic for connection failures.
    """
    global _mongo_client
    
    if _mongo_client is not None:
        return _mongo_client
    
    max_retries = 3
    retry_delay = 1  # Start with 1 second
    
    for attempt in range(max_retries):
        try:
            client = MongoClient(
                MONGODB_URI,
                maxPoolSize=10,           # Connection pool size
                minPoolSize=2,            # Minimum connections to maintain
                maxIdleTimeMS=30000,      # Close idle connections after 30s
                serverSelectionTimeoutMS=5000,  # 5s timeout for server selection
                connectTimeoutMS=10000,   # 10s timeout for initial connection
                retryWrites=True,         # Enable automatic write retries
                retryReads=True,          # Enable automatic read retries
            )
            
            # Test the connection
            client.server_info()
            _mongo_client = client
            print(f"✅ MongoDB connection established (pooled, max_pool_size=10)")
            return _mongo_client
            
        except (ServerSelectionTimeoutError, OperationFailure) as e:
            if attempt < max_retries - 1:
                print(f"⚠️  MongoDB connection attempt {attempt + 1} failed. Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff: 1s, 2s, 4s
            else:
                print(f"❌ MongoDB connection failed after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            print(f"❌ Unexpected MongoDB error: {e}")
            raise

def get_mongo_db():
    """
    Returns MongoDB database instance using pooled client.
    """
    try:
        client = _get_mongo_client()
        # Parse database name from URI
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
