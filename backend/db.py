import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "pulmosight.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            initials TEXT NOT NULL
        )
    """)
    
    # Check if we have any users, if not add the default radiologist
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    if count == 0:
        default_email = "dr.arjun@hospital.com"
        default_password = generate_password_hash("password123")
        cursor.execute(
            "INSERT INTO users (email, password, name, role, initials) VALUES (?, ?, ?, ?, ?)",
            (default_email, default_password, "Dr. Arjun Mehta", "radiologist", "AM")
        )
        conn.commit()
        print("Default user dr.arjun@hospital.com created successfully.")
        
    conn.close()

# Helper functions for User Management
def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def create_user(email, password, name, role, initials):
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_password = generate_password_hash(password)
    try:
        cursor.execute(
            "INSERT INTO users (email, password, name, role, initials) VALUES (?, ?, ?, ?, ?)",
            (email.lower(), hashed_password, name, role, initials)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

# Initialize DB on import
init_db()
