
import React, { useState, useMemo } from 'react';
import { Goal, Channel, User } from '../types';
import { useGoals } from '../hooks/useGoals';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import GoalStatsHeader from './goal/GoalStatsHeader';
import GoalCard from './goal/GoalCard';
import { GoalFormModal, UpdateProgressModal } from './goal/GoalActionModals';
import { Plus, Filter, Calendar, ChevronLeft, ChevronRight, LayoutGrid, List, Target } from 'lucide-react';
import { format, isSameMonth, addMonths, startOfMonth } from 'date-fns';
import th from 'date-fns/locale/th';

interface GoalViewProps {
    channels: Channel[];
    users: User[];
    currentUser: User;
}

const ITEMS_PER_PAGE = 9;

const GoalView: React.FC<GoalViewProps> = ({ channels, users, currentUser }) => {
    const { goals, addGoal, updateGoalValue, deleteGoal, toggleOwner, toggleBoost, isLoading } = useGoals(currentUser);
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);
    
    // Filter State
    const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [filterMonth, setFilterMonth] = useState<Date | null>(null); // Null = All Time
    
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

            // 3. Month Filter (Based on Deadline)
            if (filterMonth) {
                if (!isSameMonth(new Date(g.deadline), filterMonth)) return false;
            }

            return true;
        }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [goals, filterTab, filterChannel, filterMonth]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredGoals.length / ITEMS_PER_PAGE);
    const paginatedGoals = filteredGoals.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleSaveGoal = (data: any) => {
        if (editingGoal) {
            // In a real implementation, you would call updateGoal here.
            // For now, we simulate or you might need to add updateGoal to your hook.
            console.warn("Update not fully implemented in hook, add update logic.");
        } else {
            addGoal(data);
        }
    };

    // Reset page when filters change
    useMemo(() => {
        setPage(1);
    }, [filterTab, filterChannel, filterMonth]);

    const handleMonthChange = (direction: 'PREV' | 'NEXT') => {
        if (!filterMonth) {
            setFilterMonth(new Date()); // Initialize to today if null
        } else {
            setFilterMonth(prev => addMonths(prev!, direction === 'NEXT' ? 1 : -1));
        }
    };

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
                
                <GoalStatsHeader goals={goals} />
            </div>

            {/* 2. Controls & Filters */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-4 z-30 backdrop-blur-md bg-white/90">
                
                {/* Left: Tab & Month */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
                        <button onClick={() => setFilterTab('ACTIVE')} className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${filterTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Active</button>
                        <button onClick={() => setFilterTab('COMPLETED')} className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${filterTab === 'COMPLETED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Completed</button>
                        <button onClick={() => setFilterTab('ALL')} className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${filterTab === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All History</button>
                    </div>

                    {/* Month Picker */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm w-full md:w-auto justify-between md:justify-start">
                        <button onClick={() => handleMonthChange('PREV')} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setFilterMonth(filterMonth ? null : new Date())} className="px-3 text-xs font-bold text-gray-700 min-w-[120px] text-center hover:bg-gray-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            {filterMonth ? format(filterMonth, 'MMMM yyyy', { locale: th }) : 'ทุกช่วงเวลา (All Time)'}
                        </button>
                        <button onClick={() => handleMonthChange('NEXT')} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
