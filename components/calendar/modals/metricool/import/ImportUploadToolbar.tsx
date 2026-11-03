import React from 'react';
import { Upload, FileText, RefreshCw, Wand2, CheckCircle2 } from 'lucide-react';
import { Channel } from '../../../../../types';

interface ImportUploadToolbarProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    importedFileName: string;
    detectedHeadersCount: number;
    parsedRowsCount: number;
    channels: Channel[];
    importDefaultChannelId: string;
    setImportDefaultChannelId: (id: string) => void;
    importDefaultStatus: string;
    setImportDefaultStatus: (status: string) => void;
    contentStatuses: { key: string; label: string }[];
    isRunningAiMatch: boolean;
    aiMatchProgress: { current: number; total: number } | null;
    showPasteBox: boolean;
    setShowPasteBox: React.Dispatch<React.SetStateAction<boolean>>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRunAiSmartMatch: () => Promise<void>;
}

export const ImportUploadToolbar: React.FC<ImportUploadToolbarProps> = React.memo(({
    fileInputRef,
    importedFileName,
    detectedHeadersCount,
    parsedRowsCount,
    channels,
    importDefaultChannelId,
    setImportDefaultChannelId,
    importDefaultStatus,
    setImportDefaultStatus,
    contentStatuses,
    isRunningAiMatch,
    aiMatchProgress,
    showPasteBox,
    setShowPasteBox,
    handleFileChange,
    handleRunAiSmartMatch
}) => {
    return (
        <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#EDF3EF] px-4 py-3 rounded-2xl border border-[#D4E2D8]">
            {/* Left Side: Upload & Paste Action Buttons */}
            <div className="flex flex-col justify-center min-w-0">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#567A63] hover:bg-[#476853] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>เลือกไฟล์ CSV จาก Metricool</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowPasteBox(prev => !prev)}
                        className="px-3.5 py-2 bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#5A5044] border border-[#DED4C6] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                        <FileText className="w-3.5 h-3.5 text-[#567A63] shrink-0" />
                        <span>{showPasteBox ? 'ซ่อนกล่องวางข้อความ CSV' : 'วางข้อมูล CSV โดยตรง'}</span>
                    </button>

                    {parsedRowsCount > 0 && (
                        <button
                            type="button"
                            onClick={() => handleRunAiSmartMatch()}
                            disabled={isRunningAiMatch}
                            className="px-3.5 py-2 bg-[#B5725A] hover:bg-[#9E5F48] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-60"
                        >
                            {isRunningAiMatch ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                            ) : (
                                <Wand2 className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="tabular-nums">
                                {isRunningAiMatch
                                    ? aiMatchProgress && aiMatchProgress.total > 1
                                        ? `AI กำลังวิเคราะห์ชุดที่ ${aiMatchProgress.current}/${aiMatchProgress.total}...`
                                        : 'AI กำลังวิเคราะห์คำใกล้เคียง...'
                                    : 'ให้ AI ช่วยจับคู่ซ้ำอีกครั้ง'}
                            </span>
                        </button>
                    )}
                </div>

                {importedFileName && (
                    <p className="text-xs font-semibold text-[#3F634D] mt-1.5 flex items-center gap-1.5 truncate tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4E7A5E] shrink-0" />
                        <span className="truncate">
                            ไฟล์: {importedFileName} ({parsedRowsCount} รายการ | ตรวจพบ {detectedHeadersCount} คอลัมน์)
                        </span>
                    </p>
                )}
            </div>

            {/* Right Side: Side-by-Side Channel & Status Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t lg:border-t-0 lg:border-l border-[#D4E2D8] lg:pl-4 pt-2.5 lg:pt-0 lg:min-w-[360px] shrink-0">
                <div>
                    <label className="text-[11px] font-bold text-[#5A5044] block mb-1">
                        ช่องสำหรับนำเข้า (Channel)
                    </label>
                    <select
                        value={importDefaultChannelId}
                        onChange={e => setImportDefaultChannelId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#567A63]/30"
                    >
                        <option value="">-- ไม่ระบุช่อง --</option>
                        {channels.map(ch => (
                            <option key={ch.id} value={ch.id}>
                                {ch.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-[#5A5044] block mb-1">
                        สถานะของการ์ดที่สร้างใหม่
                    </label>
                    <select
                        value={importDefaultStatus}
                        onChange={e => setImportDefaultStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#567A63]/30"
                    >
                        {contentStatuses.map(st => (
                            <option key={st.key} value={st.key}>
                                {st.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
});

export default ImportUploadToolbar;
