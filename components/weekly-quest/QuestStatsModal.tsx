import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Trophy, ChevronLeft, ChevronRight, 
    Clock
} from 'lucide-react';
import { WeeklyQuest, Task, Channel } from '../../types';
import { 
    format, isPast, isToday, addDays, 
    startOfMonth, endOfMonth, eachMonthOfInterval, 
    startOfDay, endOfDay, subMonths
} from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { isTaskMatchingQuest } from '../../utils/questUtils';

// Sub-components
import { StatSummaryGrid } from './stats/StatSummaryGrid';
import { QuestFilterSystem } from './stats/QuestFilterSystem';
import { QuestStatCard } from './stats/QuestStatCard';

interface QuestStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: WeeklyQuest[];
    tasks: Task[];
    channels: Channel[];
    onRevive?: (quest: WeeklyQuest) => void;
}

type TabType = 'ALL' | 'COMPLETED' | 'FAILED' | 'ONGOING';
type SortKey = 'DATE' | 'TITLE' | 'PROGRESS';

const ITEMS_PER_PAGE = 6;

const QuestStatsModal: React.FC<QuestStatsModalProps> = ({ isOpen, onClose, quests, tasks, channels, onRevive }) => {
    
    // --- State ---
    const [dateRange, setDateRange] = useState<{ type: 'MONTH' | 'ALL' | 'CUSTOM', value: string }>({ type: 'MONTH', value: format(new Date(), 'yyyy-MM') });
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChannelId, setSelectedChannelId] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'DATE', direction: 'desc' });

    // --- Helpers ---
    const monthOptions = useMemo(() => {
        const start = startOfMonth(new Date(2024, 0, 1)); // Start from 2024
        const end = endOfMonth(new Date());
        return eachMonthOfInterval({ start, end }).map(d => format(d, 'yyyy-MM')).reverse();
    }, []);

    const calculateStatus = useCallback((quest: WeeklyQuest) => {
        let progress = 0;
        const matchingTasks = tasks.filter(t => isTaskMatchingQuest(t, quest));
        if (quest.questType === 'MANUAL') {
            progress = quest.manualProgress || 0;
        } else {
            progress = matchingTasks.length;
        }

        const isCompleted = progress >= quest.targetCount;
        const qStart = startOfDay(new Date(quest.weekStartDate));
        const qEnd = endOfDay(quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6));
        const isExpired = isPast(qEnd) && !isToday(qEnd);

        return { isCompleted, isExpired, progress, qEnd, matchingTasks };
    }, [tasks]);

    // --- Filter Logic ---
    const filteredQuests = useMemo(() => {
        return quests.filter(q => {
            // 1. Channel Filter
            if (selectedChannelId !== 'ALL' && q.channelId !== selectedChannelId) return false;

            // 2. Date Range Filter
            if (dateRange.type === 'MONTH') {
                const qMonth = format(new Date(q.weekStartDate), 'yyyy-MM');
                if (qMonth !== dateRange.value) return false;
            } else if (dateRange.type === 'CUSTOM') {
                const limitDate = subMonths(new Date(), parseInt(dateRange.value));
                if (new Date(q.weekStartDate) < limitDate) return false;
            }

            const { isCompleted, isExpired } = calculateStatus(q);

            // 3. Tab Filter
            if (activeTab === 'COMPLETED' && !isCompleted) return false;
            if (activeTab === 'FAILED' && (!isExpired || isCompleted)) return false;
            if (activeTab === 'ONGOING' && (isExpired || isCompleted)) return false;

            // 4. Search
            if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase()) && !q.groupTitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            return true;
        });
    }, [quests, selectedChannelId, dateRange, activeTab, searchQuery, calculateStatus]);

    // --- Grouping Logic (Triple-Layer) ---
    const groupedQuests = useMemo(() => {
        const groups: Record<string, { title: string, quests: WeeklyQuest[], id: string }> = {};
        const ungrouped: WeeklyQuest[] = [];

        filteredQuests.forEach(q => {
            if (q.groupId && q.groupTitle) {
                if (!groups[q.groupId]) {
                    groups[q.groupId] = { title: q.groupTitle, quests: [], id: q.groupId };
                }
                groups[q.groupId].quests.push(q);
            } else {
                ungrouped.push(q);
            }
        });

        const result = [
            ...Object.values(groups).map(g => ({ ...g, isGroup: true })),
            ...ungrouped.map(q => ({ ...q, isGroup: false }))
        ];

        return result;
    }, [filteredQuests]);

    // --- Sorting ---
    const sortedGroups = useMemo(() => {
        return [...groupedQuests].sort((a, b) => {
            let comparison = 0;
            if (sortConfig.key === 'TITLE') {
                const titleA = 'isGroup' in a && a.isGroup ? a.title : (a as WeeklyQuest).title;
                const titleB = 'isGroup' in b && b.isGroup ? b.title : (b as WeeklyQuest).title;
                comparison = titleA.localeCompare(titleB);
            } else {
                const dateA = 'isGroup' in a && a.isGroup ? new Date((a as any).quests[0].weekStartDate).getTime() : new Date((a as WeeklyQuest).weekStartDate).getTime();
                const dateB = 'isGroup' in b && b.isGroup ? new Date((b as any).quests[0].weekStartDate).getTime() : new Date((b as WeeklyQuest).weekStartDate).getTime();
                comparison = dateA - dateB;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [groupedQuests, sortConfig]);

    // --- Pagination ---
    const totalPages = Math.ceil(sortedGroups.length / ITEMS_PER_PAGE);
    const displayedItems = sortedGroups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- Stats Summary ---
    const summary = useMemo(() => {
        const base = quests.filter(q => {
            if (selectedChannelId !== 'ALL' && q.channelId !== selectedChannelId) return false;
            if (dateRange.type === 'MONTH') return format(new Date(q.weekStartDate), 'yyyy-MM') === dateRange.value;
            if (dateRange.type === 'CUSTOM') return new Date(q.weekStartDate) >= subMonths(new Date(), parseInt(dateRange.value));
            return true;
        });

        const res = { total: 0, completed: 0, failed: 0, ongoing: 0 };
        base.forEach(q => {
            res.total++;
            const { isCompleted, isExpired } = calculateStatus(q);
            if (isCompleted) res.completed++;
            else if (isExpired) res.failed++;
            else res.ongoing++;
        });
        return res;
    }, [quests, selectedChannelId, dateRange, calculateStatus]);

    const handleSort = (key: SortKey) => {
        setSortConfig(curr => ({ key, direction: curr.key === key && curr.direction === 'desc' ? 'asc' : 'desc' }));
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.15);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.3);
                }
            `}</style>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white/40 w-full max-w-6xl h-[94vh] rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative border border-white/40 backdrop-blur-3xl"
            >
                
                {/* Header Section - Compact */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 shrink-0 relative overflow-hidden">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32 transition-colors duration-700
                            ${activeTab === 'FAILED' ? 'bg-rose-500' : activeTab === 'COMPLETED' ? 'bg-emerald-500' : 'bg-sky-500'}
                        `}
                    />

                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Quest Chronicles</h2>
                                <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    บันทึกการเดินทางและผลงานของคุณ
                                </p>
                            </div>
                        </div>

                        <button onClick={onClose} className="bg-white/10 hover:bg-rose-500/20 p-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Summary Stats Grid - Compact */}
                <div className="px-6 pt-6 pb-2">
                    <StatSummaryGrid 
                        summary={summary} 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
                    
                    {/* Filter System - Compact */}
                    <QuestFilterSystem 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        monthOptions={monthOptions}
                        sortConfig={sortConfig}
                        handleSort={handleSort}
                        channels={channels}
                        selectedChannelId={selectedChannelId}
                        setSelectedChannelId={setSelectedChannelId}
                    />

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {displayedItems.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-slate-400 py-10"
                                >
                                    <p className="text-lg font-bold text-slate-500">ไม่พบข้อมูลเควส</p>
                                    <p className="text-xs font-bold opacity-60">ลองเปลี่ยนการกรองหรือค้นหาด้วยคำอื่น</p>
                                </motion.div>
                            ) : (
                                displayedItems.map((item, idx) => {
                                    if ('isGroup' in item && item.isGroup) {
                                        return (
                                            <QuestStatCard 
                                                key={item.id} 
                                                groupTitle={(item as any).title}
                                                subQuests={(item as any).quests}
                                                tasks={tasks}
                                                calculateStatus={calculateStatus}
                                                onRevive={onRevive}
                                                index={idx}
                                            />
                                        );
                                    } else {
                                        const quest = item as WeeklyQuest;
                                        const status = calculateStatus(quest);
                                        return (
                                            <QuestStatCard 
                                                key={quest.id} 
                                                quest={quest} 
                                                tasks={tasks}
                                                calculateStatus={calculateStatus}
                                                progress={status.progress}
                                                isCompleted={status.isCompleted}
                                                isFailed={status.isExpired && !status.isCompleted}
                                                qEnd={status.qEnd}
                                                onRevive={onRevive}
                                                index={idx}
                                            />
                                        );
                                    }
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination Footer - Compact */}
                    <div className="mt-4 flex justify-between items-center bg-white/40 backdrop-blur-md p-3 rounded-[1.5rem] border border-white/40 shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-white/40">
                                 หน้า {currentPage} จาก {totalPages || 1}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {sortedGroups.length} รายการที่พบ
                            </span>
                        </div>
                        <div className="flex gap-2">
                             <motion.button 
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                                 onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                                 disabled={currentPage === 1} 
                                 className="p-2 bg-white border border-white/40 rounded-xl hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all"
                             >
                                <ChevronLeft className="w-4 h-4 text-slate-600"/>
                             </motion.button>
                             <motion.button 
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                                 onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                                 disabled={currentPage === totalPages || totalPages === 0} 
                                 className="p-2 bg-white border border-white/40 rounded-xl hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all"
                             >
                                <ChevronRight className="w-4 h-4 text-slate-600"/>
                             </motion.button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default QuestStatsModal;
