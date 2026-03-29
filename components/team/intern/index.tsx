
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, List, Search, Filter, X, GraduationCap, Briefcase, UserPlus, Trash2, Sparkles, CalendarDays, Upload } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useInterns, InternFilterState, InternStats } from '../../../hooks/useInterns';
import { InternCandidate, InternStatus } from '../../../types';
import InternTimeline from './views/InternTimeline';
import InternListView from './views/InternListView';
import InternTableView from './views/InternTableView';
import InternCalendarView from './views/InternCalendarView';
import InternCandidateModal from './modals/InternCandidateModal';
import InternDetailModal from './modals/InternDetailModal';
import InternImportModal from './modals/InternImportModal';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import FilterDropdown from '../../common/FilterDropdown';
import { CheckCircle2, Clock, XCircle, Trash2 as TrashIcon, User as UserIcon, Inbox } from 'lucide-react';
import InternStatsGrid from './InternStatsGrid';
import InternSmartFilter from './InternSmartFilter';

interface InternManagementViewProps {
    interns: InternCandidate[];
    loading: boolean;
    hasMore: boolean;
    stats: InternStats;
    filters: InternFilterState;
    setFilters: React.Dispatch<React.SetStateAction<InternFilterState>>;
    addIntern: (data: Partial<InternCandidate>) => Promise<void>;
    updateIntern: (id: string, data: Partial<InternCandidate>) => Promise<void>;
    deleteIntern: (id: string) => Promise<void>;
    fetchMore: () => void;
    refresh: () => void;
}

const InternManagementView: React.FC<InternManagementViewProps> = ({
    interns, loading, hasMore, stats, filters, setFilters, addIntern, updateIntern, deleteIntern, fetchMore, refresh
}) => {
    const [viewMode, setViewMode] = useState<'LIST' | 'TABLE' | 'TIMELINE' | 'CALENDAR'>('LIST');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { showToast } = useToast();
    const [returnToDetail, setReturnToDetail] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState<InternCandidate | undefined>(undefined);
    const [viewingIntern, setViewingIntern] = useState<InternCandidate | null>(null);
    const { showConfirm } = useGlobalDialog();

    const handleAddClick = () => {
        setSelectedIntern(undefined);
        setIsModalOpen(true);
    };

    const handleViewClick = (intern: InternCandidate) => {
        setViewingIntern(intern);
        setIsDetailModalOpen(true);
    };

    const handleEditClick = (intern: InternCandidate, fromDetail: boolean = false) => {
        setReturnToDetail(fromDetail);
        setSelectedIntern(intern);
        setIsModalOpen(true);
    };

    const handleSaveIntern = async (data: Partial<InternCandidate>) => {
        if (selectedIntern) {
            await updateIntern(selectedIntern.id, data);
            if (viewingIntern && viewingIntern.id === selectedIntern.id) {
                setViewingIntern({ ...viewingIntern, ...data } as InternCandidate);
            }
        } else {
            await addIntern(data);
        }
        setIsModalOpen(false);
        
        if (returnToDetail) {
            setIsDetailModalOpen(true);
            setReturnToDetail(false);
        }
        
        refresh();
    };

    const handleImportInterns = async (data: Partial<InternCandidate>[]) => {
        try {
            const promises = data.map(item => addIntern(item));
            await Promise.all(promises);
            showToast(`นำเข้าข้อมูลสำเร็จ ${data.length} รายการ ✨`, 'success');
            refresh();
        } catch (err: any) {
            showToast('การนำเข้าบางรายการล้มเหลว: ' + err.message, 'error');
        }
    };

    const handleDeleteIntern = async (id: string) => {
        const intern = interns.find(i => i.id === id);
        if (!intern) return;

        const confirmed = await showConfirm(
            `คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ "${intern.fullName}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
            'ยืนยันการลบข้อมูล'
        );

        if (confirmed) {
            try {
                await deleteIntern(id);
                showToast('ลบข้อมูลสำเร็จ', 'success');
            } catch (err: any) {
                showToast('ลบข้อมูลล้มเหลว: ' + err.message, 'error');
            }
        }
    };

    const handleViewModeChange = (mode: 'LIST' | 'TABLE' | 'TIMELINE' | 'CALENDAR') => {
        setViewMode(mode);
        
        if (mode === 'CALENDAR' && filters.statuses.length === 0) {
            setFilters(prev => ({ ...prev, statuses: ['ACCEPTED'] }));
        }
    };

    const handleFilterChange = (newFilters: Partial<InternFilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters({
            searchQuery: '',
            statuses: [],
            dateRange: { start: null, end: null },
            dateType: 'APPLICATION'
        });
    };

    const currentFilterLabel = useMemo(() => {
        if (filters.dateRange.start && filters.dateRange.end) {
            return `${format(filters.dateRange.start, 'd MMM yyyy')} - ${format(filters.dateRange.end, 'd MMM yyyy')}`;
        }
        return 'ทั้งหมด';
    }, [filters.dateRange]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border border-white/40 shadow-xl shadow-indigo-500/5 relative z-50">
                <div className="flex items-center gap-4">
                    <motion.div 
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                        className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 relative group"
                    >
                        <GraduationCap className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                        <motion.div
                            animate={{ 
                                opacity: [0, 1, 0],
                                scale: [0.5, 1.2, 0.5],
                                rotate: [0, 45, -45, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-1 -right-1 text-yellow-400"
                        >
                            <Sparkles className="w-3 h-3" />
                        </motion.div>
                    </motion.div>
                    <div className="relative">
                        <motion.h2 
                            animate={{ 
                                rotate: [0, -0.5, 0.5, 0],
                                scale: [1, 1.01, 1]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-600 to-gray-900 animate-gradient-x tracking-tight"
                        >
                            Intern Management
                        </motion.h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            จัดการพนักงานฝึกงาน ({stats.total})
                            <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1 h-1 bg-indigo-400 rounded-full"
                            />
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
                        <button 
                            onClick={() => handleViewModeChange('LIST')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Card View"
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden sm:inline">Cards</span>
                        </button>
                        <button 
                            onClick={() => handleViewModeChange('TABLE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Table View"
                        >
                            <Briefcase className="w-4 h-4" />
                            <span className="hidden sm:inline">Table</span>
                        </button>
                        <button 
                            onClick={() => handleViewModeChange('TIMELINE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'TIMELINE' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Timeline View"
                        >
                            <Calendar className="w-4 h-4" />
                            <span className="hidden sm:inline">Timeline</span>
                        </button>
                        <button 
                            onClick={() => handleViewModeChange('CALENDAR')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Calendar View"
                        >
                            <CalendarDays className="w-4 h-4" />
                            <span className="hidden sm:inline">Calendar</span>
                        </button>
                    </div>

                    {/* Add Button */}
                    <div className="flex items-center gap-2">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-50 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Import CSV</span>
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddClick}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>เพิ่มผู้สมัคร</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Smart Filter Component */}
            <InternSmartFilter 
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                totalCount={stats.total}
            />

            {/* Stats Grid */}
            <InternStatsGrid 
                stats={stats}
                isLoading={loading}
                onStatClick={(status) => handleFilterChange({ statuses: [status] })}
                currentFilterLabel={currentFilterLabel}
            />

            {/* Main Content */}
            <div className="min-h-[400px] relative">
                {/* Loading Overlay */}
                {loading && interns.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50 backdrop-blur-sm rounded-[2rem]">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {viewMode === 'LIST' ? (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <InternListView 
                                interns={interns} 
                                onEdit={handleViewClick}
                                onDelete={handleDeleteIntern}
                                onUpdateStatus={(id, status) => updateIntern(id, { status })}
                                hasMore={hasMore}
                                onLoadMore={fetchMore}
                                isLoading={loading}
                            />
                        </motion.div>
                    ) : viewMode === 'TABLE' ? (
                        <motion.div 
                            key="table"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <InternTableView 
                                interns={interns} 
                                onEdit={handleViewClick}
                                onDelete={handleDeleteIntern}
                                onUpdateStatus={(id, status) => updateIntern(id, { status })}
                                isLoading={loading}
                                hasMore={hasMore}
                                onLoadMore={fetchMore}
                            />
                        </motion.div>
                    ) : viewMode === 'TIMELINE' ? (
                        <motion.div 
                            key="timeline"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <InternTimeline 
                                interns={interns} 
                                onEdit={handleViewClick}
                                onRangeChange={(start, end) => handleFilterChange({ dateRange: { start: new Date(start), end: new Date(end) }, dateType: 'INTERNSHIP' })}
                                isLoading={loading}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="calendar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <InternCalendarView 
                                interns={interns} 
                                onEdit={handleViewClick}
                                onRangeChange={(start, end) => handleFilterChange({ dateRange: { start: new Date(start), end: new Date(end) }, dateType: 'INTERNSHIP' })}
                                isLoading={loading}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <InternCandidateModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    if (returnToDetail) {
                        setIsDetailModalOpen(true);
                        setReturnToDetail(false);
                    }
                }}
                onSave={handleSaveIntern}
                intern={selectedIntern}
                allInterns={interns}
            />

            <InternDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                intern={viewingIntern}
                onEdit={(intern) => handleEditClick(intern, true)}
            />

            <InternImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportInterns}
            />
        </div>
    );
};

export default InternManagementView;
