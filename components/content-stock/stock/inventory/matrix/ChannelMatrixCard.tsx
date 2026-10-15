import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, MasterOption, Task } from '../../../../../types';
import { ChevronDown, ChevronUp, Layers, Film } from 'lucide-react';
import ChannelFormatStatusTable from './ChannelFormatStatusTable';

interface ChannelMatrixCardProps {
    channel: Channel;
    channelTasks: Task[];
    activeFormats: MasterOption[];
    activeStatuses: MasterOption[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onOpenDrillDown: (formatKey?: string, formatLabel?: string, statusKey?: string, statusLabel?: string) => void;
}

export const ChannelMatrixCard: React.FC<ChannelMatrixCardProps> = ({
    channel,
    channelTasks,
    activeFormats,
    activeStatuses,
    isExpanded,
    onToggleExpand,
    onOpenDrillDown
}) => {
    // Compute quick status summary for the compact pill bar
    const statusSummary = useMemo(() => {
        return activeStatuses
            .map(st => ({
                key: st.key,
                label: st.label,
                count: channelTasks.filter(t => t.status === st.key).length
            }))
            .filter(item => item.count > 0);
    }, [activeStatuses, channelTasks]);

    // Compute top format
    const topFormat = useMemo(() => {
        if (channelTasks.length === 0) return null;
        let bestFmt: { label: string; count: number } | null = null;
        activeFormats.forEach(fmt => {
            const count = channelTasks.filter(t => (t.contentFormats || []).includes(fmt.key)).length;
            if (count > 0 && (!bestFmt || count > bestFmt.count)) {
                bestFmt = { label: fmt.label, count };
            }
        });
        return bestFmt;
    }, [activeFormats, channelTasks]);

    return (
        <div className={`bg-white rounded-[2rem] border transition-all duration-200 overflow-hidden ${
            isExpanded 
                ? 'border-indigo-200 shadow-md ring-1 ring-indigo-500/10' 
                : 'border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs'
        }`}>
            {/* Header / Compact Bar (Always clickable to expand/collapse) */}
            <div 
                onClick={onToggleExpand}
                className={`px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isExpanded 
                        ? 'bg-gradient-to-r from-slate-50/90 via-white to-indigo-50/20 border-b border-slate-100' 
                        : 'bg-white hover:bg-slate-50/60'
                }`}
            >
                {/* Left: Brand Identity & Top Format */}
                <div className="flex items-center gap-3.5 min-w-0">
                    {/* Logo / Avatar */}
                    {channel.logoUrl ? (
                        <img
                            src={channel.logoUrl}
                            alt={channel.name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs shrink-0"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-2xs shrink-0"
                            style={{ backgroundColor: channel.color || '#4f46e5' }}
                        >
                            {channel.name.substring(0, 1).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                                {channel.name}
                            </h4>
                            <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: channel.color || '#4f46e5' }}
                                title={`Brand Color`}
                            />
                            {channel.code && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                    #{channel.code}
                                </span>
                            )}
                        </div>

                        {/* Subtext: Top Format info */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {topFormat ? (
                                <span className="flex items-center gap-1 text-indigo-600 font-semibold truncate">
                                    <Film className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span>หลัก: {topFormat.label} ({topFormat.count} คลิป)</span>
                                </span>
                            ) : (
                                <span className="text-slate-400">ยังไม่มีคอนเทนต์ค้างในคลัง</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Mini Status Pills (when collapsed) & Total Count */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                    {/* Compact Mode Mini Breakdown Pills */}
                    {!isExpanded && statusSummary.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                            {statusSummary.slice(0, 4).map(st => (
                                <span 
                                    key={st.key}
                                    className="text-[10px] font-bold text-slate-600 whitespace-nowrap"
                                >
                                    {st.label.split(' ')[0]}: <span className="text-indigo-600 font-bold">{st.count}</span>
                                    <span className="text-slate-300 ml-1.5 font-normal">·</span>
                                </span>
                            ))}
                            {statusSummary.length > 4 && (
                                <span className="text-[9px] font-bold text-slate-400">
                                    +{statusSummary.length - 4} สถานะ
                                </span>
                            )}
                        </div>
                    )}

                    {/* Total clips pill (clickable to inspect all tasks for this channel) */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation(); // prevent collapsing/expanding card
                            if (channelTasks.length === 0) return;
                            onOpenDrillDown(undefined, 'ทุกรูปแบบ (All Formats)', undefined, 'ทุกสถานะ (All Active)');
                        }}
                        disabled={channelTasks.length === 0}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            channelTasks.length > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 hover:bg-indigo-100 hover:scale-102 active:scale-95'
                                : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                        }`}
                        title="คลิกเพื่อดูรายการคลิปทั้งหมดในช่องนี้"
                    >
                        <span className="text-[10px] font-medium text-slate-500">คงค้าง:</span>
                        <span className="font-bold tabular-nums">{channelTasks.length}</span>
                        <span className="text-[10px] font-normal text-slate-500">ชิ้น</span>
                    </button>

                    {/* Expand/Collapse Chevron Button */}
                    <div className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Body: Matrix Table with Slide Down/Up Framer Motion */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="matrix-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
                            <ChannelFormatStatusTable
                                channel={channel}
                                channelTasks={channelTasks}
                                activeFormats={activeFormats}
                                activeStatuses={activeStatuses}
                                onCellClick={onOpenDrillDown}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChannelMatrixCard;
