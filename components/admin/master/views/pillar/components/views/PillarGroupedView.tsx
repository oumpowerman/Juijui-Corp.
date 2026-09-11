import React, { useState, useEffect } from 'react';
import { Globe, Plus, ChevronDown, Layers, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption, Channel, ChannelGroup, StatusFilterType } from '../../types';
import { PillarCard } from '../common/PillarCard';
import { Pagination } from '../common/Pagination';
import { PILLAR_ITEMS_PER_PAGE } from '../../pillarConstants';

interface PillarGroupedViewProps {
    filteredGlobalPillars: MasterOption[];
    filteredChannels: Channel[];
    expandedChannelIds: Set<string>;
    toggleChannelExpand: (channelId: string) => void;
    handleOpenCreatePillar: (channelId?: string) => void;
    categoriesByPillarKey: Map<string, MasterOption[]>;
    pillarsByChannelId: Map<string, MasterOption[]>;
    statusFilter: StatusFilterType;
    searchQuery: string;
    channelGroups: ChannelGroup[];
    // PillarCard actions
    onToggleActive: (pillar: MasterOption) => void;
    onOpenEditPillar: (pillar: MasterOption) => void;
    onDeleteOption: (option: MasterOption) => void;
    onOpenEditCategory: (cat: MasterOption) => void;
    activeInlinePillarKey: string | null;
    inlineCategoryInputs: Record<string, string>;
    onStartInlineAdd: (pillarKey: string) => void;
    onCancelInlineAdd: () => void;
    onInputChange: (val: string) => void;
    onInlineSubmit: (pillar: MasterOption) => void;
}

export const PillarGroupedView: React.FC<PillarGroupedViewProps> = ({
    filteredGlobalPillars,
    filteredChannels,
    expandedChannelIds,
    toggleChannelExpand,
    handleOpenCreatePillar,
    categoriesByPillarKey,
    pillarsByChannelId,
    statusFilter,
    searchQuery,
    channelGroups,
    onToggleActive,
    onOpenEditPillar,
    onDeleteOption,
    onOpenEditCategory,
    activeInlinePillarKey,
    inlineCategoryInputs,
    onStartInlineAdd,
    onCancelInlineAdd,
    onInputChange,
    onInlineSubmit
}) => {
    // Pagination: 5 channels per page
    const ITEMS_PER_PAGE = PILLAR_ITEMS_PER_PAGE;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredChannels.length, totalPages, currentPage]);

    const paginatedChannels = filteredChannels.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    return (
        <div className="space-y-4">
            
            {/* GLOBAL / SHARED SECTION */}
            {filteredGlobalPillars.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden transition-all">
                    <div 
                        onClick={() => toggleChannelExpand('GLOBAL')}
                        className="px-5 py-4 bg-gradient-to-r from-amber-50/70 to-orange-50/40 border-b border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-colors select-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-800 text-base">🌐 Global / Shared (หมวดหมู่ส่วนกลาง)</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                        ใช้ร่วมกันทุกช่อง
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">Pillars และ Categories ที่ไม่ได้ผูกกับช่องเฉพาะเจาะจง</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-700 shadow-xs">
                                {filteredGlobalPillars.length} Pillars
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCreatePillar('');
                                }}
                                className="text-xs bg-amber-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-amber-700 transition-colors flex items-center gap-1 shadow-xs"
                            >
                                <Plus className="w-3 h-3" /> เพิ่ม Pillar ส่วนกลาง
                            </button>
                            <motion.div 
                                animate={{ rotate: expandedChannelIds.has('GLOBAL') ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-7 h-7 rounded-lg bg-white/80 border border-amber-200 flex items-center justify-center text-amber-700"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </motion.div>
                        </div>
                    </div>

                    <AnimatePresence initial={false}>
                        {expandedChannelIds.has('GLOBAL') && (
                            <motion.div
                                key="global-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="p-5 bg-amber-50/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredGlobalPillars.map(pillar => {
                                            const categories = categoriesByPillarKey.get(pillar.key) || [];
                                            return (
                                                <PillarCard 
                                                    key={pillar.id}
                                                    pillar={pillar}
                                                    categories={categories}
                                                    channel={null}
                                                    isInlineAdding={activeInlinePillarKey === pillar.key}
                                                    currentInput={inlineCategoryInputs[pillar.key] || ''}
                                                    onToggleActive={onToggleActive}
                                                    onOpenEditPillar={onOpenEditPillar}
                                                    onDeleteOption={onDeleteOption}
                                                    onOpenEditCategory={onOpenEditCategory}
                                                    onStartInlineAdd={onStartInlineAdd}
                                                    onCancelInlineAdd={onCancelInlineAdd}
                                                    onInputChange={onInputChange}
                                                    onInlineSubmit={() => onInlineSubmit(pillar)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* EMPTY STATE */}
            {filteredChannels.length === 0 && filteredGlobalPillars.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-700 text-base">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</h4>
                    <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองด้านบนใหม่อีกครั้ง</p>
                </div>
            )}

            {/* CHANNEL CARDS LIST (PAGINATED 5 PER PAGE WITH SLIDE TRANSITION) */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`channels-page-${currentPage}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="space-y-4"
                >
                    {paginatedChannels.map(channel => {
                const channelPillars = (pillarsByChannelId.get(channel.id) || [])
                    .filter(p => {
                        if (statusFilter === 'ACTIVE' && !p.isActive) return false;
                        if (statusFilter === 'INACTIVE' && p.isActive) return false;
                        if (searchQuery.trim()) {
                            const q = searchQuery.toLowerCase();
                            const matchesPillar = p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
                            const cats = categoriesByPillarKey.get(p.key) || [];
                            const matchesCat = cats.some(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
                            return matchesPillar || matchesCat || channel.name.toLowerCase().includes(q);
                        }
                        return true;
                    });

                const totalChannelCategories = channelPillars.reduce((acc, p) => {
                    return acc + (categoriesByPillarKey.get(p.key)?.length || 0);
                }, 0);

                const isExpanded = expandedChannelIds.has(channel.id);
                const groupInfo = channelGroups.find(g => g.id === channel.group_id);

                return (
                    <div 
                        key={channel.id}
                        className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                            isExpanded ? 'border-indigo-200 ring-1 ring-indigo-500/10' : 'border-gray-200 hover:border-indigo-200'
                        }`}
                    >
                        {/* Accordion Header */}
                        <div
                            onClick={() => toggleChannelExpand(channel.id)}
                            className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                                isExpanded ? 'bg-indigo-50/40 border-b border-indigo-100' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                {channel.logoUrl ? (
                                    <img 
                                        src={channel.logoUrl} 
                                        alt={channel.name} 
                                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-xs shrink-0" 
                                    />
                                ) : (
                                    <div className={`w-10 h-10 rounded-xl ${channel.color || 'bg-indigo-600'} text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0`}>
                                        {channel.name.slice(0, 2).toUpperCase()}
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-gray-800 text-base">{channel.name}</h4>
                                        {groupInfo && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${groupInfo.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                {groupInfo.name}
                                            </span>
                                        )}
                                        {channel.platforms && channel.platforms.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                {channel.platforms.map(p => (
                                                    <span key={p} className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {channel.description && (
                                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{channel.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {channelPillars.length} Pillars
                                    </span>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                                        {totalChannelCategories} Categories
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCreatePillar(channel.id);
                                    }}
                                    className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>เพิ่ม Pillar</span>
                                </button>

                                <motion.div 
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-8 h-8 rounded-xl bg-gray-100/80 border border-gray-200 flex items-center justify-center text-gray-500"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Accordion Content */}
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div
                                    key={`content-${channel.id}`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-5 bg-gray-50/50 border-t border-gray-100">
                                        {channelPillars.length === 0 ? (
                                            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
                                                <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-gray-500">ช่องนี้ยังไม่มี Pillar (แกนเนื้อหา)</p>
                                                <p className="text-xs text-gray-400 mt-1 mb-4">สร้าง Pillar แรกเพื่อจัดหมวดหมู่งานและคลิปของช่องนี้</p>
                                                <button
                                                    onClick={() => handleOpenCreatePillar(channel.id)}
                                                    className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-4 h-4" /> เพิ่ม Pillar แรกในช่องนี้
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {channelPillars.map(pillar => {
                                                    const categories = categoriesByPillarKey.get(pillar.key) || [];
                                                    return (
                                                        <PillarCard 
                                                            key={pillar.id}
                                                            pillar={pillar}
                                                            categories={categories}
                                                            channel={channel}
                                                            isInlineAdding={activeInlinePillarKey === pillar.key}
                                                            currentInput={inlineCategoryInputs[pillar.key] || ''}
                                                            onToggleActive={onToggleActive}
                                                            onOpenEditPillar={onOpenEditPillar}
                                                            onDeleteOption={onDeleteOption}
                                                            onOpenEditCategory={onOpenEditCategory}
                                                            onStartInlineAdd={onStartInlineAdd}
                                                            onCancelInlineAdd={onCancelInlineAdd}
                                                            onInputChange={onInputChange}
                                                            onInlineSubmit={() => onInlineSubmit(pillar)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
                </motion.div>
            </AnimatePresence>

            {/* Pagination Controls */}
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                totalItems={filteredChannels.length}
                itemsPerPage={ITEMS_PER_PAGE}
            />
        </div>
    );
};
export default PillarGroupedView;
