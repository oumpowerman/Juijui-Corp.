
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MasterOption, Channel, ChannelGroup } from '../../../types';
import { Activity, ChevronDown, Check, Tv, Search, Users, Tag, X } from 'lucide-react';
import { useChannelGroups } from '../../../hooks/useChannelGroups';
import { getChannelTotalFollowers, formatFollowersCompact } from '../../channel/helpers/channelHelpers';

interface CFStatusChannelProps {
    status: string;
    setStatus: (val: string) => void;
    channelId: string;
    setChannelId: (val: string) => void;
    statusOptions: MasterOption[];
    channels: Channel[];
    groups?: ChannelGroup[];
}

const CFStatusChannel: React.FC<CFStatusChannelProps> = ({ 
    status, setStatus, channelId, setChannelId, statusOptions, channels, groups: propGroups 
}) => {
    // UI State for Custom Dropdowns
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isChannelOpen, setIsChannelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Refs for Click Outside
    const statusRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Channel groups & enrichment
    const { groups: hookGroups, enrichChannelsWithGroups } = useChannelGroups();
    const activeGroups = propGroups || hookGroups;
    const enrichedChannels = useMemo(() => enrichChannelsWithGroups(channels), [channels, enrichChannelsWithGroups]);

    // Helper: Find Current Objects
    const currentStatusOpt = statusOptions.find(o => o.key === status);
    const currentChannel = enrichedChannels.find(c => c.id === channelId) || channels.find(c => c.id === channelId);

    // Helper: Extract Base Color for Gradient Logic (e.g. 'bg-blue-100' -> 'blue')
    const getThemeColor = (colorClass: string = '') => {
        const match = colorClass.match(/bg-(\w+)-/);
        return match ? match[1] : 'slate';
    };

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
            if (channelRef.current && !channelRef.current.contains(event.target as Node)) {
                setIsChannelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when channel dropdown opens
    useEffect(() => {
        if (isChannelOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setSearchQuery('');
        }
    }, [isChannelOpen]);

    // Status Priority Hierarchy:
    // 1. ACTIVE (อันดับแรกสุด)
    // 2. PLANNING (กำลังเตรียมงาน/สร้างช่อง)
    // 3. PAUSED (พักชั่วคราว)
    // 4. ARCHIVED (ปิดตัว)
    const getStatusPriority = (chStatus?: string): number => {
        switch (chStatus) {
            case 'ACTIVE': return 1;
            case 'PLANNING': return 2;
            case 'PAUSED': return 3;
            case 'ARCHIVED': return 4;
            default: return 1;
        }
    };

    // Sort channels within a section: Status priority -> Followers desc -> Name th
    const sortChannels = (list: Channel[]) => {
        return [...list].sort((a, b) => {
            const aPriority = getStatusPriority(a.status);
            const bPriority = getStatusPriority(b.status);
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            const aFollowers = getChannelTotalFollowers(a);
            const bFollowers = getChannelTotalFollowers(b);
            if (bFollowers !== aFollowers) {
                return bFollowers - aFollowers;
            }

            return (a.name || '').localeCompare(b.name || '', 'th');
        });
    };

    // Filter channels by search query
    const filteredChannels = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return enrichedChannels;
        return enrichedChannels.filter(c => 
            (c.name || '').toLowerCase().includes(term) ||
            (c.group_name || '').toLowerCase().includes(term)
        );
    }, [enrichedChannels, searchQuery]);

    // Build grouped data structure
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

        // Sort groups by total followers of channels in each group (descending)
        const sGroups = [...activeGroups].sort((a, b) => {
            const aList = gMap[a.id] || [];
            const bList = gMap[b.id] || [];
            const aFollowers = aList.reduce((sum, ch) => sum + getChannelTotalFollowers(ch), 0);
            const bFollowers = bList.reduce((sum, ch) => sum + getChannelTotalFollowers(ch), 0);
            if (bFollowers !== aFollowers) {
                return bFollowers - aFollowers;
            }
            return (a.name || '').localeCompare(b.name || '', 'th');
        });

        return {
            sortedGroups: sGroups,
            groupedMap: gMap,
            ungroupedChannels: sortChannels(ungrouped),
            totalMatchedCount: filteredChannels.length
        };
    }, [activeGroups, filteredChannels]);

    // Visual Config for Active Status
    const statusTheme = getThemeColor(currentStatusOpt?.color);
    const activeStatusClass = currentStatusOpt 
        ? `bg-${statusTheme}-500 text-white shadow-${statusTheme}-200`
        : 'bg-slate-800 text-white shadow-slate-200';

    // Render single channel item row
    const renderChannelItem = (ch: Channel) => {
        const isSelected = channelId === ch.id;
        const totalFollowers = getChannelTotalFollowers(ch);
        const isNonActive = ch.status && ch.status !== 'ACTIVE';

        return (
            <button
                key={ch.id}
                type="button"
                onClick={() => { setChannelId(ch.id); setIsChannelOpen(false); }}
                className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-xl mb-1 transition-all group text-left cursor-pointer
                    ${isSelected ? 'bg-indigo-50/90 text-indigo-900 ring-1 ring-indigo-200 shadow-2xs' : 'hover:bg-slate-50 text-slate-700'}
                    ${isNonActive ? 'opacity-85 hover:opacity-100' : ''}
                `}
            >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Channel Logo */}
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {ch.logoUrl ? (
                            <img src={ch.logoUrl} alt={ch.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-black text-slate-400">
                                {ch.name.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Name & Badges */}
                    <div className="min-w-0 flex flex-col">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                            {ch.name}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {/* Operational Status Tag for non-active channels */}
                            {ch.status === 'PLANNING' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                    เตรียมงาน
                                </span>
                            )}
                            {ch.status === 'PAUSED' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                    พักชั่วคราว
                                </span>
                            )}
                            {ch.status === 'ARCHIVED' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
                                    ปิดตัว
                                </span>
                            )}

                            {/* Total Followers */}
                            {totalFollowers > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500">
                                    <Users className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{formatFollowersCompact(totalFollowers)}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 relative z-40">
            
            {/* --- 1. STATUS COMMAND BUTTON --- */}
            <div className="relative flex-1" ref={statusRef}>
                <button
                    type="button"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={`
                        w-full h-[60px] rounded-2xl flex items-center justify-between px-4 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer
                        ${activeStatusClass}
                    `}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start text-left min-w-0">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Current Status</span>
                            <span className="text-lg font-medium truncate w-full leading-none py-0.5 pb-1">
                                {currentStatusOpt?.label || 'Select Status'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Status Dropdown Menu */}
                {isStatusOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-left max-h-[300px] overflow-y-auto p-2">
                        <p className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">Change Workflow Stage</p>
                        {statusOptions.map((opt) => {
                            const isSelected = status === opt.key;
                            return (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => { setStatus(opt.key); setIsStatusOpen(false); }}
                                    className={`
                                        w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all cursor-pointer
                                        ${isSelected ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full ${opt.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-green-500" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- 2. CHANNEL SELECTOR (Section Grouped & Follower Ranked) --- */}
            <div className="relative md:w-5/12" ref={channelRef}>
                 <button
                    type="button"
                    onClick={() => setIsChannelOpen(!isChannelOpen)}
                    className={`
                        w-full h-[60px] bg-white border-2 rounded-2xl flex items-center justify-between px-4 transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer
                        ${isChannelOpen ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-md' : 'border-gray-100'}
                    `}
                >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        {/* Logo / Icon */}
                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {currentChannel?.logoUrl ? (
                                <img src={currentChannel.logoUrl} alt={currentChannel.name} className="w-full h-full object-cover" />
                            ) : (
                                <Tv className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        
                        <div className="flex flex-col items-start text-left min-w-0">
                            <div className="flex items-center gap-1.5 max-w-full">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                    {currentChannel?.group_name ? `[${currentChannel.group_name}]` : 'ช่อง / แบรนด์'}
                                </span>
                                {currentChannel && getChannelTotalFollowers(currentChannel) > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">
                                        <Users className="w-2.5 h-2.5 text-indigo-400" />
                                        {formatFollowersCompact(getChannelTotalFollowers(currentChannel))}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 w-full">
                                <span className="text-sm font-bold text-gray-800 truncate">
                                    {currentChannel?.name || 'เลือกช่อง'}
                                </span>
                                {currentChannel?.status && currentChannel.status !== 'ACTIVE' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                        {currentChannel.status === 'PLANNING' ? 'เตรียมงาน' : currentChannel.status === 'PAUSED' ? 'พัก' : 'ปิดตัว'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isChannelOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>

                {/* Channel Dropdown Menu with Section Grouping */}
                {isChannelOpen && (
                    <div className="absolute top-full left-0 md:left-auto md:right-0 w-full md:w-[380px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right flex flex-col max-h-[380px]">
                        
                        {/* Search Bar Header */}
                        <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-20">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ค้นหาชื่อช่อง หรือ กลุ่ม..."
                                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-800 placeholder-slate-400"
                                />
                                {searchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Channels List Container */}
                        <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100">
                            {totalMatchedCount === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    <Tv className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                                    <p className="text-xs font-semibold">ไม่พบช่องรายการที่ค้นหา</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">ลองค้นหาด้วยคำอื่น หรือตรวจสอบตัวสะกด</p>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Grouped Sections (Sorted by Group Followers Descending) */}
                                    {sortedGroups.map((group) => {
                                        const groupChannels = groupedMap[group.id] || [];
                                        if (groupChannels.length === 0) return null;

                                        const sortedGroupChannels = sortChannels(groupChannels);
                                        const groupFollowers = groupChannels.reduce((sum, ch) => sum + getChannelTotalFollowers(ch), 0);

                                        return (
                                            <div key={group.id} className="py-2 first:pt-0 last:pb-0">
                                                {/* Group Section Header */}
                                                <div className="px-2 py-1 mb-1.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 shrink-0 ${group.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {group.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            ({groupChannels.length})
                                                        </span>
                                                    </div>
                                                    {groupFollowers > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 shrink-0">
                                                            {formatFollowersCompact(groupFollowers)} ผู้ติดตาม
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Channels inside this Group */}
                                                <div className="space-y-0.5">
                                                    {sortedGroupChannels.map(renderChannelItem)}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* 2. Ungrouped Section (if any channels don't belong to a group) */}
                                    {ungroupedChannels.length > 0 && (
                                        <div className="py-2 first:pt-0 last:pb-0">
                                            {/* Ungrouped Section Header */}
                                            <div className="px-2 py-1 mb-1.5 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                                                        ช่องทั่วไป (Ungrouped)
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        ({ungroupedChannels.length})
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Channels inside Ungrouped */}
                                            <div className="space-y-0.5">
                                                {ungroupedChannels.map(renderChannelItem)}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Dropdown Footer Tip */}
                        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>เรียงตามกลุ่มผู้ติดตามสูงสุด</span>
                            <span>{totalMatchedCount} ช่อง</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CFStatusChannel;

