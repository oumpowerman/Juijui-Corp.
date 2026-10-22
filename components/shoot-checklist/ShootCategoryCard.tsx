import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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

const HOLD_BEFORE_SORT_MS = 200;

const rowSpringTransition = {
    type: 'spring' as const,
    stiffness: 360,
    damping: 30,
    mass: 0.8
};

const itemRowVariants: Variants = {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: rowSpringTransition
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: rowSpringTransition
    }
};

const checkIconVariants: Variants = {
    initial: { scale: 0, opacity: 0, rotate: -25 },
    animate: {
        scale: 1,
        opacity: 1,
        rotate: 0,
        transition: rowSpringTransition
    },
    exit: {
        scale: 0,
        opacity: 0,
        rotate: 15,
        transition: rowSpringTransition
    }
};

const badgeVariants: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: rowSpringTransition
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: rowSpringTransition
    }
};

const buildInitialOrder = (list: ChecklistItem[]): string[] => {
    const unchecked = list.filter(i => !i.isChecked).map(i => i.id);
    const checked = list.filter(i => i.isChecked).map(i => i.id);
    return [...unchecked, ...checked];
};

const moveItemInOrder = (
    currentOrder: string[],
    targetId: string,
    targetChecked: boolean,
    checkedLookup: Record<string, boolean>
): string[] => {
    const withoutTarget = currentOrder.filter(id => id !== targetId);

    let next: string[];
    if (targetChecked) {
        // Checking (false -> true): append to the very bottom (end of Checked Zone)
        next = [...withoutTarget, targetId];
    } else {
        // Unchecking (true -> false): insert at the end of the Unchecked Zone
        // (immediately before the first item in `withoutTarget` that is currently checked)
        const firstCheckedIdx = withoutTarget.findIndex(id => checkedLookup[id]);
        next =
            firstCheckedIdx === -1
                ? [...withoutTarget, targetId]
                : [
                      ...withoutTarget.slice(0, firstCheckedIdx),
                      targetId,
                      ...withoutTarget.slice(firstCheckedIdx)
                  ];
    }

    const unchanged =
        next.length === currentOrder.length &&
        next.every((id, idx) => id === currentOrder[idx]);
    return unchanged ? currentOrder : next;
};

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
    const [orderedIds, setOrderedIds] = useState<string[]>(() => buildInitialOrder(items));

    const sortTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const canonicalOrderRef = useRef<string[]>(items.map(i => i.id));
    const itemsRef = useRef<ChecklistItem[]>(items);
    itemsRef.current = items;

    const prevCheckedMapRef = useRef<Record<string, boolean>>(
        Object.fromEntries(items.map(i => [i.id, i.isChecked]))
    );
    const settledCheckedRef = useRef<Record<string, boolean>>(
        Object.fromEntries(items.map(i => [i.id, i.isChecked]))
    );

    useEffect(() => {
        return () => {
            Object.values(sortTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    // Synchronize orderedIds when items are added/removed, replaced from temp IDs, reset, or toggled externally
    useEffect(() => {
        const currentIds = new Set(items.map(i => i.id));
        const checkedLookup: Record<string, boolean> = {};
        items.forEach(i => {
            checkedLookup[i.id] = i.isChecked;
        });

        // Update canonical base order for any new items
        const nextCanonical = canonicalOrderRef.current.filter(id => currentIds.has(id));
        items.forEach(i => {
            if (!nextCanonical.includes(i.id)) {
                nextCanonical.push(i.id);
            }
        });
        canonicalOrderRef.current = nextCanonical;

        const prevCheckedMap = prevCheckedMapRef.current;
        const prevCheckedCount = Object.values(prevCheckedMap).filter(Boolean).length;
        const currentCheckedCount = items.filter(i => i.isChecked).length;
        const hasActiveHoldTimers = Object.keys(sortTimersRef.current).length > 0;

        // Detect bulk reset (e.g., "Reset All" button or new round reset)
        if (prevCheckedCount > 1 && currentCheckedCount === 0 && !hasActiveHoldTimers) {
            prevCheckedMapRef.current = checkedLookup;
            settledCheckedRef.current = { ...checkedLookup };
            setOrderedIds(canonicalOrderRef.current);
            return;
        }

        setOrderedIds(prevOrder => {
            // Keep existing valid IDs in their current visual order
            let nextOrder = prevOrder.filter(id => currentIds.has(id));

            // Clean up removed IDs from settledCheckedRef
            Object.keys(settledCheckedRef.current).forEach(id => {
                if (!currentIds.has(id)) {
                    delete settledCheckedRef.current[id];
                }
            });

            // Insert any newly added items at the end of their respective zone
            for (const item of items) {
                if (!nextOrder.includes(item.id)) {
                    settledCheckedRef.current[item.id] = item.isChecked;
                    nextOrder = moveItemInOrder(
                        [...nextOrder, item.id],
                        item.id,
                        item.isChecked,
                        settledCheckedRef.current
                    );
                }
            }

            // Handle external single-item toggles (e.g. from Verify Modal or Realtime) not held by local click timer
            for (const item of items) {
                const wasChecked = prevCheckedMap[item.id];
                if (
                    wasChecked !== undefined &&
                    wasChecked !== item.isChecked &&
                    !sortTimersRef.current[item.id]
                ) {
                    settledCheckedRef.current[item.id] = item.isChecked;
                    nextOrder = moveItemInOrder(
                        nextOrder,
                        item.id,
                        item.isChecked,
                        settledCheckedRef.current
                    );
                }
            }

            const unchanged =
                nextOrder.length === prevOrder.length &&
                nextOrder.every((id, idx) => id === prevOrder[idx]);
            return unchanged ? prevOrder : nextOrder;
        });

        prevCheckedMapRef.current = checkedLookup;
    }, [items]);

    const catChecked = items.filter(i => i.isChecked).length;
    const catTotal = items.length;
    const catProgress = catTotal > 0 ? (catChecked / catTotal) * 100 : 0;
    const isComplete = catProgress === 100 && catTotal > 0;

    // Render items strictly according to `orderedIds` queue
    const itemMap = new Map(items.map(i => [i.id, i]));
    const sortedItems: ChecklistItem[] = [];
    const seen = new Set<string>();

    for (const id of orderedIds) {
        const found = itemMap.get(id);
        if (found) {
            sortedItems.push(found);
            seen.add(id);
        }
    }
    for (const item of items) {
        if (!seen.has(item.id)) {
            sortedItems.push(item);
        }
    }

    const handleItemClick = (item: ChecklistItem) => {
        const nextChecked = !item.isChecked;

        if (sortTimersRef.current[item.id]) {
            clearTimeout(sortTimersRef.current[item.id]);
            delete sortTimersRef.current[item.id];
        }

        prevCheckedMapRef.current[item.id] = nextChecked;

        // Preview target order against currently settled zones
        const previewSettled = {
            ...settledCheckedRef.current,
            [item.id]: nextChecked
        };
        const previewNextOrder = moveItemInOrder(
            orderedIds,
            item.id,
            nextChecked,
            previewSettled
        );
        const willMove = previewNextOrder !== orderedIds;

        // If the item is already at its exact target position (e.g., unchecking top item when all are green,
        // or checking the bottom-most unchecked item when none below are checked), settle in-place with zero timer!
        if (!willMove) {
            settledCheckedRef.current[item.id] = nextChecked;
            onToggle(item.id, item.isChecked);
            return;
        }

        // Otherwise: Stage 1 (0ms) -> Toggle visual state in place; Stage 2 (200ms) -> Glide to target zone
        sortTimersRef.current[item.id] = setTimeout(() => {
            delete sortTimersRef.current[item.id];
            settledCheckedRef.current[item.id] = nextChecked;

            setOrderedIds(prevOrder =>
                moveItemInOrder(
                    prevOrder,
                    item.id,
                    nextChecked,
                    settledCheckedRef.current
                )
            );
        }, HOLD_BEFORE_SORT_MS);

        onToggle(item.id, item.isChecked);
    };

    const handleSubmitQuickAdd = () => {
        if (quickAddText.trim()) {
            onQuickAdd(quickAddText.trim(), category.key);
            setQuickAddText('');
        }
    };

    return (
        <div className="bg-white/65 backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/80 ring-1 ring-slate-900/[0.04] overflow-hidden flex flex-col h-full transition-all">
            {/* Category Header */}
            <div
                className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between ${
                    isComplete
                        ? 'bg-emerald-50/65 border-emerald-200/60'
                        : 'bg-white/45 border-white/60'
                }`}
            >
                <div className="flex items-center space-x-2.5">
                    <div
                        className={`p-1.5 rounded-xl bg-white/85 backdrop-blur-md shadow-2xs border border-white/80 ${
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
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums backdrop-blur-md ${
                        isComplete
                            ? 'bg-emerald-100/85 text-emerald-800 border border-emerald-200/80'
                            : 'bg-white/85 text-gray-700 border border-white/80 shadow-2xs'
                    }`}
                >
                    {catChecked}/{catTotal}
                </span>
            </div>

            {/* Category Progress Line */}
            <div className="h-1 w-full bg-white/45">
                <div
                    className={`h-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${catProgress}%` }}
                />
            </div>

            {/* Items List (One-Tap Toggle + Checker Attribution) */}
            <div className="p-2.5 flex-1 space-y-1.5">
                <AnimatePresence initial={false}>
                    {sortedItems.map(item => {
                        const hasInventoryRef = inventoryItems.some(inv => inv.name === item.text);

                        return (
                            <motion.div
                                key={item.id}
                                layout="position"
                                variants={itemRowVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                whileTap={{ scale: 0.985 }}
                                transition={rowSpringTransition}
                                onClick={() => handleItemClick(item)}
                                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border min-h-[52px] select-none backdrop-blur-md ${
                                    item.isChecked
                                        ? 'bg-emerald-50/75 border-emerald-200/80 hover:bg-emerald-50/90'
                                        : 'bg-white/80 border-white/85 hover:bg-white/95 hover:border-indigo-300 shadow-2xs'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: item.isChecked ? 1.05 : 1
                                        }}
                                        transition={rowSpringTransition}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            item.isChecked
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-gray-300 bg-white/90'
                                        }`}
                                    >
                                        <AnimatePresence initial={false}>
                                            {item.isChecked && (
                                                <motion.span
                                                    key="check-icon"
                                                    variants={checkIconVariants}
                                                    initial="initial"
                                                    animate="animate"
                                                    exit="exit"
                                                    className="flex items-center justify-center"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    <div
                                        className={`text-sm font-semibold leading-snug break-words min-w-0 flex-1 transition-colors ${
                                            item.isChecked
                                                ? 'text-gray-500 line-through'
                                                : 'text-gray-800'
                                        }`}
                                    >
                                        {item.text}
                                    </div>
                                </div>

                                {/* Right Controls: Inline Constant-Height Checker Attribution Pill + Detail Trigger */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <AnimatePresence initial={false}>
                                        {item.isChecked && item.checkedByName && (
                                            <motion.div
                                                key="checker-badge"
                                                variants={badgeVariants}
                                                initial="initial"
                                                animate="animate"
                                                exit="exit"
                                                className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-white/85 border border-emerald-200/80 shadow-2xs backdrop-blur-xs"
                                            >
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
                                                <span className="text-[11px] font-semibold text-emerald-800 max-w-[80px] truncate">
                                                    {item.checkedByName}
                                                </span>
                                                {item.checkedAt && (
                                                    <span className="hidden sm:inline text-[10px] text-gray-400 tabular-nums">
                                                        • {formatTimeBadge(item.checkedAt)} น.
                                                    </span>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {hasInventoryRef && (
                                        <button
                                            type="button"
                                            onClick={e => onOpenVerifyModal(e, item)}
                                            className="p-1.5 -mr-1 text-gray-400 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-colors shrink-0 min-w-[34px] min-h-[34px] flex items-center justify-center"
                                            title="ดูรูปและรายละเอียดอุปกรณ์"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Quick Add Input */}
                <div className="mt-2 pt-2 border-t border-white/60 px-1">
                    <div className="flex items-center gap-2 focus-within:ring-2 ring-indigo-200/60 rounded-xl transition-all bg-white/60 backdrop-blur-md border border-white/75 focus-within:bg-white/90 focus-within:border-indigo-300 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] px-2">
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
                            className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-white/80 rounded-lg transition-colors"
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
