import React from 'react';
import {
    Check,
    MessageSquare,
    ArrowUp,
    ArrowDown,
    Edit3,
    Trash2
} from 'lucide-react';
import {
    CompanyChecklistNode,
    ActiveChecklistItemState
} from '../../../types';

export interface ChecklistItemProps {
    item: CompanyChecklistNode;
    itemIndex: number;
    totalSiblings: number;
    activeState?: ActiveChecklistItemState;
    isEditingRemark: boolean;
    onToggleCheck: (itemId: string) => void;
    onToggleEditRemark: (itemId: string | null) => void;
    onChangeRemark: (itemId: string, remark: string) => void;
    onMoveOrder: (itemId: string, direction: 'UP' | 'DOWN') => void;
    onEditItem: (item: CompanyChecklistNode) => void;
    onDeleteItem: (item: CompanyChecklistNode) => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
    item,
    itemIndex,
    totalSiblings,
    activeState,
    isEditingRemark,
    onToggleCheck,
    onToggleEditRemark,
    onChangeRemark,
    onMoveOrder,
    onEditItem,
    onDeleteItem
}) => {
    const isChecked = !!activeState?.isChecked;

    return (
        <div
            className={`group relative rounded-2xl border p-3.5 transition-all duration-200 ${
                isChecked
                    ? 'bg-gradient-to-r from-emerald-50/75 via-teal-50/45 to-white/90 border-emerald-200/85 shadow-[0_4px_14px_-4px_rgba(16,185,129,0.10),inset_0_1px_0_0_rgba(255,255,255,0.95)]'
                    : 'bg-white/85 hover:bg-white/95 backdrop-blur-md border-slate-200/75 hover:border-indigo-200/90 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.04),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:shadow-[0_10px_22px_-6px_rgba(99,102,241,0.12),inset_0_1px_0_0_rgba(255,255,255,1)] hover:-translate-y-0.5'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* 3D Tactile Checkbox Button */}
                <button
                    type="button"
                    onClick={() => onToggleCheck(item.id)}
                    className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                >
                    {isChecked ? (
                        <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-[0_4px_10px_-2px_rgba(16,185,129,0.45),inset_0_1px_0_0_rgba(255,255,255,0.45)] ring-2 ring-emerald-100/90 transition-transform duration-150 scale-100">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-300/90 group-hover:border-indigo-400 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),0_1px_2px_rgba(255,255,255,0.9)] transition-all duration-150 group-hover:scale-105">
                            <span className="w-2 h-2 rounded-full bg-indigo-400/0 group-hover:bg-indigo-400/35 transition-colors" />
                        </div>
                    )}
                </button>

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                    <div
                        onClick={() => onToggleCheck(item.id)}
                        className="cursor-pointer select-none"
                    >
                        <div
                            className={`text-sm font-semibold leading-snug transition-colors ${
                                isChecked
                                    ? 'text-emerald-950/75 line-through decoration-emerald-500/60'
                                    : 'text-slate-900 group-hover:text-indigo-950'
                            }`}
                        >
                            {item.title}
                        </div>
                        {item.description && (
                            <p
                                className={`text-xs mt-1 leading-relaxed ${
                                    isChecked ? 'text-slate-500' : 'text-slate-600'
                                }`}
                            >
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* Live Checker Attribution Stamp & Item Remark — Frosted Glass Pills */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {isChecked && activeState && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/85 backdrop-blur-md border border-emerald-200/85 shadow-[0_2px_6px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] text-emerald-900 text-[11px] font-medium">
                                <img
                                    src={
                                        activeState.checkedByAvatar ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeState.checkedByName}`
                                    }
                                    alt={activeState.checkedByName}
                                    referrerPolicy="no-referrer"
                                    className="w-4 h-4 rounded-full object-cover bg-white ring-1 ring-emerald-300"
                                />
                                <span>
                                    ติ๊กโดย{' '}
                                    <strong className="font-bold text-emerald-950">
                                        {activeState.checkedByName}
                                    </strong>
                                    {activeState.checkedByPosition
                                        ? ` (${activeState.checkedByPosition})`
                                        : ''}
                                </span>
                                <span className="text-emerald-700 font-semibold tabular-nums">
                                    ·{' '}
                                    {new Date(activeState.checkedAt).toLocaleTimeString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}{' '}
                                    น.
                                </span>
                            </div>
                        )}

                        {activeState?.remark && !isEditingRemark ? (
                            <button
                                type="button"
                                onClick={() => onToggleEditRemark(item.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-50/95 to-orange-50/85 backdrop-blur-md border border-amber-200/90 shadow-2xs text-amber-900 text-[11px] font-medium cursor-pointer hover:border-amber-300 transition-colors"
                            >
                                <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>หมายเหตุ: {activeState.remark}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    onToggleEditRemark(isEditingRemark ? null : item.id)
                                }
                                className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100/70 hover:bg-indigo-50 text-[11px] font-medium text-slate-500 hover:text-indigo-700 transition-all cursor-pointer"
                            >
                                <MessageSquare className="w-3 h-3" />
                                <span>+ โน้ตกำกับข้อนี้</span>
                            </button>
                        )}
                    </div>

                    {isEditingRemark && (
                        <div className="mt-2.5 flex items-center gap-2">
                            <input
                                type="text"
                                value={activeState?.remark || ''}
                                onChange={e => onChangeRemark(item.id, e.target.value)}
                                placeholder="ระบุโน้ตกำกับข้อนี้..."
                                className="flex-1 px-3 py-1.5 text-xs border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white/95 shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => onToggleEditRemark(null)}
                                className="px-3 py-1.5 text-xs font-bold bg-gradient-to-b from-slate-800 to-slate-950 text-white rounded-xl shadow-xs cursor-pointer"
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    )}
                </div>

                {/* Reorder / Edit / Delete item buttons */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white/80 backdrop-blur-md p-0.5 rounded-xl border border-slate-200/70 shadow-2xs">
                    {itemIndex > 0 && (
                        <button
                            type="button"
                            onClick={() => onMoveOrder(item.id, 'UP')}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg cursor-pointer"
                            title="เลื่อนขึ้น"
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {itemIndex < totalSiblings - 1 && (
                        <button
                            type="button"
                            onClick={() => onMoveOrder(item.id, 'DOWN')}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg cursor-pointer"
                            title="เลื่อนลง"
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-lg cursor-pointer"
                        title="แก้ไขรายการเช็ค"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg cursor-pointer"
                        title="ลบรายการเช็ค"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ChecklistItemRow = ChecklistItem;
