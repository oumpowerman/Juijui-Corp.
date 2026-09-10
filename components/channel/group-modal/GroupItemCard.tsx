import React from 'react';
import { 
  Edit2, Trash2, ArrowRight, GripVertical, X 
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

  return (
    <div
      onDragOver={(e) => handleDragOver(e, group.id)}
      onDrop={(e) => handleDrop(e, group.id)}
      className={`rounded-2xl border-2 transition-all flex flex-col p-4 bg-white ${
        isOver 
          ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-200' 
          : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Group Card Header */}
      {isEditing ? (
        <div className="space-y-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg"
            placeholder="ชื่อกลุ่ม"
            autoFocus
          />
          <input
            type="text"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-300 rounded-lg"
            placeholder="คำอธิบายกลุ่ม"
          />
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_GROUP_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setEditColor(c.class)}
                className={`w-5 h-5 rounded-full ${c.colorDot} ${editColor === c.class ? 'ring-2 ring-offset-1 ring-slate-800' : 'opacity-60 hover:opacity-100'} cursor-pointer`}
                title={c.label}
              />
            ))}
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(group.id)}
              className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              บันทึก
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${group.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                {group.name}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                ({groupChannels.length} รายการ)
              </span>
            </div>
            {group.description && (
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onStartEdit(group)}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="แก้ไขชื่อ/สีกลุ่ม"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(group)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="ลบกลุ่มนี้"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Drop Target Zone & Channels inside this group */}
      <div className="flex-1 min-h-[140px] space-y-1.5 overflow-y-auto max-h-[220px] p-1">
        {groupChannels.length === 0 ? (
          <div className="h-full min-h-[120px] border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 text-center text-slate-400 bg-slate-50/40">
            <ArrowRight className="w-4 h-4 mb-1 opacity-40 animate-pulse text-indigo-500" />
            <p className="text-[11px] font-bold text-slate-500">ลากช่องมาวางที่นี่</p>
            <p className="text-[10px] text-slate-400">เพื่อเพิ่มเข้ากลุ่ม {group.name}</p>
          </div>
        ) : (
          groupChannels.map(ch => (
            <div
              key={ch.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ch.id)}
              onDragEnd={handleDragEnd}
              className="p-2 bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 hover:border-indigo-200 shadow-2xs transition-all flex items-center justify-between group/item cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <GripVertical className="w-3 h-3 text-slate-300 group-hover/item:text-indigo-400 shrink-0" />
                {ch.logoUrl ? (
                  <img src={ch.logoUrl} className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0" alt="logo" />
                ) : (
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] uppercase shrink-0 ${ch.color?.split(' ')[1] || 'bg-slate-100 text-slate-600'}`}>
                    {ch.name.substring(0, 2)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-700 truncate">{ch.name}</span>
              </div>

              <button
                type="button"
                onClick={() => onAssignChannel(ch.id, null)}
                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="นำออกจากกลุ่มนี้"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
