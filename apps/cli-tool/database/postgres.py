import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ecommerce?schema=public")

def get_pg_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"PostgreSQL Connection Error: {e}")
        raise e

def execute_query(query, params=None, fetch=False):
    conn = get_pg_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                return cur.fetchall()
            conn.commit()
            return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def create_tenant_owner(email, full_name):
    # Dummypassword for automation, should be auto-generated and emailed
    conn = get_pg_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if user exists
            cur.execute("SELECT id FROM \"User\" WHERE email = %s", (email,))
            user = cur.fetchone()
            if user:
                return user['id']
            
            # Create user
            cur.execute(
                """
                INSERT INTO "User" (email, password, role, "fullName", "createdAt", "updatedAt") 
                VALUES (%s, %s, 'OWNER', %s, NOW(), NOW()) 
                RETURNING id;
                """,
                (email, "$2b$10$hashedfakepassword", full_name)
            )
            user_id = cur.fetchone()['id']
            conn.commit()
            return user_id
    finally:
        conn.close()

def create_shop_record(name, domain, owner_id):
    query = """
    INSERT INTO "Shop" ("ownerId", name, domain, status, "createdAt", "updatedAt")
    VALUES (%s, %s, %s, 'ACTIVE', NOW(), NOW())
    RETURNING id;
    """
    conn = get_pg_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (owner_id, name, domain))
            shop_id = cur.fetchone()['id']
            conn.commit()
            return shop_id
    finally:
        conn.close()
