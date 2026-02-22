
import React, { useState, useMemo } from 'react';
import { Goal, Channel, User } from '../types';
import { useGoals } from '../hooks/useGoals';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import GoalStatsHeader from './goal/GoalStatsHeader';
import GoalCard from './goal/GoalCard';
import { GoalFormModal, UpdateProgressModal } from './goal/GoalActionModals';
import { Plus, Filter, Calendar, ChevronLeft, ChevronRight, LayoutGrid, List, Target, X, CalendarDays } from 'lucide-react';
import { format, isSameMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay, getDay, startOfWeek, endOfWeek } from 'date-fns';
import th from 'date-fns/locale/th';
import { motion, AnimatePresence } from "framer-motion";

interface GoalViewProps {
    channels: Channel[];
    users: User[];
    currentUser: User;
}

const ITEMS_PER_PAGE = 9;

const GoalView: React.FC<GoalViewProps> = ({ channels, users, currentUser }) => {
    // Destructure updateGoal
    const { goals, addGoal, updateGoal, updateGoalValue, deleteGoal, toggleOwner, toggleBoost, isLoading } = useGoals(currentUser);
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);
    
    // Filter State
    const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ 
        start: startOfMonth(new Date()), 
        end: endOfMonth(new Date()) 
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    
    // Pagination
    const [page, setPage] = useState(1);

    // --- Filtering Logic ---
    const filteredGoals = useMemo(() => {
        return goals.filter(g => {
            // 1. Tab Filter
            if (g.isArchived) return false; // Hide archived by default for now
            if (filterTab === 'COMPLETED' && g.currentValue < g.targetValue) return false;
            if (filterTab === 'ACTIVE' && g.currentValue >= g.targetValue) return false;

            // 2. Channel Filter
            if (filterChannel !== 'ALL' && g.channelId !== filterChannel) return false;

            // 3. Date Range Filter (Based on Deadline)
            if (dateRange.start && dateRange.end) {
                const deadline = new Date(g.deadline);
                if (!isWithinInterval(deadline, { 
                    start: startOfDay(dateRange.start), 
                    end: endOfDay(dateRange.end) 
                })) return false;
            }

            return true;
        }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [goals, filterTab, filterChannel, dateRange]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredGoals.length / ITEMS_PER_PAGE);
    const paginatedGoals = filteredGoals.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleSaveGoal = async (data: any) => {
        if (editingGoal) {
            // Update Existing Goal
            const updatedGoal: Goal = {
                ...editingGoal,
                ...data
            };
            await updateGoal(updatedGoal);
            setEditingGoal(null);
            setIsCreateModalOpen(false); // Close shared modal logic if needed, though usually controlled by props
        } else {
            // Create New Goal
            addGoal(data);
        }
    };

    // Reset page when filters change
    useMemo(() => {
        setPage(1);
    }, [filterTab, filterChannel, dateRange]);

    const handleQuickDateSelect = (type: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_90' | 'ALL') => {
        const now = new Date();
        switch (type) {
            case 'THIS_MONTH':
                setDateRange({ start: startOfMonth(now), end: endOfMonth(now) });
                setViewMonth(now);
                break;
            case 'LAST_MONTH':
                const lastMonth = addMonths(now, -1);
                setDateRange({ start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
                setViewMonth(lastMonth);
                break;
            case 'LAST_90':
                setDateRange({ start: subDays(now, 90), end: now });
                setViewMonth(now);
                break;
            case 'ALL':
                setDateRange({ start: null, end: null });
                break;
        }
        setIsDatePickerOpen(false);
    };

    const handleDateClick = (date: Date) => {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            setDateRange({ start: date, end: null });
        } else {
            if (date < dateRange.start) {
                setDateRange({ start: date, end: dateRange.start });
            } else {
                setDateRange({ start: dateRange.start, end: date });
            }
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth));
        const end = endOfWeek(endOfMonth(viewMonth));
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            
            {/* 1. Header & Stats */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                            🚀 Goal Tracking
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">ติดตามเป้าหมายและผลงานของทีม</p>
                    </div>
                    
                    <button 
                        onClick={() => { setEditingGoal(null); setIsCreateModalOpen(true); }}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-sm"
                    >
                        <Plus className="w-5 h-5 mr-2 stroke-[3px]" /> สร้างเป้าหมาย
                    </button>
                </div>
                
                <GoalStatsHeader goals={filteredGoals} />
            </div>

            {/* 2. Controls & Filters */}
            <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-50/50 flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-4 z-40 backdrop-blur-md bg-white/90">
                
                {/* Left: Tab & Date Range */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
                        <button onClick={() => setFilterTab('ACTIVE')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all ${filterTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>กำลังทำ</button>
                        <button onClick={() => setFilterTab('COMPLETED')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all ${filterTab === 'COMPLETED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>สำเร็จแล้ว</button>
                        <button onClick={() => setFilterTab('ALL')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all ${filterTab === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>ทั้งหมด</button>
                    </div>

                    {/* Date Range Picker UI */}
                    <div className="relative w-full md:w-auto">
                        <button 
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            className={`flex items-center justify-between gap-3 px-5 py-2.5 rounded-2xl border transition-all w-full md:w-auto min-w-[220px] ${isDatePickerOpen ? 'border-indigo-500 ring-4 ring-indigo-50 bg-white' : 'border-gray-200 bg-white hover:border-indigo-300 shadow-sm'}`}
                        >
                            <div className="flex items-center gap-2">
                                <CalendarDays className={`w-4 h-4 ${dateRange.start ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold text-gray-700">
                                    {dateRange.start && dateRange.end 
                                        ? `${format(dateRange.start, 'd MMM', { locale: th })} - ${format(dateRange.end, 'd MMM yy', { locale: th })}`
                                        : 'ทุกช่วงเวลา (All Time)'}
                                </span>
                            </div>
                            <Filter className={`w-3.5 h-3.5 transition-transform ${isDatePickerOpen ? 'rotate-180 text-indigo-500' : 'text-gray-400'}`} />
                        </button>

                        <AnimatePresence>
                            {isDatePickerOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-full md:w-[320px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 z-50"
                                >
                                    <div className="flex justify-between items-center mb-6 px-1">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">เลือกช่วงเวลา</span>
                                        <button onClick={() => setIsDatePickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
                                    </div>
                                    
                                    {/* Calendar Header */}
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <button onClick={() => setViewMonth(prev => addMonths(prev, -1))} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                                        <span className="text-sm font-black text-gray-700">{format(viewMonth, 'MMMM yyyy', { locale: th })}</span>
                                        <button onClick={() => setViewMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight className="w-4 h-4" /></button>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1 mb-6">
                                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                                            <div key={day} className="text-[10px] font-black text-gray-300 text-center py-1 uppercase">{day}</div>
                                        ))}
                                        {calendarDays.map((date, i) => {
                                            const isSelected = (dateRange.start && isSameDay(date, dateRange.start)) || (dateRange.end && isSameDay(date, dateRange.end));
                                            const isInRange = dateRange.start && dateRange.end && isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
                                            const isCurrentMonth = isSameMonth(date, viewMonth);

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleDateClick(date)}
                                                    className={`
                                                        relative h-9 w-full flex items-center justify-center text-xs font-bold rounded-xl transition-all
                                                        ${!isCurrentMonth ? 'text-gray-200' : 'text-gray-600 hover:bg-indigo-50'}
                                                        ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md z-10' : ''}
                                                        ${isInRange && !isSelected ? 'bg-indigo-50 text-indigo-600 rounded-none first:rounded-l-xl last:rounded-r-xl' : ''}
                                                    `}
                                                >
                                                    {format(date, 'd')}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="h-px bg-gray-100 mb-4"></div>

                                    {/* Quick Selects */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleQuickDateSelect('THIS_MONTH')} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-[10px] font-black text-gray-500 hover:text-indigo-600 transition-colors text-center uppercase tracking-wider">เดือนนี้</button>
                                        <button onClick={() => handleQuickDateSelect('LAST_MONTH')} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-[10px] font-black text-gray-500 hover:text-indigo-600 transition-colors text-center uppercase tracking-wider">เดือนที่แล้ว</button>
                                        <button onClick={() => handleQuickDateSelect('LAST_90')} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-[10px] font-black text-gray-500 hover:text-indigo-600 transition-colors text-center uppercase tracking-wider">90 วันล่าสุด</button>
                                        <button onClick={() => handleQuickDateSelect('ALL')} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-[10px] font-black text-gray-400 hover:text-gray-700 transition-colors text-center uppercase tracking-wider">ทั้งหมด</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Channel Filter */}
                <div className="w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilterChannel('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${filterChannel === 'ALL' ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            รวมทุกช่อง
                        </button>
                        {channels.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setFilterChannel(c.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all flex items-center gap-2 ${filterChannel === c.id ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm ring-1 ring-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {c.logoUrl && <img src={c.logoUrl} className="w-4 h-4 rounded-full" />}
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Grid Content */}
            {isLoading ? (
                <div className="py-32 text-center text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</div>
            ) : paginatedGoals.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50/50">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Target className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold text-lg">ไม่พบเป้าหมายในช่วงนี้</p>
                    <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยนตัวกรอง หรือสร้างเป้าหมายใหม่</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedGoals.map(goal => (
                            <div key={goal.id} className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <GoalCard 
                                    goal={goal}
                                    channel={channels.find(c => c.id === goal.channelId)}
                                    users={users}
                                    currentUser={currentUser}
                                    onUpdate={() => setUpdatingGoal(goal)}
                                    onToggleOwner={toggleOwner}
                                    onDelete={deleteGoal}
                                    onEdit={(g) => { setEditingGoal(g); setIsCreateModalOpen(true); }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-100">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                หน้า {page} / {totalPages}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <GoalFormModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                initialData={editingGoal}
                channels={channels}
                onSave={handleSaveGoal}
            />

            {updatingGoal && (
                <UpdateProgressModal 
                    isOpen={!!updatingGoal}
                    onClose={() => setUpdatingGoal(null)}
                    goal={updatingGoal}
                    onUpdate={(val) => updateGoalValue(updatingGoal.id, val)}
                />
            )}

        </div>
    );
};

export default GoalView;
