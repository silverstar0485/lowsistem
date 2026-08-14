import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from apscheduler.schedulers.background import BackgroundScheduler
from collector import sync_ordinances
from database import get_db

scheduler = BackgroundScheduler(timezone="Asia/Seoul")

def scheduled_daily_sync():
    print("[APScheduler] Running daily automatic ordinance sync task at 08:00 AM...")
    # System settings에서 API 키 조회
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM system_settings WHERE key = 'LAW_API_KEY'")
    row = cursor.fetchone()
    conn.close()
    
    api_key = row["value"] if row else None
    result = sync_ordinances(api_key=api_key)
    print(f"[APScheduler] Daily sync completed: {result['message']}")

def start_scheduler():
    if not scheduler.running:
        # 매일 오전 8:00 정기 실행 설정
        scheduler.add_job(scheduled_daily_sync, 'cron', hour=8, minute=0, id='daily_sync_job', replace_existing=True)
        scheduler.start()
        print("[APScheduler] Daily Ordinance Sync Scheduler started (Runs daily at 08:00 AM)")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("[APScheduler] Daily Ordinance Sync Scheduler stopped.")
