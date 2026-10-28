import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { X, SlidersHorizontal, Pin } from 'lucide-react';
import { Channel, ChipConfig, User } from '../../types';
import { MasterOption } from '../../types/task';

// Modular component imports
import FilterTabHeader, { TabType } from './parts/FilterTabHeader';
import ChannelFilterGrid from './parts/ChannelFilterGrid';
import FormatFilterGrid from './parts/FormatFilterGrid';
import StatusFilterGrid from './parts/StatusFilterGrid';
import AssigneeFilterGrid from './parts/AssigneeFilterGrid';
import FilterFooter from './parts/FilterFooter';

interface UnifiedFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    channels: Channel[];
    masterOptions: MasterOption[];
    users?: User[];
    
    // Selected states
    selectedChannelIds: string[];
    selectedFormats: string[];
    selectedStatuses: string[];
    selectedAssigneeIds?: string[];
    
    // Initial tab focus
    initialTab?: TabType;
    viewMode?: 'CONTENT' | 'TASK' | 'PLAN';
    taskCountsByUser?: Record<string, number>;
    
    // Apply callback
    onApplyFilters: (filters: {
        channelIds: string[];
        formats: string[];
        statuses: string[];
        assigneeIds?: string[];
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
    users = [],
    selectedChannelIds = [],
    selectedFormats = [],
    selectedStatuses = [],
    selectedAssigneeIds = [],
    initialTab,
    viewMode = 'CONTENT',
    taskCountsByUser = {},
    onApplyFilters,
    customChips = [],
    onSaveChip,
    onDeleteChip
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Current active tab
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || (viewMode === 'TASK' ? 'ASSIGNEES' : 'CHANNELS'));

    // Temporary selections for each category (committed on Confirm)
    const [tempChannelIds, setTempChannelIds] = useState<string[]>([]);
    const [tempFormats, setTempFormats] = useState<string[]>([]);
    const [tempStatuses, setTempStatuses] = useState<string[]>([]);
    const [tempAssigneeIds, setTempAssigneeIds] = useState<string[]>([]);

    // Pinning Feedback Toast State
    const [pinToast, setPinToast] = useState<{ message: string; isPin: boolean } | null>(null);
    const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNotifyPin = (label: string, isPin: boolean) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setPinToast({
            message: isPin ? `ปักหมุด "${label}" ลงแถบด่วนแล้ว` : `ถอนการปักหมุด "${label}" เรียบร้อยแล้ว`,
            isPin
        });
        toastTimerRef.current = setTimeout(() => {
            setPinToast(null);
        }, 2200);
    };

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempChannelIds(selectedChannelIds);
            setTempFormats(selectedFormats);
            setTempStatuses(selectedStatuses);
            setTempAssigneeIds(selectedAssigneeIds);
            if (initialTab) {
                setActiveTab(initialTab);
            } else if (viewMode === 'TASK') {
                setActiveTab('ASSIGNEES');
            }
        }
    }, [isOpen, selectedChannelIds, selectedFormats, selectedStatuses, selectedAssigneeIds, initialTab, viewMode]);

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

    const toggleAssignee = (userId: string) => {
        setTempAssigneeIds(prev =>
            prev.includes(userId) ? prev.filter(x => x !== userId) : [...prev, userId]
        );
    };

    // Bulk selection actions for current active tab
    const handleSelectAllCurrent = () => {
        if (activeTab === 'ASSIGNEES') {
            setTempAssigneeIds(users.map(u => u.id));
        } else if (activeTab === 'CHANNELS') {
            setTempChannelIds(channels.map(c => c.id));
        } else if (activeTab === 'FORMATS') {
            setTempFormats(formatOptions.map(o => o.key));
        } else if (activeTab === 'STATUSES') {
            setTempStatuses(statusOptions.map(o => o.key));
        }
    };

    const handleClearAllCurrent = () => {
        if (activeTab === 'ASSIGNEES') {
            setTempAssigneeIds([]);
        } else if (activeTab === 'CHANNELS') {
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
        setTempAssigneeIds([]);
    };

    const handleConfirm = () => {
        onApplyFilters({
            channelIds: tempChannelIds,
            formats: tempFormats,
            statuses: tempStatuses,
            assigneeIds: tempAssigneeIds
        });

        // Sync channel filtering with URL Query Parameters
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (tempChannelIds.length === 1) {
                next.set('channelId', tempChannelIds[0]);
                next.delete('channel');
            } else if (tempChannelIds.length > 1) {
                next.set('channelId', tempChannelIds.join(','));
                next.delete('channel');
            } else {
                next.delete('channelId');
                next.delete('channel');
            }
            return next;
        }, { replace: true });

        onClose();
    };

    const totalSelectedCount = tempChannelIds.length + tempFormats.length + tempStatuses.length + tempAssigneeIds.length;

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
                        className="relative w-full max-w-4xl h-[660px] max-h-[88vh] bg-stone-50 border border-stone-200 rounded-3xl shadow-[0_20px_60px_rgba(28,25,23,0.12)] overflow-hidden flex flex-col"
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
                                        คัดกรองงานด้วยผู้รับผิดชอบ, ช่องรายการ, รูปแบบเนื้อหา และสถานะ
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
                            tempAssigneesCount={tempAssigneeIds.length}
                            handleSelectAllCurrent={handleSelectAllCurrent}
                            handleClearAllCurrent={handleClearAllCurrent}
                            viewMode={viewMode}
                            customChips={customChips}
                        />

                        {/* Filter Options Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-100/30 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {/* Assignees Grid */}
                                {activeTab === 'ASSIGNEES' && (
                                    <AssigneeFilterGrid
                                        key="assignees"
                                        users={users}
                                        selectedAssigneeIds={tempAssigneeIds}
                                        toggleAssignee={toggleAssignee}
                                        taskCountsByUser={taskCountsByUser}
                                        customChips={customChips}
                                        onSaveChip={onSaveChip}
                                        onDeleteChip={onDeleteChip}
                                        onNotifyPin={handleNotifyPin}
                                    />
                                )}

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
                                        onNotifyPin={handleNotifyPin}
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
                                        onNotifyPin={handleNotifyPin}
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
                                        onNotifyPin={handleNotifyPin}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Center Floating Toast for Pin Feedback */}
                        <AnimatePresence>
                            {pinToast && (
                                <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.65, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.88, y: -8 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.8 }}
                                        className={`px-5 py-2.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 select-none backdrop-blur-md ${
                                            pinToast.isPin
                                                ? 'bg-amber-500/95 text-white border-amber-300 shadow-amber-500/30 ring-4 ring-amber-400/20'
                                                : 'bg-stone-900/95 text-stone-100 border-stone-700 shadow-stone-950/40 ring-4 ring-stone-800/20'
                                        }`}
                                    >
                                        <div className={`p-1 rounded-lg ${pinToast.isPin ? 'bg-amber-600/60' : 'bg-stone-800'}`}>
                                            <Pin className={`w-3.5 h-3.5 ${pinToast.isPin ? 'fill-white rotate-12' : 'text-stone-400'}`} />
                                        </div>
                                        <span>{pinToast.message}</span>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

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

