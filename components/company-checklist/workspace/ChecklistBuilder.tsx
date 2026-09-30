import React, { useState } from 'react';
import { Layers, Plus, ClipboardPaste, FolderTree } from 'lucide-react';
import { MasterOption } from '../../../types';
import { parseBulkItemsText } from '../utils/checklistParser';

export interface ChecklistBuilderProps {
    sectionsCount: number;
    positionOptions: MasterOption[];
    inputRef: React.RefObject<HTMLInputElement>;
    onCreateCategory: (payload: {
        title: string;
        description: string;
        positionKey?: string;
    }) => Promise<void>;
}

/**
 * ChecklistBuilder: Fast Category Builder for adding 10-20+ categories rapidly
 */
export const ChecklistBuilder: React.FC<ChecklistBuilderProps> = ({
    sectionsCount,
    positionOptions,
    inputRef,
    onCreateCategory
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [positionKey, setPositionKey] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onCreateCategory({
            title: title.trim(),
            description: description.trim(),
            positionKey: positionKey || undefined
        });
        setTitle('');
        setDescription('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50/55 via-white/80 to-emerald-50/50 backdrop-blur-xl rounded-[26px] border border-white/95 ring-1 ring-indigo-200/60 p-5 sm:p-6 shadow-[0_14px_34px_-12px_rgba(99,102,241,0.08),inset_0_1px_0_0_rgba(255,255,255,0.95)]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-95"
            />
            <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-white/90 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                        </span>
                        <span>
                            เพิ่มหมวดหมู่ใหม่ด่วน (หมวดที่ {sectionsCount + 1}) — พิมพ์แล้วกด Enter สร้างหมวดต่อไปได้ทันที
                        </span>
                    </label>
                    <span className="px-2.5 py-1 rounded-xl bg-white/85 border border-indigo-100 text-xs font-bold text-indigo-700 tabular-nums shrink-0 shadow-2xs">
                        มีแล้ว {sectionsCount} หมวดหมู่
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={`เช่น หมวดที่ ${sectionsCount + 1}: ระบุชื่อหมวดหมู่...`}
                        className="lg:col-span-5 px-3.5 py-2.5 text-sm font-semibold bg-white/85 focus:bg-white backdrop-blur-md border border-white/95 ring-1 ring-slate-200/80 focus:ring-indigo-500 rounded-xl focus:outline-none text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition-all"
                    />

                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="คำอธิบายหมวดหมู่ (ไม่บังคับ)..."
                        className="lg:col-span-3 px-3.5 py-2.5 text-xs bg-white/85 focus:bg-white backdrop-blur-md border border-white/95 ring-1 ring-slate-200/80 focus:ring-indigo-500 rounded-xl focus:outline-none text-slate-700 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition-all"
                    />

                    <select
                        value={positionKey}
                        onChange={e => setPositionKey(e.target.value)}
                        className="lg:col-span-2 px-3 py-2.5 text-xs font-semibold bg-white/85 focus:bg-white backdrop-blur-md border border-white/95 ring-1 ring-slate-200/80 focus:ring-indigo-500 rounded-xl text-slate-800 focus:outline-none shadow-2xs transition-all cursor-pointer"
                    >
                        <option value="">-- ทุกตำแหน่ง --</option>
                        {positionOptions.map(pos => (
                            <option key={pos.id} value={pos.key}>
                                {pos.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        disabled={!title.trim()}
                        className="lg:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 hover:from-slate-700 hover:to-slate-900 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold border border-slate-700/80 shadow-[0_8px_18px_-4px_rgba(15,23,42,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.3)] transition-all whitespace-nowrap cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>สร้างหมวดที่ {sectionsCount + 1}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export interface ChecklistInlineItemBuilderProps {
    sectionId: string;
    onQuickAddSingleItem: (
        parentId: string,
        title: string,
        description: string
    ) => Promise<void>;
    onBulkCreateItems: (
        parentId: string,
        items: { title: string; description: string }[]
    ) => Promise<void>;
    onOpenAddSubgroup: () => void;
}

/**
 * ChecklistInlineItemBuilder: Extracted fast single-item & multi-line bulk paste builder inside each category
 */
export const ChecklistInlineItemBuilder: React.FC<ChecklistInlineItemBuilderProps> = ({
    sectionId,
    onQuickAddSingleItem,
    onBulkCreateItems,
    onOpenAddSubgroup
}) => {
    const [quickTitle, setQuickTitle] = useState('');
    const [quickDesc, setQuickDesc] = useState('');
    const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');

    const parsedBulkItems = parseBulkItemsText(bulkText);

    const handleQuickAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTitle.trim()) return;
        await onQuickAddSingleItem(sectionId, quickTitle.trim(), quickDesc.trim());
        setQuickTitle('');
        setQuickDesc('');
    };

    const handleBulkSubmit = async () => {
        if (parsedBulkItems.length === 0) return;
        await onBulkCreateItems(sectionId, parsedBulkItems);
        setBulkText('');
        setIsBulkPasteOpen(false);
    };

    return (
        <div className="pt-3 border-t border-slate-200/60 space-y-2.5">
            {isBulkPasteOpen ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white/90 to-purple-50/50 backdrop-blur-md border border-white/95 ring-1 ring-indigo-200/75 shadow-inner space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                                <ClipboardPaste className="w-3.5 h-3.5" />
                            </span>
                            <span>วางข้อความทีละหลายข้อ (1 บรรทัด = 1 ข้อเช็ค)</span>
                        </span>
                        <span className="text-[11px] font-medium text-indigo-700/85 bg-white/80 px-2 py-0.5 rounded-lg border border-indigo-100">
                            ใช้เครื่องหมาย <code>:</code> คั่นระหว่างหัวข้อกับคำอธิบายได้
                        </span>
                    </div>
                    <textarea
                        rows={5}
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                        placeholder={`ตัวอย่างการวางหลายบรรทัด:\nสรุปงานและสเตตัสโปรเจกต์: อัปเดตงานทั้งหมดที่รับผิดชอบ\nส่งมอบไฟล์โปรเจกต์ทั้งหมด: รวบรวมไฟล์ลงโฟลเดอร์กลาง\nส่งมอบรูปภาพอินเสิร์ต: คืนเข้าคลังของบริษัท`}
                        className="w-full px-3.5 py-2.5 text-xs bg-white/95 border border-indigo-200/90 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 tabular-nums">
                            ตรวจพบ <strong className="text-indigo-700">{parsedBulkItems.length}</strong> รายการที่จะสร้าง
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsBulkPasteOpen(false)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl border border-slate-200/80 cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                disabled={parsedBulkItems.length === 0}
                                onClick={handleBulkSubmit}
                                className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl shadow-sm shadow-indigo-500/20 cursor-pointer"
                            >
                                + สร้างทั้งหมด {parsedBulkItems.length} ข้อทันที
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleQuickAddSubmit} className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={quickTitle}
                            onChange={e => setQuickTitle(e.target.value)}
                            placeholder="+ พิมพ์ชื่อข้อเช็คใหม่ในหมวดนี้ (กด Enter เพื่อเพิ่มทันที)..."
                            className="flex-1 px-3.5 py-2 text-xs font-semibold bg-white/80 focus:bg-white backdrop-blur-md border border-slate-200/85 focus:border-indigo-400 rounded-xl focus:outline-none text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition-all"
                        />
                        <input
                            type="text"
                            value={quickDesc}
                            onChange={e => setQuickDesc(e.target.value)}
                            placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)..."
                            className="sm:w-64 px-3.5 py-2 text-xs bg-white/80 focus:bg-white backdrop-blur-md border border-slate-200/85 focus:border-indigo-400 rounded-xl focus:outline-none text-slate-700 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!quickTitle.trim()}
                            className="px-4 py-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 disabled:opacity-40 text-white text-xs font-semibold shadow-xs whitespace-nowrap transition-all cursor-pointer"
                        >
                            + เพิ่มข้อเช็ค
                        </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
                        <button
                            type="button"
                            onClick={() => setIsBulkPasteOpen(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/70 text-indigo-700 font-semibold transition-colors cursor-pointer"
                        >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            <span>วางข้อความทีละหลายข้อ (Bulk Paste)</span>
                        </button>

                        <button
                            type="button"
                            onClick={onOpenAddSubgroup}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/75 hover:bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                        >
                            <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                            <span>+ เพิ่มกลุ่มย่อย (Sub-group)</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export const FastCategoryBuilderBar = ChecklistBuilder;
