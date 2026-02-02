import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Skull, TrendingUp, Calendar, ChevronLeft, ChevronRight, RefreshCw, Filter, Search, ArrowUpDown, BarChart3 } from 'lucide-react';
import { WeeklyQuest, Task } from '../../types';
import { format, isPast, isToday, isWithinInterval, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';

interface QuestStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: WeeklyQuest[];
    tasks: Task[];
    onRevive?: (quest: WeeklyQuest) => void;
}

type TabType = 'ALL' | 'COMPLETED' | 'FAILED' | 'ONGOING';
type SortKey = 'DATE' | 'TITLE' | 'PROGRESS';

const ITEMS_PER_PAGE = 6;

const QuestStatsModal: React.FC<QuestStatsModalProps> = ({ isOpen, onClose, quests, tasks, onRevive }) => {
    
    // --- State ---
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM')); // Default current month
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'DATE', direction: 'desc' });

    // --- Helpers ---
    const calculateStatus = (quest: WeeklyQuest) => {
        let progress = 0;
        if (quest.questType === 'MANUAL') {
            progress = quest.manualProgress || 0;
        } else {
            const qStart = new Date(quest.weekStartDate);
            qStart.setHours(0, 0, 0, 0);
            const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
            qEnd.setHours(23, 59, 59, 999);

            const matches = tasks.filter(t => {
                if (t.isUnscheduled || !t.endDate) return false;
                const taskDate = new Date(t.endDate);
                const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
                if (!inRange) return false;
                if (quest.channelId && t.channelId !== quest.channelId) return false;
                if (quest.targetStatus && t.status !== quest.targetStatus && t.status !== 'DONE') return false;
                return true; 
            });
            progress = matches.length;
        }

        const isCompleted = progress >= quest.targetCount;
        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(new Date(quest.weekStartDate), 6);
        const isExpired = isPast(qEnd) && !isToday(qEnd);

        return { isCompleted, isExpired, progress, qEnd };
    };

    // --- Generate Month Options ---
    const monthOptions = useMemo(() => {
        if (quests.length === 0) return [format(new Date(), 'yyyy-MM')];
        
        // Find min and max date from quests
        const dates = quests.map(q => new Date(q.weekStartDate));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(); // Always include today

        const months = eachMonthOfInterval({
            start: startOfMonth(minDate),
            end: endOfMonth(maxDate)
        });

        // Reverse to show newest months first
        return months.map(d => format(d, 'yyyy-MM')).reverse();
    }, [quests]);

    // --- Filter Logic ---
    const filteredQuests = useMemo(() => {
        return quests.filter(q => {
            // 1. Month Filter
            if (selectedMonth !== 'ALL_TIME') {
                const qMonth = format(new Date(q.weekStartDate), 'yyyy-MM');
                if (qMonth !== selectedMonth) return false;
            }

            const { isCompleted, isExpired } = calculateStatus(q);

            // 2. Tab Filter
            if (activeTab === 'COMPLETED' && !isCompleted) return false;
            if (activeTab === 'FAILED' && (!isExpired || isCompleted)) return false;
            if (activeTab === 'ONGOING' && (isExpired || isCompleted)) return false;

            // 3. Search
            if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            return true;
        });
    }, [quests, selectedMonth, activeTab, searchQuery, tasks]);

    // --- Sorting ---
    const sortedQuests = useMemo(() => {
        return [...filteredQuests].sort((a, b) => {
            const { progress: pA } = calculateStatus(a);
            const { progress: pB } = calculateStatus(b);
            
            let comparison = 0;
            if (sortConfig.key === 'TITLE') comparison = a.title.localeCompare(b.title);
            else if (sortConfig.key === 'PROGRESS') comparison = (pA/a.targetCount) - (pB/b.targetCount);
            else comparison = new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime();

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredQuests, sortConfig]);

    // --- Pagination ---
    const totalPages = Math.ceil(sortedQuests.length / ITEMS_PER_PAGE);
    const displayedQuests = sortedQuests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- Stats Summary (Based on Month Selection) ---
    const summary = useMemo(() => {
        const base = selectedMonth === 'ALL_TIME' 
            ? quests 
            : quests.filter(q => format(new Date(q.weekStartDate), 'yyyy-MM') === selectedMonth);

        const res = { total: 0, completed: 0, failed: 0, ongoing: 0 };
        base.forEach(q => {
            res.total++;
            const { isCompleted, isExpired } = calculateStatus(q);
            if (isCompleted) res.completed++;
            else if (isExpired) res.failed++;
            else res.ongoing++;
        });
        return res;
    }, [quests, selectedMonth, tasks]);

    const handleSort = (key: SortKey) => {
        setSortConfig(curr => ({ key, direction: curr.key === key && curr.direction === 'desc' ? 'asc' : 'desc' }));
    };

    if (!isOpen) return null;

    // Theme Config based on Active Tab
    const getTheme = () => {
        switch(activeTab) {
            case 'COMPLETED': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
            case 'FAILED': return 'bg-red-50 border-red-200 text-red-900';
            case 'ONGOING': return 'bg-blue-50 border-blue-200 text-blue-900';
            default: return 'bg-white border-gray-200 text-gray-900';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-[#f8fafc] w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-200">
                
                {/* Header & Month Selector */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                    {/* Background Glow based on tab */}
                    <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none -mr-20 -mt-20 transition-colors duration-500
                        ${activeTab === 'FAILED' ? 'bg-red-500' : activeTab === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}
                    `}></div>

                    <div className="relative z-10 flex items-center gap-4 w-full md:w-auto">
                         <div className={`p-3 rounded-2xl border border-white/20 shadow-lg ${activeTab === 'FAILED' ? 'bg-red-500' : activeTab === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                            {activeTab === 'FAILED' ? <Skull className="w-6 h-6 text-white"/> : activeTab === 'COMPLETED' ? <Trophy className="w-6 h-6 text-white"/> : <BarChart3 className="w-6 h-6 text-white"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Quest Chronicles</h2>
                            <p className="text-slate-400 text-xs font-medium">บันทึกผลงานและการเดินทาง</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-3 bg-white/10 p-1.5 rounded-xl border border-white/10">
                        <Calendar className="w-5 h-5 text-indigo-300 ml-2" />
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer pr-2 [&>option]:text-slate-900"
                        >
                            {monthOptions.map(m => (
                                <option key={m} value={m}>
                                    {format(new Date(m), 'MMMM yyyy', { locale: th })}
                                </option>
                            ))}
                            <option value="ALL_TIME">ทุกช่วงเวลา (All Time)</option>
                        </select>
                        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Filter Cards (Tabs) */}
                <div className="p-6 bg-white border-b border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button 
                            onClick={() => setActiveTab('ALL')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">ทั้งหมด</span>
                            <span className="text-3xl font-black">{summary.total}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('COMPLETED')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">สำเร็จ 🎉</span>
                            <span className="text-3xl font-black">{summary.completed}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('FAILED')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'FAILED' ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-105' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">ล้มเหลว 💀</span>
                            <span className="text-3xl font-black">{summary.failed}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('ONGOING')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'ONGOING' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">กำลังลุย 🔥</span>
                            <span className="text-3xl font-black">{summary.ongoing}</span>
                        </button>
                    </div>
                </div>

                {/* List Container */}
                <div className={`flex-1 overflow-hidden flex flex-col ${getTheme()} transition-colors duration-300`}>
                    
                    {/* Search & Sort Bar */}
                    <div className="px-6 py-3 flex items-center justify-between border-b border-black/5 bg-white/50 backdrop-blur-sm">
                        <div className="relative group max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อเควส..." 
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleSort('DATE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${sortConfig.key === 'DATE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 border-transparent'}`}>
                                วันที่ <ArrowUpDown className="w-3 h-3"/>
                             </button>
                             <button onClick={() => handleSort('PROGRESS')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${sortConfig.key === 'PROGRESS' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 border-transparent'}`}>
                                ความคืบหน้า <ArrowUpDown className="w-3 h-3"/>
                             </button>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {displayedQuests.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 pb-20">
                                <Search className="w-16 h-16 mb-4 text-slate-300" />
                                <p className="text-lg font-bold">ไม่พบข้อมูล</p>
                                <p className="text-xs">ไม่มีเควสในช่วงเวลาหรือสถานะที่เลือก</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {displayedQuests.map(quest => {
                                    const { progress, isCompleted, isExpired, qEnd } = calculateStatus(quest);
                                    const percent = Math.min((progress / quest.targetCount) * 100, 100);
                                    const isFailed = isExpired && !isCompleted;

                                    return (
                                        <div key={quest.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
                                            {/* Icon Status */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 ${
                                                isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                isFailed ? 'bg-red-50 border-red-200 text-red-600' :
                                                'bg-blue-50 border-blue-200 text-blue-600'
                                            }`}>
                                                {isCompleted ? <Trophy className="w-6 h-6" /> : isFailed ? <Skull className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-sm truncate ${isFailed ? 'text-gray-500 line-through decoration-red-300' : 'text-gray-800'}`}>{quest.title}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                        isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        isFailed ? 'bg-red-100 text-red-700 border-red-200' :
                                                        'bg-blue-100 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {isCompleted ? 'SUCCESS' : isFailed ? 'FAILED' : 'ONGOING'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {format(new Date(quest.weekStartDate), 'd MMM')} - {format(qEnd, 'd MMM')}</span>
                                                    <div className="flex-1 max-w-[150px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-red-400' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-gray-700">{progress}/{quest.targetCount}</span>
                                                </div>
                                            </div>

                                            {/* Action (Revive) */}
                                            {isFailed && onRevive && (
                                                <button 
                                                    onClick={() => onRevive(quest)}
                                                    className="p-2 bg-green-50 text-green-600 border border-green-200 rounded-xl hover:bg-green-100 hover:scale-105 active:scale-95 transition-all shadow-sm group-hover:opacity-100 md:opacity-0 opacity-100"
                                                    title="ชุบชีวิต (Revive)"
                                                >
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                        <span className="text-xs font-bold text-gray-500">
                             Page {currentPage} / {totalPages || 1}
                        </span>
                        <div className="flex gap-2">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default QuestStatsModal;