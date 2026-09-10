import React from 'react';
import { GripVertical, Check } from 'lucide-react';
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
      className={`lg:col-span-4 p-5 rounded-2xl border-2 transition-all flex flex-col min-h-[360px] ${
        dragOverGroupId === 'UNGROUPED'
          ? 'border-dashed border-indigo-400 bg-indigo-50/40'
          : 'border-slate-200 bg-slate-50/70'
      }`}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ช่องที่ยังไม่มีกลุ่ม
          </h3>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white border border-slate-200 text-slate-700">
          {ungroupedChannels.length}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        ลากช่องด้านล่างนี้ไปวางในกลุ่มทางขวาได้เลย
      </p>

      <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] pr-1">
        {ungroupedChannels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white/60">
            <Check className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-600">จัดกลุ่มครบทุกช่องแล้ว!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">หรือลากช่องจากกลุ่มขวามือกลับมาวางที่นี่ได้</p>
          </div>
        ) : (
          ungroupedChannels.map(ch => (
            <div
              key={ch.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ch.id)}
              onDragEnd={handleDragEnd}
              className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between cursor-grab active:cursor-grabbing group select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 shrink-0" />
                {ch.logoUrl ? (
                  <img src={ch.logoUrl} className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" alt="logo" />
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${ch.color?.split(' ')[1] || 'bg-slate-100 text-slate-600'}`}>
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
                  className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold hover:border-indigo-300 cursor-pointer shrink-0"
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
