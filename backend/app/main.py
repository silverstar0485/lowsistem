import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db, init_db
from seeder import seed_database
from collector import sync_ordinances
from scheduler import start_scheduler, stop_scheduler

app = FastAPI(
    title="부산시의회 타시도 조례 모니터링 API",
    version="1.0.0",
    description="부산광역시의회 입법정책 지원 및 타 지자체 조례 모니터링 & 입법 Gap 분석 시스템 API"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    # Check if ordinances table has data, if empty, seed
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM ordinances")
    count = cursor.fetchone()["count"]
    conn.close()
    
    if count == 0:
        print("[FastAPI Startup] No ordinances found. Seeding initial dataset...")
        seed_database()
        
    start_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()

# Pydantic Schemas
class ScrapToggleRequest(BaseModel):
    ordinance_id: int
    is_scrapped: Optional[int] = None

class MemoUpdateRequest(BaseModel):
    memo: str
    review_status: str

class SettingsUpdateRequest(BaseModel):
    law_api_key: str

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Busan Ordinance Monitoring API"}

@app.get("/api/ordinances")
def get_ordinances(
    regions: Optional[List[str]] = Query(None),
    change_type: Optional[str] = Query(None),
    period: Optional[str] = Query(None), # 1m, 3m, 6m, 1y, custom
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    unenacted_only: Optional[bool] = Query(False),
    scrapped_only: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    sort_by: str = Query("promul_date", pattern="^(promul_date|title|org_name|created_at)$"),
    sort_order: str = Query("DESC", pattern="^(ASC|DESC|asc|desc)$")
):
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    # 1. Regions filter
    if regions:
        placeholders = ",".join(["?"] * len(regions))
        conditions.append(f"o.org_name IN ({placeholders})")
        params.extend(regions)
        
    # 2. Change Type filter
    if change_type and change_type != "전체":
        conditions.append("o.change_type = ?")
        params.append(change_type)
        
    # 3. Busan Unenacted filter
    if unenacted_only:
        conditions.append("o.is_busan_enacted = 0")
        
    # 4. Period filter
    today = datetime.now()
    if period == "1m":
        cutoff = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        conditions.append("o.promul_date >= ?")
        params.append(cutoff)
    elif period == "3m":
        cutoff = (today - timedelta(days=90)).strftime("%Y-%m-%d")
        conditions.append("o.promul_date >= ?")
        params.append(cutoff)
    elif period == "6m":
        cutoff = (today - timedelta(days=180)).strftime("%Y-%m-%d")
        conditions.append("o.promul_date >= ?")
        params.append(cutoff)
    elif period == "1y":
        cutoff = (today - timedelta(days=365)).strftime("%Y-%m-%d")
        conditions.append("o.promul_date >= ?")
        params.append(cutoff)
    elif period == "custom" and start_date and end_date:
        conditions.append("o.promul_date BETWEEN ? AND ?")
        params.extend([start_date, end_date])
        
    # 5. Keyword filter (Title, Reason, Summary)
    if keyword and keyword.strip():
        kw = f"%{keyword.strip()}%"
        conditions.append("(o.title LIKE ? OR o.reason LIKE ? OR o.summary LIKE ? OR o.dept_name LIKE ?)")
        params.extend([kw, kw, kw, kw])

    # 6. Scrapped only filter
    if scrapped_only:
        conditions.append("s.is_scrapped = 1")
        
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    # Query total count
    count_sql = f"""
        SELECT COUNT(*) as total 
        FROM ordinances o
        LEFT JOIN scraps_memos s ON o.id = s.ordinance_id
        {where_clause}
    """
    cursor.execute(count_sql, params)
    total_count = cursor.fetchone()["total"]
    
    # Fetch paginated rows with scrap/memo info
    offset = (page - 1) * limit
    sql = f"""
        SELECT 
            o.*, 
            COALESCE(s.is_scrapped, 0) as is_scrapped,
            COALESCE(s.memo, '') as memo,
            COALESCE(s.review_status, '미검토') as review_status
        FROM ordinances o
        LEFT JOIN scraps_memos s ON o.id = s.ordinance_id
        {where_clause}
        ORDER BY o.{sort_by} {sort_order.upper()}
        LIMIT ? OFFSET ?
    """
    query_params = params + [limit, offset]
    cursor.execute(sql, query_params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
    
    return {
        "items": rows,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@app.get("/api/ordinances/{ordinance_id}")
def get_ordinance_detail(ordinance_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            o.*, 
            COALESCE(s.is_scrapped, 0) as is_scrapped,
            COALESCE(s.memo, '') as memo,
            COALESCE(s.review_status, '미검토') as review_status,
            s.updated_at as memo_updated_at
        FROM ordinances o
        LEFT JOIN scraps_memos s ON o.id = s.ordinance_id
        WHERE o.id = ?
    """, (ordinance_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="해당 조례를 찾을 수 없습니다.")
        
    return dict(row)

@app.get("/api/stats")
def get_dashboard_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    # Total count
    cursor.execute("SELECT COUNT(*) as cnt FROM ordinances")
    total_ordinances = cursor.fetchone()["cnt"]
    
    # Newly enacted count (제정)
    cursor.execute("SELECT COUNT(*) as cnt FROM ordinances WHERE change_type = '제정'")
    newly_enacted = cursor.fetchone()["cnt"]
    
    # Busan unenacted count (부산시 미제정/발굴 추천)
    cursor.execute("SELECT COUNT(*) as cnt FROM ordinances WHERE is_busan_enacted = 0")
    busan_unenacted = cursor.fetchone()["cnt"]
    
    # Scrapped count
    cursor.execute("SELECT COUNT(*) as cnt FROM scraps_memos WHERE is_scrapped = 1")
    scrapped_count = cursor.fetchone()["cnt"]
    
    # Region distribution
    cursor.execute("""
        SELECT org_name, COUNT(*) as count 
        FROM ordinances 
        GROUP BY org_name 
        ORDER BY count DESC
    """)
    region_stats = [dict(row) for row in cursor.fetchall()]
    
    # Change type breakdown
    cursor.execute("""
        SELECT change_type, COUNT(*) as count 
        FROM ordinances 
        GROUP BY change_type 
        ORDER BY count DESC
    """)
    change_type_stats = [dict(row) for row in cursor.fetchall()]
    
    # Last sync time
    cursor.execute("SELECT sync_date, status, message FROM sync_logs ORDER BY id DESC LIMIT 1")
    last_sync_row = cursor.fetchone()
    last_sync = dict(last_sync_row) if last_sync_row else None
    
    conn.close()
    
    return {
        "total_ordinances": total_ordinances,
        "newly_enacted": newly_enacted,
        "busan_unenacted": busan_unenacted,
        "scrapped_count": scrapped_count,
        "region_stats": region_stats,
        "change_type_stats": change_type_stats,
        "last_sync": last_sync
    }

@app.post("/api/scraps")
def toggle_scrap(req: ScrapToggleRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT is_scrapped FROM scraps_memos WHERE ordinance_id = ?", (req.ordinance_id,))
    row = cursor.fetchone()
    
    if row:
        new_state = 1 if row["is_scrapped"] == 0 else 0
        if req.is_scrapped is not None:
            new_state = req.is_scrapped
            
        cursor.execute("""
            UPDATE scraps_memos 
            SET is_scrapped = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE ordinance_id = ?
        """, (new_state, req.ordinance_id))
    else:
        new_state = 1 if req.is_scrapped is None else req.is_scrapped
        cursor.execute("""
            INSERT INTO scraps_memos (ordinance_id, is_scrapped, memo, review_status)
            VALUES (?, ?, '', '검토예정')
        """, (req.ordinance_id, new_state))
        
    conn.commit()
    conn.close()
    return {"status": "success", "ordinance_id": req.ordinance_id, "is_scrapped": new_state}

@app.put("/api/memos/{ordinance_id}")
def update_memo(ordinance_id: int, req: MemoUpdateRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM scraps_memos WHERE ordinance_id = ?", (ordinance_id,))
    row = cursor.fetchone()
    
    if row:
        cursor.execute("""
            UPDATE scraps_memos 
            SET memo = ?, review_status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE ordinance_id = ?
        """, (req.memo, req.review_status, ordinance_id))
    else:
        cursor.execute("""
            INSERT INTO scraps_memos (ordinance_id, is_scrapped, memo, review_status)
            VALUES (?, 0, ?, ?)
        """, (ordinance_id, req.memo, req.review_status))
        
    conn.commit()
    conn.close()
    return {"status": "success", "ordinance_id": ordinance_id, "memo": req.memo, "review_status": req.review_status}

@app.get("/api/workspace")
def get_workspace_items():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            o.*, 
            s.is_scrapped,
            s.memo,
            s.review_status,
            s.updated_at as memo_updated_at
        FROM scraps_memos s
        JOIN ordinances o ON s.ordinance_id = o.id
        WHERE s.is_scrapped = 1 OR (s.memo IS NOT NULL AND s.memo != '')
        ORDER BY s.updated_at DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"items": rows, "total": len(rows)}

@app.post("/api/sync/trigger")
def trigger_sync():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM system_settings WHERE key = 'LAW_API_KEY'")
    row = cursor.fetchone()
    conn.close()
    
    api_key = row["value"] if row else None
    res = sync_ordinances(api_key=api_key)
    return res

@app.get("/api/sync/logs")
def get_sync_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sync_logs ORDER BY id DESC LIMIT 20")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"logs": rows}

@app.get("/api/export")
def export_all_filtered(
    regions: Optional[List[str]] = Query(None),
    change_type: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    unenacted_only: Optional[bool] = Query(False)
):
    """
    Excel/CSV 다운로드용 전체 필터링 데이터 반환
    """
    res = get_ordinances(
        regions=regions,
        change_type=change_type,
        period=period,
        keyword=keyword,
        unenacted_only=unenacted_only,
        page=1,
        limit=5000
    )
    return res["items"]
