
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, List, Search, Filter, X, GraduationCap, Briefcase, UserPlus, Trash2, Sparkles, CalendarDays, Upload } from 'lucide-react';
import { useInterns } from '../../../hooks/useInterns';
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

interface InternManagementViewProps {
    interns: InternCandidate[];
    loading: boolean;
    hasMore: boolean;
    addIntern: (data: Partial<InternCandidate>) => Promise<void>;
    updateIntern: (id: string, data: Partial<InternCandidate>) => Promise<void>;
    deleteIntern: (id: string) => Promise<void>;
    fetchMore: () => void;
    fetchByRange: (start: string, end: string) => void;
    refresh: () => void;
}

const InternManagementView: React.FC<InternManagementViewProps> = ({
    interns, loading, hasMore, addIntern, updateIntern, deleteIntern, fetchMore, fetchByRange, refresh
}) => {
    const [viewMode, setViewMode] = useState<'LIST' | 'TABLE' | 'TIMELINE' | 'CALENDAR'>('LIST');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<InternStatus[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { showToast } = useToast();
    const [returnToDetail, setReturnToDetail] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState<InternCandidate | undefined>(undefined);
    const [viewingIntern, setViewingIntern] = useState<InternCandidate | null>(null);
    const { showConfirm } = useGlobalDialog();

    const statusOptions = [
        { key: 'APPLIED', label: 'สมัครเข้ามา', icon: <Inbox className="w-4 h-4" /> },
        { key: 'INTERVIEW_SCHEDULED', label: 'นัดสัมภาษณ์แล้ว', icon: <Clock className="w-4 h-4" /> },
        { key: 'INTERVIEWED', label: 'สัมภาษณ์แล้ว', icon: <UserIcon className="w-4 h-4" /> },
        { key: 'ACCEPTED', label: 'รับเข้าฝึกงาน', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'REJECTED', label: 'ไม่ผ่านการคัดเลือก', icon: <XCircle className="w-4 h-4" /> },
        { key: 'ARCHIVED', label: 'เก็บถาวร', icon: <TrashIcon className="w-4 h-4" /> },
    ];

    const filteredInterns = useMemo(() => {
        return interns.filter(i => {
            const matchesSearch = i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 i.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 i.position.toLowerCase().includes(searchQuery.toLowerCase());
            
            // If statusFilter is empty, we show everything except ARCHIVED and REJECTED unless showArchived is true
            // If statusFilter has values, we show those specific statuses
            const matchesStatus = statusFilter.length === 0 
                ? (showArchived ? true : (i.status !== 'ARCHIVED' && i.status !== 'REJECTED'))
                : statusFilter.includes(i.status);

            return matchesSearch && matchesStatus;
        });
    }, [interns, searchQuery, statusFilter, showArchived]);

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
            // Update viewingIntern if it's the one being edited to reflect changes in detail modal
            if (viewingIntern && viewingIntern.id === selectedIntern.id) {
                setViewingIntern({ ...viewingIntern, ...data } as InternCandidate);
            }
        } else {
            await addIntern(data);
        }
        setIsModalOpen(false);
        
        // If we came from detail modal, go back to it
        if (returnToDetail) {
            setIsDetailModalOpen(true);
            setReturnToDetail(false);
        }
        
        refresh();
    };

    const handleImportInterns = async (data: Partial<InternCandidate>[]) => {
        try {
            // We can do bulk import if we update useInterns, but for now we'll do it sequentially or in parallel
            // Since useInterns.addIntern handles one at a time, we'll map them
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
    };

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
                            จัดการพนักงานฝึกงาน ({filteredInterns.length})
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

                    {/* Search */}
                    <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="ค้นหาชื่อ, มหาลัย, ตำแหน่ง..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200/60 focus:bg-white focus:border-indigo-200 rounded-xl text-xs font-bold outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="w-full sm:w-64">
                        <FilterDropdown 
                            label="สถานะ"
                            value={statusFilter}
                            options={statusOptions}
                            onChange={(val) => setStatusFilter(val as InternStatus[])}
                            icon={<Filter className="w-4 h-4" />}
                            activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700"
                            multiSelect={true}
                        />
                    </div>

                    {/* Show Archived Toggle */}
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${showArchived ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                        title={showArchived ? "ซ่อนที่เก็บถาวร" : "แสดงที่เก็บถาวร"}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{showArchived ? "ซ่อน Archive" : "ดู Archive"}</span>
                    </button>

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

            {/* Stats Grid */}
            <InternStatsGrid />

            {/* Main Content */}
            <div className="min-h-[400px] relative">
                {/* Loading Overlay - only show when loading and no data yet, or as a subtle overlay */}
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
                                interns={filteredInterns} 
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
                                interns={filteredInterns} 
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
                                interns={filteredInterns} 
                                onEdit={handleViewClick}
                                onRangeChange={fetchByRange}
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
                                interns={filteredInterns} 
                                onEdit={handleViewClick}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal */}
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
