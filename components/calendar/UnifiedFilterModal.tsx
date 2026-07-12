import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import { Channel, ChipConfig } from '../../types';
import { MasterOption } from '../../types/task';

// Modular component imports
import FilterTabHeader, { TabType } from './parts/FilterTabHeader';
import ChannelFilterGrid from './parts/ChannelFilterGrid';
import FormatFilterGrid from './parts/FormatFilterGrid';
import StatusFilterGrid from './parts/StatusFilterGrid';
import FilterFooter from './parts/FilterFooter';

interface UnifiedFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    channels: Channel[];
    masterOptions: MasterOption[];
    
    // Selected states
    selectedChannelIds: string[];
    selectedFormats: string[];
    selectedStatuses: string[];
    
    // Apply callback
    onApplyFilters: (filters: {
        channelIds: string[];
        formats: string[];
        statuses: string[];
    }) => void;

    // Pinning Support
    customChips?: ChipConfig[];
    onSaveChip?: (chip: ChipConfig) => void;
    onDeleteChip?: (id: string) => void;
}

const UnifiedFilterModal: React.FC<UnifiedFilterModalProps> = ({
    isOpen,
    onClose,
    channels = [],
    masterOptions = [],
    selectedChannelIds = [],
    selectedFormats = [],
    selectedStatuses = [],
    onApplyFilters,
    customChips = [],
    onSaveChip,
    onDeleteChip
}) => {
    // Current active tab
    const [activeTab, setActiveTab] = useState<TabType>('CHANNELS');

    // Temporary selections for each category (committed on Confirm)
    const [tempChannelIds, setTempChannelIds] = useState<string[]>([]);
    const [tempFormats, setTempFormats] = useState<string[]>([]);
    const [tempStatuses, setTempStatuses] = useState<string[]>([]);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempChannelIds(selectedChannelIds);
            setTempFormats(selectedFormats);
            setTempStatuses(selectedStatuses);
        }
    }, [isOpen, selectedChannelIds, selectedFormats, selectedStatuses]);

    // Filter master options for active formats and statuses
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive);

    // Toggle handlers
    const toggleChannel = (id: string) => {
        setTempChannelIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleFormat = (key: string) => {
        setTempFormats(prev => 
            prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
        );
    };

    const toggleStatus = (key: string) => {
        setTempStatuses(prev => 
            prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
        );
    };

    // Bulk selection actions for current active tab
    const handleSelectAllCurrent = () => {
        if (activeTab === 'CHANNELS') {
            setTempChannelIds(channels.map(c => c.id));
        } else if (activeTab === 'FORMATS') {
            setTempFormats(formatOptions.map(o => o.key));
        } else if (activeTab === 'STATUSES') {
            setTempStatuses(statusOptions.map(o => o.key));
        }
    };

    const handleClearAllCurrent = () => {
        if (activeTab === 'CHANNELS') {
            setTempChannelIds([]);
        } else if (activeTab === 'FORMATS') {
            setTempFormats([]);
        } else if (activeTab === 'STATUSES') {
            setTempStatuses([]);
        }
    };

    const handleResetAll = () => {
        setTempChannelIds([]);
        setTempFormats([]);
        setTempStatuses([]);
    };

    const handleConfirm = () => {
        onApplyFilters({
            channelIds: tempChannelIds,
            formats: tempFormats,
            statuses: tempStatuses
        });
        onClose();
    };

    const totalSelectedCount = tempChannelIds.length + tempFormats.length + tempStatuses.length;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div id="unified-filter-portal" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Elegant off-white/beige glass backdrop with rich blur */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
                    />

                    {/* Modal Container Card - Earth tone & Warm white theme */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="relative w-full max-w-4xl h-[640px] max-h-[85vh] bg-stone-50 border border-stone-200 rounded-3xl shadow-[0_20px_60px_rgba(28,25,23,0.12)] overflow-hidden flex flex-col"
                    >
                        {/* Header Section */}
                        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-white sticky top-0 z-10 shadow-[0_1px_3px_rgba(28,25,23,0.02)]">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-stone-100 text-stone-700 rounded-xl border border-stone-200">
                                    <SlidersHorizontal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                                        ตัวกรองข้อมูลแบบละเอียด
                                        {totalSelectedCount > 0 && (
                                            <span className="text-xs bg-stone-800 text-stone-100 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                                                เลือก {totalSelectedCount} รายการ
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        คัดกรองงานบนปฏิทินด้วยช่องรายการ รูปแบบเนื้อหา และสถานะความคืบหน้า
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tab Controller */}
                        <FilterTabHeader
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            tempChannelIdsCount={tempChannelIds.length}
                            tempFormatsCount={tempFormats.length}
                            tempStatusesCount={tempStatuses.length}
                            handleSelectAllCurrent={handleSelectAllCurrent}
                            handleClearAllCurrent={handleClearAllCurrent}
                        />

                        {/* Filter Options Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-100/30 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {/* Channels Grid */}
                                {activeTab === 'CHANNELS' && (
                                    <ChannelFilterGrid
                                        key="channels"
                                        channels={channels}
                                        tempChannelIds={tempChannelIds}
                                        toggleChannel={toggleChannel}
                                        customChips={customChips}
                                        onSaveChip={onSaveChip}
                                        onDeleteChip={onDeleteChip}
                                    />
                                )}

                                {/* Content Formats Grid */}
                                {activeTab === 'FORMATS' && (
                                    <FormatFilterGrid
                                        key="formats"
                                        formatOptions={formatOptions}
                                        tempFormats={tempFormats}
                                        toggleFormat={toggleFormat}
                                        customChips={customChips}
                                        onSaveChip={onSaveChip}
                                        onDeleteChip={onDeleteChip}
                                    />
                                )}

                                {/* Statuses Grid */}
                                {activeTab === 'STATUSES' && (
                                    <StatusFilterGrid
                                        key="statuses"
                                        statusOptions={statusOptions}
                                        tempStatuses={tempStatuses}
                                        toggleStatus={toggleStatus}
                                        customChips={customChips}
                                        onSaveChip={onSaveChip}
                                        onDeleteChip={onDeleteChip}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Controls */}
                        <FilterFooter
                            totalSelectedCount={totalSelectedCount}
                            handleResetAll={handleResetAll}
                            onClose={onClose}
                            handleConfirm={handleConfirm}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default UnifiedFilterModal;
