import React from 'react';
import { format, isValid } from 'date-fns';
import {
    Sparkles,
    Wand2,
    CheckCircle2,
    ArrowRight,
    PlusCircle,
    Film,
    GitCompare,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Task } from '../../../../../types';
import { ParsedMetricoolRow } from '../../../../../utils/metricoolCsv';
import { PLATFORM_BADGE_STYLE } from '../constants';
import ImportDiffPanel from './ImportDiffPanel';

interface ImportPreviewRowProps {
    row: ParsedMetricoolRow;
    matchedTask?: Task;
    nearbyTasks: Task[];
    isDiffExpanded: boolean;
    onToggleDiff: (rowIndex: number) => void;
    onActionChange: (rowIndex: number, action: 'UPDATE' | 'CREATE' | 'SKIP') => void;
    onTargetTaskChange: (rowIndex: number, taskId: string) => void;
}

export const ImportPreviewRow: React.FC<ImportPreviewRowProps> = React.memo(({
    row,
    matchedTask,
    nearbyTasks,
    isDiffExpanded,
    onToggleDiff,
    onActionChange,
    onTargetTaskChange
}) => {
    return (
        <tr
            className={`transition-colors ${
                row.action === 'SKIP'
                    ? 'bg-[#F4EFE6]/60 opacity-60'
                    : row.action === 'UPDATE'
                    ? 'bg-[#FBF0E4]/40 hover:bg-[#FBF0E4]/70'
                    : 'bg-[#FFFDF9] hover:bg-[#EDF3EF]/50'
            }`}
        >
            {/* 1. Date & Time */}
            <td className="py-3 px-3 whitespace-nowrap align-top tabular-nums">
                <div className="font-bold text-[#4A4238]">
                    {format(row.parsedDate, 'dd/MM/yyyy')}
                </div>
                <div className="text-[11px] font-semibold text-[#567A63]">
                    เวลา {row.scheduledTime} น.
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                    {row.targetPlatforms.map(p => {
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
                    })}
                </div>
            </td>

            {/* 2. CSV Title, Caption & Expandable Old-vs-New Diff Panel */}
            <td className="py-3 px-3 max-w-[320px] align-top">
                <div className="font-bold text-[#4A4238] break-words">
                    {row.title}
                </div>
                {row.description && row.description !== row.title && (
                    <div className="text-[11px] text-[#7D7265] line-clamp-2 mt-0.5">
                        {row.description}
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                    {row.mediaUrls.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C4F3E] bg-[#F5E0D8] px-1.5 py-0.2 rounded border border-[#E6C7BB] tabular-nums">
                            <Film className="w-2.5 h-2.5" />
                            มีไฟล์คลิป ({row.mediaUrls.length})
                        </span>
                    )}
                    {row.tags.slice(0, 4).map(t => (
                        <span
                            key={t}
                            className="text-[10px] font-semibold text-[#4F735B] bg-[#E6EFE9] px-1.5 py-0.2 rounded border border-[#C5DBD0]"
                        >
                            #{t}
                        </span>
                    ))}
                </div>

                {/* Inline Expandable Old-vs-New Diff Panel */}
                {row.action === 'UPDATE' && matchedTask && isDiffExpanded && (
                    <ImportDiffPanel row={row} matchedTask={matchedTask} />
                )}
            </td>

            {/* 3. Match Status, Reason & Diff Toggle Button */}
            <td className="py-3 px-3 max-w-[260px] align-top">
                {row.action === 'UPDATE' && matchedTask ? (
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF0E4] text-[#8C5A32] border border-[#EBD2B7] tabular-nums">
                            {row.matchType === 'AI_SEMANTIC' ? (
                                <>
                                    <Sparkles className="w-3 h-3 text-[#9E5F48]" />
                                    <span>AI จับคู่ให้ ({row.matchConfidence}%)</span>
                                </>
                            ) : row.matchType === 'THAI_FUZZY' ? (
                                <>
                                    <Wand2 className="w-3 h-3 text-[#8C5A32]" />
                                    <span>จับคู่คำใกล้เคียง ({row.matchConfidence}%)</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-[#4E7A5E]" />
                                    <span>ตรงกับการ์ดเดิม</span>
                                </>
                            )}
                        </div>

                        <div className="text-xs font-bold text-[#4A4238] flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-[#A86D3D] shrink-0" />
                            <span className="truncate">{matchedTask.title}</span>
                        </div>

                        {row.matchReason && (
                            <div className="text-[10px] text-[#7D7265]">
                                {row.matchReason}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => onToggleDiff(row.rowIndex)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FFFDF9] hover:bg-[#F4EFE6] text-[#8C5A32] border border-[#E5D2B8] transition-colors"
                        >
                            <GitCompare className="w-3 h-3 text-[#A86D3D]" />
                            <span>{isDiffExpanded ? 'ซ่อนตารางเทียบข้อมูล' : 'เทียบข้อมูลเก่า-ใหม่'}</span>
                            {isDiffExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                ) : row.action === 'CREATE' ? (
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E6EFE9] text-[#3F634D] border border-[#C5DBD0]">
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>ไม่ซ้ำ — สร้างการ์ดใหม่</span>
                        </div>
                        {row.matchReason && (
                            <div className="text-[10px] text-[#8C5A32] font-semibold">
                                {row.matchReason}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#7D7265] block">
                            ข้ามรายการนี้
                        </span>
                        {row.matchReason && (
                            <span className="text-[10px] text-[#8C5A32] block">
                                {row.matchReason}
                            </span>
                        )}
                    </div>
                )}
            </td>

            {/* 4. Action Override Controls */}
            <td className="py-3 px-3 align-top space-y-1.5 min-w-[190px]">
                <select
                    value={row.action}
                    onChange={e =>
                        onActionChange(
                            row.rowIndex,
                            e.target.value as 'UPDATE' | 'CREATE' | 'SKIP'
                        )
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl"
                >
                    <option value="UPDATE">อัปเดตการ์ดเดิม</option>
                    <option value="CREATE">สร้างเป็นการ์ดใหม่</option>
                    <option value="SKIP">ข้าม (ไม่นำเข้า)</option>
                </select>

                {row.action === 'UPDATE' && (
                    <select
                        value={row.matchedTaskId || ''}
                        onChange={e => onTargetTaskChange(row.rowIndex, e.target.value)}
                        className="w-full px-2 py-1 text-[11px] font-semibold bg-[#F4EFE6] border border-[#DED4C6] rounded-lg text-[#5A5044]"
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
});

export default ImportPreviewRow;
