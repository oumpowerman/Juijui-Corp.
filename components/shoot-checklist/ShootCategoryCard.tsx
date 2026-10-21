import React, { useState } from 'react';
import {
    Camera,
    Mic,
    Box,
    Plus,
    Lightbulb,
    Layout,
    Check,
    User as UserIcon,
    Eye
} from 'lucide-react';
import { ChecklistItem, InventoryItem, MasterOption } from '../../types';

const formatTimeBadge = (iso?: string) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
};

const getCategoryIcon = (key: string) => {
    if (key.includes('CAMERA')) return <Camera className="w-5 h-5" />;
    if (key.includes('AUDIO')) return <Mic className="w-5 h-5" />;
    if (key.includes('LIGHT')) return <Lightbulb className="w-5 h-5" />;
    if (key.includes('GRIP')) return <Layout className="w-5 h-5" />;
    return <Box className="w-5 h-5" />;
};

interface ShootCategoryCardProps {
    category: MasterOption;
    items: ChecklistItem[];
    inventoryItems: InventoryItem[];
    onToggle: (id: string, currentStatus: boolean) => void;
    onQuickAdd: (text: string, categoryKey: string) => void;
    onOpenVerifyModal: (e: React.MouseEvent, item: ChecklistItem) => void;
}

const ShootCategoryCard: React.FC<ShootCategoryCardProps> = ({
    category,
    items,
    inventoryItems,
    onToggle,
    onQuickAdd,
    onOpenVerifyModal
}) => {
    const [quickAddText, setQuickAddText] = useState('');

    const catChecked = items.filter(i => i.isChecked).length;
    const catTotal = items.length;
    const catProgress = catTotal > 0 ? (catChecked / catTotal) * 100 : 0;
    const isComplete = catProgress === 100 && catTotal > 0;

    // Sort: Unchecked first so remaining items stay at the top on mobile
    const sortedItems = [...items].sort((a, b) => Number(a.isChecked) - Number(b.isChecked));

    const handleSubmitQuickAdd = () => {
        if (quickAddText.trim()) {
            onQuickAdd(quickAddText.trim(), category.key);
            setQuickAddText('');
        }
    };

    return (
        <div className="bg-white/75 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 overflow-hidden flex flex-col h-full transition-all">
            {/* Category Header */}
            <div
                className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between ${
                    isComplete
                        ? 'bg-emerald-50/70 border-emerald-100/60'
                        : 'bg-white/60 border-white/50'
                }`}
            >
                <div className="flex items-center space-x-2.5">
                    <div
                        className={`p-1.5 rounded-xl bg-white/80 shadow-2xs backdrop-blur-xs ${
                            category.color || 'text-indigo-600'
                        }`}
                    >
                        {getCategoryIcon(category.key)}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                        {category.label}
                    </h3>
                </div>
                <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums backdrop-blur-xs ${
                        isComplete
                            ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60'
                            : 'bg-white/80 text-gray-600 border border-gray-200/80 shadow-2xs'
                    }`}
                >
                    {catChecked}/{catTotal}
                </span>
            </div>

            {/* Category Progress Line */}
            <div className="h-1 w-full bg-white/40">
                <div
                    className={`h-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${catProgress}%` }}
                />
            </div>

            {/* Items List (One-Tap Toggle + Checker Attribution) */}
            <div className="p-2.5 flex-1 space-y-1.5">
                {sortedItems.map(item => {
                    const hasInventoryRef = inventoryItems.some(inv => inv.name === item.text);

                    return (
                        <div
                            key={item.id}
                            onClick={() => onToggle(item.id, item.isChecked)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border min-h-[54px] select-none active:scale-[0.99] backdrop-blur-xs ${
                                item.isChecked
                                    ? 'bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-50/70'
                                    : 'bg-white/60 border-white/70 hover:bg-white/85 hover:border-indigo-200 hover:shadow-xs'
                            }`}
                        >
                            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors ${
                                        item.isChecked
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-gray-300 bg-white/90'
                                    }`}
                                >
                                    {item.isChecked && (
                                        <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div
                                        className={`text-sm font-semibold leading-snug break-words ${
                                            item.isChecked
                                                ? 'text-gray-500 line-through'
                                                : 'text-gray-800'
                                        }`}
                                    >
                                        {item.text}
                                    </div>

                                    {/* Real-time Checker Attribution Badge */}
                                    {item.isChecked && item.checkedByName && (
                                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-white/85 border border-emerald-200/80 shadow-2xs backdrop-blur-xs">
                                            {item.checkedByAvatar ? (
                                                <img
                                                    src={item.checkedByAvatar}
                                                    alt={item.checkedByName}
                                                    className="w-3.5 h-3.5 rounded-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <UserIcon className="w-3 h-3 text-emerald-600" />
                                            )}
                                            <span className="text-[11px] font-semibold text-emerald-800">
                                                {item.checkedByName}
                                            </span>
                                            {item.checkedAt && (
                                                <span className="text-[10px] text-gray-400 tabular-nums">
                                                    • {formatTimeBadge(item.checkedAt)} น.
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Optional Photo / Detail Preview Trigger */}
                            {hasInventoryRef && (
                                <button
                                    type="button"
                                    onClick={e => onOpenVerifyModal(e, item)}
                                    className="p-2 -mr-1 text-gray-400 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                    title="ดูรูปและรายละเอียดอุปกรณ์"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}

                {/* Quick Add Input */}
                <div className="mt-2 pt-2 border-t border-white/50 px-1">
                    <div className="flex items-center gap-2 focus-within:ring-2 ring-indigo-200/60 rounded-xl transition-all bg-white/55 backdrop-blur-xs border border-white/60 focus-within:bg-white/85 px-2">
                        <input
                            type="text"
                            placeholder="+ เพิ่มอุปกรณ์ด่วนในหมวดนี้..."
                            className="flex-1 bg-transparent text-xs sm:text-sm outline-none placeholder:text-gray-400 py-2 px-1 text-gray-700 font-medium"
                            value={quickAddText}
                            onChange={e => setQuickAddText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSubmitQuickAdd();
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleSubmitQuickAdd}
                            className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-white/70 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShootCategoryCard;
