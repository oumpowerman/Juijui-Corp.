import React from 'react';
import { Channel, MasterOption, Task } from '../../../../../types';

interface ChannelFormatStatusTableProps {
    channel: Channel;
    channelTasks: Task[];
    activeFormats: MasterOption[];
    activeStatuses: MasterOption[];
    onCellClick: (formatKey?: string, formatLabel?: string, statusKey?: string, statusLabel?: string) => void;
}

export const ChannelFormatStatusTable: React.FC<ChannelFormatStatusTableProps> = ({
    channel,
    channelTasks,
    activeFormats,
    activeStatuses,
    onCellClick
}) => {
    // Check for tasks with formats not matching any active format option
    const otherFormatTasks = channelTasks.filter(t => {
        const formats = t.contentFormats || [];
        return !formats.some(f => activeFormats.some(af => af.key === f));
    });

    return (
        <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="py-2.5 px-3 bg-slate-50/80 rounded-l-xl text-[11px] font-bold text-slate-500 uppercase tracking-wider min-w-[160px]">
                            รูปแบบคอนเทนต์ (Format)
                        </th>
                        {activeStatuses.map(st => (
                            <th 
                                key={st.key}
                                className="py-2.5 px-3 bg-slate-50/80 text-[11px] font-bold text-slate-600 text-center min-w-[100px] whitespace-nowrap"
                            >
                                <span className="inline-block truncate max-w-[130px]" title={st.label}>
                                    {st.label}
                                </span>
                            </th>
                        ))}
                        <th className="py-2.5 px-3 bg-indigo-50/60 rounded-r-xl text-[11px] font-bold text-indigo-700 text-center min-w-[90px] whitespace-nowrap">
                            รวม (Total)
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {/* Dynamic Format Rows from Master Data */}
                    {activeFormats.map(fmt => {
                        const formatTasks = channelTasks.filter(t => (t.contentFormats || []).includes(fmt.key));
                        const formatTotal = formatTasks.length;

                        return (
                            <tr key={fmt.key} className="hover:bg-slate-50/50 transition-colors">
                                {/* Format Name Cell */}
                                <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: fmt.color?.includes('bg-') ? undefined : fmt.color }}
                                        />
                                        <span className="font-bold text-slate-800">{fmt.label}</span>
                                    </div>
                                </td>

                                {/* Status Cells */}
                                {activeStatuses.map(st => {
                                    const count = formatTasks.filter(t => t.status === st.key).length;
                                    return (
                                        <td key={st.key} className="py-3 px-3 text-center">
                                            {count > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onCellClick(fmt.key, fmt.label, st.key, st.label)}
                                                    className="px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold tabular-nums text-xs transition-all hover:scale-105 active:scale-95 shadow-2xs border border-indigo-100"
                                                    title={`ดู ${count} รายการ ${channel.name} • ${fmt.label} • ${st.label}`}
                                                >
                                                    {count}
                                                </button>
                                            ) : (
                                                <span className="text-slate-300 font-normal">0</span>
                                            )}
                                        </td>
                                    );
                                })}

                                {/* Format Row Total */}
                                <td className="py-3 px-3 text-center bg-indigo-50/20">
                                    {formatTotal > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => onCellClick(fmt.key, fmt.label, undefined, 'ทุกสถานะ (All Statuses)')}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold tabular-nums text-xs transition-all hover:bg-indigo-200 active:scale-95 shadow-2xs"
                                            title={`ดูทั้งหมด ${formatTotal} รายการ ${channel.name} • ${fmt.label}`}
                                        >
                                            {formatTotal}
                                        </button>
                                    ) : (
                                        <span className="text-slate-300 font-normal">0</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {/* Optional: Unspecified / Other Format Row */}
                    {otherFormatTasks.length > 0 && (
                        <tr className="hover:bg-slate-50/50 transition-colors bg-amber-50/10">
                            <td className="py-3 px-3">
                                <div className="flex items-center gap-2 text-slate-500 italic">
                                    <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                                    <span>ไม่ระบุฟอร์แมต / อื่นๆ</span>
                                </div>
                            </td>
                            {activeStatuses.map(st => {
                                const count = otherFormatTasks.filter(t => t.status === st.key).length;
                                return (
                                    <td key={st.key} className="py-3 px-3 text-center">
                                        {count > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => onCellClick('__OTHER__', 'ไม่ระบุฟอร์แมต', st.key, st.label)}
                                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold tabular-nums text-xs transition-all"
                                            >
                                                {count}
                                            </button>
                                        ) : (
                                            <span className="text-slate-300 font-normal">0</span>
                                        )}
                                    </td>
                                );
                            })}
                            <td className="py-3 px-3 text-center bg-indigo-50/20">
                                <button
                                    type="button"
                                    onClick={() => onCellClick('__OTHER__', 'ไม่ระบุฟอร์แมต', undefined, 'ทุกสถานะ')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold tabular-nums text-xs"
                                >
                                    {otherFormatTasks.length}
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>

                {/* Status Total Column Footers */}
                <tfoot>
                    <tr className="bg-slate-50/70 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                        <td className="py-3 px-3 rounded-l-xl uppercase tracking-wider text-[11px] text-slate-600">
                            รวมทุกรูปแบบ
                        </td>
                        {activeStatuses.map(st => {
                            const colCount = channelTasks.filter(t => t.status === st.key).length;
                            return (
                                <td key={st.key} className="py-3 px-3 text-center">
                                    {colCount > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => onCellClick(undefined, 'ทุกรูปแบบ (All Formats)', st.key, st.label)}
                                            className="px-2 py-1 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-white font-bold tabular-nums transition-all"
                                            title={`ดูงานสถานะ ${st.label} ทั้งหมดในช่องนี้`}
                                        >
                                            {colCount}
                                        </button>
                                    ) : (
                                        <span className="text-slate-300 font-normal">0</span>
                                    )}
                                </td>
                            );
                        })}
                        <td className="py-3 px-3 text-center bg-indigo-100/70 rounded-r-xl">
                            <span className="font-bold text-indigo-900 tabular-nums">
                                {channelTasks.length}
                            </span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default ChannelFormatStatusTable;
