import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Plus, FolderKanban, Layers, FolderPlus, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, ChannelGroup } from '../../../types';
import { DEFAULT_GROUP_COLORS } from '../../../hooks/useChannelGroups';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { GroupCreateForm } from './GroupCreateForm';
import { UngroupedChannelPool } from './UngroupedChannelPool';
import { GroupItemCard } from './GroupItemCard';

interface ChannelGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  groups: ChannelGroup[];
  onCreateGroup: (name: string, color?: string, description?: string) => Promise<ChannelGroup | null>;
  onUpdateGroup: (id: string, updates: Partial<ChannelGroup>) => Promise<boolean>;
  onDeleteGroup: (id: string) => Promise<boolean>;
  onAssignChannel: (channelId: string, groupId: string | null) => Promise<boolean>;
}

export const ChannelGroupModal: React.FC<ChannelGroupModalProps> = ({
  isOpen,
  onClose,
  channels,
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignChannel,
}) => {
  const { showConfirm } = useGlobalDialog();

  // Create Group Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(DEFAULT_GROUP_COLORS[0].class);
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Group Inline State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Drag and Drop active states
  const [draggedChannelId, setDraggedChannelId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null | 'UNGROUPED'>(null);

  // Lock body scroll while open & ESC key close handler
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  // Ungrouped channels list
  const ungroupedChannels = channels.filter(ch => !ch.group_id);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupColor(DEFAULT_GROUP_COLORS[groups.length % DEFAULT_GROUP_COLORS.length].class);
  };

  const handleSaveNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await onCreateGroup(newGroupName, newGroupColor, newGroupDesc);
      if (created) {
        setIsCreating(false);
        setNewGroupName('');
        setNewGroupDesc('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (group: ChannelGroup) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditColor(group.color || DEFAULT_GROUP_COLORS[0].class);
    setEditDesc(group.description || '');
  };

  const handleSaveEdit = async (groupId: string) => {
    if (!editName.trim()) return;
    await onUpdateGroup(groupId, {
      name: editName.trim(),
      color: editColor,
      description: editDesc.trim(),
    });
    setEditingGroupId(null);
  };

  const handleDelete = async (group: ChannelGroup) => {
    const assignedCount = channels.filter(ch => ch.group_id === group.id).length;
    const msg = assignedCount > 0
      ? `ยืนยันลบกลุ่ม "${group.name}" หรือไม่?\n(ช่องรายการ ${assignedCount} รายการในกลุ่มนี้จะถูกย้ายกลับไปที่ "ยังไม่มีกลุ่ม")`
      : `ยืนยันลบกลุ่ม "${group.name}" ?`;

    if (await showConfirm(msg)) {
      await onDeleteGroup(group.id);
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, channelId: string) => {
    setDraggedChannelId(channelId);
    e.dataTransfer.setData('text/plain', channelId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedChannelId(null);
    setDragOverGroupId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetGroupId: string | 'UNGROUPED') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== targetGroupId) {
      setDragOverGroupId(targetGroupId);
    }
  }, [dragOverGroupId]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    const channelId = e.dataTransfer.getData('text/plain') || draggedChannelId;
    setDragOverGroupId(null);
    setDraggedChannelId(null);

    if (channelId) {
      await onAssignChannel(channelId, targetGroupId);
    }
  }, [draggedChannelId, onAssignChannel]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="channel-group-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div 
            key="channel-group-modal-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.32, bounce: 0.08 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/80 border-b-[4px] border-b-slate-300/90 ring-1 ring-slate-900/10 w-full max-w-5xl h-[85vh] min-h-[580px] max-h-[760px] flex flex-col overflow-hidden my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 3D Specular Top Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50/90 border border-indigo-100 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.15)] flex items-center justify-center text-indigo-600">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">
                      จัดการกลุ่มรายการ (Channel Groups & Sections)
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100/90 text-indigo-700 border border-indigo-200/60 shadow-2xs">
                      {groups.length} กลุ่ม
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    สร้างกลุ่มเพื่อจัดระเบียบหน้าช่องรายการ เช่น Lifestyle, ข่าว, บันเทิง แล้วลากช่องรายการใส่กลุ่มได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isCreating && (
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    สร้างกลุ่มใหม่
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6 [scrollbar-gutter:stable]">
              {/* Interactive Drag & Drop Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Area (4 Cols): Ungrouped Channels Pool */}
                <UngroupedChannelPool
                  ungroupedChannels={ungroupedChannels}
                  groups={groups}
                  dragOverGroupId={dragOverGroupId}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  onAssignChannel={onAssignChannel}
                />

                {/* Right Area (8 Cols): Created Channel Groups */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      กลุ่มรายการที่สร้างไว้ ({groups.length} กลุ่ม)
                    </h3>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {isCreating ? (
                      <motion.div
                        key="create-form-view"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="space-y-4"
                      >
                        <GroupCreateForm
                          isCreating={isCreating}
                          onCancel={() => setIsCreating(false)}
                          onSaveNewGroup={handleSaveNewGroup}
                          newGroupName={newGroupName}
                          setNewGroupName={setNewGroupName}
                          newGroupDesc={newGroupDesc}
                          setNewGroupDesc={setNewGroupDesc}
                          newGroupColor={newGroupColor}
                          setNewGroupColor={setNewGroupColor}
                          isSubmitting={isSubmitting}
                        />

                        {groups.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                            {groups.map(group => (
                              <GroupItemCard
                                key={group.id}
                                group={group}
                                channels={channels}
                                isOver={dragOverGroupId === group.id}
                                isEditing={editingGroupId === group.id}
                                editName={editName}
                                setEditName={setEditName}
                                editDesc={editDesc}
                                setEditDesc={setEditDesc}
                                editColor={editColor}
                                setEditColor={setEditColor}
                                onStartEdit={handleStartEdit}
                                onCancelEdit={() => setEditingGroupId(null)}
                                onSaveEdit={handleSaveEdit}
                                onDelete={handleDelete}
                                handleDragOver={handleDragOver}
                                handleDrop={handleDrop}
                                handleDragStart={handleDragStart}
                                handleDragEnd={handleDragEnd}
                                onAssignChannel={onAssignChannel}
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : groups.length === 0 ? (
                      <motion.div
                        key="empty-state-view"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="p-10 bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
                          <FolderPlus className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">ยังไม่มีการสร้างกลุ่มรายการ (0 กลุ่ม)</h4>
                        <p className="text-xs text-slate-500 max-w-md mt-1 mb-5">
                          คุณสามารถกดปุ่มสร้างกลุ่มด้านล่าง เช่น <strong>"Lifestyle"</strong>, <strong>"บันเทิง"</strong>, หรือ <strong>"วาไรตี้"</strong> แล้วลากช่องรายการเข้ามาจัดเป็น Section ได้ทันที
                        </p>
                        <button
                          type="button"
                          onClick={handleStartCreate}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          กดสร้างกลุ่มแรกเลย (เช่น Lifestyle)
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="groups-grid-view"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {groups.map(group => (
                          <GroupItemCard
                            key={group.id}
                            group={group}
                            channels={channels}
                            isOver={dragOverGroupId === group.id}
                            isEditing={editingGroupId === group.id}
                            editName={editName}
                            setEditName={setEditName}
                            editDesc={editDesc}
                            setEditDesc={setEditDesc}
                            editColor={editColor}
                            setEditColor={setEditColor}
                            onStartEdit={handleStartEdit}
                            onCancelEdit={() => setEditingGroupId(null)}
                            onSaveEdit={handleSaveEdit}
                            onDelete={handleDelete}
                            handleDragOver={handleDragOver}
                            handleDrop={handleDrop}
                            handleDragStart={handleDragStart}
                            handleDragEnd={handleDragEnd}
                            onAssignChannel={onAssignChannel}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>การจัดกลุ่มจะบันทึกทันที และนำไปแสดงเป็น Section ในหน้าจัดการช่อง</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default ChannelGroupModal;
