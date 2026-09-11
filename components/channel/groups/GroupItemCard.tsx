import React from 'react';
import { 
  Edit2, Trash2, ArrowRight, GripVertical, X, Layers
} from 'lucide-react';
import { Channel, ChannelGroup } from '../../../types';
import { DEFAULT_GROUP_COLORS } from '../../../hooks/useChannelGroups';

interface GroupItemCardProps {
  group: ChannelGroup;
  channels: Channel[];
  isOver: boolean;
  isEditing: boolean;
  editName: string;
  setEditName: (val: string) => void;
  editDesc: string;
  setEditDesc: (val: string) => void;
  editColor: string;
  setEditColor: (val: string) => void;
  onStartEdit: (group: ChannelGroup) => void;
  onCancelEdit: () => void;
  onSaveEdit: (groupId: string) => Promise<void>;
  onDelete: (group: ChannelGroup) => Promise<void>;
  handleDragOver: (e: React.DragEvent, targetGroupId: string) => void;
  handleDrop: (e: React.DragEvent, targetGroupId: string) => Promise<void>;
  handleDragStart: (e: React.DragEvent, channelId: string) => void;
  handleDragEnd: () => void;
  onAssignChannel: (channelId: string, groupId: string | null) => Promise<boolean>;
}

// Helper to determine ambient glow and accent styling from group color class
const getGroupVisualTheme = (colorClass?: string) => {
  const c = colorClass || '';
  if (c.includes('purple')) {
    return {
      glow: 'bg-purple-500',
      bevel: 'border-b-purple-300/70',
      badgeBg: 'bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-purple-500/5 text-purple-800 border-purple-200/90',
      dragRing: 'ring-purple-500/25 border-purple-400 bg-purple-50/70 shadow-purple-500/15',
      iconTint: 'text-purple-600',
    };
  }
  if (c.includes('pink')) {
    return {
      glow: 'bg-pink-500',
      bevel: 'border-b-pink-300/70',
      badgeBg: 'bg-gradient-to-r from-pink-500/15 via-pink-500/10 to-pink-500/5 text-pink-800 border-pink-200/90',
      dragRing: 'ring-pink-500/25 border-pink-400 bg-pink-50/70 shadow-pink-500/15',
      iconTint: 'text-pink-600',
    };
  }
  if (c.includes('rose')) {
    return {
      glow: 'bg-rose-500',
      bevel: 'border-b-rose-300/70',
      badgeBg: 'bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-500/5 text-rose-800 border-rose-200/90',
      dragRing: 'ring-rose-500/25 border-rose-400 bg-rose-50/70 shadow-rose-500/15',
      iconTint: 'text-rose-600',
    };
  }
  if (c.includes('amber')) {
    return {
      glow: 'bg-amber-500',
      bevel: 'border-b-amber-300/70',
      badgeBg: 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 text-amber-900 border-amber-200/90',
      dragRing: 'ring-amber-500/25 border-amber-400 bg-amber-50/70 shadow-amber-500/15',
      iconTint: 'text-amber-600',
    };
  }
  if (c.includes('emerald')) {
    return {
      glow: 'bg-emerald-500',
      bevel: 'border-b-emerald-300/70',
      badgeBg: 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 text-emerald-800 border-emerald-200/90',
      dragRing: 'ring-emerald-500/25 border-emerald-400 bg-emerald-50/70 shadow-emerald-500/15',
      iconTint: 'text-emerald-600',
    };
  }
  if (c.includes('teal')) {
    return {
      glow: 'bg-teal-500',
      bevel: 'border-b-teal-300/70',
      badgeBg: 'bg-gradient-to-r from-teal-500/15 via-teal-500/10 to-teal-500/5 text-teal-800 border-teal-200/90',
      dragRing: 'ring-teal-500/25 border-teal-400 bg-teal-50/70 shadow-teal-500/15',
      iconTint: 'text-teal-600',
    };
  }
  if (c.includes('blue')) {
    return {
      glow: 'bg-blue-500',
      bevel: 'border-b-blue-300/70',
      badgeBg: 'bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-blue-500/5 text-blue-800 border-blue-200/90',
      dragRing: 'ring-blue-500/25 border-blue-400 bg-blue-50/70 shadow-blue-500/15',
      iconTint: 'text-blue-600',
    };
  }
  // Default: Indigo
  return {
    glow: 'bg-indigo-500',
    bevel: 'border-b-indigo-300/70',
    badgeBg: 'bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-indigo-500/5 text-indigo-800 border-indigo-200/90',
    dragRing: 'ring-indigo-500/25 border-indigo-400 bg-indigo-50/70 shadow-indigo-500/15',
    iconTint: 'text-indigo-600',
  };
};

export const GroupItemCard: React.FC<GroupItemCardProps> = ({
  group,
  channels,
  isOver,
  isEditing,
  editName,
  setEditName,
  editDesc,
  setEditDesc,
  editColor,
  setEditColor,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  handleDragOver,
  handleDrop,
  handleDragStart,
  handleDragEnd,
  onAssignChannel,
}) => {
  const groupChannels = channels.filter(ch => ch.group_id === group.id);
  const theme = getGroupVisualTheme(group.color);

  return (
    <div
      onDragOver={(e) => handleDragOver(e, group.id)}
      onDrop={(e) => handleDrop(e, group.id)}
      className={`group/card relative rounded-2xl border border-white/80 border-b-[3.5px] ${theme.bevel} ring-1 ring-slate-900/5 transition-all duration-200 flex flex-col p-4 bg-white/85 backdrop-blur-md overflow-hidden ${
        isOver 
          ? `ring-4 ${theme.dragRing} scale-[1.015] shadow-xl` 
          : 'shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-1px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.1),0_4px_12px_-2px_rgba(0,0,0,0.04)]'
      }`}
    >
      {/* 3D Specular Top Rim Light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Dynamic Ambient Glow (Top Right) */}
      <div 
        className={`pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full ${theme.glow} opacity-[0.14] blur-2xl transition-opacity duration-300 group-hover/card:opacity-[0.24]`} 
      />

      {/* Group Card Header */}
      {isEditing ? (
        <div className="relative z-10 space-y-3 mb-3 p-3.5 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-xs">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50/80 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="ชื่อกลุ่ม (เช่น Lifestyle, บันเทิง)"
            autoFocus
          />
          <input
            type="text"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full px-3 py-1.5 text-[11px] bg-slate-50/80 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="คำอธิบายกลุ่มสั้นๆ"
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {DEFAULT_GROUP_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setEditColor(c.class)}
                className={`w-5 h-5 rounded-full ${c.colorDot} shadow-xs transition-all ${
                  editColor === c.class ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                } cursor-pointer`}
                title={c.label}
              />
            ))}
          </div>
          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(group.id)}
              className="px-3.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
            >
              บันทึก
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100/90">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 3D Glass Title Capsule */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shadow-[0_2px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs whitespace-nowrap ${theme.badgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.glow}`} />
                <span className="truncate max-w-[150px]">{group.name}</span>
              </div>

              {/* Translucent Count Chip */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/[0.04] text-slate-600 border border-slate-900/[0.04] backdrop-blur-xs whitespace-nowrap">
                {groupChannels.length} รายการ
              </span>
            </div>

            {group.description && (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 leading-relaxed font-medium">
                {group.description}
              </p>
            )}
          </div>

          {/* Micro-Action Floating Glass Buttons */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              type="button"
              onClick={() => onStartEdit(group)}
              className="p-1.5 bg-white/70 hover:bg-white text-slate-400 hover:text-indigo-600 border border-white/80 hover:border-indigo-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-sm transition-all active:scale-90 cursor-pointer"
              title="แก้ไขชื่อ/สีกลุ่ม"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(group)}
              className="p-1.5 bg-white/70 hover:bg-white text-slate-400 hover:text-rose-600 border border-white/80 hover:border-rose-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-sm transition-all active:scale-90 cursor-pointer"
              title="ลบกลุ่มนี้"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Drop Target Zone & Channels inside this group */}
      <div className="relative z-10 flex-1 min-h-[140px] space-y-2 overflow-y-auto max-h-[220px] p-0.5 [scrollbar-gutter:stable]">
        {groupChannels.length === 0 ? (
          <div className="h-full min-h-[130px] border-2 border-dashed border-slate-200/90 rounded-xl flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-white/40 to-slate-50/60 backdrop-blur-xs group-hover/card:border-slate-300 transition-colors">
            <div className="w-7 h-7 rounded-full bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center mb-1.5">
              <ArrowRight className={`w-3.5 h-3.5 ${theme.iconTint} opacity-80 animate-pulse`} />
            </div>
            <p className="text-[11px] font-bold text-slate-600 whitespace-nowrap">ลากช่องมาวางที่นี่</p>
            <p className="text-[10px] text-slate-400 mt-0.5">เพิ่มเข้ากลุ่ม {group.name}</p>
          </div>
        ) : (
          groupChannels.map(ch => (
            <div
              key={ch.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ch.id)}
              onDragEnd={handleDragEnd}
              className="px-2.5 py-2 bg-white/90 hover:bg-white backdrop-blur-xs rounded-xl border border-white/90 hover:border-indigo-200/90 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-between group/item cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-indigo-500 transition-colors shrink-0" />
                {ch.logoUrl ? (
                  <img 
                    src={ch.logoUrl} 
                    className="w-6 h-6 rounded-lg object-cover border border-slate-200/90 shadow-2xs shrink-0" 
                    alt="logo" 
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-2xs border border-slate-200/50 shrink-0 ${ch.color?.split(' ')[1] || 'bg-slate-100 text-slate-600'}`}>
                    {ch.name.substring(0, 2)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-800 truncate">{ch.name}</span>
              </div>

              {/* Glass Remove Mini Button */}
              <button
                type="button"
                onClick={() => onAssignChannel(ch.id, null)}
                className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-all active:scale-90 cursor-pointer ml-1.5 shrink-0"
                title="นำออกจากกลุ่มนี้"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

