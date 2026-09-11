import React from 'react';
import { CheckCircle2, Clock, X, ExternalLink, AlertCircle } from 'lucide-react';
import { FullSyncSummary } from '../types';

interface SyncResultSummaryModalProps {
    result: FullSyncSummary | null;
    onClose: () => void;
}

export const SyncResultSummaryModal: React.FC<SyncResultSummaryModalProps> = ({
    result,
    onClose
}) => {
    if (!result) return null;

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                            ผลการทดสอบซิงค์ล่าสุด (Live Test Summary)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                            เวลาที่ใช้: {result.durationMs}ms ({new Date(result.timestamp).toLocaleTimeString('th-TH')})
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <span className="text-slate-500 font-medium">ช่องที่ตรวจสอบ</span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{result.totalChannelsChecked}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80">
                    <span className="text-emerald-700 font-medium">อัปเดตยอดใหม่</span>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">{result.totalChannelsUpdated}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200/80">
                    <span className="text-indigo-700 font-medium">ประเภทการยิง</span>
                    <p className="text-lg font-black text-indigo-700 mt-0.5 uppercase">{result.triggeredBy}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200/80">
                    <span className="text-purple-700 font-medium">ระยะเวลา</span>
                    <p className="text-lg font-black text-purple-700 mt-0.5 font-mono">{(result.durationMs / 1000).toFixed(1)}s</p>
                </div>
            </div>

            {/* List of checked channels in this run */}
            {result.results && result.results.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                    {result.results.map((ch, idx) => (
                        <div key={ch.channelId || idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs">
                            <span className="font-bold text-slate-800">{ch.channelName}</span>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    ch.updated ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {ch.updated ? '✨ มีการเปลี่ยนแปลง' : 'คงเดิม'}
                                </span>
                                <span className="font-mono text-slate-700 font-bold">
                                    {(ch.totalFollowers || 0).toLocaleString()} รวม
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
