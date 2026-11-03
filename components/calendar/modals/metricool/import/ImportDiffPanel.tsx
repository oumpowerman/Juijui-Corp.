import React from 'react';
import { format, isValid } from 'date-fns';
import { ArrowRight, Calendar, Clock, FileText, Film, Share2 } from 'lucide-react';
import { Task } from '../../../../../types';
import { ParsedMetricoolRow } from '../../../../../utils/metricoolCsv';
import { PLATFORM_BADGE_STYLE } from '../constants';

interface ImportDiffPanelProps {
    row: ParsedMetricoolRow;
    matchedTask: Task;
}

export const ImportDiffPanel: React.FC<ImportDiffPanelProps> = React.memo(({ row, matchedTask }) => {
    const oldDate =
        matchedTask.endDate instanceof Date
            ? matchedTask.endDate
            : new Date(matchedTask.endDate);
    const oldDateStr = isValid(oldDate) ? format(oldDate, 'dd/MM/yyyy') : '-';
    const newDateStr = isValid(row.parsedDate) ? format(row.parsedDate, 'dd/MM/yyyy') : '-';
    const isDateChanged = oldDateStr !== newDateStr;

    const oldTime = matchedTask.scheduledTime || 'ไม่ได้ระบุ';
    const newTime = row.scheduledTime || 'ไม่ได้ระบุ';
    const isTimeChanged = oldTime !== newTime;

    const oldPlatforms = matchedTask.targetPlatforms || [];
    const mergedPlatforms =
        row.targetPlatforms.length > 0
            ? Array.from(new Set([...oldPlatforms, ...row.targetPlatforms]))
            : oldPlatforms;
    const addedPlatforms = mergedPlatforms.filter(p => !oldPlatforms.includes(p));

    const oldAssetsCount = (matchedTask.assets || []).length;
    const newMediaCount = row.mediaUrls.length + (row.thumbnailUrl ? 1 : 0);

    return (
        <div className="mt-2.5 p-3 rounded-2xl bg-[#FAF6EE] border border-[#E5D8C5] text-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-1.5">
                <span className="font-bold text-[#6E5338] flex items-center gap-1.5">
                    <span>เปรียบเทียบข้อมูลก่อนอัปเดตการ์ดเดิม</span>
                </span>
                <span className="text-[10px] font-semibold text-[#8C7A65]">
                    ไฮไลต์สีเขียวเซจ = ข้อมูลใหม่ที่จะซิงค์เพิ่มจาก Metricool
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Column: Current Card Data */}
                <div className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#E6DFD3] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#7D7265] uppercase tracking-wide">
                        ข้อมูลในการ์ดเดิมปัจจุบัน
                    </div>

                    <div className="font-bold text-[#4A4238] truncate" title={matchedTask.title}>
                        {matchedTask.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6E6355] tabular-nums">
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#8C8070]" />
                            วันที่: <strong className="text-[#4A4238]">{oldDateStr}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#8C8070]" />
                            เวลา: <strong className="text-[#4A4238]">{oldTime}</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <Share2 className="w-3 h-3 text-[#8C8070]" />
                        {oldPlatforms.length > 0 ? (
                            oldPlatforms.map(p => {
                                const badge = PLATFORM_BADGE_STYLE[p] || {
                                    label: p,
                                    bg: 'bg-[#EFECE6] border-[#D8D0C3]',
                                    text: 'text-[#5A5246]'
                                };
                                return (
                                    <span
                                        key={p}
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badge.bg} ${badge.text}`}
                                    >
                                        {badge.label}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-[11px] text-[#9E9283]">ยังไม่ระบุแพลตฟอร์ม</span>
                        )}
                    </div>

                    <div className="text-[11px] text-[#7D7265] line-clamp-2 pt-0.5">
                        <FileText className="w-3 h-3 inline mr-1 text-[#8C8070]" />
                        {matchedTask.description || 'ไม่มีคำบรรยายเดิม'}
                    </div>

                    <div className="text-[10px] font-semibold text-[#7D7265] tabular-nums">
                        <Film className="w-3 h-3 inline mr-1 text-[#8C8070]" />
                        ไฟล์แนบเดิม: {oldAssetsCount} รายการ
                    </div>
                </div>

                {/* Right Column: Updated Data from Metricool CSV */}
                <div className="p-2.5 rounded-xl bg-[#F2F7F4] border border-[#C5DBD0] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#3F634D] uppercase tracking-wide flex items-center gap-1">
                        <span>ข้อมูลหลังซิงค์จาก Metricool CSV</span>
                        <ArrowRight className="w-3 h-3" />
                    </div>

                    <div className="font-bold text-[#4A4238] truncate" title={matchedTask.title || row.title}>
                        {matchedTask.title || row.title}{' '}
                        <span className="text-[10px] font-semibold text-[#4F735B]">(คงชื่อการ์ดเดิมไว้)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#4A4238] tabular-nums">
                        <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                isDateChanged ? 'bg-[#DFECE4] text-[#2F523C] font-bold' : ''
                            }`}
                        >
                            <Calendar className="w-3 h-3 text-[#4F735B]" />
                            วันที่: <strong>{newDateStr}</strong>
                            {isDateChanged && <span className="text-[10px]">(เปลี่ยนวัน)</span>}
                        </span>

                        <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                isTimeChanged ? 'bg-[#DFECE4] text-[#2F523C] font-bold' : ''
                            }`}
                        >
                            <Clock className="w-3 h-3 text-[#4F735B]" />
                            เวลา: <strong>{newTime} น.</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <Share2 className="w-3 h-3 text-[#4F735B]" />
                        {mergedPlatforms.map(p => {
                            const isAdded = addedPlatforms.includes(p);
                            const badge = PLATFORM_BADGE_STYLE[p] || {
                                label: p,
                                bg: 'bg-[#EFECE6] border-[#D8D0C3]',
                                text: 'text-[#5A5246]'
                            };
                            return (
                                <span
                                    key={p}
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badge.bg} ${badge.text} ${
                                        isAdded ? 'ring-1 ring-[#4F735B]' : ''
                                    }`}
                                >
                                    {isAdded ? `+${badge.label}` : badge.label}
                                </span>
                            );
                        })}
                    </div>

                    <div className="text-[11px] text-[#3F634D] line-clamp-2 pt-0.5">
                        <FileText className="w-3 h-3 inline mr-1 text-[#4F735B]" />
                        {row.description || matchedTask.description || '-'}
                    </div>

                    <div className="text-[10px] font-bold text-[#3F634D] tabular-nums">
                        <Film className="w-3 h-3 inline mr-1 text-[#4F735B]" />
                        {newMediaCount > 0
                            ? `เพิ่มลิงก์วิดีโอ/ปกคลิปจาก Metricool +${newMediaCount} รายการ`
                            : `คงไฟล์แนบเดิม (${oldAssetsCount} รายการ)`}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ImportDiffPanel;
