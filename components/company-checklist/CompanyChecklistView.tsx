import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ShieldCheck,
    Plus,
    Save,
    FileCheck2
} from 'lucide-react';
import {
    User,
    MasterOption,
    CompanyChecklist,
    CompanyChecklistNode,
    ChecklistNodeType,
    SavedChecklistRecord
} from '../../types';
import { useCompanyChecklist } from '../../hooks/useCompanyChecklist';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { ChecklistHeaderBar } from './layout/ChecklistHeaderBar';
import { ChecklistWorkspaceToolbar } from './layout/ChecklistWorkspaceToolbar';
import { CompanyChecklistBackground } from './layout/CompanyChecklistBackground';
import { ChecklistCategory, ChecklistBuilder } from './workspace';
import { ChecklistSavedRecordsTab } from './history/ChecklistSavedRecordsTab';
import { ChecklistBoardModal } from './modals/ChecklistBoardModal';
import { ChecklistNodeModal } from './modals/ChecklistNodeModal';
import { SaveChecklistRecordModal } from './modals/SaveChecklistRecordModal';
import { evaluateChecklistCadence } from './utils/checklistCadenceUtils';
import MentorTip from '../MentorTip';

interface CompanyChecklistViewProps {
    currentUser: User;
    users: User[];
    masterOptions?: MasterOption[];
}

export const CompanyChecklistView: React.FC<CompanyChecklistViewProps> = ({
    currentUser,
    users = []
}) => {
    const { showConfirm } = useGlobalDialog();
    const [searchParams] = useSearchParams();
    const urlPresetId = searchParams.get('presetId');

    const {
        checklists,
        nodes,
        activeItemStates = {},
        activeCaseTitles = {},
        savedRecords = [],
        positionOptions = [],
        responsibilityOptions = [],
        getPositionLabel,
        getResponsibilityLabel,
        isUserResponsibleForSection,
        getSectionItemNodes,
        setCaseTitleForPreset,
        toggleActiveItem,
        updateActiveItemRemark,
        resetActiveChecklistWorkspace,
        saveChecklistSnapshotRecord,
        deleteSavedRecord,
        createChecklistBoard,
        updateChecklistBoard,
        deleteChecklistBoard,
        createNode,
        bulkCreateItems,
        updateNode,
        moveNodeOrder,
        deleteNode
    } = useCompanyChecklist(currentUser);

    // Main tab: 'WORKSPACE' vs 'SAVED_RECORDS'
    const [activeMainTab, setActiveMainTab] = useState<'WORKSPACE' | 'SAVED_RECORDS'>('WORKSPACE');

    // Selected Preset ID
    const [selectedPresetId, setSelectedPresetId] = useState<string>(urlPresetId || '');

    // Deep-link sync when navigating from Notification Bell with ?presetId=...
    useEffect(() => {
        if (urlPresetId && checklists.some(c => c.id === urlPresetId)) {
            setSelectedPresetId(urlPresetId);
            setActiveMainTab('WORKSPACE');
        }
    }, [urlPresetId, checklists]);

    // Filter & Layout Controls for 10-20 categories
    const [onlyMyResponsibility, setOnlyMyResponsibility] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [gridColumns, setGridColumns] = useState<1 | 2>(1);

    // Collapsed sections
    const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

    // Fast Category Input Ref
    const fastCategoryInputRef = useRef<HTMLInputElement>(null);

    // Modals
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [editingBoard, setEditingBoard] = useState<CompanyChecklist | null>(null);

    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [nodeModalParentId, setNodeModalParentId] = useState<string | null>(null);
    const [nodeModalParentTitle, setNodeModalParentTitle] = useState<string | undefined>(undefined);
    const [nodeModalDefaultType, setNodeModalDefaultType] = useState<ChecklistNodeType>('SECTION');
    const [editingNode, setEditingNode] = useState<CompanyChecklistNode | null>(null);

    const [isSaveRecordModalOpen, setIsSaveRecordModalOpen] = useState(false);

    // Expanded History Record ID
    const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

    // Active Preset
    const activePreset = useMemo(() => {
        if (checklists.length === 0) return null;
        return checklists.find(c => c.id === selectedPresetId) || checklists[0];
    }, [checklists, selectedPresetId]);

    // Nodes belonging to activePreset
    const currentPresetNodes = useMemo(() => {
        if (!activePreset) return [];
        return nodes
            .filter(n => n.checklistId === activePreset.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [nodes, activePreset]);

    // Level 1 Sections (Categories)
    const sections = useMemo(
        () =>
            currentPresetNodes
                .filter(n => n.nodeType === 'SECTION' && !n.parentId)
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [currentPresetNodes]
    );

    // Cadence evaluation for activePreset
    const activePresetCadence = useMemo(() => {
        if (!activePreset) return null;
        return evaluateChecklistCadence(activePreset, savedRecords);
    }, [activePreset, savedRecords]);

    // Auto-fill currentCaseTitle when activePreset is recurring and caseTitle is empty
    useEffect(() => {
        if (!activePreset || !activePresetCadence?.isRecurring) return;
        const existingTitle = activeCaseTitles?.[activePreset.id];
        if (!existingTitle && activePresetCadence.autoCaseTitle) {
            setCaseTitleForPreset(
                activePreset.id,
                activePresetCadence.autoCaseTitle
            );
        }
    }, [
        activePreset?.id,
        activePreset?.resetCycle,
        activePreset?.customIntervalCount,
        activePreset?.customIntervalUnit,
        activePresetCadence?.isRecurring,
        activePresetCadence?.autoCaseTitle
    ]);

    const currentCaseTitle = useMemo(() => {
        if (!activePreset) return '';
        const stored = activeCaseTitles?.[activePreset.id];
        if (stored !== undefined && stored !== '') return stored;
        if (activePresetCadence?.isRecurring && activePresetCadence.autoCaseTitle) {
            return activePresetCadence.autoCaseTitle;
        }
        return stored ?? '';
    }, [activePreset, activeCaseTitles, activePresetCadence]);

    // Filtered sections
    const filteredSections = useMemo(() => {
        return sections.filter(sec => {
            if (onlyMyResponsibility && !isUserResponsibleForSection(sec, currentUser)) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const secMatch =
                    sec.title.toLowerCase().includes(q) ||
                    (sec.description || '').toLowerCase().includes(q);
                const items = getSectionItemNodes(sec.id);
                const itemMatch = items.some(
                    i =>
                        i.title.toLowerCase().includes(q) ||
                        (i.description || '').toLowerCase().includes(q)
                );
                return secMatch || itemMatch;
            }
            return true;
        });
    }, [
        sections,
        onlyMyResponsibility,
        searchQuery,
        isUserResponsibleForSection,
        getSectionItemNodes,
        currentUser
    ]);

    // Overall progress stats for activePreset
    const presetProgress = useMemo(() => {
        const allItems = currentPresetNodes.filter(n => n.nodeType === 'ITEM');
        const total = allItems.length;
        const checked = allItems.filter(item => !!activeItemStates[item.id]?.isChecked).length;
        const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

        const checkerMap = new Map<
            string,
            { name: string; position?: string; avatarUrl?: string; count: number }
        >();
        allItems.forEach(item => {
            const st = activeItemStates[item.id];
            if (st?.isChecked && st.checkedBy) {
                const existing = checkerMap.get(st.checkedBy);
                if (existing) {
                    existing.count += 1;
                } else {
                    checkerMap.set(st.checkedBy, {
                        name: st.checkedByName,
                        position: st.checkedByPosition,
                        avatarUrl: st.checkedByAvatar,
                        count: 1
                    });
                }
            }
        });

        return {
            total,
            checked,
            percent,
            checkers: Array.from(checkerMap.values())
        };
    }, [currentPresetNodes, activeItemStates]);

    const toggleCollapse = (id: string) => {
        setCollapsedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCollapseAll = () => {
        const next: Record<string, boolean> = {};
        sections.forEach(s => {
            next[s.id] = true;
        });
        setCollapsedIds(next);
    };

    const handleExpandAll = () => {
        setCollapsedIds({});
    };

    const scrollToSection = (sectionId: string) => {
        setCollapsedIds(prev => ({ ...prev, [sectionId]: false }));
        setTimeout(() => {
            const el = document.getElementById(`chk-section-${sectionId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    };

    const handleResetActivePreset = async () => {
        if (!activePreset) return;
        const confirmed = await showConfirm(
            `ต้องการล้างเครื่องหมายติ๊กทั้งหมดของ "${activePreset.title}" เพื่อเริ่มเช็ครายการใหม่ใช่หรือไม่?`,
            'รีเซ็ตรายการเช็คปัจจุบัน'
        );
        if (confirmed) {
            await resetActiveChecklistWorkspace(activePreset.id);
        }
    };

    const handleConfirmSaveRecord = async (
        caseTitle: string,
        summaryNote: string,
        resetAfterSave: boolean
    ) => {
        if (!activePreset) return;
        const record = await saveChecklistSnapshotRecord(
            activePreset.id,
            caseTitle,
            summaryNote,
            resetAfterSave,
            users
        );
        if (record) {
            setExpandedRecordId(record.id);
        }
    };

    const handleDeletePreset = async (preset: CompanyChecklist) => {
        const confirmed = await showConfirm(
            `ต้องการลบหัวข้อ Checklist "${preset.title}" และหมวดหมู่ภายในใช่หรือไม่? (ใบประวัติที่เคยกดบันทึกไปแล้วจะยังอยู่ครบ)`,
            'ยืนยันการลบหัวข้อ Checklist'
        );
        if (confirmed) {
            await deleteChecklistBoard(preset.id);
        }
    };

    const handleDeleteNode = async (node: CompanyChecklistNode) => {
        const confirmed = await showConfirm(
            `ต้องการลบ "${node.title}" ใช่หรือไม่?`,
            'ยืนยันการลบรายการ'
        );
        if (confirmed) {
            await deleteNode(node.id);
        }
    };

    const handleDeleteSavedRecord = async (record: SavedChecklistRecord) => {
        const ok = await showConfirm(
            `ต้องการลบใบประวัติ "${record.caseTitle}" ใช่หรือไม่?`,
            'ลบประวัติเช็คลิสต์'
        );
        if (ok) {
            await deleteSavedRecord(record.id);
        }
    };

    return (
        <CompanyChecklistBackground>
            <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-10 space-y-5">
                <MentorTip moduleId="COMPANY_CHECKLIST" />

            {/* 1. Top Header & Preset Selector Bar */}
            <ChecklistHeaderBar
                activeMainTab={activeMainTab}
                onChangeMainTab={setActiveMainTab}
                checklists={checklists}
                nodes={nodes}
                activeItemStates={activeItemStates}
                savedRecords={savedRecords}
                savedRecordsCount={savedRecords.length}
                activePreset={activePreset}
                onSelectPreset={setSelectedPresetId}
                onCreatePreset={() => {
                    setEditingBoard(null);
                    setIsBoardModalOpen(true);
                }}
                onEditPreset={preset => {
                    setEditingBoard(preset);
                    setIsBoardModalOpen(true);
                }}
                onDeletePreset={handleDeletePreset}
            />

            {/* 2–4. Animated View Transition: WORKSPACE vs SAVED_RECORDS */}
            <AnimatePresence mode="wait" initial={false}>
                {activeMainTab === 'WORKSPACE' ? (
                    <motion.div
                        key={`workspace-${activePreset?.id || 'empty'}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
                        }}
                        exit={{
                            opacity: 0,
                            y: -8,
                            transition: { duration: 0.14, ease: 'easeIn' }
                        }}
                        className="space-y-5"
                    >
                        {/* Empty State when 0 Checklists exist */}
                        {checklists.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/95 ring-1 ring-indigo-200/50 p-8 sm:p-12 text-center space-y-4 shadow-[0_14px_34px_-12px_rgba(15,23,42,0.07),inset_0_1px_0_0_rgba(255,255,255,0.95)]"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-white/90 flex items-center justify-center mx-auto">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <div className="space-y-1.5 max-w-lg mx-auto">
                                    <h2 className="text-lg font-bold text-slate-900">
                                        ยังไม่มีหัวข้อ Checklist (เริ่มสร้างเองได้ทั้งหมด)
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        คุณสามารถสร้างหัวข้อ Checklist ใหม่ แล้วเพิ่มหมวดหมู่ข้างในกี่หมวดก็ได้ (10–20 หมวดหรือมากกว่านั้น) พร้อมผูกตำแหน่ง/หน้าที่รับผิดชอบ และวางรายการเช็คได้ด้วยตัวเองทั้งหมด
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingBoard(null);
                                            setIsBoardModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 text-emerald-400" />
                                        <span>สร้างหัวข้อ Checklist แรกของคุณ</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Active Checklist Workspace */}
                        {activePreset && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.24,
                                        delay: 0.03,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                >
                                    <ChecklistWorkspaceToolbar
                                        activePreset={activePreset}
                                        cadenceEvaluation={activePresetCadence}
                                        sections={sections}
                                        currentCaseTitle={currentCaseTitle}
                                        onChangeCaseTitle={title =>
                                            setCaseTitleForPreset(activePreset.id, title)
                                        }
                                        presetProgress={presetProgress}
                                        activeItemStates={activeItemStates}
                                        getSectionItemNodes={getSectionItemNodes}
                                        gridColumns={gridColumns}
                                        onChangeGridColumns={setGridColumns}
                                        onExpandAll={handleExpandAll}
                                        onCollapseAll={handleCollapseAll}
                                        onJumpToSection={scrollToSection}
                                        searchQuery={searchQuery}
                                        onChangeSearchQuery={setSearchQuery}
                                        onlyMyResponsibility={onlyMyResponsibility}
                                        onToggleOnlyMyResponsibility={() =>
                                            setOnlyMyResponsibility(prev => !prev)
                                        }
                                        onOpenSaveModal={() => setIsSaveRecordModalOpen(true)}
                                        onResetActivePreset={handleResetActivePreset}
                                        onFocusFastCategoryInput={() => {
                                            fastCategoryInputRef.current?.focus();
                                            fastCategoryInputRef.current?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'center'
                                            });
                                        }}
                                    />
                                </motion.div>

                                {/* Category Cards Grid (1 or 2 Columns) */}
                                {filteredSections.length > 0 && (
                                    <div
                                        className={`grid gap-5 items-start ${
                                            gridColumns === 2
                                                ? 'grid-cols-1 xl:grid-cols-2'
                                                : 'grid-cols-1'
                                        }`}
                                    >
                                        {filteredSections.map((section, secIndex) => (
                                            <motion.div
                                                key={section.id}
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.24,
                                                    delay: Math.min(0.06 + secIndex * 0.035, 0.22),
                                                    ease: [0.16, 1, 0.3, 1]
                                                }}
                                            >
                                                <ChecklistCategory
                                                    section={section}
                                                    secIndex={secIndex}
                                                    totalSections={filteredSections.length}
                                                    activePreset={activePreset}
                                                    currentPresetNodes={currentPresetNodes}
                                                    sectionItems={getSectionItemNodes(section.id)}
                                                    activeItemStates={activeItemStates}
                                                    positionOptions={positionOptions}
                                                    responsibilityOptions={responsibilityOptions}
                                                    users={users}
                                                    isMySection={isUserResponsibleForSection(
                                                        section,
                                                        currentUser
                                                    )}
                                                    isCollapsed={!!collapsedIds[section.id]}
                                                    onToggleCollapse={toggleCollapse}
                                                    onToggleCheckItem={itemId =>
                                                        toggleActiveItem(itemId, activePreset.id)
                                                    }
                                                    onUpdateItemRemark={(itemId, remark) =>
                                                        updateActiveItemRemark(
                                                            itemId,
                                                            activePreset.id,
                                                            remark
                                                        )
                                                    }
                                                    onMoveNodeOrder={moveNodeOrder}
                                                    onUpdateNode={updateNode}
                                                    onDeleteNode={handleDeleteNode}
                                                    onOpenNodeModal={({
                                                        editingNode: targetNode,
                                                        parentId,
                                                        parentTitle,
                                                        defaultType
                                                    }) => {
                                                        setEditingNode(targetNode);
                                                        setNodeModalParentId(parentId);
                                                        setNodeModalParentTitle(parentTitle);
                                                        setNodeModalDefaultType(defaultType);
                                                        setIsNodeModalOpen(true);
                                                    }}
                                                    onQuickAddSingleItem={async (
                                                        parentId,
                                                        title,
                                                        description
                                                    ) => {
                                                        await createNode({
                                                            checklistId: activePreset.id,
                                                            parentId,
                                                            nodeType: 'ITEM',
                                                            title,
                                                            description,
                                                            assignedUserIds: []
                                                        });
                                                    }}
                                                    onBulkCreateItems={async (parentId, items) => {
                                                        await bulkCreateItems(
                                                            activePreset.id,
                                                            parentId,
                                                            items
                                                        );
                                                    }}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Fast Category Builder Bar */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.24,
                                        delay: 0.12,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                >
                                    <ChecklistBuilder
                                        sectionsCount={sections.length}
                                        positionOptions={positionOptions}
                                        inputRef={fastCategoryInputRef}
                                        onCreateCategory={async ({
                                            title,
                                            description,
                                            positionKey
                                        }) => {
                                            await createNode({
                                                checklistId: activePreset.id,
                                                parentId: null,
                                                nodeType: 'SECTION',
                                                title,
                                                description,
                                                positionKey,
                                                assignedUserIds: []
                                            });
                                        }}
                                    />
                                </motion.div>

                                {/* Bottom summary bar if items are checked */}
                                {presetProgress.checked > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="relative overflow-hidden bg-gradient-to-r from-emerald-50/90 via-white/90 to-teal-50/85 backdrop-blur-xl text-slate-900 rounded-[26px] border border-white/95 ring-1 ring-emerald-200/80 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_14px_34px_-12px_rgba(16,185,129,0.14),inset_0_1px_0_0_rgba(255,255,255,0.95)]"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-white/90 flex items-center justify-center shrink-0">
                                                <FileCheck2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-extrabold text-slate-900">
                                                    พร้อมบันทึกผลเช็คลิสต์ ({presetProgress.checked}/
                                                    {presetProgress.total} ข้อ ·{' '}
                                                    <span className="text-emerald-700">
                                                        {presetProgress.percent}%
                                                    </span>
                                                    )
                                                </div>
                                                <div className="text-xs font-medium text-slate-600 mt-0.5 tabular-nums">
                                                    ผู้ร่วมติ๊ก:{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {presetProgress.checkers
                                                            .map(c => c.name)
                                                            .join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsSaveRecordModalOpen(true)}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs sm:text-sm font-bold transition-all shadow-[0_6px_16px_-4px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] whitespace-nowrap cursor-pointer"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>ตกลง · บันทึกผลการเช็คเข้าประวัติ</span>
                                        </button>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="saved-records-tab"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
                        }}
                        exit={{
                            opacity: 0,
                            y: -8,
                            transition: { duration: 0.14, ease: 'easeIn' }
                        }}
                    >
                        <ChecklistSavedRecordsTab
                            checklists={checklists}
                            nodes={nodes}
                            activeItemStates={activeItemStates}
                            savedRecords={savedRecords}
                            expandedRecordId={expandedRecordId}
                            onToggleExpandRecord={setExpandedRecordId}
                            onDeleteRecord={handleDeleteSavedRecord}
                            getPositionLabel={getPositionLabel}
                            getResponsibilityLabel={getResponsibilityLabel}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 5. Modals */}
            <ChecklistBoardModal
                isOpen={isBoardModalOpen}
                onClose={() => {
                    setIsBoardModalOpen(false);
                    setEditingBoard(null);
                }}
                editingBoard={editingBoard}
                onSave={async payload => {
                    if (editingBoard) {
                        await updateChecklistBoard(editingBoard.id, payload);
                    } else {
                        const created = await createChecklistBoard(payload);
                        if (created) {
                            setSelectedPresetId(created.id);
                        }
                    }
                }}
            />

            {activePreset && (
                <ChecklistNodeModal
                    isOpen={isNodeModalOpen}
                    onClose={() => {
                        setIsNodeModalOpen(false);
                        setEditingNode(null);
                    }}
                    checklistId={activePreset.id}
                    parentId={nodeModalParentId}
                    parentTitle={nodeModalParentTitle}
                    defaultNodeType={nodeModalDefaultType}
                    editingNode={editingNode}
                    positionOptions={positionOptions}
                    responsibilityOptions={responsibilityOptions}
                    users={users}
                    onSave={async payload => {
                        if (editingNode) {
                            await updateNode(editingNode.id, payload);
                        } else {
                            await createNode(payload);
                        }
                    }}
                />
            )}

                {activePreset && (
                    <SaveChecklistRecordModal
                        isOpen={isSaveRecordModalOpen}
                        onClose={() => setIsSaveRecordModalOpen(false)}
                        preset={activePreset}
                        sections={sections}
                        getSectionItemNodes={getSectionItemNodes}
                        activeItemStates={activeItemStates}
                        initialCaseTitle={currentCaseTitle}
                        users={users}
                        currentUser={currentUser}
                        onConfirmSave={handleConfirmSaveRecord}
                    />
                )}
            </div>
        </CompanyChecklistBackground>
    );
};

export default CompanyChecklistView;
