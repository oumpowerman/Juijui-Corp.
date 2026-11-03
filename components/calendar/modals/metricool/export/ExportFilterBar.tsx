import React from 'react';
import { Calendar, Filter, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Channel } from '../../../../../types';
import { ExportRangeMode, ExportStatusScope, ImportDraftMode } from '../constants';

interface ExportFilterBarProps {
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
}

export const ExportFilterBar: React.FC<ExportFilterBarProps> = React.memo(({
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
    setIncludeTagsInCaption
}) => {
    return (
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-[#F4EFE6] p-3.5 sm:p-4 rounded-2xl border border-[#E5DDD0]">
            {/* Column 1: Date Range */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5A5044] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B5654D]" />
                    ช่วงเวลาที่ต้องการส่งออก
                </label>
                <select
                    value={exportRangeMode}
                    onChange={e => setExportRangeMode(e.target.value as ExportRangeMode)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A74]/30"
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
                            <span className="text-[10px] font-semibold text-[#7D7265]">ตั้งแต่</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={e => setCustomStartDate(e.target.value)}
                                className="w-full px-2 py-1 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-lg tabular-nums"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-[#7D7265]">ถึงวันที่</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={e => setCustomEndDate(e.target.value)}
                                className="w-full px-2 py-1 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-lg tabular-nums"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Column 2: Channel & Status Filter */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5A5044] flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#5A8067]" />
                    กรองช่อง (Channel) และสถานะ
                </label>
                <select
                    value={exportChannelId}
                    onChange={e => setExportChannelId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B9478]/30"
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
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl focus:outline-none"
                >
                    <option value="ALL">ทุกสถานะงานในตาราง</option>
                    <option value="FINAL_ONLY">เฉพาะงานที่อนุมัติแล้ว (APPROVE / FINAL)</option>
                </select>
            </div>

            {/* Column 3: Metricool Format Options */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5A5044] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9C7A4C]" />
                    ตั้งค่าเริ่มต้นสำหรับ Metricool
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="text-[10px] font-semibold text-[#7D7265] block">
                            เวลาโพสต์เริ่มต้น
                        </span>
                        <input
                            type="time"
                            value={defaultExportTime}
                            onChange={e => setDefaultExportTime(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl tabular-nums"
                        />
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold text-[#7D7265] block">
                            โหมดตั้งเวลาใน Metricool
                        </span>
                        <select
                            value={importAsDraftMode}
                            onChange={e => setImportAsDraftMode(e.target.value as ImportDraftMode)}
                            className="w-full px-2 py-1 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl"
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
                        className="w-4 h-4 rounded text-[#A8644F] focus:ring-[#A8644F]"
                    />
                    <span className="text-[11px] font-semibold text-[#665B4E] truncate">
                        ใช้ Title เป็นชื่อคลิป และใช้ Description + #Tags เป็นแคปชัน
                    </span>
                </label>
            </div>
        </div>
    );
});

export default ExportFilterBar;
