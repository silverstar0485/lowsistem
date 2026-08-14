export interface Ordinance {
  id: number;
  org_name: string;
  title: string;
  change_type: string;
  promul_date: string;
  promul_no?: string;
  dept_name?: string;
  reason?: string;
  summary?: string;
  full_text_url?: string;
  is_busan_enacted: number; // 0: 미제정(발굴추천), 1: 기제정
  busan_match_reason?: string;
  legislative_points?: string;
  is_scrapped?: number;
  memo?: string;
  review_status?: string;
  created_at?: string;
}

export interface DashboardStats {
  total_ordinances: number;
  newly_enacted: number;
  busan_unenacted: number;
  scrapped_count: number;
  region_stats: { org_name: string; count: number }[];
  change_type_stats: { change_type: string; count: number }[];
  last_sync: {
    sync_date: string;
    status: string;
    message: string;
  } | null;
}

export interface FilterState {
  regions: string[];
  change_type: string;
  period: string; // '1m' | '3m' | '6m' | '1y' | 'all'
  keyword: string;
  unenacted_only: boolean;
  scrapped_only: boolean;
  sort_by: string;
  sort_order: string;
  page: number;
  limit: number;
}

export interface SyncLog {
  id: number;
  sync_date: string;
  status: string;
  items_added: number;
  items_updated: number;
  message: string;
}
