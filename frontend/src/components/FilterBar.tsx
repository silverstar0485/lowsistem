'use client';

import React, { useState } from 'react';
import { Search, Sparkles, LayoutGrid, Table, Download, Filter, X, Check } from 'lucide-react';
import { FilterState, Ordinance } from '@/lib/types';
import { exportOrdinancesToExcel } from '@/lib/exportExcel';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  filteredOrdinances: Ordinance[];
  totalCount: number;
}

const REGIONS_LIST = [
  "서울특별시", "경기도", "인천광역시", "대구광역시", "대전광역시",
  "광주광역시", "울산광역시", "세종특별자치시", "강원특별자치도", "충청북도",
  "충청남도", "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
];

const CHANGE_TYPES = ["전체", "제정", "일부개정", "전부개정", "폐지"];
const PERIODS = [
  { label: "전체", value: "all" },
  { label: "최근 1개월", value: "1m" },
  { label: "최근 3개월", value: "3m" },
  { label: "최근 6개월", value: "6m" },
  { label: "최근 1년", value: "1y" },
];

const POPULAR_KEYWORDS = ["생성형 AI", "청년", "인구감소", "해양", "소상공인", "자율주행", "디지털 성범죄", "전기차 안전", "고독사", "드론"];

export default function FilterBar({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  filteredOrdinances,
  totalCount
}: FilterBarProps) {
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const toggleRegion = (region: string) => {
    setFilters(prev => {
      const exists = prev.regions.includes(region);
      const updated = exists
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region];
      return { ...prev, regions: updated, page: 1 };
    });
  };

  const clearRegions = () => {
    setFilters(prev => ({ ...prev, regions: [], page: 1 }));
  };

  const handleKeywordClick = (kw: string) => {
    setFilters(prev => ({
      ...prev,
      keyword: prev.keyword === kw ? '' : kw,
      page: 1
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 transition-all">
      
      {/* Top Row: Search input + Primary Busan Unenacted Toggle + Export + View Switcher */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pb-3 border-b border-slate-100">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value, page: 1 }))}
            placeholder="조례명, 주요 내용, 제정이유 키워드 검색 (예: 청년, AI, 해양, 소상공인...)"
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400"
          />
          {filters.keyword && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, keyword: '', page: 1 }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {/* Busan Unenacted Core Highlight Toggle */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, unenacted_only: !prev.unenacted_only, page: 1 }))}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center space-x-1.5 shadow-xs ${
              filters.unenacted_only
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300/60 shadow-amber-200'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${filters.unenacted_only ? 'fill-slate-950' : 'text-amber-600'}`} />
            <span>부산시 미제정/발굴 추천만 보기</span>
            {filters.unenacted_only && <Check className="w-3.5 h-3.5 ml-1 stroke-[3]" />}
          </button>

          {/* Excel Export Button */}
          <button
            onClick={() => exportOrdinancesToExcel(filteredOrdinances)}
            className="px-3.5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀(.xlsx) 다운로드</span>
          </button>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 border border-slate-200">
            <button
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                viewMode === 'card' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>카드형</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>고밀도 표</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Detailed Filters (Regions Multi-select, Change Types, Period) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
        
        {/* Regions Multi-Select Dropdown */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            시·도 선택 ({filters.regions.length === 0 ? '전체 16개 시도' : `${filters.regions.length}개 선택됨`})
          </label>
          <button
            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            className="w-full text-left px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-all"
          >
            <span className="truncate text-slate-700 font-medium">
              {filters.regions.length === 0 ? '전체 시·도 (16개)' : filters.regions.join(', ')}
            </span>
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          </button>

          {showRegionDropdown && (
            <div className="absolute left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">16개 광역 시·도 선택</span>
                {filters.regions.length > 0 && (
                  <button onClick={clearRegions} className="text-[11px] text-blue-600 hover:underline">
                    초기화
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {REGIONS_LIST.map(r => {
                  const selected = filters.regions.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRegion(r)}
                      className={`text-left px-2 py-1 text-xs rounded transition-all flex items-center justify-between ${
                        selected
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{r}</span>
                      {selected && <Check className="w-3 h-3 text-blue-600 ml-1 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2 text-right">
                <button
                  onClick={() => setShowRegionDropdown(false)}
                  className="px-3 py-1 bg-slate-900 text-white text-xs rounded hover:bg-slate-800"
                >
                  적용 완료
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Change Type Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">제·개정 구분</label>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {CHANGE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFilters(prev => ({ ...prev, change_type: type, page: 1 }))}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition-all ${
                  filters.change_type === type
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Period Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">공포 기간</label>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setFilters(prev => ({ ...prev, period: p.value, page: 1 }))}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition-all ${
                  filters.period === p.value
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Popular Keyword Quick Chips */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center flex-wrap gap-1.5 text-xs">
        <span className="text-slate-400 text-[11px] font-medium mr-1">추천 정책 키워드:</span>
        {POPULAR_KEYWORDS.map(kw => {
          const active = filters.keyword === kw;
          return (
            <button
              key={kw}
              onClick={() => handleKeywordClick(kw)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all ${
                active
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              #{kw}
            </button>
          );
        })}
      </div>
    </div>
  );
}
