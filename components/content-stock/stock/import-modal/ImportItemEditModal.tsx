import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Check,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    User,
    Tv,
    Calendar,
    Layers,
    Sparkles,
    FileText
} from 'lucide-react';
import { ParsedStockItemPreview } from '../../../../services/stockImportValidator';
import { Channel, User as UserType, MasterOption } from '../../../../types';
import { revalidateStockItem } from './revalidateItem';

interface ImportItemEditModalProps {
    isOpen: boolean;
    item: ParsedStockItemPreview | null;
    channels: Channel[];
    users: UserType[];
    masterOptions: MasterOption[];
    onClose: () => void;
    onSave: (updatedItem: ParsedStockItemPreview) => void;
}

export const ImportItemEditModal: React.FC<ImportItemEditModalProps> = ({
    isOpen,
    item,
    channels,
    users,
    masterOptions,
    onClose,
    onSave
}) => {
    const [title, setTitle] = useState('');
    const [idea, setIdea] = useState('');
    const [channelId, setChannelId] = useState<string>('');
    const [status, setStatus] = useState<string>('TODO');
    const [format, setFormat] = useState<string>('');
    const [pillar, setPillar] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [ownerIds, setOwnerIds] = useState<string[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [subIds, setSubIds] = useState<string[]>([]);
    const [publishDateStr, setPublishDateStr] = useState<string>('');
    const [isUnscheduled, setIsUnscheduled] = useState<boolean>(true);

    // Initialize state when item changes
    useEffect(() => {
        if (!item) return;
        setTitle(item.title || item.rawTitle || '');
        setIdea(item.idea || '');
        setChannelId(item.channelId || '');
        setStatus(item.status || 'TODO');
        setFormat(item.format || '');
        setPillar(item.pillar || '');
        setCategory(item.category || '');
        setOwnerIds(item.ownerIds || []);
        setEditorIds(item.editorIds || []);
        setSubIds(item.subIds || []);
        setIsUnscheduled(item.isUnscheduled);

        if (item.publishDate) {
            try {
                const d = new Date(item.publishDate);
                if (!isNaN(d.getTime())) {
                    setPublishDateStr(d.toISOString().split('T')[0]);
                } else {
                    setPublishDateStr('');
                }
            } catch {
                setPublishDateStr('');
            }
        } else {
            setPublishDateStr('');
        }
    }, [item]);

    // Live preview validation of current draft edits
    const draftValidation = useMemo(() => {
        if (!item) return null;

        let parsedDate: Date | null = null;
        if (!isUnscheduled && publishDateStr) {
            parsedDate = new Date(publishDateStr);
        }

        const draftItem: ParsedStockItemPreview = {
            ...item,
            title,
            idea,
            channelId: channelId || null,
            status,
            format: format || null,
            pillar: pillar || null,
            category: category || null,
            ownerIds,
            editorIds,
            subIds,
            publishDate: parsedDate,
            isUnscheduled
        };

        return revalidateStockItem(draftItem, users, channels, masterOptions);
    }, [item, title, idea, channelId, status, format, pillar, category, ownerIds, editorIds, subIds, publishDateStr, isUnscheduled, users, channels, masterOptions]);

    const handleSave = () => {
        if (!draftValidation) return;
        onSave(draftValidation);
        onClose();
    };

    const statusOptions = useMemo(() => {
        return masterOptions.filter(o => o.type === 'STATUS');
    }, [masterOptions]);

    const formatOptions = useMemo(() => {
        return masterOptions.filter(o => o.type === 'FORMAT');
    }, [masterOptions]);

    const pillarOptions = useMemo(() => {
        return masterOptions.filter(o => o.type === 'PILLAR');
    }, [masterOptions]);

    const categoryOptions = useMemo(() => {
        return masterOptions.filter(o => o.type === 'CATEGORY');
    }, [masterOptions]);

    if (!isOpen || !item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2300] flex items-center justify-center p-3 sm:p-5 font-sans select-none overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
                />

                {/* Edit Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 15 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10 max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 font-black text-sm">
                                #{item.index}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    แก้ไขข้อมูลสำหรับนำเข้า (Quick Fix)
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    แถวที่ #{item.index} ในไฟล์ CSV
                                </p>
                            </div>
                        </div>

                        {/* Live Validation Indicator */}
                        <div className="flex items-center gap-2">
                            {draftValidation?.isValid ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-2xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>ข้อมูลผ่านเกณฑ์แล้ว</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold shadow-2xs">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    <span>ยังมีข้อผิดพลาด</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form Body (Scrollable) */}
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                        {/* Errors & Warnings Notification inside Editor */}
                        {draftValidation && draftValidation.errors.length > 0 && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                                <p className="text-[11px] font-black text-rose-700 flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>สิ่งที่ต้องแก้ไขให้ถูกต้องก่อนนำเข้า:</span>
                                </p>
                                <ul className="list-disc list-inside text-rose-600 text-[11px] font-medium pl-1">
                                    {draftValidation.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {draftValidation && draftValidation.warnings.length > 0 && (
                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
                                <p className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>คำเตือน/ข้อสังเกต:</span>
                                </p>
                                <ul className="list-disc list-inside text-amber-700 text-[11px] font-medium pl-1">
                                    {draftValidation.warnings.map((warn, idx) => (
                                        <li key={idx}>{warn}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 1. Content Topic (Title) */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-800 flex items-center gap-1">
                                <span>Content Topic (ชื่อหัวข้อ)</span>
                                <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="กรอกชื่อหัวข้อคอนเทนต์..."
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none transition-all ${
                                    !title.trim()
                                        ? 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                }`}
                            />
                        </div>

                        {/* 2. Channel & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Channel */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700 flex items-center gap-1">
                                    <Tv className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>ช่อง (Channel)</span>
                                </label>
                                <select
                                    value={channelId}
                                    onChange={(e) => setChannelId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">-- ไม่ระบุช่อง --</option>
                                    {channels.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700 flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>สถานะในคลัง (Status)</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {statusOptions.length > 0 ? (
                                        statusOptions.map((s) => (
                                            <option key={s.key} value={s.key}>
                                                {s.label || s.key}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="TODO">To Do</option>
                                            <option value="IDEA">Idea</option>
                                            <option value="SCRIPT">Script</option>
                                            <option value="SHOOTING">Shooting</option>
                                            <option value="EDIT_CLIP">Editing</option>
                                            <option value="APPROVE">Approved</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* 3. Format & Pillar & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Format */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Format</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {formatOptions.map((f) => (
                                        <option key={f.key} value={f.key}>
                                            {f.label || f.key}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Pillar */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Pillar</label>
                                <select
                                    value={pillar}
                                    onChange={(e) => setPillar(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {pillarOptions.map((p) => (
                                        <option key={p.key} value={p.key}>
                                            {p.label || p.key}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {categoryOptions.map((c) => (
                                        <option key={c.key} value={c.key}>
                                            {c.label || c.key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 4. Idea / Brief */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>รายละเอียด / Idea Brief</span>
                            </label>
                            <textarea
                                rows={2}
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="รายละเอียดเพิ่มเติมของหัวข้อ หรือแนวคิด..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium"
                            />
                        </div>

                        {/* 5. Team Members (Owner & Editor) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Idea Owner */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>เจ้าของไอเดีย (Owner)</span>
                                </label>
                                <select
                                    value={ownerIds[0] || ''}
                                    onChange={(e) => setOwnerIds(e.target.value ? [e.target.value] : [])}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} {u.position ? `(${u.position})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Editor */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-700 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>ผู้ตัดต่อ (Editor)</span>
                                </label>
                                <select
                                    value={editorIds[0] || ''}
                                    onChange={(e) => setEditorIds(e.target.value ? [e.target.value] : [])}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} {u.position ? `(${u.position})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 6. Publish Date & Unscheduled Toggle */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>วันเผยแพร่ (Publish Date)</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isUnscheduled}
                                        onChange={(e) => setIsUnscheduled(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span>ยังไม่ระบุวัน (Unscheduled)</span>
                                </label>
                            </div>

                            {!isUnscheduled && (
                                <input
                                    type="date"
                                    value={publishDateStr}
                                    onChange={(e) => setPublishDateStr(e.target.value)}
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                />
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                        >
                            <Check className="w-4 h-4" />
                            <span>บันทึกและตรวจความถูกต้อง</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
