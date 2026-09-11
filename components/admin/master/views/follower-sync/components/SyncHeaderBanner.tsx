import React from 'react';
import { Sparkles, Play, Save } from 'lucide-react';

interface SyncHeaderBannerProps {
    isTesting: boolean;
    isSaving: boolean;
    onTestSyncNow: () => void;
    onSave: () => void;
}

export const SyncHeaderBanner: React.FC<SyncHeaderBannerProps> = ({
    isTesting,
    isSaving,
    onTestSyncNow,
    onSave
}) => {
    return (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden border border-indigo-500/20">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Channel Reach & Cron Optimizer</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        ระบบอัปเดตยอดผู้ติดตามอัตโนมัติ (Auto-Sync)
                    </h2>
                    <p className="text-indigo-200/80 text-sm leading-relaxed">
                        ปรับแต่งตารางเวลา เลือกเฉพาะช่องและแพลตฟอร์มที่ต้องการให้อัปเดต พร้อมระบบคำนวณและประหยัด Bandwidth เครือข่าย
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={onTestSyncNow}
                        disabled={isTesting || isSaving}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Play className={`w-4 h-4 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบซิงค์ตอนนี้'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving || isTesting}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
