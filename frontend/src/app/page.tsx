'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import OrdinanceCard from '@/components/OrdinanceCard';
import OrdinanceTable from '@/components/OrdinanceTable';
import DetailModal from '@/components/DetailModal';
import SyncModal from '@/components/SyncModal';
import { Ordinance, DashboardStats, FilterState } from '@/lib/types';
import { ChevronLeft, ChevronRight, Bookmark, Sparkles, Filter, FileText } from 'lucide-react';
import { exportOrdinancesToExcel } from '@/lib/exportExcel';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'busan_master'>('dashboard');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allOrdinances, setAllOrdinances] = useState<Ordinance[]>([]);
  const [ordinances, setOrdinances] = useState<Ordinance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Ordinance for Detail Modal
  const [selectedOrdinance, setSelectedOrdinance] = useState<Ordinance | null>(null);
  
  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Workspace Scraps state
  const [workspaceItems, setWorkspaceItems] = useState<Ordinance[]>([]);
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState<string>('전체');

  // Primary Filters
  const [filters, setFilters] = useState<FilterState>({
    regions: [],
    change_type: '전체',
    period: 'all',
    keyword: '',
    unenacted_only: false,
    scrapped_only: false,
    sort_by: 'promul_date',
    sort_order: 'DESC',
    page: 1,
    limit: 12
  });

  // Load LocalStorage user workspace modifications (Scraps & Memos)
  const getLocalWorkspace = (): Record<number, { is_scrapped: number; memo: string; review_status: string }> => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('busan_user_workspace');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveLocalWorkspace = (data: Record<number, { is_scrapped: number; memo: string; review_status: string }>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('busan_user_workspace', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        return;
      }
    } catch {}

    // Fallback to static JSON data for GitHub Pages
    try {
      const res = await fetch(`${basePath}/data/stats.json`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error loading static stats:', e);
    }
  }, []);

  // Fetch Ordinances list (Supports both live API and static GitHub Pages export)
  const fetchOrdinances = useCallback(async () => {
    setIsLoading(true);
    let rawItems: Ordinance[] = [];
    let isLiveApi = false;

    try {
      const params = new URLSearchParams();
      filters.regions.forEach(r => params.append('regions', r));
      if (filters.change_type && filters.change_type !== '전체') {
        params.append('change_type', filters.change_type);
      }
      if (filters.period && filters.period !== 'all') {
        params.append('period', filters.period);
      }
      if (filters.keyword.trim()) {
        params.append('keyword', filters.keyword.trim());
      }
      if (filters.unenacted_only) {
        params.append('unenacted_only', 'true');
      }
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const res = await fetch(`/api/ordinances?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrdinances(data.items || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.total_pages || 1);
        setIsLoading(false);
        isLiveApi = true;
        return;
      }
    } catch {}

    // Static fallback for GitHub Pages
    if (!isLiveApi) {
      try {
        if (allOrdinances.length === 0) {
          const res = await fetch(`${basePath}/data/ordinances.json`);
          if (res.ok) {
            rawItems = await res.json();
            setAllOrdinances(rawItems);
          }
        } else {
          rawItems = allOrdinances;
        }

        // Merge with local storage workspace modifications
        const localWs = getLocalWorkspace();
        const merged = rawItems.map(item => {
          if (localWs[item.id]) {
            return {
              ...item,
              is_scrapped: localWs[item.id].is_scrapped,
              memo: localWs[item.id].memo,
              review_status: localWs[item.id].review_status
            };
          }
          return item;
        });

        // Apply client-side filters
        let result = merged;

        if (filters.regions.length > 0) {
          result = result.filter(item => filters.regions.includes(item.org_name));
        }
        if (filters.change_type && filters.change_type !== '전체') {
          result = result.filter(item => item.change_type === filters.change_type);
        }
        if (filters.unenacted_only) {
          result = result.filter(item => item.is_busan_enacted === 0);
        }
        if (filters.keyword.trim()) {
          const kw = filters.keyword.trim().toLowerCase();
          result = result.filter(item => 
            item.title.toLowerCase().includes(kw) ||
            (item.reason && item.reason.toLowerCase().includes(kw)) ||
            (item.summary && item.summary.toLowerCase().includes(kw)) ||
            (item.dept_name && item.dept_name.toLowerCase().includes(kw))
          );
        }

        setTotalCount(result.length);
        const totalP = Math.ceil(result.length / filters.limit) || 1;
        setTotalPages(totalP);

        const startIdx = (filters.page - 1) * filters.limit;
        const pageItems = result.slice(startIdx, startIdx + filters.limit);
        setOrdinances(pageItems);

      } catch (e) {
        console.error('Error fetching static data:', e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [filters, allOrdinances]);

  // Fetch Workspace items
  const fetchWorkspaceItems = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        setWorkspaceItems(data.items || []);
        return;
      }
    } catch {}

    // Static fallback for GitHub Pages
    const localWs = getLocalWorkspace();
    const itemsToFilter = allOrdinances.length > 0 ? allOrdinances : ordinances;
    const ws = itemsToFilter.map(item => {
      if (localWs[item.id]) {
        return {
          ...item,
          is_scrapped: localWs[item.id].is_scrapped,
          memo: localWs[item.id].memo,
          review_status: localWs[item.id].review_status
        };
      }
      return item;
    }).filter(item => item.is_scrapped === 1 || (item.memo && item.memo.trim() !== ''));

    setWorkspaceItems(ws);
  }, [allOrdinances, ordinances]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchOrdinances();
    } else if (activeTab === 'workspace') {
      fetchWorkspaceItems();
    }
  }, [activeTab, fetchOrdinances, fetchWorkspaceItems]);

  // Toggle Scrap Bookmark
  const handleToggleScrap = async (ordId: number) => {
    let newScrapState = 1;
    const current = ordinances.find(i => i.id === ordId) || workspaceItems.find(i => i.id === ordId);
    if (current && current.is_scrapped) {
      newScrapState = 0;
    }

    try {
      const res = await fetch('/api/scraps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordinance_id: ordId })
      });
      if (res.ok) {
        const data = await res.json();
        newScrapState = data.is_scrapped;
      }
    } catch {}

    // Update LocalStorage for static deployment
    const localWs = getLocalWorkspace();
    localWs[ordId] = {
      is_scrapped: newScrapState,
      memo: localWs[ordId]?.memo || current?.memo || '',
      review_status: localWs[ordId]?.review_status || current?.review_status || '검토예정'
    };
    saveLocalWorkspace(localWs);

    // Update local state
    setOrdinances(prev => prev.map(item => item.id === ordId ? { ...item, is_scrapped: newScrapState } : item));
    if (selectedOrdinance && selectedOrdinance.id === ordId) {
      setSelectedOrdinance(prev => prev ? { ...prev, is_scrapped: newScrapState } : null);
    }
    fetchStats();
    fetchWorkspaceItems();
  };

  // Save Memo
  const handleSaveMemo = async (ordId: number, memo: string, status: string) => {
    try {
      const res = await fetch(`/api/memos/${ordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo, review_status: status })
      });
      if (res.ok) {}
    } catch {}

    // LocalStorage fallback for static host
    const localWs = getLocalWorkspace();
    const current = ordinances.find(i => i.id === ordId) || workspaceItems.find(i => i.id === ordId);
    localWs[ordId] = {
      is_scrapped: localWs[ordId]?.is_scrapped ?? current?.is_scrapped ?? 0,
      memo: memo,
      review_status: status
    };
    saveLocalWorkspace(localWs);

    setOrdinances(prev => prev.map(item => item.id === ordId ? { ...item, memo, review_status: status } : item));
    if (selectedOrdinance && selectedOrdinance.id === ordId) {
      setSelectedOrdinance(prev => prev ? { ...prev, memo, review_status: status } : null);
    }
    fetchStats();
    fetchWorkspaceItems();
  };

  // Trigger Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/trigger', { method: 'POST' });
      if (res.ok) {
        await fetchStats();
        await fetchOrdinances();
      }
    } catch (e) {
      console.error('Error triggering sync:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered Workspace Items
  const filteredWorkspace = workspaceItems.filter(item => {
    if (workspaceStatusFilter === '전체') return true;
    return item.review_status === workspaceStatusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: MONITORING DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filteredOrdinances={ordinances}
              totalCount={totalCount}
            />

            {/* Results Count & Current Filter Indicators */}
            <div className="flex items-center justify-between mb-4 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-sm">
                  총 <span className="text-blue-700 font-bold">{totalCount}</span>건의 조례 검색됨
                </span>
                {filters.unenacted_only && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    부산시 미제정/발굴 추천 필터 적용 중
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span>페이지 당 {filters.limit}개 보기</span>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-600">타시도 자치법규 데이터를 불러오는 중입니다...</p>
              </div>
            ) : ordinances.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
                <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">조건에 해당하는 조례가 없습니다.</h3>
                <p className="text-xs text-slate-500 mb-4">필터 조건이나 검색 키워드를 변경해보세요.</p>
                <button
                  onClick={() => setFilters({
                    regions: [],
                    change_type: '전체',
                    period: 'all',
                    keyword: '',
                    unenacted_only: false,
                    scrapped_only: false,
                    sort_by: 'promul_date',
                    sort_order: 'DESC',
                    page: 1,
                    limit: 12
                  })}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div>
                {/* View Switcher: Card View vs Table View */}
                {viewMode === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ordinances.map((ord) => (
                      <OrdinanceCard
                        key={ord.id}
                        ordinance={ord}
                        onSelect={setSelectedOrdinance}
                        onToggleScrap={handleToggleScrap}
                      />
                    ))}
                  </div>
                ) : (
                  <OrdinanceTable
                    ordinances={ordinances}
                    onSelect={setSelectedOrdinance}
                    onToggleScrap={handleToggleScrap}
                  />
                )}

                {/* Pagination Bar */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={filters.page === 1}
                      className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p = i + 1;
                        if (totalPages > 5 && filters.page > 3) {
                          p = filters.page - 2 + i;
                          if (p > totalPages) p = totalPages - (4 - i);
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              filters.page === p
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                      disabled={filters.page === totalPages}
                      className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERSONAL WORKSPACE (SCRAPS & MEMOS) */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            
            {/* Workspace Header Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs text-emerald-700 font-bold mb-1">
                  <Bookmark className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  <span>정책지원관 입법발굴 개인 보관함</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">스크랩 및 입법 검토의견 관리</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  관심 조례로 등록하거나 입법 메모를 작성한 조례 모음입니다 ({workspaceItems.length}건).
                </p>
              </div>

              {/* Status Filter buttons & Excel Export */}
              <div className="flex items-center flex-wrap gap-2">
                {['전체', '검토예정', '검토중', '발굴완료', '보류'].map(st => (
                  <button
                    key={st}
                    onClick={() => setWorkspaceStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      workspaceStatusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
                
                <button
                  onClick={() => exportOrdinancesToExcel(filteredWorkspace, "부산시의회_정책지원관_입법검토목록")}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all ml-2"
                >
                  보관함 엑셀 다운로드
                </button>
              </div>
            </div>

            {/* Workspace Items Grid */}
            {filteredWorkspace.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500">
                <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">보관된 조례가 없습니다.</h3>
                <p className="text-xs text-slate-500">대시보드에서 관심 조례를 스크랩하거나 검토 메모를 작성해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWorkspace.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded">
                            {ord.org_name}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded border">
                            {ord.change_type}
                          </span>
                          {ord.is_busan_enacted === 0 && (
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="w-3 h-3 fill-slate-950" />
                              부산시 미제정
                            </span>
                          )}
                        </div>

                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ord.review_status === '발굴완료' ? 'bg-emerald-100 text-emerald-800' :
                          ord.review_status === '검토중' ? 'bg-blue-100 text-blue-800' :
                          ord.review_status === '보류' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ord.review_status || '검토예정'}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedOrdinance(ord)}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer mb-2"
                      >
                        {ord.title}
                      </h3>

                      {ord.memo && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950 mb-3">
                          <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            정책지원관 검토의견
                          </div>
                          <p className="whitespace-pre-line text-[11.5px] leading-relaxed">
                            {ord.memo}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto text-xs">
                      <button
                        onClick={() => setSelectedOrdinance(ord)}
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        메모 수정 및 상세 보기
                      </button>

                      <button
                        onClick={() => handleToggleScrap(ord.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        스크랩 해제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Ordinance Detail & Memo Modal */}
      <DetailModal
        ordinance={selectedOrdinance}
        onClose={() => setSelectedOrdinance(null)}
        onSaveMemo={handleSaveMemo}
        onToggleScrap={handleToggleScrap}
      />

      {/* Sync Status & Trigger Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">부산광역시의회 입법정책 지원 시스템 | 타시도 조례 모니터링 & 신규 조례 발굴</p>
        <p className="mt-1 text-slate-400">국가법령정보센터 자치법규 Open API 연동 및 자동 일일 배치 동기화 지원</p>
      </footer>
    </div>
  );
}
