
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

    const onConfirmModal = async (feedback?: string) => {
        const success = await handleConfirmAction(
            modalConfig.reviewId,
            modalConfig.type!,
            modalConfig.taskId,
            modalConfig.task,
            feedback,
            updateReviewStatus,
            currentUser.id
        );
        if (success) setModalConfig({ ...modalConfig, isOpen: false });
    };

    const totalActiveTasks = groups.critical.length + groups.revise.length + groups.today.length;
    const canReview = currentUser.role === 'ADMIN' || ['Senior', 'Manager', 'Head'].some(role => (currentUser.position || '').includes(role));

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="purple" messages={[
                "Tip: เริ่มเคลียร์จาก 'Critical' ก่อน เพราะคืองานที่เลยกำหนดแล้ว", 
                "งาน 'Revise' คือน้องๆ แก้มาส่งใหม่ อย่าลืมเข้าไปดูนะ",
                "กด 'Pass' เพื่ออนุมัติและแจก XP ให้ทีมงานทันที! 🎉"
            ]} />

            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            ห้องตรวจงาน 🔍
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">
                            Quality Gate Control Center
                        </p>
                    </div>
                    <button onClick={() => setIsInfoOpen(true)} className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors mt-1">
                        <Info className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <QualityStatsWidget reviews={uniqueReviews} users={users} />

            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row gap-3 sticky top-2 z-30">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหางาน, ชื่อคลิป..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-bold text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
                    <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                        <button onClick={() => setFilterDateType('ALL_PENDING')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterDateType === 'ALL_PENDING' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            งานรอตรวจ ({totalActiveTasks})
                        </button>
                        <button onClick={() => setFilterDateType('TODAY')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterDateType === 'TODAY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            เฉพาะวันนี้
                        </button>
                        <button onClick={() => setFilterDateType('OVERDUE')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterDateType === 'OVERDUE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            งานค้าง ({groups.critical.length})
                        </button>
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-1"></div>

                    <div className="relative shrink-0">
                        <select 
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl text-xs font-bold cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            value={filterChannel}
                            onChange={(e) => setFilterChannel(e.target.value)}
                        >
                            <option value="ALL">📺 ทุกช่องทาง</option>
                            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-gray-400">กำลังโหลดรายการ...</div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700">เคลียร์คิวหมดแล้ว! 🎉</h3>
                    <p className="text-gray-400">ไม่มีงานค้างรอตรวจ พักผ่อนได้เลยครับ</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {groups.critical.length > 0 && (
                        <section className="animate-in slide-in-from-left-4 duration-500">
                            <button onClick={() => toggleGroup('CRITICAL')} className="flex items-center justify-between w-full mb-4 group">
                                <h3 className="text-lg font-bold text-red-600 flex items-center bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm">
                                    <AlertTriangle className="w-5 h-5 mr-2 animate-pulse" /> 
                                    ด่วน / เลยกำหนด ({groups.critical.length})
                                </h3>
                                <div className="h-px bg-red-100 flex-1 mx-4 group-hover:bg-red-200 transition-colors"></div>
                                {collapsedGroups['CRITICAL'] ? <ChevronRight className="text-red-300" /> : <ChevronDown className="text-red-300" />}
                            </button>
                            {!collapsedGroups['CRITICAL'] && (
                                <div className="grid grid-cols-1 gap-4">
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
                            <button onClick={() => toggleGroup('REVISE')} className="flex items-center justify-between w-full mb-4 group">
                                <h3 className="text-lg font-bold text-orange-600 flex items-center bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 shadow-sm">
                                    <LayoutList className="w-5 h-5 mr-2" /> 
                                    กำลังแก้ไข (Revise) ({groups.revise.length})
                                </h3>
                                <div className="h-px bg-orange-100 flex-1 mx-4 group-hover:bg-orange-200 transition-colors"></div>
                                {collapsedGroups['REVISE'] ? <ChevronRight className="text-orange-300" /> : <ChevronDown className="text-orange-300" />}
                            </button>
                            {!collapsedGroups['REVISE'] && (
                                <div className="grid grid-cols-1 gap-4">
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
                            <button onClick={() => toggleGroup('TODAY')} className="flex items-center justify-between w-full mb-4 group">
                                <h3 className="text-lg font-black text-indigo-700 flex items-center bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                                    <Clock className="w-5 h-5 mr-2" /> 
                                    คิวตรวจวันนี้ ({groups.today.length})
                                </h3>
                                <div className="h-px bg-indigo-100 flex-1 mx-4 group-hover:bg-indigo-200 transition-colors"></div>
                                {collapsedGroups['TODAY'] ? <ChevronRight className="text-indigo-300" /> : <ChevronDown className="text-indigo-300" />}
                            </button>
                            {!collapsedGroups['TODAY'] && (
                                <div className="grid grid-cols-1 gap-4">
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
                            <button onClick={() => toggleGroup('UPCOMING')} className="flex items-center justify-between w-full mb-4 group opacity-70 hover:opacity-100 transition-opacity">
                                <h3 className="text-md font-bold text-gray-500 flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                                    <Calendar className="w-4 h-4 mr-2" /> 
                                    คิวล่วงหน้า ({groups.upcoming.length})
                                </h3>
                                <div className="h-px bg-gray-200 flex-1 mx-4 border-dashed border-b border-gray-300"></div>
                                {collapsedGroups['UPCOMING'] ? <ChevronRight className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                            </button>
                            {!collapsedGroups['UPCOMING'] && (
                                <div className="grid grid-cols-1 gap-4 opacity-80">
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

            <ReviewActionModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                actionType={modalConfig.type}
                onConfirm={onConfirmModal}
            />

            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือห้องตรวจงาน (Quality Gate)"
            >
                <QualityGuide />
            </InfoModal>
        </div>
    );
};

export default QualityGateView;
