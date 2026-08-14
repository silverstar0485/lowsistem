import json
import sqlite3
from pathlib import Path
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, init_db
from seeder import seed_database

def export_static_json():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Check if empty, seed if needed
    cursor.execute("SELECT COUNT(*) as count FROM ordinances")
    if cursor.fetchone()["count"] == 0:
        seed_database()

    # Fetch all ordinances
    cursor.execute("""
        SELECT 
            o.*, 
            COALESCE(s.is_scrapped, 0) as is_scrapped,
            COALESCE(s.memo, '') as memo,
            COALESCE(s.review_status, '미검토') as review_status
        FROM ordinances o
        LEFT JOIN scraps_memos s ON o.id = s.ordinance_id
        ORDER BY o.promul_date DESC
    """)
    ordinances = [dict(row) for row in cursor.fetchall()]

    # Fetch stats
    cursor.execute("SELECT COUNT(*) as cnt FROM ordinances")
    total_ordinances = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM ordinances WHERE change_type = '제정'")
    newly_enacted = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM ordinances WHERE is_busan_enacted = 0")
    busan_unenacted = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM scraps_memos WHERE is_scrapped = 1")
    scrapped_count = cursor.fetchone()["cnt"]

    cursor.execute("SELECT org_name, COUNT(*) as count FROM ordinances GROUP BY org_name ORDER BY count DESC")
    region_stats = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT change_type, COUNT(*) as count FROM ordinances GROUP BY change_type ORDER BY count DESC")
    change_type_stats = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT sync_date, status, message FROM sync_logs ORDER BY id DESC LIMIT 1")
    last_sync_row = cursor.fetchone()
    last_sync = dict(last_sync_row) if last_sync_row else None

    conn.close()

    stats = {
        "total_ordinances": total_ordinances,
        "newly_enacted": newly_enacted,
        "busan_unenacted": busan_unenacted,
        "scrapped_count": scrapped_count,
        "region_stats": region_stats,
        "change_type_stats": change_type_stats,
        "last_sync": last_sync
    }

    # Save to frontend/public/data/
    public_data_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "data"
    public_data_dir.mkdir(parents=True, exist_ok=True)

    with open(public_data_dir / "ordinances.json", "w", encoding="utf-8") as f:
        json.dump(ordinances, f, ensure_ascii=False, indent=2)

    with open(public_data_dir / "stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"Successfully exported {len(ordinances)} ordinances and stats to {public_data_dir}")

if __name__ == "__main__":
    export_static_json()
