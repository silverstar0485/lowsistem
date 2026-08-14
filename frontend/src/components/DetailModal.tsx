'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Bookmark, Save, FileText, CheckCircle2, Building, Calendar, Hash } from 'lucide-react';
import { Ordinance } from '@/lib/types';

interface DetailModalProps {
  ordinance: Ordinance | null;
  onClose: () => void;
  onSaveMemo: (ordId: number, memo: string, status: string) => Promise<void>;
  onToggleScrap: (ordId: number) => void;
}

const REVIEW_STATUSES = ["검토예정", "검토중", "발굴완료", "보류"];

export default function DetailModal({ ordinance, onClose, onSaveMemo, onToggleScrap }: DetailModalProps) {
  const [memoText, setMemoText] = useState('');
  const [status, setStatus] = useState('검토예정');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ordinance) {
      setMemoText(ordinance.memo || '');
      setStatus(ordinance.review_status || '검토예정');
    }
  }, [ordinance]);

  if (!ordinance) return null;

  const isUnenacted = ordinance.is_busan_enacted === 0;

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveMemo(ordinance.id, memoText, status);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div className="pr-6">
            <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
              <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                {ordinance.org_name}
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-medium px-2 py-0.5 rounded border border-slate-700">
                {ordinance.change_type}
              </span>
              {isUnenacted ? (
                <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  부산시 미제정/발굴 추천
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  부산시 기제정
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{ordinance.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-slate-400">공포일자</div>
                <div className="font-semibold text-slate-800">{ordinance.promul_date}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-slate-400">공포번호</div>
                <div className="font-semibold text-slate-800">{ordinance.promul_no || '-'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
              <Building className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-slate-400">소관부서 / 상임위</div>
                <div className="font-semibold text-slate-800 truncate">{ordinance.dept_name || '-'}</div>
              </div>
            </div>
          </div>

          {/* Busan Gap Analysis Box */}
          <div className={`p-4 rounded-xl border ${
            isUnenacted 
              ? 'bg-amber-500/10 border-amber-300 text-amber-950' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="font-bold mb-1 flex items-center gap-2 text-sm">
              <Sparkles className={`w-4 h-4 ${isUnenacted ? 'text-amber-600' : 'text-slate-500'}`} />
              부산광역시 조례 대조 & 입법 Gap 분석 결과
            </div>
            <p className="text-xs font-semibold mb-2">{ordinance.busan_match_reason}</p>
            {ordinance.legislative_points && (
              <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80 text-xs whitespace-pre-line leading-relaxed text-slate-700">
                {ordinance.legislative_points}
              </div>
            )}
          </div>

          {/* Enactment Rationale & Summary */}
          {ordinance.reason && (
            <div>
              <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-xs text-blue-800">
                <FileText className="w-3.5 h-3.5" />
                제·개정 이유
              </h4>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {ordinance.reason}
              </p>
            </div>
          )}

          {ordinance.summary && (
            <div>
              <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-xs text-blue-800">
                <FileText className="w-3.5 h-3.5" />
                주요 내용 요약
              </h4>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {ordinance.summary}
              </p>
            </div>
          )}

          {/* Personal Workspace & Memo Editor Section */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-600" />
                정책지원관 개인 워크스페이스 메모
              </h3>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-slate-600">검토 상태:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {REVIEW_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="예: 2026년 하반기 회기 발굴 검토 안건 (소관 상임위: 기획재경위원회, 주요 참고사항 적시)"
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder-slate-400"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => onToggleScrap(ordinance.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center space-x-1.5 ${
                  ordinance.is_scrapped
                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${ordinance.is_scrapped ? 'fill-amber-600' : ''}`} />
                <span>{ordinance.is_scrapped ? '관심 조례 스크랩됨' : '관심 조례 스크랩 등록'}</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? '저장 중...' : '메모 저장하기'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          {ordinance.full_text_url ? (
            <a
              href={ordinance.full_text_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline"
            >
              <span>국가법령정보센터 조례 전문 보기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
