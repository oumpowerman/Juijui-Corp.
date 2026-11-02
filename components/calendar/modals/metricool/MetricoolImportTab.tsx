import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    RefreshCw,
    Wand2,
    CheckCircle2,
    PlusCircle,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Task, Channel } from '../../../../types';
import { ParsedMetricoolRow } from '../../../../utils/metricoolCsv';
import { PLATFORM_BADGE_STYLE, collapsibleDrawerVariants } from './constants';

interface MetricoolImportTabProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    importedFileName: string;
    detectedHeaders: string[];
    parsedRows: ParsedMetricoolRow[];
    channels: Channel[];
    tasks: Task[];
    nearbyTasks: Task[];
    importDefaultChannelId: string;
    setImportDefaultChannelId: (id: string) => void;
    importDefaultStatus: string;
    setImportDefaultStatus: (status: string) => void;
    contentStatuses: { key: string; label: string }[];
    isRunningAiMatch: boolean;
    showPasteBox: boolean;
    setShowPasteBox: React.Dispatch<React.SetStateAction<boolean>>;
    rawCsvPaste: string;
    setRawCsvPaste: (val: string) => void;
    importSummary: { updateCount: number; createCount: number; skipCount: number };
    processCsvText: (text: string, sourceName: string) => Promise<void>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRunAiSmartMatch: () => Promise<void>;
    handleRowActionChange: (rowIndex: number, action: 'UPDATE' | 'CREATE' | 'SKIP') => void;
    handleRowTargetTaskChange: (rowIndex: number, taskId: string) => void;
}

export const MetricoolImportTab: React.FC<MetricoolImportTabProps> = React.memo(({
    fileInputRef,
    importedFileName,
    detectedHeaders,
    parsedRows,
    channels,
    tasks,
    nearbyTasks,
    importDefaultChannelId,
    setImportDefaultChannelId,
    importDefaultStatus,
    setImportDefaultStatus,
    contentStatuses,
    isRunningAiMatch,
    showPasteBox,
    setShowPasteBox,
    rawCsvPaste,
    setRawCsvPaste,
    importSummary,
    processCsvText,
    handleFileChange,
    handleRunAiSmartMatch,
    handleRowActionChange,
    handleRowTargetTaskChange
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
            {/* 1. Pinned Upload & Default Settings Bar (flex-shrink-0) */}
            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-indigo-50/50 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 dark:border-slate-800">
                <div className="md:col-span-2 flex flex-col justify-center">
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
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Upload className="w-4 h-4" />
                            <span>เลือกไฟล์ CSV จาก Metricool</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowPasteBox(prev => !prev)}
                            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                        >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{showPasteBox ? 'ซ่อนกล่องวางข้อความ CSV' : 'วางข้อมูล CSV โดยตรง'}</span>
                        </button>

                        {parsedRows.length > 0 && (
                            <button
                                type="button"
                                onClick={() => handleRunAiSmartMatch()}
                                disabled={isRunningAiMatch}
                                className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-60"
                            >
                                {isRunningAiMatch ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Wand2 className="w-3.5 h-3.5" />
                                )}
                                <span>
                                    {isRunningAiMatch ? 'AI กำลังวิเคราะห์คำตกสระ...' : 'ให้ AI ช่วยจับคู่ซ้ำอีกครั้ง'}
                                </span>
                            </button>
                        )}
                    </div>

                    {importedFileName && (
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mt-2 flex items-center gap-1.5 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">
                                ไฟล์: {importedFileName} ({parsedRows.length} รายการ | ตรวจพบ {detectedHeaders.length} คอลัมน์)
                            </span>
                        </p>
                    )}
                </div>

                {/* Default Channel & Status for Newly Created Items */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 border-t md:border-t-0 md:border-l border-indigo-100 dark:border-slate-700 md:pl-4 pt-2.5 md:pt-0">
                    <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                            ช่องเริ่มต้น (กรณีไม่ระบุ Brand)
                        </label>
                        <select
                            value={importDefaultChannelId}
                            onChange={e => setImportDefaultChannelId(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
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
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                            สถานะของการ์ดที่สร้างใหม่
                        </label>
                        <select
                            value={importDefaultStatus}
                            onChange={e => setImportDefaultStatus(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
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

            {/* 2. Animated Collapsible Raw CSV Paste Drawer (flex-shrink-0) */}
            <AnimatePresence initial={false}>
                {showPasteBox && (
                    <motion.div
                        key="csv-paste-drawer"
                        variants={collapsibleDrawerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-shrink-0 overflow-hidden"
                    >
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                วางข้อความ CSV หรือหัวคอลัมน์จาก Metricool ที่นี่:
                            </label>
                            <textarea
                                rows={3}
                                value={rawCsvPaste}
                                onChange={e => setRawCsvPaste(e.target.value)}
                                placeholder={'Text,Date,Time,Draft,Brand Name,Facebook,Instagram,TikTok,YouTube...\n"แคปชันคลิป #รีวิว",2026-11-05,18:00:00,false,"ช่องหลัก",TRUE,TRUE,TRUE,TRUE'}
                                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (rawCsvPaste.trim()) {
                                            processCsvText(rawCsvPaste.trim(), 'ข้อมูลที่วางจากคลิปบอร์ด');
                                            setShowPasteBox(false);
                                        }
                                    }}
                                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    แปลงข้อมูล CSV
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Full-Height Stretching Preview Table or Dropzone (flex-1 min-h-0) */}
            {parsedRows.length === 0 ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50/70 dark:bg-slate-800/30 hover:bg-indigo-50/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer transition-all"
                >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3 shadow-2xs">
                        <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        คลิกเพื่ออัปโหลดไฟล์ `.csv` จาก Metricool
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-lg">
                        ระบบจะตรวจสอบชื่อคลิปและวันที่เทียบกับตารางใน CalendarView อัตโนมัติ หากชื่อตกสระหรือพิมพ์คลาดเคลื่อนเล็กน้อย ระบบ AI จะช่วยจับคู่เข้ากับการ์ดเดิมให้โดยไม่สร้างซ้ำ
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
                    {/* Match Stats Pills (flex-shrink-0) */}
                    <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                                อัปเดตการ์ดเดิม: {importSummary.updateCount} รายการ
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                                สร้างการ์ดใหม่: {importSummary.createCount} รายการ
                            </span>
                            {importSummary.skipCount > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                    ข้าม: {importSummary.skipCount} รายการ
                                </span>
                            )}
                        </div>

                        {isRunningAiMatch && (
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Gemini AI กำลังช่วยเทียบชื่อคลิปที่สระตกหล่น...</span>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Table Container Filling Remaining Space (flex-1 min-h-0) */}
                    <div className="flex-1 min-h-0 flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="py-2.5 px-3">วัน-เวลาใน CSV</th>
                                        <th className="py-2.5 px-3">ข้อมูลจาก Metricool CSV</th>
                                        <th className="py-2.5 px-3">ผลการจับคู่ (Smart Match)</th>
                                        <th className="py-2.5 px-3">การทำงาน (Action)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {parsedRows.map(row => {
                                        const matchedTask = row.matchedTaskId
                                            ? tasks.find(t => t.id === row.matchedTaskId)
                                            : undefined;

                                        return (
                                            <tr
                                                key={row.rowIndex}
                                                className={`transition-colors ${
                                                    row.action === 'SKIP'
                                                        ? 'bg-slate-50/60 opacity-50'
                                                        : row.action === 'UPDATE'
                                                        ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                                        : 'bg-white hover:bg-emerald-50/20'
                                                }`}
                                            >
                                                {/* Date & Time */}
                                                <td className="py-3 px-3 whitespace-nowrap align-top">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                                        {format(row.parsedDate, 'dd/MM/yyyy')}
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-indigo-600">
                                                        เวลา {row.scheduledTime} น.
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {row.targetPlatforms.map(p => {
                                                            const badge = PLATFORM_BADGE_STYLE[p] || {
                                                                label: p,
                                                                bg: 'bg-gray-100 border-gray-200',
                                                                text: 'text-gray-700'
                                                            };
                                                            return (
                                                                <span
                                                                    key={p}
                                                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badge.bg} ${badge.text}`}
                                                                >
                                                                    {badge.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>

                                                {/* CSV Title & Caption */}
                                                <td className="py-3 px-3 max-w-[260px] align-top">
                                                    <div className="font-bold text-slate-900 dark:text-white break-words">
                                                        {row.title}
                                                    </div>
                                                    {row.description && row.description !== row.title && (
                                                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                                            {row.description}
                                                        </div>
                                                    )}
                                                    {row.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {row.tags.slice(0, 4).map(t => (
                                                                <span
                                                                    key={t}
                                                                    className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded"
                                                                >
                                                                    #{t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Match Status & Reason */}
                                                <td className="py-3 px-3 max-w-[260px] align-top">
                                                    {row.action === 'UPDATE' && matchedTask ? (
                                                        <div className="space-y-1">
                                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                {row.matchType === 'AI_SEMANTIC' ? (
                                                                    <>
                                                                        <Sparkles className="w-3 h-3 text-indigo-600" />
                                                                        <span>AI จับคู่ให้ ({row.matchConfidence}%)</span>
                                                                    </>
                                                                ) : row.matchType === 'THAI_FUZZY' ? (
                                                                    <>
                                                                        <Wand2 className="w-3 h-3 text-amber-700" />
                                                                        <span>จับคู่คำใกล้เคียง ({row.matchConfidence}%)</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                        <span>ตรงกับการ์ดเดิม</span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                                <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                                                                <span className="truncate">{matchedTask.title}</span>
                                                            </div>

                                                            {row.matchReason && (
                                                                <div className="text-[10px] text-slate-500">
                                                                    {row.matchReason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : row.action === 'CREATE' ? (
                                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <PlusCircle className="w-3.5 h-3.5" />
                                                            <span>ไม่ซ้ำ — สร้างการ์ดใหม่</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-slate-400">
                                                            ข้ามรายการนี้
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action Override Controls */}
                                                <td className="py-3 px-3 align-top space-y-1.5 min-w-[190px]">
                                                    <select
                                                        value={row.action}
                                                        onChange={e =>
                                                            handleRowActionChange(
                                                                row.rowIndex,
                                                                e.target.value as 'UPDATE' | 'CREATE' | 'SKIP'
                                                            )
                                                        }
                                                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                                    >
                                                        <option value="UPDATE">อัปเดตการ์ดเดิม</option>
                                                        <option value="CREATE">สร้างเป็นการ์ดใหม่</option>
                                                        <option value="SKIP">ข้าม (ไม่นำเข้า)</option>
                                                    </select>

                                                    {row.action === 'UPDATE' && (
                                                        <select
                                                            value={row.matchedTaskId || ''}
                                                            onChange={e =>
                                                                handleRowTargetTaskChange(row.rowIndex, e.target.value)
                                                            }
                                                            className="w-full px-2 py-1 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                                                        >
                                                            <option value="">-- เลือกการ์ดที่ต้องการอัปเดต --</option>
                                                            {nearbyTasks.map(t => {
                                                                const td = t.endDate instanceof Date ? t.endDate : new Date(t.endDate);
                                                                return (
                                                                    <option key={t.id} value={t.id}>
                                                                        [{isValid(td) ? format(td, 'dd/MM') : '-'}] {t.title.slice(0, 38)}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default MetricoolImportTab;
