import React from 'react';
import { Trash2, Users, Layers, Tag, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Channel, ChannelGroup } from '../../types';
import { PLATFORM_ICONS } from '../../constants';
import { PLATFORM_OPTIONS } from './PlatformGridSelector';
import { SocialLinkPreviewCard } from './SocialLinkPreviewCard';
import { formatFollowersCompact } from '../ChannelManager';

interface ChannelCardProps {
  channel: Channel;
  group?: ChannelGroup | null;
  contentCount: number;
  channelTotalFollowers: number;
  onEdit: (channel: Channel) => void;
  onDelete: (id: string, name: string) => void;
  glow: {
    gradient: string;
    shadow: string;
    border: string;
    badgeClass: string;
    meshBg: string;
  };
  bgClass: string;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  group,
  contentCount,
  channelTotalFollowers,
  onEdit,
  onDelete,
  glow,
  bgClass,
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 25, scale: 0.96 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring', stiffness: 120, damping: 16 }
        }
      }}
      whileHover={{
        y: -6,
        scale: 1.01,
        transition: { type: 'spring', stiffness: 400, damping: 18 }
      }}
      onClick={() => onEdit(channel)}
      className="bg-white rounded-[2rem] border border-slate-200/80 border-b-[3.5px] border-b-slate-200/90 transition-all duration-300 group flex flex-col cursor-pointer relative shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_45px_rgba(0,0,0,0.07)] hover:border-b-indigo-200/90 hover:z-30"
    >
      {/* Ambient background glow corresponding to the brand color class */}
      <div className={`absolute -inset-[1px] rounded-[2rem] bg-gradient-to-tr ${glow.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 -z-10 pointer-events-none`} />

      {/* Color Bar / Banner */}
      <div className={`h-28 w-full ${bgClass} relative rounded-t-[calc(2rem-2px)] overflow-hidden transition-all duration-500`}>
        {/* Mesh design on matching background */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{ 
            backgroundImage: 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)', 
            backgroundSize: '10px 10px',
            color: 'inherit'
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent"></div>
        
        {/* Badges in Banner: Group Section Badge & Catalog Number */}
        <div className="absolute top-3.5 right-4 flex items-center gap-1.5 z-10">
          {(channel.group_name || group?.name) && (
            <span 
              className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-white/85 backdrop-blur-md text-slate-800 border border-white/80 border-b-[1.5px] border-b-slate-200/60 shadow-2xs flex items-center gap-1 max-w-[120px] truncate"
              title={`สังกัดกลุ่ม: ${channel.group_name || group?.name}`}
            >
              <Tag className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
              <span className="truncate">{channel.group_name || group?.name}</span>
            </span>
          )}

          <span className="font-mono text-[9px] font-black uppercase tracking-widest text-slate-800/70 bg-white/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/60 shadow-2xs shrink-0">
            SHOW-{channel.id.substring(0, 4).toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* 3D Logo Floating Crest */}
      <div className="absolute top-14 left-6">
        <div className="w-20 h-20 rounded-2xl border-[3.5px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-slate-200/60 bg-white overflow-hidden flex items-center justify-center group-hover:scale-105 group-hover:-rotate-2 group-hover:shadow-[0_12px_28px_rgba(99,102,241,0.18)] transition-all duration-300">
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
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-xl text-slate-800 line-clamp-1 group-hover:text-slate-900 transition-colors" title={channel.name}>
              {channel.name}
            </h3>
          </div>
          <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(channel.id, channel.name);
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

        {/* Total Followers & Content count highlights - Glassy Pastel Metric Badges */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-white to-slate-50/90 backdrop-blur-sm border border-slate-200/80 border-b-[2px] border-b-slate-300/80 text-slate-700 text-xs font-bold shadow-2xs"
            title={`ยอดผู้ติดตามรวมทุกแพลตฟอร์ม: ${channelTotalFollowers.toLocaleString()} คน`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>{channelTotalFollowers > 0 ? `${formatFollowersCompact(channelTotalFollowers)} ผู้ติดตาม` : '0 ผู้ติดตาม'}</span>
          </div>

          <span 
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-b-[2px] backdrop-blur-sm transition-colors shadow-2xs ${glow.badgeClass}`}
            title={`จำนวนคอนเทนต์ทั้งหมดของช่องนี้ในระบบ: ${contentCount} คอนเทนต์`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{contentCount} คอนเทนต์</span>
          </span>

          {channel.email && channel.email.trim() && (
            <a
              href={`mailto:${channel.email.trim()}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-indigo-50/80 to-white text-indigo-700 border border-indigo-200/80 border-b-[2px] border-b-indigo-300/80 text-xs font-bold shadow-2xs hover:bg-indigo-100/80 hover:text-indigo-900 transition-colors max-w-full truncate"
              title={`อีเมลติดต่อ: ${channel.email.trim()}`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{channel.email.trim()}</span>
            </a>
          )}
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
                if (!Icon) return null;

                return (
                  <SocialLinkPreviewCard
                    key={p}
                    platform={p}
                    url={link}
                    channelName={channel.name}
                    channelLogoUrl={channel.logoUrl}
                    channelColor={channel.color}
                    followersCount={followerCount}
                  >
                    <motion.button 
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
                          ? 'bg-gradient-to-b from-white to-indigo-50/60 border-indigo-200 border-b-[2.5px] border-b-indigo-300/90 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 active:translate-y-[1px] active:border-b-[1px]' 
                          : 'bg-slate-50 border-slate-200/80 border-b-[2px] cursor-default opacity-60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${hasLink ? pColor : 'text-slate-400'}`} />
                      {hasLink && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                      )}
                    </motion.button>
                  </SocialLinkPreviewCard>
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
};
export default ChannelCard;
