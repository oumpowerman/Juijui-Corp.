import React from 'react';
import { FolderKanban, History, Plus, X } from 'lucide-react';
import { PresetSelectorMode } from './types';

interface PresetSelectorHeaderProps {
    mode: PresetSelectorMode;
    totalPresets: number;
    onClose: () => void;
    onCreatePreset?: () => void;
}

export const PresetSelectorHeader: React.FC<PresetSelectorHeaderProps> = ({
    mode,
    totalPresets,
    onClose,
    onCreatePreset
}) => {
    const isWorkspaceMode = mode === 'WORKSPACE_SWITCHER';

    return (
        <div className="px-5 sm:px-6 py-4 bg-white/95 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                        isWorkspaceMode
                            ? 'bg-gradient-to-br from-slate-800 to-slate-950 text-emerald-400 border-slate-700'
                            : 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-indigo-500'
                    }`}
                >
                    {isWorkspaceMode ? (
                        <FolderKanban className="w-5 h-5" />
                    ) : (
                        <History className="w-5 h-5" />
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {isWorkspaceMode
                                ? 'เลือกกระดานหัวข้อ Checklist'
                                : 'กรองประวัติตามหัวข้อ Checklist'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold tabular-nums">
                            {totalPresets} หัวข้อ
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {isWorkspaceMode
                            ? 'ค้นหาและสลับไปยังหัวข้อ Checklist ที่ต้องการตรวจสอบได้ทันที'
                            : 'เลือกดูประวัติการบันทึกเฉพาะหัวข้อที่ต้องการ หรือเลือกดูทุกหัวข้อรวมกัน'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {isWorkspaceMode && onCreatePreset && (
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onCreatePreset();
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>สร้างหัวข้อใหม่</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="ปิดหน้าต่าง (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
