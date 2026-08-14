import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "ordinance.db"

def get_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. ordinances (타시도 자치법규/조례)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ordinances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_name TEXT NOT NULL,
        title TEXT NOT NULL,
        change_type TEXT NOT NULL,
        promul_date TEXT NOT NULL,
        promul_no TEXT,
        dept_name TEXT,
        reason TEXT,
        summary TEXT,
        full_text_url TEXT,
        is_busan_enacted INTEGER DEFAULT 0,
        busan_match_reason TEXT,
        legislative_points TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. busan_ordinances (부산광역시 기제정 조례 마스터 데이터)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS busan_ordinances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        dept_name TEXT,
        enact_date TEXT,
        keywords TEXT
    );
    """)
    
    # 3. scraps_memos (관심조례 및 개인 메모)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scraps_memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ordinance_id INTEGER NOT NULL UNIQUE,
        is_scrapped INTEGER DEFAULT 0,
        memo TEXT DEFAULT '',
        review_status TEXT DEFAULT '검토예정',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ordinance_id) REFERENCES ordinances(id) ON DELETE CASCADE
    );
    """)
    
    # 4. sync_logs (자동/수동 수집 이력)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        items_added INTEGER DEFAULT 0,
        items_updated INTEGER DEFAULT 0,
        message TEXT
    );
    """)

    # 5. system_settings (시스템 설정 - API Key, Cron 시간 등)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized at:", DB_PATH)
