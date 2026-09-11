import React from 'react';
import { GripVertical, Check, Inbox } from 'lucide-react';
import { Channel, ChannelGroup } from '../../../types';

interface UngroupedChannelPoolProps {
  ungroupedChannels: Channel[];
  groups: ChannelGroup[];
  dragOverGroupId: string | null | 'UNGROUPED';
  handleDragOver: (e: React.DragEvent, target: string | 'UNGROUPED') => void;
  handleDrop: (e: React.DragEvent, targetGroupId: string | null) => Promise<void>;
  handleDragStart: (e: React.DragEvent, channelId: string) => void;
  handleDragEnd: () => void;
  onAssignChannel: (channelId: string, groupId: string | null) => Promise<boolean>;
}

export const UngroupedChannelPool: React.FC<UngroupedChannelPoolProps> = ({
  ungroupedChannels,
  groups,
  dragOverGroupId,
  handleDragOver,
  handleDrop,
  handleDragStart,
  handleDragEnd,
  onAssignChannel,
}) => {
  return (
    <div 
      onDragOver={(e) => handleDragOver(e, 'UNGROUPED')}
      onDrop={(e) => handleDrop(e, null)}
      className={`relative lg:col-span-4 p-5 rounded-2xl border border-white/80 border-b-[3.5px] border-b-slate-300/80 ring-1 ring-slate-900/5 transition-all duration-200 flex flex-col min-h-[360px] bg-slate-50/80 backdrop-blur-md overflow-hidden ${
        dragOverGroupId === 'UNGROUPED'
          ? 'border-dashed border-indigo-400 bg-indigo-50/70 ring-4 ring-indigo-500/20 scale-[1.01] shadow-lg'
          : 'shadow-[0_8px_20px_-4px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* 3D Specular Top Rim Light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/80 border border-slate-200/80 shadow-2xs flex items-center justify-center">
            <Inbox className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ช่องที่ยังไม่มีกลุ่ม
          </h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-white/90 border border-white/90 shadow-2xs text-slate-700 backdrop-blur-xs">
          {ungroupedChannels.length}
        </span>
      </div>

      <p className="relative z-10 text-[11px] text-slate-500 mb-3 font-medium">
        ลากช่องด้านล่างนี้ไปวางในกลุ่มทางขวาได้เลย
      </p>

      <div className="relative z-10 space-y-2 flex-1 overflow-y-auto max-h-[460px] pr-1 [scrollbar-gutter:stable]">
        {ungroupedChannels.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-slate-400 border-2 border-dashed border-slate-200/80 rounded-xl bg-gradient-to-b from-white/60 to-slate-50/40 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2 shadow-2xs">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">จัดกลุ่มครบทุกช่องแล้ว!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">หรือลากช่องจากกลุ่มขวามือกลับมาวางที่นี่ได้</p>
          </div>
        ) : (
          ungroupedChannels.map(ch => (
            <div
              key={ch.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ch.id)}
              onDragEnd={handleDragEnd}
              className="p-2.5 bg-white/90 hover:bg-white rounded-xl border border-white/90 hover:border-indigo-200 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-between cursor-grab active:cursor-grabbing group select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                {ch.logoUrl ? (
                  <img src={ch.logoUrl} className="w-7 h-7 rounded-lg object-cover border border-slate-200/80 shadow-2xs shrink-0" alt="logo" />
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-slate-200/50 shrink-0 ${ch.color?.split(' ')[1] || 'bg-slate-100 text-slate-600'}`}>
                    {ch.name.substring(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{ch.name}</p>
                  <span className="text-[10px] text-slate-400 font-mono">SHOW-{ch.id.substring(0, 4).toUpperCase()}</span>
                </div>
              </div>

              {/* Quick Assign Dropdown for Mobile / One-Click */}
              {groups.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) onAssignChannel(ch.id, e.target.value);
                  }}
                  className="text-[10px] bg-slate-50/90 border border-slate-200/90 rounded-lg px-2 py-1 text-slate-600 font-bold hover:border-indigo-300 hover:bg-white shadow-2xs transition-colors cursor-pointer shrink-0 ml-2"
                  title="เลือกย้ายเข้ากลุ่ม"
                >
                  <option value="" disabled>ย้ายเข้า ▾</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

