import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Pin, Layers, Tv, CheckCheck } from 'lucide-react';
import { Channel } from '../../../types';
import { ChipConfig } from '../../../types';
import { getHexFromColorClass } from '../../../utils/color';

interface ChannelFilterGridProps {
    channels: Channel[];
    tempChannelIds: string[];
    toggleChannel: (id: string) => void;
    customChips?: ChipConfig[];
    onSaveChip?: (chip: ChipConfig) => void;
    onDeleteChip?: (id: string) => void;
}

const ChannelFilterGrid: React.FC<ChannelFilterGridProps> = ({
    channels = [],
    tempChannelIds = [],
    toggleChannel,
    customChips = [],
    onSaveChip,
    onDeleteChip
}) => {
    // 1. Group channels automatically by group_name with fallback to Ungrouped
    const channelGroups = useMemo(() => {
        const map = new Map<string, Channel[]>();

        channels.forEach(channel => {
            const groupName = channel.group_name?.trim() || 'UNGROUPED';
            if (!map.has(groupName)) {
                map.set(groupName, []);
            }
            map.get(groupName)!.push(channel);
        });

        const groups: { name: string; isUngrouped: boolean; items: Channel[] }[] = [];

        // Named groups first
        map.forEach((items, name) => {
            if (name !== 'UNGROUPED') {
                groups.push({ name, isUngrouped: false, items });
            }
        });

        // Sort named groups alphabetically
        groups.sort((a, b) => a.name.localeCompare(b.name, 'th'));

        // Ungrouped channels section at the bottom
        if (map.has('UNGROUPED')) {
            groups.push({
                name: 'ช่องทั่วไป / สังกัดอิสระ (Ungrouped)',
                isUngrouped: true,
                items: map.get('UNGROUPED')!
            });
        }

        return groups;
    }, [channels]);

    // 2. Quick Group Toggle Handler
    const handleToggleGroup = (groupItems: Channel[]) => {
        const groupItemIds = groupItems.map(item => item.id);
        const isAllSelected = groupItemIds.every(id => tempChannelIds.includes(id));

        if (isAllSelected) {
            // Unselect all in this group
            groupItemIds.forEach(id => {
                if (tempChannelIds.includes(id)) {
                    toggleChannel(id);
                }
            });
        } else {
            // Select all in this group
            groupItemIds.forEach(id => {
                if (!tempChannelIds.includes(id)) {
                    toggleChannel(id);
                }
            });
        }
    };

    if (channels.length === 0) {
        return (
            <div className="py-16 text-center text-stone-400 font-medium">
                ไม่พบข้อมูลช่องรายการในขณะนี้
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            {channelGroups.map(group => {
                const groupItemIds = group.items.map(item => item.id);
                const isAllGroupSelected = groupItemIds.length > 0 && groupItemIds.every(id => tempChannelIds.includes(id));
                const selectedCountInGroup = groupItemIds.filter(id => tempChannelIds.includes(id)).length;

                return (
                    <div key={group.name} className="space-y-3">
                        {/* Section Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${group.isUngrouped ? 'bg-stone-200/70 text-stone-600' : 'bg-amber-100 text-amber-800'}`}>
                                    {group.isUngrouped ? <Tv className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                </div>
                                <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                                    <span>{group.name}</span>
                                    <span className="text-xs font-semibold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-full">
                                        {selectedCountInGroup > 0 ? `${selectedCountInGroup}/${group.items.length}` : `${group.items.length}`} รายการ
                                    </span>
                                </h3>
                            </div>

                            {/* Group Quick Select Toggle Button */}
                            <button
                                type="button"
                                onClick={() => handleToggleGroup(group.items)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                                    isAllGroupSelected
                                        ? 'bg-stone-800 text-stone-50 border-stone-800 hover:bg-stone-900 shadow-2xs'
                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                                }`}
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{isAllGroupSelected ? 'ยกเลิกทั้งกลุ่ม' : 'เลือกทั้งกลุ่ม'}</span>
                            </button>
                        </div>

                        {/* Channels Grid for this Group */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {group.items.map(channel => {
                                const isSelected = tempChannelIds.includes(channel.id);
                                const channelColor = getHexFromColorClass(channel.color);
                                const isPinned = customChips.some(c => c.type === 'CHANNEL' && c.value === channel.id);

                                return (
                                    <div
                                        key={channel.id}
                                        onClick={() => toggleChannel(channel.id)}
                                        className={`group relative p-4 rounded-2xl border-2 cursor-pointer select-none flex items-center gap-3.5 transition-all duration-250 ${
                                            isSelected
                                                ? 'border-stone-800 bg-stone-100/75 shadow-md shadow-stone-800/5'
                                                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                                        }`}
                                        style={{
                                            boxShadow: isSelected
                                                ? `0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px ${channelColor}20, inset 0 2px 4px 0 rgba(0,0,0,0.02)`
                                                : undefined
                                        }}
                                    >
                                        {/* Custom decorative left border block */}
                                        <div
                                            className="absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-r-lg transition-transform duration-200 group-hover:scale-y-110"
                                            style={{ backgroundColor: channelColor }}
                                        />

                                        {/* Channel Avatar/Logo */}
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-stone-200 bg-stone-50 shadow-inner">
                                            {channel.logoUrl ? (
                                                <img
                                                    src={channel.logoUrl}
                                                    alt={channel.name}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                                                    style={{ backgroundColor: channelColor }}
                                                >
                                                    {channel.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Text Metadata */}
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-sm font-bold text-stone-800 truncate group-hover:text-stone-900 transition-colors">
                                                {channel.name}
                                            </h4>
                                            <p className="text-[10px] text-stone-500 mt-0.5 truncate leading-relaxed font-normal" title={channel.description || 'ยังไม่มีคำบรรยายเพิ่มเติม'}>
                                                {channel.description || 'ยังไม่มีคำบรรยายเพิ่มเติม'}
                                            </p>
                                        </div>

                                        {/* Check Indicator badge */}
                                        {isSelected && (
                                            <div className="absolute top-3.5 right-3.5 bg-stone-800 text-stone-50 rounded-full p-0.5 shadow-sm">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                        )}

                                        {/* Pin Button */}
                                        {onSaveChip && onDeleteChip && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const existing = customChips.find(c => c.type === 'CHANNEL' && c.value === channel.id);
                                                    if (existing) {
                                                        onDeleteChip(existing.id);
                                                    } else {
                                                        onSaveChip({
                                                            id: `chip_ch_${channel.id}`,
                                                            label: channel.name,
                                                            type: 'CHANNEL',
                                                            value: channel.id,
                                                            colorTheme: channelColor,
                                                            scope: 'CONTENT',
                                                            mode: 'INCLUDE'
                                                        });
                                                    }
                                                }}
                                                className={`absolute bottom-3.5 right-3.5 p-1.5 rounded-lg border transition-all ${
                                                    isPinned
                                                        ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm'
                                                        : 'bg-white border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                                                }`}
                                                title={isPinned ? 'ถอนการปักหมุดแถบด่วน' : 'ปักหมุดลงแถบด่วน'}
                                            >
                                                <Pin className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default ChannelFilterGrid;
