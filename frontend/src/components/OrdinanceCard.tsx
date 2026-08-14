'use client';

import React from 'react';
import { Sparkles, Bookmark, ExternalLink, MessageSquare, Calendar, Building, FileText, CheckCircle2 } from 'lucide-react';
import { Ordinance } from '@/lib/types';

interface OrdinanceCardProps {
  ordinance: Ordinance;
  onSelect: (ord: Ordinance) => void;
  onToggleScrap: (id: number) => void;
}

export default function OrdinanceCard({ ordinance, onSelect, onToggleScrap }: OrdinanceCardProps) {
  const isUnenacted = ordinance.is_busan_enacted === 0;

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between p-5 relative overflow-hidden ${
      isUnenacted 
        ? 'border-amber-300/80 ring-1 ring-amber-400/20 bg-gradient-to-b from-amber-50/20 to-white' 
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Region Badge */}
            <span className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
              {ordinance.org_name}
            </span>

            {/* Change Type Badge */}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
              ordinance.change_type === '제정'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {ordinance.change_type}
            </span>

            {/* Busan Unenacted Core Tag */}
            {isUnenacted ? (
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs ring-1 ring-amber-400">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                부산시 미제정/발굴 추천
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                부산시 기제정
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleScrap(ordinance.id);
            }}
            className={`p-1.5 rounded-lg transition-all ${
              ordinance.is_scrapped
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}
            title={ordinance.is_scrapped ? '스크랩 취소' : '관심 조례 스크랩'}
          >
            <Bookmark className={`w-4 h-4 ${ordinance.is_scrapped ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Ordinance Title */}
        <h3
          onClick={() => onSelect(ordinance)}
          className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors line-clamp-2 mb-2 leading-snug"
        >
          {ordinance.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center space-x-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>공포일: {ordinance.promul_date}</span>
          </span>
          {ordinance.dept_name && (
            <span className="flex items-center space-x-1 truncate max-w-[180px]">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{ordinance.dept_name}</span>
            </span>
          )}
        </div>

        {/* Legislative Insights 3-line Summary Box */}
        {ordinance.legislative_points && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1 mb-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-[11px] text-blue-700">
              <FileText className="w-3.5 h-3.5" />
              입법 시사점 & 주요 내용 (정책지원관 요약)
            </div>
            <p className="whitespace-pre-line text-slate-600 leading-relaxed text-[11.5px] line-clamp-3">
              {ordinance.legislative_points}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        <button
          onClick={() => onSelect(ordinance)}
          className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>상세검토 및 메모</span>
          {ordinance.memo && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
              메모보유
            </span>
          )}
        </button>

        {ordinance.full_text_url && (
          <a
            href={ordinance.full_text_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 hover:underline"
          >
            <span>조례 전문</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
