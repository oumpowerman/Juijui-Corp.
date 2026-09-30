import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, FolderTree, Briefcase, Users, CheckSquare, Layers } from 'lucide-react';
import {
    CompanyChecklistNode,
    ChecklistNodeType,
    MasterOption,
    User
} from '../../../types';

interface ChecklistNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    checklistId: string;
    parentId: string | null;
    parentTitle?: string;
    defaultNodeType: ChecklistNodeType;
    editingNode?: CompanyChecklistNode | null;
    positionOptions: MasterOption[];
    responsibilityOptions: MasterOption[];
    users: User[];
    onSave: (payload: {
        checklistId: string;
        parentId: string | null;
        nodeType: ChecklistNodeType;
        title: string;
        description: string;
        positionKey?: string;
        responsibilityKey?: string;
        assignedUserIds: string[];
    }) => Promise<void>;
}

export const ChecklistNodeModal: React.FC<ChecklistNodeModalProps> = ({
    isOpen,
    onClose,
    checklistId,
    parentId,
    parentTitle,
    defaultNodeType,
    editingNode,
    positionOptions,
    responsibilityOptions,
    users,
    onSave
}) => {
    const [nodeType, setNodeType] = useState<ChecklistNodeType>(defaultNodeType);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [positionKey, setPositionKey] = useState('');
    const [responsibilityKey, setResponsibilityKey] = useState('');
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingNode) {
            setNodeType(editingNode.nodeType);
            setTitle(editingNode.title);
            setDescription(editingNode.description || '');
            setPositionKey(editingNode.positionKey || '');
            setResponsibilityKey(editingNode.responsibilityKey || '');
            setAssignedUserIds(editingNode.assignedUserIds || []);
        } else {
            setNodeType(defaultNodeType);
            setTitle('');
            setDescription('');
            setPositionKey('');
            setResponsibilityKey('');
            setAssignedUserIds([]);
        }
        setUserSearch('');
    }, [editingNode, defaultNodeType, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const filteredResponsibilities = useMemo(() => {
        if (!positionKey) return responsibilityOptions;
        const matching = responsibilityOptions.filter(r => r.parentKey === positionKey);
        return matching.length > 0 ? matching : responsibilityOptions;
    }, [responsibilityOptions, positionKey]);

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        return users.filter(u => {
            if (!q) return true;
            return (
                (u.name || '').toLowerCase().includes(q) ||
                (u.position || '').toLowerCase().includes(q)
            );
        });
    }, [users, userSearch]);

    const toggleUserAssignee = (userId: string) => {
        setAssignedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);
        try {
            await onSave({
                checklistId,
                parentId: editingNode ? editingNode.parentId : parentId,
                nodeType,
                title: title.trim(),
                description: description.trim(),
                positionKey: positionKey || undefined,
                responsibilityKey: responsibilityKey || undefined,
                assignedUserIds
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeLabel =
        nodeType === 'SECTION'
            ? 'หมวดหมู่หลัก (Category - Level 1)'
            : nodeType === 'SUBGROUP'
            ? 'กลุ่มย่อย (Sub-group - Level 2)'
            : 'รายการเช็ค (Checklist Item)';

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="checklist-node-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={onClose}
                    className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                >
                    <motion.div
                        key="checklist-node-modal-dialog"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl my-auto"
                    >
                        {/* Sticky Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 shrink-0 bg-white">
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                    {editingNode ? `แก้ไข${typeLabel}` : `เพิ่ม${typeLabel}`}
                                </h3>
                                {parentTitle && (
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                        ภายใต้: {parentTitle}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body + Sticky Footer */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                                {!editingNode && parentId !== null && defaultNodeType !== 'ITEM' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                                            ประเภทรายการที่ต้องการเพิ่ม
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNodeType('SUBGROUP')}
                                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                                                    nodeType === 'SUBGROUP'
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                <FolderTree className="w-4 h-4" />
                                                <span>กลุ่มย่อย (Sub-group L2)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNodeType('ITEM')}
                                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                                                    nodeType === 'ITEM'
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                <CheckSquare className="w-4 h-4" />
                                                <span>รายการเช็คโดยตรง (Item)</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                                        {nodeType === 'SECTION'
                                            ? 'ชื่อหมวดหมู่หลัก (Category - Level 1)'
                                            : nodeType === 'SUBGROUP'
                                            ? 'ชื่อกลุ่มย่อย (Sub-group - Level 2)'
                                            : 'ข้อความรายการที่ต้องตรวจเช็ค (Checklist Item)'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="ระบุชื่อ..."
                                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                                        รายละเอียด / เกณฑ์การตรวจสอบเพิ่มเติม
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="ระบุวิธีตรวจสอบหรือมาตรฐานที่ต้องระวัง..."
                                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 resize-none"
                                    />
                                </div>

                                {nodeType !== 'ITEM' && (
                                    <div className="pt-4 border-t border-slate-200 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-emerald-600" />
                                                <span>ซิงก์กับตำแหน่งและหน้าที่ความรับผิดชอบ (Master Sync)</span>
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                เชื่อมโยงกับข้อมูล Position & Responsibility จากหน้าตั้งค่าระบบ เพื่อระบุผู้ดูแลรับผิดชอบหมวดนี้
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                    ตำแหน่งที่รับผิดชอบ (Position)
                                                </label>
                                                <select
                                                    value={positionKey}
                                                    onChange={e => {
                                                        const nextPos = e.target.value;
                                                        setPositionKey(nextPos);
                                                        if (nextPos && responsibilityKey) {
                                                            const r = responsibilityOptions.find(
                                                                opt => opt.key === responsibilityKey
                                                            );
                                                            if (r && r.parentKey && r.parentKey !== nextPos) {
                                                                setResponsibilityKey('');
                                                            }
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                                                >
                                                    <option value="">-- ไม่เจาะจงตำแหน่ง (ทุกตำแหน่ง) --</option>
                                                    {positionOptions.map(pos => (
                                                        <option key={pos.id} value={pos.key}>
                                                            {pos.label} ({pos.key})
                                                        </option>
                                                    ))}
                                                    {positionKey &&
                                                        !positionOptions.some(p => p.key === positionKey) && (
                                                            <option value={positionKey}>{positionKey}</option>
                                                        )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>หน้าที่ความรับผิดชอบ (Responsibility)</span>
                                                </label>
                                                <select
                                                    value={responsibilityKey}
                                                    onChange={e => {
                                                        const nextResp = e.target.value;
                                                        setResponsibilityKey(nextResp);
                                                        const found = responsibilityOptions.find(
                                                            r => r.key === nextResp
                                                        );
                                                        if (found?.parentKey && !positionKey) {
                                                            setPositionKey(found.parentKey);
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                                                >
                                                    <option value="">-- ไม่ระบุหน้าที่ย่อย --</option>
                                                    {filteredResponsibilities.map(resp => (
                                                        <option key={resp.id} value={resp.key}>
                                                            {resp.label}{' '}
                                                            {resp.parentKey ? `[${resp.parentKey}]` : ''}
                                                        </option>
                                                    ))}
                                                    {responsibilityKey &&
                                                        !responsibilityOptions.some(
                                                            r => r.key === responsibilityKey
                                                        ) && (
                                                            <option value={responsibilityKey}>
                                                                {responsibilityKey}
                                                            </option>
                                                        )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Specific User Assignees */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>ระบุรายบุคคลที่ดูแลโดยตรง (Assignees - เลือกได้หลายคน)</span>
                                                </label>
                                                <span className="text-xs text-slate-500 tabular-nums">
                                                    เลือกแล้ว {assignedUserIds.length} คน
                                                </span>
                                            </div>

                                            <input
                                                type="text"
                                                value={userSearch}
                                                onChange={e => setUserSearch(e.target.value)}
                                                placeholder="ค้นหาชื่อพนักงาน หรือตำแหน่ง..."
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg mb-2 focus:outline-none focus:border-slate-900"
                                            />

                                            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-slate-400">
                                                        ไม่พบรายชื่อพนักงาน
                                                    </div>
                                                ) : (
                                                    filteredUsers.map(user => {
                                                        const selected = assignedUserIds.includes(user.id);
                                                        return (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => toggleUserAssignee(user.id)}
                                                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                                                                    selected
                                                                        ? 'bg-emerald-50/70 text-slate-900 font-semibold'
                                                                        : 'hover:bg-slate-50 text-slate-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <img
                                                                        src={
                                                                            user.avatarUrl ||
                                                                            'https://api.dicebear.com/7.x/avataaars/svg?seed=staff'
                                                                        }
                                                                        alt={user.name}
                                                                        referrerPolicy="no-referrer"
                                                                        className="w-6 h-6 rounded-full object-cover bg-slate-200 shrink-0"
                                                                    />
                                                                    <span className="truncate">{user.name}</span>
                                                                    {user.position && (
                                                                        <>
                                                                            <span className="text-slate-300">·</span>
                                                                            <span className="text-slate-500 truncate">
                                                                                {user.position}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className={`text-xs ${
                                                                        selected
                                                                            ? 'text-emerald-700 font-semibold'
                                                                            : 'text-slate-400'
                                                                    }`}
                                                                >
                                                                    {selected ? 'เลือกแล้ว ✓' : 'เลือก'}
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim()}
                                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap"
                                >
                                    {isSubmitting
                                        ? 'กำลังบันทึก...'
                                        : editingNode
                                        ? 'บันทึกการแก้ไข'
                                        : 'เพิ่มรายการ'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
