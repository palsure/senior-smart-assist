#!/usr/bin/env python3
"""
Database Migration Script
Adds missing columns to existing database tables
"""
import sys
import os
import sqlite3

def migrate_database():
    """Add missing columns to the database."""
    # Find the database file
    db_path = None
    
    # Check common locations
    possible_paths = [
        'seniorsmartassist.db',
        'instance/seniorsmartassist.db',
        'instance/seniorsmartassist_dev.db',
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        # Try to find it (also check old name for migration)
        for root, dirs, files in os.walk('.'):
            for file in files:
                if file.endswith('.db') and ('seniorsmartassist' in file or 'elderassist' in file):
                    db_path = os.path.join(root, file)
                    break
            if db_path:
                break
    
    if not db_path:
        print("❌ Database file not found.")
        print("The database will be created automatically when you start the server.")
        return
    
    print(f"📊 Found database at: {db_path}")
    print("🔄 Migrating database...")
    
    # Connect to SQLite database directly
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if gender column exists
        cursor.execute("PRAGMA table_info(volunteer)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'gender' not in columns:
            print("  ✓ Adding 'gender' column to volunteer table...")
            cursor.execute("ALTER TABLE volunteer ADD COLUMN gender VARCHAR(20)")
            conn.commit()
        else:
            print("  ✓ 'gender' column already exists")
        
        if 'has_car' not in columns:
            print("  ✓ Adding 'has_car' column to volunteer table...")
            cursor.execute("ALTER TABLE volunteer ADD COLUMN has_car BOOLEAN DEFAULT 0")
            conn.commit()
        else:
            print("  ✓ 'has_car' column already exists")
        
        # Check if chat_message table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_message'")
        if not cursor.fetchone():
            print("  ✓ Creating 'chat_message' table...")
            cursor.execute("""
                CREATE TABLE chat_message (
                    id INTEGER NOT NULL PRIMARY KEY,
                    request_id INTEGER NOT NULL,
                    sender_id INTEGER NOT NULL,
                    sender_type VARCHAR(20) NOT NULL,
                    message VARCHAR(1000) NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(request_id) REFERENCES help_request (id)
                )
            """)
            conn.commit()
        else:
            print("  ✓ 'chat_message' table already exists")
        
        # Check help_request table for rating columns
        cursor.execute("PRAGMA table_info(help_request)")
        help_request_columns = [column[1] for column in cursor.fetchall()]
        
        if 'rating' not in help_request_columns:
            print("  ✓ Adding 'rating' column to help_request table...")
            cursor.execute("ALTER TABLE help_request ADD COLUMN rating INTEGER")
            conn.commit()
        else:
            print("  ✓ 'rating' column already exists in help_request table")
        
        if 'rating_comment' not in help_request_columns:
            print("  ✓ Adding 'rating_comment' column to help_request table...")
            cursor.execute("ALTER TABLE help_request ADD COLUMN rating_comment VARCHAR(500)")
            conn.commit()
        else:
            print("  ✓ 'rating_comment' column already exists in help_request table")
        
        # Check if reward table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reward'")
        if not cursor.fetchone():
            print("  ✓ Creating 'reward' table...")
            cursor.execute("""
                CREATE TABLE reward (
                    id INTEGER NOT NULL PRIMARY KEY,
                    request_id INTEGER NOT NULL,
                    volunteer_id INTEGER NOT NULL,
                    amount FLOAT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(request_id) REFERENCES help_request (id),
                    FOREIGN KEY(volunteer_id) REFERENCES volunteer (id)
                )
            """)
            conn.commit()
        else:
            print("  ✓ 'reward' table already exists")
        
        conn.close()
        print("\n✅ Database migration completed successfully!")
        print("You can now start the server with: python run.py")
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"\n❌ Error during migration: {e}")
        print("\n💡 Alternative solution:")
        print(f"   1. Backup your data (if needed)")
        print(f"   2. Delete the database file: {db_path}")
        print(f"   3. Restart the server - it will create a new database with all tables")
        sys.exit(1)

if __name__ == '__main__':
    migrate_database()
