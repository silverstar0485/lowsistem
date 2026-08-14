'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Key, History, CheckCircle, AlertCircle } from 'lucide-react';
import { SyncLog } from '@/lib/types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
}

export default function SyncModal({ isOpen, onClose, onTriggerSync, isSyncing }: SyncModalProps) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/sync/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSync = async () => {
    await onTriggerSync();
    await fetchLogs();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">일일 데이터 수집 & 동기화 상태</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-800">
          
          {/* Manual Trigger Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-blue-900 text-sm">실시간 조례 수집 실행</h4>
              <p className="text-blue-700 text-xs mt-0.5">
                매일 오전 08:00 AM 정기 스케줄러 실행 외 수동 갱신을 수행합니다.
              </p>
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '수집 중...' : '지금 수집하기'}</span>
            </button>
          </div>

          {/* API Key Configuration */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Key className="w-4 h-4 text-slate-500" />
                국가법령정보센터 자치법규 Open API Key (OC)
              </label>
              <span className="text-[11px] text-slate-400">미설정 시 모의 시뮬레이터 구동</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="국가법령정보센터 발급 API Key 입력 (선택)"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setSaveStatus('저장되었습니다 (로컬 세션)')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
              >
                설정 저장
              </button>
            </div>
            {saveStatus && <p className="text-[11px] text-emerald-600 font-medium">{saveStatus}</p>}
          </div>

          {/* Recent Sync Execution History */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2.5 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              최근 데이터 수집 이력 (Sync Logs)
            </h4>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-4 text-center text-slate-400">수집 기록이 없습니다.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-white flex items-start justify-between text-xs hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        {log.status === 'SUCCESS' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> 성공
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> 실패
                          </span>
                        )}
                        <span className="font-mono text-slate-500">{log.sync_date}</span>
                      </div>
                      <p className="text-slate-700 text-[11.5px]">{log.message}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ml-2">
                      +{log.items_added}건
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
