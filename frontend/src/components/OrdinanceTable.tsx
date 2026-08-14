'use client';

import React from 'react';
import { Sparkles, Bookmark, ExternalLink, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Ordinance } from '@/lib/types';

interface OrdinanceTableProps {
  ordinances: Ordinance[];
  onSelect: (ord: Ordinance) => void;
  onToggleScrap: (id: number) => void;
}

export default function OrdinanceTable({ ordinances, onSelect, onToggleScrap }: OrdinanceTableProps) {
  if (ordinances.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        조회된 조례 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-700">
              <th className="py-3 px-4 w-12 text-center">스크랩</th>
              <th className="py-3 px-4 w-28">시·도명</th>
              <th className="py-3 px-4 min-w-[280px]">조례명</th>
              <th className="py-3 px-4 w-24 text-center">구분</th>
              <th className="py-3 px-4 w-28">공포일자</th>
              <th className="py-3 px-4 w-44">부산시 유무</th>
              <th className="py-3 px-4 min-w-[180px]">소관부서</th>
              <th className="py-3 px-4 w-28 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
            {ordinances.map((ord) => {
              const isUnenacted = ord.is_busan_enacted === 0;
              return (
                <tr
                  key={ord.id}
                  onClick={() => onSelect(ord)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    isUnenacted ? 'bg-amber-50/10' : ''
                  }`}
                >
                  {/* Scrap Bookmark */}
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleScrap(ord.id)}
                      className={`p-1 rounded transition-colors ${
                        ord.is_scrapped ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-500'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${ord.is_scrapped ? 'fill-amber-500' : ''}`} />
                    </button>
                  </td>

                  {/* Region */}
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span className="bg-slate-900 text-white text-[11px] px-2 py-0.5 rounded font-mono">
                      {ord.org_name}
                    </span>
                  </td>

                  {/* Title & Memo indicator */}
                  <td className="py-3 px-4 font-bold text-slate-900 hover:text-blue-600">
                    <div className="flex items-center space-x-1.5">
                      <span>{ord.title}</span>
                      {ord.memo && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-normal shrink-0">
                          메모
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Change Type */}
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      ord.change_type === '제정'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {ord.change_type}
                    </span>
                  </td>

                  {/* Promul Date */}
                  <td className="py-3 px-4 font-mono text-slate-600">{ord.promul_date}</td>

                  {/* Busan Unenacted status */}
                  <td className="py-3 px-4">
                    {isUnenacted ? (
                      <span className="bg-amber-500 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3 fill-slate-950" />
                        미제정/발굴추천
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        기제정
                      </span>
                    )}
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                    {ord.dept_name || '-'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelect(ord)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="검토 의견 작성 및 상세보기"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    {ord.full_text_url && (
                      <a
                        href={ord.full_text_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded inline-block"
                        title="원문 보기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
