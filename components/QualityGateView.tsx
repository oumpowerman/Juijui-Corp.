
import React, { useState, useMemo } from 'react';
import { useReviews } from '../hooks/useReviews';
import { useQualityActions } from '../hooks/useQualityActions';
import { isToday, isTomorrow, isPast, isFuture, differenceInCalendarDays, isSameDay } from 'date-fns';
import { Clock, Search, Filter, AlertTriangle, Info, CheckCircle2, ChevronDown, ChevronRight, LayoutList, Layers, Calendar } from 'lucide-react';
import { Channel, Task, MasterOption, User } from '../types';
import MentorTip from './MentorTip';
import ReviewCard from './quality-gate/ReviewCard';
import ReviewActionModal from './quality-gate/ReviewActionModal';
import QualityStatsWidget from './quality-gate/QualityStatsWidget';
import InfoModal from './ui/InfoModal';
import QualityGuide from './quality-gate/QualityGuide';
import AppBackground from './common/AppBackground';

interface QualityGateViewProps {
    channels: Channel[];
    users: User[]; 
    masterOptions: MasterOption[]; 
    onOpenTask: (task: Task) => void;
    currentUser: User;
    tasks: Task[]; // Use global tasks as source of truth
}

type GroupType = 'CRITICAL' | 'REVISE' | 'TODAY' | 'UPCOMING';

const QualityGateView: React.FC<QualityGateViewProps> = ({ channels, users, masterOptions, onOpenTask, currentUser, tasks }) => {
    const { reviews, isLoading, updateReviewStatus } = useReviews();
    const { handleConfirmAction } = useQualityActions();
    
    // --- UI State ---
    const [filterDateType, setFilterDateType] = useState<'ALL_PENDING' | 'TODAY' | 'OVERDUE'>('ALL_PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    // Accordion State
    const [collapsedGroups, setCollapsedGroups] = useState<Record<GroupType, boolean>>({
        'CRITICAL': false,
        'REVISE': false,
        'TODAY': false,
        'UPCOMING': true 
    });

    // Modal State
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, type: 'PASS' | 'REVISE' | null, reviewId: string, taskId: string, task?: Task }>({
        isOpen: false,
        type: null,
        reviewId: '',
        taskId: '',
        task: undefined
    });

    // --- Core Logic: Re-hydrating Review Sessions with Authoritative Task Data ---
    const enrichedReviews = useMemo(() => {
        return reviews.map(r => {
            // Find the most up-to-date version of this task from the global array
            const authoritativeTask = tasks.find(t => t.id === r.taskId);
            return {
                ...r,
                // Replace the potentially stale task info from useReviews fetch 
                // with the authoritative one from TaskContext
                task: authoritativeTask || r.task 
            };
        });
    }, [reviews, tasks]);

    // 1. DEDUPLICATION LOGIC: Group by Task ID and keep only the LATEST Round
    const uniqueReviews = useMemo(() => {
        const latestReviewsMap = new Map<string, typeof enrichedReviews[0]>();
        
        enrichedReviews.forEach(r => {
            if (!r.task) return;
            const existing = latestReviewsMap.get(r.taskId);
            if (!existing || r.round > existing.round) {
                latestReviewsMap.set(r.taskId, r);
            }
        });

        return Array.from(latestReviewsMap.values());
    }, [enrichedReviews]);

    // 2. Apply Filters
    const filteredReviews = useMemo(() => {
        const today = new Date();
        return uniqueReviews.filter(r => {
            if (filterChannel !== 'ALL' && r.task?.channelId !== filterChannel) return false;
            
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchTitle = r.task?.title.toLowerCase().includes(searchLower);
                if (!matchTitle) return false;
            }

            if (filterDateType === 'TODAY') {
                return isSameDay(r.scheduledAt, today) && r.status === 'PENDING';
            }
            if (filterDateType === 'OVERDUE') {
                return isPast(r.scheduledAt) && !isSameDay(r.scheduledAt, today) && r.status === 'PENDING';
            }
            
            return r.status !== 'PASSED';
        });
    }, [uniqueReviews, filterChannel, searchTerm, filterDateType]);

    // Grouping Logic
    const groups = useMemo(() => {
        const today = new Date();
        const result = {
            critical: [] as typeof filteredReviews,
            revise: [] as typeof filteredReviews,
            today: [] as typeof filteredReviews,
            upcoming: [] as typeof filteredReviews
        };

        filteredReviews.forEach(r => {
            const isOverdue = isPast(r.scheduledAt) && !isSameDay(r.scheduledAt, today);
            
            if (r.status === 'REVISE') {
                result.revise.push(r);
            } else if (r.status === 'PENDING') {
                if (isOverdue) {
                    result.critical.push(r);
                } else if (isSameDay(r.scheduledAt, today)) {
                    result.today.push(r);
                } else {
                    result.upcoming.push(r);
                }
            }
        });

        return result;
    }, [filteredReviews]);

    const toggleGroup = (group: GroupType) => {
        setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const getStatusInfo = (statusKey: string) => {
        const option = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === statusKey);
        if (option) {
            return { label: option.label, color: option.color || 'bg-gray-100 text-gray-500' };
        }
        return { label: statusKey, color: 'bg-gray-100 text-gray-500' };
    };

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name || 'Unknown';

    const handleActionClick = (reviewId: string, action: 'PASS' | 'REVISE', taskId: string, task: Task) => {
        setModalConfig({ isOpen: true, type: action, reviewId, taskId, task });
    };

    const onConfirmModal = async (feedback?: string, adjustment: number = 0) => {
        const success = await handleConfirmAction(
            modalConfig.reviewId,
            modalConfig.type!,
            modalConfig.taskId,
            modalConfig.task,
            feedback,
            updateReviewStatus,
            currentUser.id,
            adjustment // Pass the manual adjustment
        );
        if (success) setModalConfig({ ...modalConfig, isOpen: false });
    };

    const totalActiveTasks = groups.critical.length + groups.revise.length + groups.today.length;
    const canReview = currentUser.role === 'ADMIN' || ['Senior', 'Manager', 'Head'].some(role => (currentUser.position || '').includes(role));

    return (
        <AppBackground theme="inspector" pattern="grid" className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 p-4 md:p-8 min-h-screen">
            <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative z-10">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    {/* Post-it Mentor Tip */}
                    <div className="transform -rotate-1 hover:rotate-0 transition-transform duration-300 max-w-2xl">
                        <MentorTip variant="purple" messages={[
                            "Tip: เริ่มเคลียร์จาก 'Critical' ก่อน เพราะคืองานที่เลยกำหนดแล้ว", 
                            "งาน 'Revise' คือน้องๆ แก้มาส่งใหม่ อย่าลืมเข้าไปดูนะ",
                            "กด 'Pass' เพื่ออนุมัติและแจก XP ให้ทีมงานทันที! 🎉"
                        ]} />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-3xl shadow-2xl border border-indigo-500/20 backdrop-blur-md">
                                <Layers className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white flex items-center tracking-tight italic uppercase">
                                    Inspector's Desk <span className="ml-3 text-indigo-500 not-italic">🔍</span>
                                </h1>
                                <p className="text-indigo-400/60 mt-1 font-black uppercase tracking-[0.3em] text-xs">
                                    Quality Gate Control Center
                                </p>
                            </div>
                            <button onClick={() => setIsInfoOpen(true)} className="p-2 text-indigo-400/40 hover:text-indigo-400 hover:bg-white/5 rounded-full transition-colors mt-1">
                                <Info className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <QualityStatsWidget reviews={uniqueReviews} users={users} />

                    {/* Holographic Controls */}
                    <div className="bg-slate-900/60 backdrop-blur-2xl p-4 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col xl:flex-row gap-4 sticky top-4 z-30 ring-1 ring-white/5">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                            <input 
                                type="text" 
                                placeholder="SCANNING FOR TASKS..." 
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-black/40 border border-white/5 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-black text-indigo-100 placeholder:text-indigo-900 uppercase tracking-widest"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
                            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shrink-0">
                                <button onClick={() => setFilterDateType('ALL_PENDING')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterDateType === 'ALL_PENDING' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-indigo-400/40 hover:text-indigo-400'}`}>
                                    Pending ({totalActiveTasks})
                                </button>
                                <button onClick={() => setFilterDateType('TODAY')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterDateType === 'TODAY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-indigo-400/40 hover:text-indigo-400'}`}>
                                    Today
                                </button>
                                <button onClick={() => setFilterDateType('OVERDUE')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterDateType === 'OVERDUE' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'text-indigo-400/40 hover:text-rose-400'}`}>
                                    Overdue ({groups.critical.length})
                                </button>
                            </div>

                            <div className="w-px h-10 bg-white/5 mx-1"></div>

                            <div className="relative shrink-0">
                                <select 
                                    className="appearance-none bg-black/40 border border-white/5 text-indigo-400 py-3 pl-5 pr-12 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    value={filterChannel}
                                    onChange={(e) => setFilterChannel(e.target.value)}
                                >
                                    <option value="ALL">All Channels</option>
                                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/30 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center text-indigo-500/40 font-black uppercase tracking-[0.5em] animate-pulse">Initialising Scan...</div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-32 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/5 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Desk Cleared! 🎉</h3>
                            <p className="text-indigo-400/40 font-black uppercase tracking-widest text-xs mt-2">All quality gates passed. No pending reviews.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {groups.critical.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500">
                                    <button onClick={() => toggleGroup('CRITICAL')} className="flex items-center justify-between w-full mb-6 group">
                                        <h3 className="text-xl font-black text-rose-500 flex items-center bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" /> 
                                            Critical / Overdue ({groups.critical.length})
                                        </h3>
                                        <div className="h-px bg-rose-500/10 flex-1 mx-6 group-hover:bg-rose-500/30 transition-colors"></div>
                                        {collapsedGroups['CRITICAL'] ? <ChevronRight className="text-rose-500/40" /> : <ChevronDown className="text-rose-500/40" />}
                                    </button>
                                    {!collapsedGroups['CRITICAL'] && (
                                        <div className="grid grid-cols-1 gap-6">
                                            {groups.critical.map(r => (
                                                <ReviewCard 
                                                    key={r.id} review={r} users={users}
                                                    onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                    getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                    isOverdue={true}
                                                    currentUser={currentUser}
                                                    canReview={canReview}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {groups.revise.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-100">
                                    <button onClick={() => toggleGroup('REVISE')} className="flex items-center justify-between w-full mb-6 group">
                                        <h3 className="text-xl font-black text-amber-500 flex items-center bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <LayoutList className="w-6 h-6 mr-3" /> 
                                            Revision Queue ({groups.revise.length})
                                        </h3>
                                        <div className="h-px bg-amber-500/10 flex-1 mx-6 group-hover:bg-amber-500/30 transition-colors"></div>
                                        {collapsedGroups['REVISE'] ? <ChevronRight className="text-amber-500/40" /> : <ChevronDown className="text-amber-500/40" />}
                                    </button>
                                    {!collapsedGroups['REVISE'] && (
                                        <div className="grid grid-cols-1 gap-6">
                                            {groups.revise.map(r => (
                                                <ReviewCard 
                                                    key={r.id} review={r} users={users}
                                                    onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                    getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                    highlightRevise={true}
                                                    currentUser={currentUser}
                                                    canReview={canReview}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {groups.today.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-150">
                                    <button onClick={() => toggleGroup('TODAY')} className="flex items-center justify-between w-full mb-6 group">
                                        <h3 className="text-xl font-black text-indigo-400 flex items-center bg-indigo-500/10 px-6 py-3 rounded-2xl border border-indigo-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <Clock className="w-6 h-6 mr-3" /> 
                                            Today's Inspection ({groups.today.length})
                                        </h3>
                                        <div className="h-px bg-indigo-500/10 flex-1 mx-6 group-hover:bg-indigo-500/30 transition-colors"></div>
                                        {collapsedGroups['TODAY'] ? <ChevronRight className="text-indigo-400/40" /> : <ChevronDown className="text-indigo-400/40" />}
                                    </button>
                                    {!collapsedGroups['TODAY'] && (
                                        <div className="grid grid-cols-1 gap-6">
                                            {groups.today.map(r => (
                                                <ReviewCard 
                                                    key={r.id} review={r} users={users}
                                                    onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                    getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                    currentUser={currentUser}
                                                    canReview={canReview}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {groups.upcoming.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-200">
                                    <button onClick={() => toggleGroup('UPCOMING')} className="flex items-center justify-between w-full mb-6 group opacity-50 hover:opacity-100 transition-opacity">
                                        <h3 className="text-md font-black text-indigo-400/60 flex items-center bg-white/5 px-6 py-3 rounded-2xl border border-white/5 italic uppercase tracking-widest">
                                            <Calendar className="w-5 h-5 mr-3" /> 
                                            Upcoming Queue ({groups.upcoming.length})
                                        </h3>
                                        <div className="h-px bg-white/5 flex-1 mx-6 border-dashed border-b border-white/10"></div>
                                        {collapsedGroups['UPCOMING'] ? <ChevronRight className="text-indigo-400/20" /> : <ChevronDown className="text-indigo-400/20" />}
                                    </button>
                                    {!collapsedGroups['UPCOMING'] && (
                                        <div className="grid grid-cols-1 gap-6 opacity-60">
                                            {groups.upcoming.map(r => (
                                                <ReviewCard 
                                                    key={r.id} review={r} users={users}
                                                    onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                    getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                    currentUser={currentUser}
                                                    canReview={canReview}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </div>

                <ReviewActionModal 
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    actionType={modalConfig.type}
                    task={modalConfig.task} // Pass task object for calculation
                    onConfirm={onConfirmModal}
                    masterOptions={masterOptions} // PASS MASTER OPTIONS
                />

                <InfoModal 
                    isOpen={isInfoOpen}
                    onClose={() => setIsInfoOpen(false)}
                    title="คู่มือห้องตรวจงาน (Quality Gate)"
                >
                    <QualityGuide />
                </InfoModal>
            </div>
        </AppBackground>
    );
};

export default QualityGateView;
