'use client';

import React from 'react';
import { Building2, Sparkles, RefreshCw, Bookmark, Landmark, Layers } from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface HeaderProps {
  stats: DashboardStats | null;
  activeTab: 'dashboard' | 'workspace' | 'busan_master';
  setActiveTab: (tab: 'dashboard' | 'workspace' | 'busan_master') => void;
  onOpenSyncModal: () => void;
  isSyncing: boolean;
}

export default function Header({ stats, activeTab, setActiveTab, onOpenSyncModal, isSyncing }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  부산광역시의회 입법정책 지원
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">
                  자동 배치 시스템 v1.0
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                타시도 조례 모니터링 & 신규 조례 발굴 시스템
              </h1>
            </div>
          </div>

          {/* KPI Stats Counters */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-slate-400">수집 조례</div>
                <div className="text-sm font-bold text-white">{stats?.total_ordinances ?? 0}건</div>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg px-3 py-2 flex items-center space-x-2 ring-1 ring-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <div className="text-amber-300 font-medium">부산시 미제정/발굴 추천</div>
                <div className="text-sm font-extrabold text-amber-200">{stats?.busan_unenacted ?? 0}건</div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-slate-400">관심/스크랩</div>
                <div className="text-sm font-bold text-emerald-300">{stats?.scrapped_count ?? 0}건</div>
              </div>
            </div>

            {/* Sync Refresh Action */}
            <button
              onClick={onOpenSyncModal}
              disabled={isSyncing}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">일일 데이터 수집</span>
              <span className="sm:hidden">수집</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-2 pb-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>타시도 조례 모니터링 대시보드</span>
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>정책지원관 워크스페이스 ({stats?.scrapped_count ?? 0})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
