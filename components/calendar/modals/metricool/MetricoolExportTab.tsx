import React from 'react';
import { Calendar, Filter, Clock, Check } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Task, Channel } from '../../../../types';
import {
    PLATFORM_BADGE_STYLE,
    ExportRangeMode,
    ExportStatusScope,
    ImportDraftMode
} from './constants';

interface MetricoolExportTabProps {
    currentDate: Date;
    channels: Channel[];
    exportRangeMode: ExportRangeMode;
    setExportRangeMode: (mode: ExportRangeMode) => void;
    customStartDate: string;
    setCustomStartDate: (val: string) => void;
    customEndDate: string;
    setCustomEndDate: (val: string) => void;
    exportChannelId: string;
    setExportChannelId: (id: string) => void;
    exportStatusScope: ExportStatusScope;
    setExportStatusScope: (scope: ExportStatusScope) => void;
    defaultExportTime: string;
    setDefaultExportTime: (time: string) => void;
    importAsDraftMode: ImportDraftMode;
    setImportAsDraftMode: (mode: ImportDraftMode) => void;
    includeTagsInCaption: boolean;
    setIncludeTagsInCaption: (val: boolean) => void;
    exportCandidateTasks: Task[];
    selectedExportTasks: Task[];
    excludedTaskIds: Set<string>;
    toggleExportTask: (id: string) => void;
    toggleSelectAllExportTasks: () => void;
}

export const MetricoolExportTab: React.FC<MetricoolExportTabProps> = React.memo(({
    currentDate,
    channels,
    exportRangeMode,
    setExportRangeMode,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    exportChannelId,
    setExportChannelId,
    exportStatusScope,
    setExportStatusScope,
    defaultExportTime,
    setDefaultExportTime,
    importAsDraftMode,
    setImportAsDraftMode,
    includeTagsInCaption,
    setIncludeTagsInCaption,
    exportCandidateTasks,
    selectedExportTasks,
    excludedTaskIds,
    toggleExportTask,
    toggleSelectAllExportTasks
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
            {/* 1. Pinned Top Filter & Settings Bar (flex-shrink-0) */}
            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/90 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                {/* Column 1: Date Range */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        ช่วงเวลาที่ต้องการส่งออก
                    </label>
                    <select
                        value={exportRangeMode}
                        onChange={e => setExportRangeMode(e.target.value as ExportRangeMode)}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    >
                        <option value="CURRENT_MONTH">
                            ทั้งเดือนที่เปิดอยู่ ({format(currentDate || new Date(), 'MMM yyyy')})
                        </option>
                        <option value="NEXT_7_DAYS">7 วันข้างหน้า (นับจากวันนี้)</option>
                        <option value="CUSTOM">กำหนดช่วงวันที่เอง</option>
                    </select>

                    {exportRangeMode === 'CUSTOM' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                                <span className="text-[10px] font-semibold text-slate-500">ตั้งแต่</span>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={e => setCustomStartDate(e.target.value)}
                                    className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-slate-500">ถึงวันที่</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={e => setCustomEndDate(e.target.value)}
                                    className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Channel & Status Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-indigo-500" />
                        กรองช่อง (Channel) และสถานะ
                    </label>
                    <select
                        value={exportChannelId}
                        onChange={e => setExportChannelId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                        <option value="ALL">ทุกช่อง (All Channels)</option>
                        {channels.map(ch => (
                            <option key={ch.id} value={ch.id}>
                                {ch.name} {ch.code ? `(${ch.code})` : ''}
                            </option>
                        ))}
                    </select>

                    <select
                        value={exportStatusScope}
                        onChange={e => setExportStatusScope(e.target.value as ExportStatusScope)}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    >
                        <option value="ALL">ทุกสถานะงานในตาราง</option>
                        <option value="FINAL_ONLY">เฉพาะงานที่อนุมัติแล้ว (APPROVE / FINAL)</option>
                    </select>
                </div>

                {/* Column 3: Metricool Format Options */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        ตั้งค่าเริ่มต้นสำหรับ Metricool
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[10px] font-semibold text-slate-500 block">
                                เวลาโพสต์เริ่มต้น
                            </span>
                            <input
                                type="time"
                                value={defaultExportTime}
                                onChange={e => setDefaultExportTime(e.target.value)}
                                className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-500 block">
                                โหมดตั้งเวลาใน Metricool
                            </span>
                            <select
                                value={importAsDraftMode}
                                onChange={e => setImportAsDraftMode(e.target.value as ImportDraftMode)}
                                className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                            >
                                <option value="ALWAYS_SCHEDULED">ตั้งเวลาโพสต์จริง (Draft=false)</option>
                                <option value="AUTO">ตามสถานะการ์ดงาน</option>
                                <option value="ALWAYS_DRAFT">เข้าเป็นฉบับร่าง (Draft=true)</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={includeTagsInCaption}
                            onChange={e => setIncludeTagsInCaption(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            ใช้ Title เป็นชื่อคลิป และใช้ Description + #Tags เป็นแคปชัน
                        </span>
                    </label>
                </div>
            </div>

            {/* 2. Table Toolbar Header (flex-shrink-0) */}
            <div className="flex-shrink-0 flex items-center justify-between px-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span>รายการคอนเทนต์ที่จะส่งออก</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        เลือก {selectedExportTasks.length} / {exportCandidateTasks.length} รายการ
                    </span>
                </h4>

                {exportCandidateTasks.length > 0 && (
                    <button
                        type="button"
                        onClick={toggleSelectAllExportTasks}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        {excludedTaskIds.size > 0 ? 'เลือกทั้งหมด' : 'ยกเลิกการเลือกทั้งหมด'}
                    </button>
                )}
            </div>

            {/* 3. Full-Height Stretching Table Frame (flex-1 min-h-0) */}
            {exportCandidateTasks.length === 0 ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3 shadow-2xs">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        ไม่พบรายการคอนเทนต์ในช่วงเวลาที่เลือก
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                        ลองเปลี่ยนตัวกรองช่วงเวลา หรือเปลี่ยนช่อง (Channel) ด้านบนเพื่อค้นหารายการที่จะส่งออก
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="py-2.5 px-3 w-10 text-center">เลือก</th>
                                    <th className="py-2.5 px-3">วัน-เวลาโพสต์</th>
                                    <th className="py-2.5 px-3">ชื่อคลิป (Title) & แคปชัน (Text)</th>
                                    <th className="py-2.5 px-3">ช่อง (Brand)</th>
                                    <th className="py-2.5 px-3">แพลตฟอร์ม</th>
                                    <th className="py-2.5 px-3 text-center">ไฟล์มีเดีย</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {exportCandidateTasks.map(task => {
                                    const isSelected = !excludedTaskIds.has(task.id);
                                    const ch = channels.find(c => c.id === task.channelId);
                                    const tDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
                                    const mediaCount = (task.assets || []).filter(
                                        a =>
                                            a.url &&
                                            (a.category === 'VIDEO_DRAFT' ||
                                                a.category === 'LINK' ||
                                                a.category === 'THUMBNAIL')
                                    ).length;

                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => toggleExportTask(task.id)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-white hover:bg-rose-50/30 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                                                    : 'bg-slate-50/60 dark:bg-slate-900/40 opacity-50'
                                            }`}
                                        >
                                            <td className="py-2.5 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                                    {isValid(tDate) ? format(tDate, 'dd/MM/yyyy') : '-'}
                                                </div>
                                                <div className="text-[11px] font-semibold text-slate-400">
                                                    {task.scheduledTime || `${defaultExportTime} (ค่าเริ่มต้น)`}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 max-w-xs">
                                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                                    {task.title}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    {task.description || 'ใช้ชื่อคลิปเป็นแคปชัน'}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {ch?.name || 'ไม่ระบุช่อง'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(task.targetPlatforms || []).map(p => {
                                                        const badge = PLATFORM_BADGE_STYLE[p] || {
                                                            label: p,
                                                            bg: 'bg-gray-100 border-gray-200',
                                                            text: 'text-gray-700'
                                                        };
                                                        return (
                                                            <span
                                                                key={p}
                                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text}`}
                                                            >
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                {mediaCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Check className="w-3 h-3" />
                                                        {mediaCount} ลิงก์
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
});

export default MetricoolExportTab;
