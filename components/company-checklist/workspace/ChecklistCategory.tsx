import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown,
    UserCheck,
    ArrowUp,
    ArrowDown,
    Edit3,
    Trash2,
    Briefcase,
    Users,
    FolderTree,
    CheckCircle2
} from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    MasterOption,
    User,
    ChecklistNodeType
} from '../../../types';
import { ChecklistItem } from './ChecklistItem';
import { ChecklistInlineItemBuilder } from './ChecklistBuilder';
import { getSectionPastelTheme } from '../utils/sectionPastelThemes';

export interface ChecklistCategoryProps {
    section: CompanyChecklistNode;
    secIndex: number;
    totalSections: number;
    activePreset: CompanyChecklist;
    currentPresetNodes: CompanyChecklistNode[];
    sectionItems: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    positionOptions: MasterOption[];
    responsibilityOptions: MasterOption[];
    users: User[];
    isMySection: boolean;
    isCollapsed: boolean;
    onToggleCollapse: (sectionId: string) => void;
    onToggleCheckItem: (itemId: string) => void;
    onUpdateItemRemark: (itemId: string, remark: string) => void;
    onMoveNodeOrder: (nodeId: string, direction: 'UP' | 'DOWN') => void;
    onUpdateNode: (nodeId: string, updates: Partial<CompanyChecklistNode>) => Promise<void>;
    onDeleteNode: (node: CompanyChecklistNode) => void;
    onOpenNodeModal: (params: {
        editingNode: CompanyChecklistNode | null;
        parentId: string | null;
        parentTitle?: string;
        defaultType: ChecklistNodeType;
    }) => void;
    onQuickAddSingleItem: (parentId: string, title: string, description: string) => Promise<void>;
    onBulkCreateItems: (
        parentId: string,
        items: { title: string; description: string }[]
    ) => Promise<void>;
}

export const ChecklistCategory: React.FC<ChecklistCategoryProps> = ({
    section,
    secIndex,
    totalSections,
    activePreset,
    currentPresetNodes,
    sectionItems,
    activeItemStates,
    positionOptions,
    responsibilityOptions,
    users,
    isMySection,
    isCollapsed,
    onToggleCollapse,
    onToggleCheckItem,
    onUpdateItemRemark,
    onMoveNodeOrder,
    onUpdateNode,
    onDeleteNode,
    onOpenNodeModal,
    onQuickAddSingleItem,
    onBulkCreateItems
}) => {
    const [editingRemarkItemId, setEditingRemarkItemId] = useState<string | null>(null);

    const checkedCount = sectionItems.filter(i => !!activeItemStates[i.id]?.isChecked).length;
    const totalCount = sectionItems.length;
    const isAllDone = totalCount > 0 && checkedCount === totalCount;
    const sectionPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    // 6-Pastel Theme Cycling (automatically shifts to Mint Emerald when 100% completed)
    const theme = getSectionPastelTheme(secIndex, isAllDone);

    const assignedUsers = users.filter(u => section.assignedUserIds?.includes(u.id));

    const directSubgroups = currentPresetNodes
        .filter(n => n.parentId === section.id && n.nodeType === 'SUBGROUP')
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const directItems = currentPresetNodes
        .filter(n => n.parentId === section.id && n.nodeType === 'ITEM')
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const sectionFilteredResps = section.positionKey
        ? responsibilityOptions.filter(
              r => !r.parentKey || r.parentKey === section.positionKey
          )
        : responsibilityOptions;

    return (
        <div
            id={`chk-section-${section.id}`}
            className={`relative bg-white/80 backdrop-blur-xl rounded-[26px] border overflow-hidden scroll-mt-6 transition-all duration-300 shadow-[0_14px_34px_-12px_rgba(15,23,42,0.07),inset_0_1px_0_0_rgba(255,255,255,0.95)] ${theme.cardBorder}`}
        >
            {/* Top Specular Glass Edge */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-95 z-20"
            />

            {/* Category Header — Pastel Gradient Glass */}
            <div className={`relative px-5 py-4 ${theme.headerGradient} space-y-3 overflow-hidden`}>
                {/* Soft Pastel Ambient Orb */}
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -top-12 -right-10 w-36 h-36 rounded-full blur-2xl ${theme.ambientOrb}`}
                />

                <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <button
                            type="button"
                            onClick={() => onToggleCollapse(section.id)}
                            className="mt-0.5 w-7 h-7 rounded-xl bg-white/80 hover:bg-white border border-white/90 shadow-2xs text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shrink-0"
                            title={isCollapsed ? 'ขยายหมวดหมู่นี้' : 'ย่อหมวดหมู่นี้'}
                        >
                            <motion.span
                                initial={false}
                                animate={{ rotate: isCollapsed ? -90 : 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="inline-flex items-center justify-center"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </motion.span>
                        </button>

                        {/* 3D Squircle Section Index Badge (#1, #2, ...) */}
                        <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold tabular-nums shrink-0 ${theme.squircleBadge}`}
                        >
                            #{secIndex + 1}
                        </span>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    {section.title}
                                </h3>
                                <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-xl tabular-nums ${theme.countBadge}`}
                                >
                                    {isAllDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                    <span>
                                        {checkedCount}/{totalCount} ข้อ
                                    </span>
                                </span>
                                {isMySection && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-gradient-to-r from-indigo-50/95 to-violet-50/95 text-indigo-700 text-[11px] font-bold border border-indigo-200/85 shadow-2xs">
                                        <UserCheck className="w-3 h-3" />
                                        <span>หมวดที่คุณดูแล</span>
                                    </span>
                                )}
                            </div>

                            {section.description && (
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {section.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Category Reorder / Edit / Delete Controls */}
                    <div className="flex items-center gap-1 shrink-0 bg-white/65 backdrop-blur-md p-1 rounded-xl border border-white/90 shadow-2xs">
                        {secIndex > 0 && (
                            <button
                                type="button"
                                onClick={() => onMoveNodeOrder(section.id, 'UP')}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white/90 rounded-lg transition-colors cursor-pointer"
                                title="เลื่อนหมวดขึ้น"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {secIndex < totalSections - 1 && (
                            <button
                                type="button"
                                onClick={() => onMoveNodeOrder(section.id, 'DOWN')}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white/90 rounded-lg transition-colors cursor-pointer"
                                title="เลื่อนหมวดลง"
                            >
                                <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() =>
                                onOpenNodeModal({
                                    editingNode: section,
                                    parentId: null,
                                    parentTitle: activePreset.title,
                                    defaultType: 'SECTION'
                                })
                            }
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/90 rounded-lg transition-colors cursor-pointer"
                            title="ตั้งค่าหมวดหมู่ / ระบุรายบุคคล"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteNode(section)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/90 rounded-lg transition-colors cursor-pointer"
                            title="ลบหมวดหมู่นี้"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Mini 3D Pastel Progress Strip */}
                {totalCount > 0 && (
                    <div className="relative z-10 flex items-center gap-2.5 pt-0.5">
                        <div
                            className={`flex-1 h-1.5 rounded-full overflow-hidden shadow-[inset_0_1px_1px_rgba(15,23,42,0.06)] ${theme.progressTrack}`}
                        >
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${theme.progressBar}`}
                                style={{ width: `${sectionPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tabular-nums shrink-0">
                            {sectionPercent}%
                        </span>
                    </div>
                )}

                {/* INLINE POSITION & RESPONSIBILITY SYNC BAR — Frosted Glass Pills */}
                <div
                    className={`relative z-10 flex flex-wrap items-center gap-2 pt-2.5 border-t ${theme.syncBarBorder} text-xs`}
                >
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                        <Briefcase className={`w-3.5 h-3.5 ${theme.syncIconText}`} />
                        <span>ซิงก์ผู้รับผิดชอบ:</span>
                    </span>

                    <select
                        value={section.positionKey || ''}
                        onChange={e => {
                            const nextPos = e.target.value || undefined;
                            onUpdateNode(section.id, { positionKey: nextPos });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-white/80 hover:bg-white backdrop-blur-md border border-white/95 ring-1 ring-slate-200/75 hover:ring-slate-300 rounded-xl text-slate-800 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none focus:ring-slate-900 transition-all cursor-pointer"
                    >
                        <option value="">-- ทุกตำแหน่ง --</option>
                        {positionOptions.map(pos => (
                            <option key={pos.id} value={pos.key}>
                                ตำแหน่ง: {pos.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={section.responsibilityKey || ''}
                        onChange={e => {
                            const nextResp = e.target.value || undefined;
                            const found = responsibilityOptions.find(r => r.key === nextResp);
                            onUpdateNode(section.id, {
                                responsibilityKey: nextResp,
                                ...(found?.parentKey && !section.positionKey
                                    ? { positionKey: found.parentKey }
                                    : {})
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-white/80 hover:bg-white backdrop-blur-md border border-white/95 ring-1 ring-slate-200/75 hover:ring-slate-300 rounded-xl text-slate-800 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] focus:outline-none focus:ring-slate-900 transition-all cursor-pointer"
                    >
                        <option value="">-- ไม่ระบุหน้าที่ย่อย --</option>
                        {sectionFilteredResps.map(resp => (
                            <option key={resp.id} value={resp.key}>
                                หน้าที่: {resp.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() =>
                            onOpenNodeModal({
                                editingNode: section,
                                parentId: null,
                                parentTitle: activePreset.title,
                                defaultType: 'SECTION'
                            })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white backdrop-blur-md border border-white/95 ring-1 ring-slate-200/75 hover:ring-slate-300 text-slate-700 hover:text-slate-900 font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] transition-all cursor-pointer"
                    >
                        <Users className={`w-3.5 h-3.5 ${theme.syncIconText}`} />
                        <span>
                            {assignedUsers.length > 0
                                ? `รายบุคคล: ${assignedUsers.map(u => u.name).join(', ')}`
                                : '+ ระบุรายบุคคล'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Category Body — Smooth Framer Motion Slide Collapse / Expand */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        key={`category-body-${section.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                                height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.2, delay: 0.04, ease: 'easeOut' }
                            }
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
                                opacity: { duration: 0.14, ease: 'easeIn' }
                            }
                        }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 space-y-4 bg-gradient-to-b from-white/50 to-white/80">
                            {/* Direct Items */}
                            {directItems.length > 0 && (
                                <div className="space-y-2.5">
                                    {directItems.map((item, idx) => (
                                        <ChecklistItem
                                            key={item.id}
                                            item={item}
                                            itemIndex={idx}
                                            totalSiblings={directItems.length}
                                            activeState={activeItemStates[item.id]}
                                            isEditingRemark={editingRemarkItemId === item.id}
                                            onToggleCheck={onToggleCheckItem}
                                            onToggleEditRemark={setEditingRemarkItemId}
                                            onChangeRemark={onUpdateItemRemark}
                                            onMoveOrder={onMoveNodeOrder}
                                            onEditItem={it =>
                                                onOpenNodeModal({
                                                    editingNode: it,
                                                    parentId: it.parentId,
                                                    parentTitle: section.title,
                                                    defaultType: 'ITEM'
                                                })
                                            }
                                            onDeleteItem={onDeleteNode}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Level 2 Subgroups — Pastel Inset Glass Tray */}
                            {directSubgroups.map(sub => {
                                const subItems = currentPresetNodes
                                    .filter(n => n.parentId === sub.id && n.nodeType === 'ITEM')
                                    .sort((a, b) => a.sortOrder - b.sortOrder);
                                const subChecked = subItems.filter(
                                    i => !!activeItemStates[i.id]?.isChecked
                                ).length;

                                return (
                                    <div
                                        key={sub.id}
                                        className={`rounded-2xl border p-4 space-y-3 ${theme.subgroupTray}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-xl bg-white/90 border border-white shadow-2xs flex items-center justify-center shrink-0">
                                                    <FolderTree className={`w-3.5 h-3.5 ${theme.syncIconText}`} />
                                                </span>
                                                <h4 className="text-sm font-bold text-slate-800">
                                                    {sub.title}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tabular-nums ${theme.countBadge}`}>
                                                    {subChecked}/{subItems.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onOpenNodeModal({
                                                            editingNode: null,
                                                            parentId: sub.id,
                                                            parentTitle: `${section.title} > ${sub.title}`,
                                                            defaultType: 'ITEM'
                                                        })
                                                    }
                                                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 bg-white/85 hover:bg-white border border-white/95 ring-1 ring-slate-200/75 rounded-xl shadow-2xs transition-all cursor-pointer"
                                                >
                                                    + เพิ่มข้อเช็ค
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteNode(sub)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
                                                    title="ลบกลุ่มย่อยนี้"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            {subItems.map((item, idx) => (
                                                <ChecklistItem
                                                    key={item.id}
                                                    item={item}
                                                    itemIndex={idx}
                                                    totalSiblings={subItems.length}
                                                    activeState={activeItemStates[item.id]}
                                                    isEditingRemark={editingRemarkItemId === item.id}
                                                    onToggleCheck={onToggleCheckItem}
                                                    onToggleEditRemark={setEditingRemarkItemId}
                                                    onChangeRemark={onUpdateItemRemark}
                                                    onMoveOrder={onMoveNodeOrder}
                                                    onEditItem={it =>
                                                        onOpenNodeModal({
                                                            editingNode: it,
                                                            parentId: it.parentId,
                                                            parentTitle: `${section.title} > ${sub.title}`,
                                                            defaultType: 'ITEM'
                                                        })
                                                    }
                                                    onDeleteItem={onDeleteNode}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Fast Inline Item & Multi-line Bulk Paste Builder */}
                            <ChecklistInlineItemBuilder
                                sectionId={section.id}
                                onQuickAddSingleItem={onQuickAddSingleItem}
                                onBulkCreateItems={onBulkCreateItems}
                                onOpenAddSubgroup={() =>
                                    onOpenNodeModal({
                                        editingNode: null,
                                        parentId: section.id,
                                        parentTitle: section.title,
                                        defaultType: 'SUBGROUP'
                                    })
                                }
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const ChecklistCategoryCard = ChecklistCategory;
