import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    Trash2,
    Archive,
    RotateCcw,
    PackageOpen,
    PlusCircle,
    Compass,
    Info,
    Edit2,
    Send,
    History,
    PackageCheck
} from 'lucide-react';
import { ChecklistItem, ChecklistPreset, MasterOption, ShootRoundKey } from '../../types';
import MentorTip from '../MentorTip';
import { useChecklist } from '../../hooks/useChecklist';
import { SHOOT_ROUND_META } from '../../context/ChecklistContext';
import InventoryModal from './InventoryModal';
import PresetModal from './PresetModal';
import PresetEditorModal from './PresetEditorModal';
import ItemVerifyModal from './ItemVerifyModal';
import ShootRoundSubmitModal from './ShootRoundSubmitModal';
import ShootTripHistoryView from './ShootTripHistoryView';
import ShootSessionStepperCard, { getRoundActiveStyles } from './ShootSessionStepperCard';
import ShootCategoryCard from './ShootCategoryCard';
import ShootPackingBackground from './ShootPackingBackground';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import InfoModal from '../ui/InfoModal';
import ChecklistGuide from './ChecklistGuide';
import AppBackground from '../common/AppBackground';

interface ShootChecklistProps {
    items: ChecklistItem[];
    onToggle: (id: string, currentStatus: boolean) => void;
    onAdd: (text: string, categoryId: string) => void;
    onDelete: (id: string) => void;
    onReset: () => void;

    presets: ChecklistPreset[];
    activePresetId?: string | null;
    activePresetName?: string | null;
    onLoadPreset: (id: string, clearFirst?: boolean) => void;
    onAddPreset: (name: string, inventoryIds?: string[]) => void;
    onDeletePreset: (id: string) => void;

    onOpenSettings: () => void;
    masterOptions?: MasterOption[];
}

const springTransition = {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.8
};

const tabContentVariants: Variants = {
    enter: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? 24 : -24,
        scale: 0.99
    }),
    center: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: springTransition
    },
    exit: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? -24 : 24,
        scale: 0.99,
        transition: {
            duration: 0.16,
            ease: [0.16, 1, 0.3, 1] as const
        }
    })
};

const ShootChecklist: React.FC<ShootChecklistProps> = ({
    items: propItems,
    onToggle,
    onAdd,
    onDelete,
    onReset,
    activePresetId: propActivePresetId,
    activePresetName: propActivePresetName,
    onLoadPreset: propOnLoadPreset,
    onAddPreset: propOnAddPreset,
    onDeletePreset: propOnDeletePreset,
    masterOptions = []
}) => {
    const {
        activeChecklistItems,
        inventoryItems,
        checklistPresets,
        activeShootSession,
        shootTripRecords,
        isSubmittingRound,
        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem,
        handleUpdatePreset,
        handleUpdateShootSessionTitle,
        handleSetShootRound,
        handleSubmitShootRound,
        handleStartNewShootSession,
        handleResumeShootTrip,
        handleDeleteShootTripRecord,
        fetchPaginatedShootTrips
    } = useChecklist();

    // Use enriched items from context (includes checker attribution)
    const items = activeChecklistItems.length > 0 ? activeChecklistItems : propItems;

    const { showConfirm } = useGlobalDialog();

    // Main Tab State: ACTIVE (จัดกระเป๋าออกกอง) vs HISTORY (ประวัติการออกกอง)
    const [activeViewTab, setActiveViewTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    const [tabDirection, setTabDirection] = useState<number>(1);

    const handleSwitchViewTab = (nextTab: 'ACTIVE' | 'HISTORY') => {
        if (nextTab === activeViewTab) return;
        setTabDirection(nextTab === 'HISTORY' ? 1 : -1);
        setActiveViewTab(nextTab);
    };

    // Modals State
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [isPresetEditorOpen, setIsPresetEditorOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<ChecklistPreset | null>(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyingItem, setVerifyingItem] = useState<ChecklistItem | null>(null);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // Filtered Master Options
    const mainCats = useMemo(
        () =>
            masterOptions
                .filter(o => o.type === 'INV_CAT_L1')
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [masterOptions]
    );
    const subCats = useMemo(
        () =>
            masterOptions
                .filter(o => o.type === 'INV_CAT_L2')
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [masterOptions]
    );

    // Calculations
    const totalItems = items.length;
    const checkedItems = items.filter(i => i.isChecked).length;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    const currentRound: ShootRoundKey = activeShootSession?.currentRound || 'PACK_OUT';
    const currentRoundMeta = SHOOT_ROUND_META[currentRound];
    const roundStyle = getRoundActiveStyles(currentRound);

    const inProgressTripsCount = useMemo(
        () =>
            shootTripRecords.filter(
                r => !(r.rounds?.PACK_OUT && r.rounds?.PACK_BACK && r.rounds?.RETURN_STORAGE)
            ).length,
        [shootTripRecords]
    );

    // Handlers
    const handlePresetClick = async (presetId: string) => {
        if (presetId === 'CLEAR') {
            const confirmed = await showConfirm(
                'ต้องการลบรายการทั้งหมดหน้าจอใช่หรือไม่?',
                'ยืนยันการล้างกระเป๋า 🗑️'
            );
            if (confirmed) {
                propOnLoadPreset('CLEAR');
            }
        } else {
            propOnLoadPreset(presetId, true);
        }
    };

    const handleEditPresetClick = (e: React.MouseEvent, preset: ChecklistPreset) => {
        e.stopPropagation();
        setEditingPreset(preset);
        setIsPresetEditorOpen(true);
    };

    const handleOpenVerifyModal = (e: React.MouseEvent, item: ChecklistItem) => {
        e.stopPropagation();
        setVerifyingItem(item);
        setIsVerifyModalOpen(true);
    };

    const handleVerifyConfirm = () => {
        if (verifyingItem && !verifyingItem.isChecked) {
            onToggle(verifyingItem.id, false);
            setVerifyingItem(null);
        }
    };

    // Helper: Find Parent L1 Key from an L2 Key
    const findParentL1 = (l2Key: string) => {
        const l2 = subCats.find(s => s.key === l2Key);
        if (l2 && l2.parentKey) {
            const l1 = mainCats.find(m => m.key === l2.parentKey);
            return l1 ? l1 : null;
        }
        return null;
    };

    // Group Items by L1
    const groupedActiveItems = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {};
        mainCats.forEach(cat => {
            groups[cat.key] = [];
        });
        groups['MISC'] = [];

        items.forEach(item => {
            const l1 = findParentL1(item.categoryId);
            if (l1) {
                if (!groups[l1.key]) groups[l1.key] = [];
                groups[l1.key].push(item);
            } else {
                if (groups[item.categoryId]) groups[item.categoryId].push(item);
                else groups['MISC'].push(item);
            }
        });
        return groups;
    }, [items, mainCats, subCats]);

    const handleQuickAdd = (text: string, l1Key: string) => {
        const isDuplicate = items.some(i => i.text.toLowerCase() === text.trim().toLowerCase());
        if (isDuplicate) return;
        onAdd(text.trim(), l1Key);
    };

    const currentInventoryItem = verifyingItem
        ? inventoryItems.find(inv => inv.name === verifyingItem.text)
        : undefined;

    return (
        <AppBackground
            transparent={true}
            pattern="none"
            className="px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 animate-in fade-in duration-500 relative z-10 min-h-[calc(100vh-64px)] w-full pb-36 sm:pb-24"
        >
            {/* Interactive Production Van & Crew Packing Background Animation (Portaled Fixed Viewport) */}
            <ShootPackingBackground
                currentRound={currentRound}
                progress={progress}
                activeViewTab={activeViewTab}
                totalItems={totalItems}
            />

            <div className="relative z-10 w-full max-w-6xl mx-auto space-y-5">
                <MentorTip moduleId="SHOOT_CHECKLIST" />

                {/* Top Header & View Switcher */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <span>จัดเป๋าออกกอง</span>
                                <span>🎒</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                                ระบบตรวจเช็คอุปกรณ์ 3 รอบ (หยิบออกคลัง • ยกกลับ • คืนเข้าคลัง)
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsInfoOpen(true)}
                            className="p-2 bg-white/80 backdrop-blur-xs text-teal-600 hover:text-teal-700 hover:bg-white rounded-xl transition-all shadow-2xs border border-white/60 min-w-[40px] min-h-[40px] flex items-center justify-center"
                            title="คู่มือการใช้งาน"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Top Controls: Segmented Tab Switcher + Inventory Button */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                        <div className="flex-1 sm:flex-none bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-xs flex items-center relative">
                            <button
                                type="button"
                                onClick={() => handleSwitchViewTab('ACTIVE')}
                                className={`relative flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[40px] z-10 ${
                                    activeViewTab === 'ACTIVE'
                                        ? 'text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {activeViewTab === 'ACTIVE' && (
                                    <motion.div
                                        layoutId="shootChecklistMainTabPill"
                                        transition={springTransition}
                                        className="absolute inset-0 bg-slate-900 rounded-xl shadow-sm -z-10"
                                    />
                                )}
                                <PackageCheck className="w-4 h-4" />
                                <span>จัดของออกกอง</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchViewTab('HISTORY')}
                                className={`relative flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[40px] z-10 ${
                                    activeViewTab === 'HISTORY'
                                        ? 'text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {activeViewTab === 'HISTORY' && (
                                    <motion.div
                                        layoutId="shootChecklistMainTabPill"
                                        transition={springTransition}
                                        className="absolute inset-0 bg-slate-900 rounded-xl shadow-sm -z-10"
                                    />
                                )}
                                <History className="w-4 h-4" />
                                <span>ประวัติออกกอง</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums transition-colors ${
                                        activeViewTab === 'HISTORY'
                                            ? 'bg-white/20 text-white'
                                            : inProgressTripsCount > 0
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-white/80 text-gray-600'
                                    }`}
                                >
                                    {shootTripRecords.length}
                                </span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsInventoryModalOpen(true)}
                            className="px-4 py-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200/70 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 min-h-[44px]"
                        >
                            <Archive className="w-4 h-4 text-white/90" />
                            <span>คลังอุปกรณ์</span>
                        </button>
                    </div>
                </div>

                {/* Animated Tab Content Area (ACTIVE vs HISTORY) */}
                <AnimatePresence mode="wait" initial={false} custom={tabDirection}>
                    {activeViewTab === 'HISTORY' ? (
                        <motion.div
                            key="shoot-tab-history"
                            custom={tabDirection}
                            variants={tabContentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                        >
                            <ShootTripHistoryView
                                records={shootTripRecords}
                                activeTripId={activeShootSession?.tripId}
                                onResumeTrip={async trip => {
                                    await handleResumeShootTrip(trip);
                                    handleSwitchViewTab('ACTIVE');
                                }}
                                onDeleteTrip={handleDeleteShootTripRecord}
                                fetchPaginatedShootTrips={fetchPaginatedShootTrips}
                            />
                        </motion.div>
                    ) : (
                        /* VIEW 2: ACTIVE SHOOT PACKING WORKSPACE */
                        <motion.div
                            key="shoot-tab-active"
                            custom={tabDirection}
                            variants={tabContentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-4"
                        >
                        {/* Preset Chips Bar */}
                        <div className="overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                            <div className="flex items-center gap-2 w-max">
                                {checklistPresets.map(p => (
                                    <div
                                        key={p.id}
                                        className={`flex items-center rounded-xl border text-xs font-bold transition-all pr-1.5 pl-3.5 py-1.5 cursor-pointer min-h-[38px] backdrop-blur-xs ${
                                            propActivePresetId === p.id
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200/50'
                                                : 'bg-white/75 text-gray-700 border-white/60 hover:bg-white/95 shadow-2xs'
                                        }`}
                                        onClick={() => handlePresetClick(p.id)}
                                    >
                                        <span className="mr-1.5">{p.name}</span>
                                        <button
                                            type="button"
                                            onClick={e => handleEditPresetClick(e, p)}
                                            className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
                                                propActivePresetId === p.id
                                                    ? 'text-indigo-100 hover:text-white'
                                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                            title="แก้ไขชุดอุปกรณ์นี้"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <div className="w-px h-6 bg-white/60 mx-1" />

                                <button
                                    type="button"
                                    onClick={() => setIsPresetModalOpen(true)}
                                    className="px-3.5 py-2 bg-white/75 backdrop-blur-xs rounded-xl text-gray-700 hover:text-indigo-600 border border-white/60 hover:bg-white/95 shadow-2xs transition-all text-xs font-bold flex items-center min-h-[38px]"
                                >
                                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> สร้างชุดใหม่
                                </button>

                                {items.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handlePresetClick('CLEAR')}
                                        className="px-3 py-2 text-rose-600 hover:text-rose-700 bg-white/75 hover:bg-rose-50/70 backdrop-blur-xs rounded-xl border border-white/60 shadow-2xs transition-all text-xs font-bold flex items-center min-h-[38px]"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> ล้างกระเป๋า
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Shoot Session Card & 3-Round Stepper */}
                        <ShootSessionStepperCard
                            activeShootSession={activeShootSession}
                            activePresetName={propActivePresetName}
                            onUpdateSessionTitle={handleUpdateShootSessionTitle}
                            onSetShootRound={handleSetShootRound}
                            onStartNewSession={() => handleStartNewShootSession()}
                        />

                        {/* Sticky Readiness & Submit Round Bar */}
                        <div className="bg-white/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3.5 sticky top-2 z-30">
                            <div className="flex-1">
                                <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5">
                                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                        <Compass
                                            className={`w-4 h-4 ${
                                                progress === 100
                                                    ? 'text-emerald-500'
                                                    : 'text-amber-500'
                                            }`}
                                        />
                                        <span>ความพร้อม ({currentRoundMeta.label})</span>
                                    </span>
                                    <span className="font-bold text-gray-900 tabular-nums">
                                        {checkedItems}/{totalItems} ชิ้น ({progress}%)
                                    </span>
                                </div>
                                <div className="h-3 bg-white/60 backdrop-blur-xs rounded-full overflow-hidden border border-white/80 p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                                            progress === 100
                                                ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                                                : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onReset}
                                    disabled={checkedItems === 0}
                                    className="p-2.5 text-gray-500 hover:text-indigo-600 bg-white/80 hover:bg-white backdrop-blur-xs rounded-xl transition-colors border border-white/70 shadow-2xs disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    title="รีเซ็ตเครื่องหมายติ๊กในรอบนี้"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(true)}
                                    disabled={totalItems === 0 || isSubmittingRound}
                                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 ${roundStyle.ctaBtn}`}
                                >
                                    <Send className="w-4 h-4" />
                                    <span>
                                        ส่งรายงานรอบที่ {currentRoundMeta.index} ({checkedItems}/
                                        {totalItems})
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Equipment List Area */}
                        {items.length === 0 ? (
                            <div
                                className="text-center py-20 bg-white/75 backdrop-blur-md rounded-3xl border-2 border-dashed border-white/80 shadow-2xs flex flex-col items-center justify-center cursor-pointer hover:bg-white/90 transition-colors"
                                onClick={() => setIsInventoryModalOpen(true)}
                            >
                                <PackageOpen className="w-14 h-14 text-gray-300 mb-3" />
                                <h3 className="text-lg font-bold text-gray-700">
                                    ยังไม่มีอุปกรณ์ในกระเป๋า
                                </h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    แตะเลือกชุด Preset ด้านบน หรือเพิ่มอุปกรณ์จากคลัง
                                </p>
                                <button
                                    type="button"
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all"
                                >
                                    เปิดคลังอุปกรณ์
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {[
                                    ...mainCats,
                                    ...(groupedActiveItems['MISC']?.length > 0
                                        ? [
                                              {
                                                  id: 'MISC',
                                                  key: 'MISC',
                                                  label: 'อื่นๆ (Misc)',
                                                  color: 'text-gray-600',
                                                  sortOrder: 999,
                                                  type: 'INV_CAT_L1',
                                                  isActive: true
                                              } as MasterOption
                                          ]
                                        : [])
                                ].map(cat => {
                                    const catItems = groupedActiveItems[cat.key] || [];
                                    if (catItems.length === 0) return null;

                                    return (
                                        <ShootCategoryCard
                                            key={cat.id}
                                            category={cat}
                                            items={catItems}
                                            inventoryItems={inventoryItems}
                                            onToggle={onToggle}
                                            onQuickAdd={handleQuickAdd}
                                            onOpenVerifyModal={handleOpenVerifyModal}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <InventoryModal
                    isOpen={isInventoryModalOpen}
                    onClose={() => setIsInventoryModalOpen(false)}
                    inventoryItems={inventoryItems}
                    currentChecklistItems={items.map(i => ({ id: i.id, text: i.text }))}
                    onAdd={(text, catId) => {
                        const isDuplicate = items.some(
                            i => i.text.toLowerCase() === text.toLowerCase()
                        );
                        if (!isDuplicate) {
                            onAdd(text, catId);
                        }
                    }}
                    onRemove={onDelete}
                    onAddItem={handleAddInventoryItem}
                    onUpdateItem={handleUpdateInventoryItem}
                    onDeleteItem={handleDeleteInventoryItem}
                    masterOptions={masterOptions}
                />

                <PresetModal
                    isOpen={isPresetModalOpen}
                    onClose={() => setIsPresetModalOpen(false)}
                    presets={checklistPresets}
                    inventoryItems={inventoryItems}
                    onAddPreset={(name, ids) => propOnAddPreset(name, ids)}
                    onDeletePreset={id => propOnDeletePreset(id)}
                />

                {editingPreset && (
                    <PresetEditorModal
                        isOpen={isPresetEditorOpen}
                        onClose={() => {
                            setIsPresetEditorOpen(false);
                            setEditingPreset(null);
                        }}
                        preset={editingPreset}
                        inventoryItems={inventoryItems}
                        onSave={handleUpdatePreset}
                    />
                )}

                {verifyingItem && (
                    <ItemVerifyModal
                        isOpen={isVerifyModalOpen}
                        onClose={() => setIsVerifyModalOpen(false)}
                        item={verifyingItem}
                        inventoryItem={currentInventoryItem}
                        onConfirm={handleVerifyConfirm}
                    />
                )}

                <ShootRoundSubmitModal
                    isOpen={isSubmitModalOpen}
                    onClose={() => setIsSubmitModalOpen(false)}
                    currentRound={currentRound}
                    sessionTitle={activeShootSession?.title || 'ออกกองทั่วไป'}
                    items={items}
                    isSubmitting={isSubmittingRound}
                    onSubmit={async (note, customTitle) => {
                        const saved = await handleSubmitShootRound(note, customTitle);
                        if (saved) {
                            setIsSubmitModalOpen(false);
                        }
                    }}
                />

                <InfoModal
                    isOpen={isInfoOpen}
                    onClose={() => setIsInfoOpen(false)}
                    title="คู่มือจัดเป๋าออกกอง (3 รอบ)"
                >
                    <ChecklistGuide />
                </InfoModal>
            </div>
        </AppBackground>
    );
};

export default ShootChecklist;
