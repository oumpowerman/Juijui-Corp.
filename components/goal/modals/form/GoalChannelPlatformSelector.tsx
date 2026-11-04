import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Hash,
    MonitorPlay,
    ChevronDown,
    Check,
    Tv,
    Search,
    Users,
    Tag,
    X,
    Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, Platform } from '../../../../types';
import { PLATFORM_ICONS } from '../../../../constants';
import {
    computeGoalFollowerValue,
    getChannelFollowersByPlatform,
} from '../../../../hooks/useGoals';
import { useChannelGroups } from '../../../../hooks/useChannelGroups';
import { formatFollowersCompact } from '../../../channel/helpers/channelHelpers';
import { ALL_PLATFORMS, dropdownPopoverVariants } from '../goalModalConstants';

interface GoalChannelPlatformSelectorProps {
    channels: Channel[];
    channelId: string;
    platform: Platform | 'ALL';
    onSelectChannel: (id: string) => void;
    onSelectPlatform: (plat: Platform | 'ALL') => void;
}

export const GoalChannelPlatformSelector: React.FC<GoalChannelPlatformSelectorProps> = ({
    channels,
    channelId,
    platform,
    onSelectChannel,
    onSelectPlatform,
}) => {
    const [isChannelOpen, setIsChannelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const channelDropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { groups: activeGroups, enrichChannelsWithGroups } = useChannelGroups();
    const enrichedChannels = useMemo(
        () => enrichChannelsWithGroups(channels),
        [channels, enrichChannelsWithGroups]
    );

    const currentChannel = useMemo(
        () =>
            enrichedChannels.find(c => c.id === channelId) ||
            channels.find(c => c.id === channelId) ||
            null,
        [enrichedChannels, channels, channelId]
    );

    const allChannelsFollowers = useMemo(
        () => computeGoalFollowerValue({ channelId: null, platform }, channels),
        [platform, channels]
    );

    const selectedChannelFollowers = useMemo(
        () =>
            currentChannel
                ? getChannelFollowersByPlatform(currentChannel, platform)
                : allChannelsFollowers,
        [currentChannel, platform, allChannelsFollowers]
    );

    const activePlatformMeta = useMemo(
        () => ALL_PLATFORMS.find(p => p.id === platform) || ALL_PLATFORMS[0],
        [platform]
    );

    // Click Outside Handler for Channel Dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                channelDropdownRef.current &&
                !channelDropdownRef.current.contains(event.target as Node)
            ) {
                setIsChannelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus search input when dropdown opens
    useEffect(() => {
        if (isChannelOpen) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setSearchQuery('');
        }
    }, [isChannelOpen]);

    const getStatusPriority = (chStatus?: string): number => {
        switch (chStatus) {
            case 'ACTIVE':
                return 1;
            case 'PLANNING':
                return 2;
            case 'PAUSED':
                return 3;
            case 'ARCHIVED':
                return 4;
            default:
                return 1;
        }
    };

    const sortChannels = (list: Channel[]) => {
        return [...list].sort((a, b) => {
            const aPriority = getStatusPriority(a.status);
            const bPriority = getStatusPriority(b.status);
            if (aPriority !== bPriority) return aPriority - bPriority;

            const aFollowers = getChannelFollowersByPlatform(a, platform);
            const bFollowers = getChannelFollowersByPlatform(b, platform);
            if (bFollowers !== aFollowers) return bFollowers - aFollowers;

            return (a.name || '').localeCompare(b.name || '', 'th');
        });
    };

    const filteredChannels = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return enrichedChannels;
        return enrichedChannels.filter(
            c =>
                (c.name || '').toLowerCase().includes(term) ||
                (c.group_name || '').toLowerCase().includes(term)
        );
    }, [enrichedChannels, searchQuery]);

    const { sortedGroups, groupedMap, ungroupedChannels, totalMatchedCount } = useMemo(() => {
        const gMap: Record<string, Channel[]> = {};
        activeGroups.forEach(g => {
            gMap[g.id] = [];
        });
        const ungrouped: Channel[] = [];

        filteredChannels.forEach(ch => {
            if (ch.group_id && gMap[ch.group_id]) {
                gMap[ch.group_id].push(ch);
            } else {
                ungrouped.push(ch);
            }
        });

        const sGroups = [...activeGroups].sort((a, b) => {
            const aList = gMap[a.id] || [];
            const bList = gMap[b.id] || [];
            const aFollowers = aList.reduce(
                (sum, ch) => sum + getChannelFollowersByPlatform(ch, platform),
                0
            );
            const bFollowers = bList.reduce(
                (sum, ch) => sum + getChannelFollowersByPlatform(ch, platform),
                0
            );
            if (bFollowers !== aFollowers) return bFollowers - aFollowers;
            return (a.name || '').localeCompare(b.name || '', 'th');
        });

        return {
            sortedGroups: sGroups,
            groupedMap: gMap,
            ungroupedChannels: sortChannels(ungrouped),
            totalMatchedCount: filteredChannels.length,
        };
    }, [activeGroups, filteredChannels, platform]);

    const renderChannelItem = (ch: Channel) => {
        const isSelected = channelId === ch.id;
        const chFollowers = getChannelFollowersByPlatform(ch, platform);
        const isNonActive = ch.status && ch.status !== 'ACTIVE';

        return (
            <button
                key={ch.id}
                type="button"
                onClick={() => {
                    onSelectChannel(ch.id);
                    setIsChannelOpen(false);
                }}
                className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-xl mb-1 transition-all group text-left cursor-pointer
                    ${
                        isSelected
                            ? 'bg-indigo-50/90 text-indigo-900 ring-1 ring-indigo-200 shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-700'
                    }
                    ${isNonActive ? 'opacity-85 hover:opacity-100' : ''}
                `}
            >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {ch.logoUrl ? (
                            <img
                                src={ch.logoUrl}
                                alt={ch.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                                {ch.name.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex flex-col">
                        <span
                            className={`text-xs font-bold truncate ${
                                isSelected ? 'text-indigo-950' : 'text-slate-800'
                            }`}
                        >
                            {ch.name}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {ch.status === 'PLANNING' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                    เตรียมงาน
                                </span>
                            )}
                            {ch.status === 'PAUSED' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                    พักชั่วคราว
                                </span>
                            )}
                            {ch.status === 'ARCHIVED' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
                                    ปิดตัว
                                </span>
                            )}

                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500">
                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                <span className="tabular-nums">
                                    {formatFollowersCompact(chFollowers)}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                            isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                        }`}
                    >
                        {formatFollowersCompact(chFollowers)}
                    </span>
                    {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white shadow-2xs">
                            <Check className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* 1. CHANNEL SELECTOR DROPDOWN (5 cols on desktop) */}
            <div className="md:col-span-5 relative z-30" ref={channelDropdownRef}>
                <div className="h-5 mb-1.5 flex items-center justify-between px-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-indigo-500" />
                        <span>ช่องรายการ (Channel)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                        {channels.length} ช่อง
                    </span>
                </div>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsChannelOpen(prev => !prev)}
                    className={`
                        w-full h-[58px] bg-white border-2 rounded-2xl flex items-center justify-between px-3.5 transition-all cursor-pointer
                        ${
                            isChannelOpen
                                ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-md'
                                : 'border-slate-200/90 hover:border-indigo-300 shadow-2xs'
                        }
                    `}
                >
                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${
                                currentChannel
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                            }`}
                        >
                            {currentChannel?.logoUrl ? (
                                <img
                                    src={currentChannel.logoUrl}
                                    alt={currentChannel.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : currentChannel ? (
                                <Tv className="w-4 h-4 text-slate-500" />
                            ) : (
                                <Layers className="w-4 h-4 text-indigo-600" />
                            )}
                        </div>

                        <div className="flex flex-col items-start text-left min-w-0">
                            <div className="flex items-center gap-1.5 max-w-full">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                    {currentChannel?.group_name
                                        ? `[${currentChannel.group_name}]`
                                        : currentChannel
                                          ? 'ช่องรายการ'
                                          : 'ทุกช่องในระบบ'}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md shrink-0 tabular-nums">
                                    <Users className="w-2.5 h-2.5 text-indigo-500" />
                                    {formatFollowersCompact(selectedChannelFollowers)}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800 truncate max-w-full">
                                {currentChannel ? currentChannel.name : 'รวมทุกช่อง (All Channels)'}
                            </span>
                        </div>
                    </div>

                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                            isChannelOpen ? 'rotate-180 text-indigo-600' : ''
                        }`}
                    />
                </motion.button>

                {/* Dropdown Popover */}
                <AnimatePresence>
                    {isChannelOpen && (
                        <motion.div
                            variants={dropdownPopoverVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 w-full sm:w-[360px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 origin-top-left flex flex-col max-h-[380px]"
                        >
                            {/* Sticky Search Header */}
                            <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-20">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="ค้นหาชื่อช่อง หรือ กลุ่ม..."
                                        className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-800 placeholder-slate-400"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Channel List */}
                            <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100 overscroll-contain">
                                {/* Pinned Option: All Channels */}
                                {(!searchQuery.trim() ||
                                    'รวมทุกช่อง all channels'.includes(
                                        searchQuery.trim().toLowerCase()
                                    )) && (
                                    <div className="pb-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelectChannel('');
                                                setIsChannelOpen(false);
                                            }}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer
                                                ${
                                                    channelId === ''
                                                        ? 'bg-indigo-50/90 text-indigo-900 ring-1 ring-indigo-200 shadow-2xs'
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 truncate">
                                                        รวมทุกช่อง (All Channels)
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        นับยอดผู้ติดตามรวมจากทุกช่องในองค์กร
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                                                        channelId === ''
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {formatFollowersCompact(allChannelsFollowers)}
                                                </span>
                                                {channelId === '' && (
                                                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white shadow-2xs">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {totalMatchedCount === 0 ? (
                                    <div className="py-8 text-center text-slate-400">
                                        <Tv className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                                        <p className="text-xs font-semibold">ไม่พบช่องรายการที่ค้นหา</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            ลองค้นหาด้วยคำอื่น หรือตรวจสอบตัวสะกด
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {sortedGroups.map(group => {
                                            const groupChannels = groupedMap[group.id] || [];
                                            if (groupChannels.length === 0) return null;

                                            const sortedGroupChannels = sortChannels(groupChannels);
                                            const groupFollowers = groupChannels.reduce(
                                                (sum, ch) =>
                                                    sum +
                                                    getChannelFollowersByPlatform(ch, platform),
                                                0
                                            );

                                            return (
                                                <div
                                                    key={group.id}
                                                    className="py-2 first:pt-0 last:pb-0"
                                                >
                                                    <div className="px-2 py-1 mb-1.5 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                                                                    group.color ||
                                                                    'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                }`}
                                                            >
                                                                <Tag className="w-2.5 h-2.5" />
                                                                {group.name}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                ({groupChannels.length})
                                                            </span>
                                                        </div>
                                                        {groupFollowers > 0 && (
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 shrink-0 tabular-nums">
                                                                {formatFollowersCompact(
                                                                    groupFollowers
                                                                )}{' '}
                                                                คน
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {sortedGroupChannels.map(renderChannelItem)}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {ungroupedChannels.length > 0 && (
                                            <div className="py-2 first:pt-0 last:pb-0">
                                                <div className="px-2 py-1 mb-1.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            ช่องทั่วไป (Ungrouped)
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            ({ungroupedChannels.length})
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    {ungroupedChannels.map(renderChannelItem)}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Dropdown Footer */}
                            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                                <span>เรียงตามกลุ่มผู้ติดตามสูงสุด</span>
                                <span>พบ {totalMatchedCount} ช่อง</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. PLATFORM COMPACT ICON BADGES (7 cols on desktop) */}
            <div className="md:col-span-7">
                <div className="h-5 mb-1.5 flex items-center justify-between px-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <MonitorPlay className="w-3.5 h-3.5 text-indigo-500" />
                        <span>แพลตฟอร์ม (Platform)</span>
                    </label>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.2 rounded-md">
                        {activePlatformMeta.label}
                    </span>
                </div>

                <div className="grid grid-cols-5 gap-2 h-[58px]">
                    {ALL_PLATFORMS.map(p => {
                        const Icon =
                            p.id === 'ALL' ? Hash : PLATFORM_ICONS[p.id as Platform] || Hash;
                        const isSelected = platform === p.id;
                        const platCount = computeGoalFollowerValue(
                            { channelId: channelId || null, platform: p.id },
                            channels
                        );

                        return (
                            <motion.button
                                key={p.id}
                                type="button"
                                title={`${p.label} (${platCount.toLocaleString()} คน)`}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelectPlatform(p.id)}
                                className={`
                                    relative h-full rounded-2xl border-2 flex flex-col items-center justify-center gap-1 px-1.5 transition-colors cursor-pointer overflow-hidden
                                    ${
                                        isSelected
                                            ? 'border-indigo-600 text-white shadow-md shadow-indigo-200/70'
                                            : 'bg-white border-slate-200/90 text-slate-600 hover:border-indigo-200 hover:bg-slate-50/60'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="goalPlatformActiveBg"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                        className="absolute inset-0 bg-indigo-600 z-0"
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-1">
                                    <Icon
                                        className={`w-4 h-4 shrink-0 transition-transform ${
                                            isSelected ? 'text-white scale-110' : p.iconColor
                                        }`}
                                    />
                                    <span
                                        className={`text-[10px] font-bold tracking-tight ${
                                            isSelected ? 'text-white' : 'text-slate-500'
                                        }`}
                                    >
                                        {p.shortLabel}
                                    </span>
                                </div>

                                <span
                                    className={`relative z-10 text-[10px] font-bold px-1.5 py-0.2 rounded-md tabular-nums leading-tight ${
                                        isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {formatFollowersCompact(platCount)}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
