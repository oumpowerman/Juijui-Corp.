import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption, Task } from '../../../../../types';
import { GroupSectionData } from './types';
import ChannelMatrixCard from './ChannelMatrixCard';
import { ChevronDown, ChevronUp, FolderKanban, Tv } from 'lucide-react';

interface ChannelMatrixGroupSectionProps {
    section: GroupSectionData;
    tasks: Task[];
    activeFormats: MasterOption[];
    activeStatuses: MasterOption[];
    isGroupCollapsed: boolean;
    onToggleGroupCollapse: () => void;
    expandedChannelIds: Set<string>;
    onToggleChannelExpand: (channelId: string) => void;
    onOpenDrillDown: (channelId?: string, channelName?: string, formatKey?: string, formatLabel?: string, statusKey?: string, statusLabel?: string) => void;
}

export const ChannelMatrixGroupSection: React.FC<ChannelMatrixGroupSectionProps> = ({
    section,
    tasks,
    activeFormats,
    activeStatuses,
    isGroupCollapsed,
    onToggleGroupCollapse,
    expandedChannelIds,
    onToggleChannelExpand,
    onOpenDrillDown
}) => {
    if (section.channels.length === 0) return null;

    return (
        <div className="space-y-3">
            {/* Group Header Bar */}
            <div 
                onClick={onToggleGroupCollapse}
                className="flex items-center justify-between p-3 sm:px-4 sm:py-3 bg-slate-100/80 hover:bg-slate-200/60 rounded-2xl cursor-pointer transition-colors border border-slate-200/50 select-none"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-white text-indigo-600 rounded-xl shadow-2xs shrink-0">
                        <FolderKanban className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight truncate">
                            {section.groupName}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-bold tabular-nums">
                            ({section.channels.length} ช่องทาง)
                        </span>
                        {section.groupDescription && (
                            <span className="text-[11px] text-slate-400 font-normal truncate hidden md:inline">
                                · {section.groupDescription}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Group Total Clips Badge */}
                    <span className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-bold border border-slate-200/70 shadow-2xs tabular-nums">
                        รวมทั้งกลุ่ม: <span className="text-indigo-600 font-bold">{section.totalClips}</span> คลิป
                    </span>

                    <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                        title={isGroupCollapsed ? 'ขยายกลุ่ม' : 'ย่อกลุ่ม'}
                    >
                        {isGroupCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronUp className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Channels List inside Group with Slide Up/Down Framer Motion */}
            <AnimatePresence initial={false}>
                {!isGroupCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-3 pl-1 sm:pl-2 overflow-hidden"
                    >
                        {section.channels.map(channel => {
                            const channelTasks = tasks.filter(t => t.channelId === channel.id);
                            const isExpanded = expandedChannelIds.has(channel.id);

                            return (
                                <ChannelMatrixCard
                                    key={channel.id}
                                    channel={channel}
                                    channelTasks={channelTasks}
                                    activeFormats={activeFormats}
                                    activeStatuses={activeStatuses}
                                    isExpanded={isExpanded}
                                    onToggleExpand={() => onToggleChannelExpand(channel.id)}
                                    onOpenDrillDown={(fmtKey, fmtLabel, stKey, stLabel) => {
                                        onOpenDrillDown(
                                            channel.id,
                                            channel.name,
                                            fmtKey,
                                            fmtLabel,
                                            stKey,
                                            stLabel
                                        );
                                    }}
                                />
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChannelMatrixGroupSection;
