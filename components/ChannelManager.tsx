
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, LayoutTemplate, Layers, Users, Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, Task } from '../types';
import { PLATFORM_ICONS } from '../constants';
import MentorTip from './MentorTip';
import NotificationBellBtn from './NotificationBellBtn';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import ChannelFormModal from './ChannelFormModal.tsx';
import { PLATFORM_OPTIONS } from './channel/PlatformGridSelector';
import { supabase } from '../lib/supabase';

interface ChannelManagerProps {
  tasks: Task[];
  channels: Channel[];
  onAdd: (channel: Channel, file?: File) => Promise<boolean>;
  onEdit: (channel: Channel, file?: File) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onOpenSettings: () => void;
}

export const formatFollowersCompact = (num?: number): string => {
  if (!num || isNaN(num) || num <= 0) return '0';
  if (num >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(1);
    return formatted.endsWith('.0') ? `${num / 1_000_000}M` : `${formatted}M`;
  }
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(1);
    return formatted.endsWith('.0') ? `${num / 1_000}K` : `${formatted}K`;
  }
  return num.toLocaleString();
};

const getChannelTotalFollowers = (channel: Channel): number => {
  if (!channel.followers) return 0;
  return Object.values(channel.followers).reduce<number>((sum, count) => {
    return sum + (typeof count === 'number' && !isNaN(count) && count > 0 ? count : 0);
  }, 0);
};

const getGlowStyles = (colorClass: string) => {
  const raw = colorClass || '';
  if (raw.includes('red')) return { 
    gradient: 'from-rose-500/10 to-red-500/10 hover:from-rose-500/20 hover:to-red-500/20', 
    shadow: 'shadow-red-500/5 group-hover:shadow-red-500/15', 
    border: 'group-hover:border-rose-200', 
    badgeClass: 'bg-red-50 border-red-200 text-red-600',
    meshBg: 'text-red-500'
  };
  if (raw.includes('orange')) return { 
    gradient: 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20', 
    shadow: 'shadow-orange-500/5 group-hover:shadow-orange-500/15', 
    border: 'group-hover:border-orange-200', 
    badgeClass: 'bg-orange-50 border-orange-200 text-orange-600',
    meshBg: 'text-orange-500'
  };
  if (raw.includes('amber')) return { 
    gradient: 'from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20', 
    shadow: 'shadow-amber-500/5 group-hover:shadow-amber-500/15', 
    border: 'group-hover:border-amber-200', 
    badgeClass: 'bg-amber-50 border-amber-200 text-amber-600',
    meshBg: 'text-amber-500'
  };
  if (raw.includes('green')) return { 
    gradient: 'from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20', 
    shadow: 'shadow-green-500/5 group-hover:shadow-green-500/15', 
    border: 'group-hover:border-emerald-200', 
    badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    meshBg: 'text-emerald-500'
  };
  if (raw.includes('teal')) return { 
    gradient: 'from-teal-500/10 to-cyan-500/10 hover:from-teal-500/20 hover:to-cyan-500/20', 
    shadow: 'shadow-teal-500/5 group-hover:shadow-teal-500/15', 
    border: 'group-hover:border-teal-200', 
    badgeClass: 'bg-teal-50 border-teal-200 text-teal-600',
    meshBg: 'text-teal-500'
  };
  if (raw.includes('blue')) return { 
    gradient: 'from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20', 
    shadow: 'shadow-blue-500/5 group-hover:shadow-blue-500/15', 
    border: 'group-hover:border-blue-200', 
    badgeClass: 'bg-blue-50 border-blue-200 text-blue-600',
    meshBg: 'text-blue-500'
  };
  if (raw.includes('indigo')) return { 
    gradient: 'from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20', 
    shadow: 'shadow-indigo-500/5 group-hover:shadow-indigo-500/15', 
    border: 'group-hover:border-indigo-200', 
    badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    meshBg: 'text-indigo-500'
  };
  if (raw.includes('purple')) return { 
    gradient: 'from-purple-500/10 to-fuchsia-500/10 hover:from-purple-500/20 hover:to-fuchsia-500/20', 
    shadow: 'shadow-purple-500/5 group-hover:shadow-purple-500/15', 
    border: 'group-hover:border-purple-200', 
    badgeClass: 'bg-purple-50 border-purple-200 text-purple-600',
    meshBg: 'text-purple-500'
  };
  if (raw.includes('pink')) return { 
    gradient: 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-pink-500/20', 
    shadow: 'shadow-pink-500/5 group-hover:shadow-pink-500/15', 
    border: 'group-hover:border-pink-200', 
    badgeClass: 'bg-pink-50 border-pink-200 text-pink-500',
    meshBg: 'text-pink-500'
  };
  return { 
    gradient: 'from-slate-500/10 to-zinc-500/10 hover:from-slate-500/20 hover:to-zinc-500/20', 
    shadow: 'shadow-slate-500/5 group-hover:shadow-slate-500/15', 
    border: 'group-hover:border-slate-300', 
    badgeClass: 'bg-slate-50 border-slate-200 text-slate-500',
    meshBg: 'text-slate-500'
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

const ChannelManager: React.FC<ChannelManagerProps> = ({ tasks, channels, onAdd, onEdit, onDelete, onOpenSettings }) => {
  const { showConfirm } = useGlobalDialog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Server-Side Direct Content Count Map (Lifetime contents in database, not limited by date windowing)
  const [contentCountMap, setContentCountMap] = useState<Record<string, number>>({});
  const [totalContentsCount, setTotalContentsCount] = useState<number>(0);

  const fetchDirectContentCounts = useCallback(async () => {
    try {
      // Query only channel_id column across all contents (ultra-lightweight payload, ~few KB)
      const { data, error } = await supabase
        .from('contents')
        .select('channel_id');

      if (error) {
        console.warn('[ChannelManager] Could not fetch direct content counts:', error.message);
        return;
      }

      if (data) {
        const counts: Record<string, number> = {};
        let total = 0;
        data.forEach((row: { channel_id?: string | null }) => {
          total += 1;
          if (row.channel_id) {
            counts[row.channel_id] = (counts[row.channel_id] || 0) + 1;
          }
        });
        setContentCountMap(counts);
        setTotalContentsCount(total);
      }
    } catch (err) {
      console.warn('[ChannelManager] Direct count error:', err);
    }
  }, []);

  // Fetch count on mount and subscribe to realtime changes in contents table
  useEffect(() => {
    fetchDirectContentCounts();

    const channelSub = supabase
      .channel('realtime-channel-content-counts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contents' },
        () => {
          fetchDirectContentCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [fetchDirectContentCounts]);

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setIsFormOpen(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsFormOpen(true);
  };

  const handleSaveChannel = async (payload: Channel, logoFile?: File | null) => {
    if (editingChannel) {
      return await onEdit(payload, logoFile || undefined);
    } else {
      return await onAdd(payload, logoFile || undefined);
    }
  };

  // Calculate Ecosystem Total Followers
  const grandTotalFollowers = channels.reduce((sum, ch) => {
    return sum + getChannelTotalFollowers(ch);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-500 pb-20">
      <MentorTip moduleId="CHANNEL" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
             จัดการช่องรายการ (Brands & Shows)
          </h1>
          <p className="text-gray-500 mt-1">
             สร้าง "รายการ" หรือ "แบรนด์" ของคุณ พร้อมติดตามยอดผู้ติดตามรวมและลิงก์ของแต่ละ Platform
          </p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleCreateChannel}
                className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
            >
                <Plus className="w-5 h-5 mr-2" />
                สร้างรายการใหม่
            </button>
            
            {/* Notification Button */}
            <NotificationBellBtn 
                onClick={() => onOpenSettings()}
                className="hidden md:flex"
            />
        </div>
      </div>

      {/* Ecosystem Statistics Cards */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">รายการในสังกัด</p>
              <p className="text-xl font-black text-slate-800">{channels.length} <span className="text-xs font-medium text-slate-400">ช่อง</span></p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">คอนเทนต์ทั้งหมด</p>
              <p className="text-xl font-black text-slate-800">{totalContentsCount} <span className="text-xs font-medium text-slate-400">คอนเทนต์</span></p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl border border-indigo-100 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-900/70 flex items-center gap-1">
                <span>ผู้ติดตามรวมทุกช่อง (Total Reach)</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </p>
              <p className="text-xl font-black text-indigo-950">
                {grandTotalFollowers > 0 ? (
                  <>
                    {formatFollowersCompact(grandTotalFollowers)} <span className="text-xs font-medium text-indigo-400">({grandTotalFollowers.toLocaleString()} คน)</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-400">ยังไม่ได้ระบุยอด</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Channels Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {channels.length === 0 && (
            <motion.div 
              variants={cardVariants}
              className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"
            >
                <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>ยังไม่มีรายการเลยครับ ลองกด "สร้างรายการใหม่" ดูนะ</p>
            </motion.div>
        )}
        
        {channels.map((channel, idx) => {
            const contentCount = contentCountMap[channel.id] || 0;
            const channelTotalFollowers = getChannelTotalFollowers(channel);
            const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
            const glow = getGlowStyles(channel.color);
            
            return (
                <motion.div 
                    key={channel.id} 
                    variants={cardVariants}
                    whileHover={{ 
                        y: -6, 
                        scale: 1.01,
                        transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    onClick={() => handleEditChannel(channel)}
                    className={`bg-white rounded-[2rem] border border-slate-200/90 transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer relative shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:border-slate-300`}
                >
                    {/* Ambient background glow corresponding to the brand color class */}
                    <div className={`absolute -inset-[1px] rounded-[2rem] bg-gradient-to-tr ${glow.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 -z-10`} />

                    {/* Color Bar / Banner */}
                    <div className={`h-28 w-full ${bgClass} relative overflow-hidden transition-all duration-500`}>
                        {/* Elegant mesh design on matching background */}
                        <div 
                          className="absolute inset-0 opacity-15"
                          style={{ 
                            backgroundImage: 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)', 
                            backgroundSize: '10px 10px',
                            color: 'inherit'
                          }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent"></div>
                        
                        {/* Unique structural catalog number */}
                        <span className="absolute top-4 right-5 font-mono text-[9px] font-black uppercase tracking-widest text-slate-800/40 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full z-10 border border-white/40">
                          SHOW-{channel.id.substring(0, 4).toUpperCase()}
                        </span>
                    </div>
                    
                    {/* Logo Overlay with awesome interactive bounce */}
                    <div className="absolute top-14 left-6">
                         <div className="w-20 h-20 rounded-2xl border-[3.5px] border-white shadow-lg bg-white overflow-hidden flex items-center justify-center group-hover:scale-105 group-hover:-rotate-2 group-hover:shadow-indigo-500/10 transition-all duration-300">
                             {channel.logoUrl ? (
                                 <img src={channel.logoUrl} className="w-full h-full object-cover rounded-xl" alt="logo" />
                             ) : (
                                 <div className={`w-full h-full flex items-center justify-center font-black text-2xl uppercase rounded-xl ${channel.color.split(' ')[1]}`}>
                                     {channel.name.substring(0, 2)}
                                 </div>
                             )}
                          </div>
                    </div>
 
                    <div className="p-6 pt-11 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl text-slate-800 line-clamp-1 group-hover:text-slate-900 transition-colors" title={channel.name}>
                                {channel.name}
                            </h3>
                            <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if(await showConfirm(`ยืนยันลบรายการ "${channel.name}" ?`)) onDelete(channel.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95 cursor-pointer"
                                    title="ลบรายการ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
 
                        {channel.description ? (
                            <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[36px] mt-1 font-medium leading-relaxed">
                                {channel.description}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-300 italic mb-4 line-clamp-2 min-h-[36px] mt-1 leading-relaxed">
                                ไม่มีคำอธิบายช่องเพิ่มเติม
                            </p>
                        )}

                        {/* Total Followers & Content count highlights */}
                        <div className="mb-4 flex items-center gap-2">
                            <div 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold"
                              title={`ยอดผู้ติดตามรวมทุกแพลตฟอร์ม: ${channelTotalFollowers.toLocaleString()} คน`}
                            >
                                <Users className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{channelTotalFollowers > 0 ? `${formatFollowersCompact(channelTotalFollowers)} ผู้ติดตาม` : '0 ผู้ติดตาม'}</span>
                            </div>

                            <span 
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs ${glow.badgeClass}`}
                                title={`จำนวนคอนเทนต์ทั้งหมดของช่องนี้ในระบบ: ${contentCount} คอนเทนต์`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>{contentCount} คอนเทนต์</span>
                            </span>
                        </div>
 
                        <div className="mt-auto pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-1.5">
                                    {(channel.platforms || []).map(p => {
                                        const Icon = PLATFORM_ICONS[p];
                                        const pColor = PLATFORM_OPTIONS.find(opt => opt.id === p)?.color || 'text-gray-500';
                                        const link = channel.social_links?.[p];
                                        const followerCount = channel.followers?.[p];
                                        const hasLink = Boolean(link && link.trim());
                                        const hasFollowers = typeof followerCount === 'number' && !isNaN(followerCount) && followerCount > 0;
                                        if (!Icon) return null;

                                        const tooltipParts = [`${p}`];
                                        if (hasFollowers) tooltipParts.push(`${followerCount!.toLocaleString()} ผู้ติดตาม`);
                                        if (hasLink) tooltipParts.push(`คลิกเพื่อเปิดหน้าช่อง: ${link}`);
                                        else tooltipParts.push(`(ยังไม่ได้ผูกลิงก์หน้าช่อง)`);

                                        return (
                                            <motion.button 
                                                key={p} 
                                                type="button"
                                                whileHover={{ y: -4, scale: 1.15, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 12 }}
                                                onClick={(e) => {
                                                    if (hasLink) {
                                                        e.stopPropagation();
                                                        let fullUrl = link!.trim();
                                                        if (!/^https?:\/\//i.test(fullUrl)) {
                                                            fullUrl = 'https://' + fullUrl;
                                                        }
                                                        window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                                    }
                                                }}
                                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all z-10 relative ${
                                                    hasLink 
                                                        ? 'bg-white border-indigo-200 shadow-md cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1' 
                                                        : 'bg-slate-50 border-slate-200/80 cursor-default opacity-60'
                                                }`}
                                                title={tooltipParts.join(' • ')}
                                            >
                                                <Icon className={`w-4 h-4 ${hasLink ? pColor : 'text-slate-400'}`} />
                                                {hasLink && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <span className="text-[11px] font-semibold text-slate-400">
                                  คลิกการ์ดเพื่อแก้ไข
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
        })}
      </motion.div>

      {/* Render the extracted Channel Form Modal */}
      <ChannelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        channel={editingChannel}
        onSave={handleSaveChannel}
      />
    </div>
  );
};

export default ChannelManager;

