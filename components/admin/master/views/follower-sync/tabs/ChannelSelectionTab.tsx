import React, { useState, useMemo } from 'react';
import { 
    Tv, 
    Search, 
    CheckSquare, 
    Square, 
    Youtube, 
    Facebook, 
    Instagram, 
    Smartphone, 
    CheckCircle2, 
    Users, 
    ExternalLink 
} from 'lucide-react';
import { Channel } from '../../../../../../types';
import { FollowerSyncConfig } from '../types';

interface ChannelSelectionTabProps {
    channels: Channel[];
    config: FollowerSyncConfig;
    onChange: (updater: (prev: FollowerSyncConfig) => FollowerSyncConfig) => void;
}

export const ChannelSelectionTab: React.FC<ChannelSelectionTabProps> = ({
    channels,
    config,
    onChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // If config.enabledChannelIds is empty, by default all channels are considered enabled initially
    const isChannelEnabled = (channelId: string) => {
        if (!config.enabledChannelIds || config.enabledChannelIds.length === 0) {
            return true; // Default all active
        }
        return config.enabledChannelIds.includes(channelId);
    };

    // Filter channels by search
    const filteredChannels = useMemo(() => {
        if (!searchQuery.trim()) return channels;
        const q = searchQuery.toLowerCase();
        return channels.filter(c => c.name.toLowerCase().includes(q));
    }, [channels, searchQuery]);

    // Active selection count
    const selectedCount = useMemo(() => {
        if (!config.enabledChannelIds || config.enabledChannelIds.length === 0) {
            return channels.length;
        }
        return channels.filter(c => config.enabledChannelIds.includes(c.id)).length;
    }, [channels, config.enabledChannelIds]);

    // Toggle individual channel
    const handleToggleChannel = (channelId: string) => {
        onChange(prev => {
            const currentIds = (!prev.enabledChannelIds || prev.enabledChannelIds.length === 0)
                ? channels.map(c => c.id)
                : [...prev.enabledChannelIds];

            if (currentIds.includes(channelId)) {
                const nextIds = currentIds.filter(id => id !== channelId);
                return { ...prev, enabledChannelIds: nextIds };
            } else {
                return { ...prev, enabledChannelIds: [...currentIds, channelId] };
            }
        });
    };

    // Select All
    const handleSelectAll = () => {
        onChange(prev => ({
            ...prev,
            enabledChannelIds: channels.map(c => c.id),
        }));
    };

    // Deselect All
    const handleDeselectAll = () => {
        onChange(prev => ({
            ...prev,
            enabledChannelIds: [], // Empty selection
        }));
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Tv className="w-5 h-5 text-indigo-600" />
                            <span>เลือกช่องที่ต้องการซิงค์ (Target Channels Selection)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            เลือกเฉพาะช่องที่จำเป็นต้องอัปเดตยอดผู้ติดตาม เพื่อลดการยิงเครือข่ายที่ไม่จำเป็น
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100"
                        >
                            <CheckSquare className="w-4 h-4" />
                            <span>เลือกทั้งหมด ({channels.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                        >
                            <Square className="w-4 h-4" />
                            <span>ยกเลิกทั้งหมด</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar & Counter Pill */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อช่อง..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-indigo-50/80 text-indigo-800 border border-indigo-100/80 text-xs font-bold shrink-0 self-end sm:self-auto">
                        เลือกแล้ว: <span className="font-black text-indigo-900">{selectedCount}</span> / {channels.length} ช่อง
                    </div>
                </div>
            </div>

            {/* Channels Grid */}
            {filteredChannels.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-2">
                    <Tv className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">ไม่พบช่องรายการที่ตรงกับการค้นหา</p>
                    <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredChannels.map(channel => {
                        const enabled = isChannelEnabled(channel.id);
                        const socialLinks = (channel.social_links || {}) as Record<string, string>;
                        const followers = (channel.followers || {}) as Record<string, number>;
                        const totalReach = Object.values(followers).reduce((sum, n) => sum + (Number(n) || 0), 0);

                        return (
                            <div
                                key={channel.id}
                                onClick={() => handleToggleChannel(channel.id)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                                    enabled
                                        ? 'bg-white border-indigo-500/80 shadow-xs ring-2 ring-indigo-500/10'
                                        : 'bg-slate-50/80 border-slate-200/80 opacity-60 hover:opacity-90'
                                }`}
                            >
                                <div className="flex items-start gap-3.5 min-w-0">
                                    {/* Avatar / Logo */}
                                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {channel.logoUrl ? (
                                            <img
                                                src={channel.logoUrl}
                                                alt={channel.name}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <Tv className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Channel Details */}
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 text-sm truncate">
                                                {channel.name}
                                            </h4>
                                            {channel.group_name && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold truncate shrink-0">
                                                    {channel.group_name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Social Links Badges */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {socialLinks.youtube && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-100" title="YouTube Link Connected">
                                                    <Youtube className="w-3 h-3 text-rose-600" />
                                                    <span>YT</span>
                                                </span>
                                            )}
                                            {socialLinks.facebook && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100" title="Facebook Link Connected">
                                                    <Facebook className="w-3 h-3 text-blue-600" />
                                                    <span>FB</span>
                                                </span>
                                            )}
                                            {socialLinks.instagram && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 text-[10px] font-semibold border border-pink-100" title="Instagram Link Connected">
                                                    <Instagram className="w-3 h-3 text-pink-600" />
                                                    <span>IG</span>
                                                </span>
                                            )}
                                            {socialLinks.tiktok && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold border border-slate-200" title="TikTok Link Connected">
                                                    <Smartphone className="w-3 h-3 text-slate-700" />
                                                    <span>TikTok</span>
                                                </span>
                                            )}
                                            {!socialLinks.youtube && !socialLinks.facebook && !socialLinks.instagram && !socialLinks.tiktok && (
                                                <span className="text-[10px] text-slate-400 italic">
                                                    ยังไม่มีลิงก์โซเชียล
                                                </span>
                                            )}
                                        </div>

                                        {/* Follower Total */}
                                        <p className="text-[11px] text-indigo-700/80 font-bold flex items-center gap-1 pt-0.5">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>Reach ปัจจุบัน: {totalReach > 0 ? totalReach.toLocaleString() : '0'} คน</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Selection Checkbox */}
                                <div className="shrink-0 pt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={() => {}}
                                        className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
