
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ReviewSession, User, Task } from '../../types';
import { CheckCircle2, AlertTriangle, Clock, Activity, X, Calendar, LayoutList, User as UserIcon, MessageSquare } from 'lucide-react';
import { isToday, format } from 'date-fns';
import { th } from 'date-fns/locale';

interface QualityStatsWidgetProps {
    reviews: ReviewSession[];
    users: User[];
}

// --- Helper: Find Submitter ---
const getSubmitter = (task: Task | undefined, users: User[]) => {
    if (!task) return null;
    // Priority: Editor -> Assignee -> Idea Owner
    const id = task.editorIds?.[0] || task.assigneeIds?.[0] || task.ideaOwnerIds?.[0];
    return users.find(u => u.id === id);
}

// --- Enhanced Internal Modal ---
const StatDetailModal = ({ 
    isOpen, onClose, title, items, colorClass, icon: Icon, users 
}: { 
    isOpen: boolean; onClose: () => void; title: string; items: ReviewSession[]; colorClass: string; icon: any; users: User[] 
}) => {
    if (!isOpen) return null;

    // Extract base color name for gradients (e.g. 'text-yellow-600' -> 'yellow')
    const colorKey = colorClass.split('-')[1] || 'indigo';
    
    // Dynamic Gradient Background for Header
    const headerBg = `bg-gradient-to-r from-${colorKey}-500 to-${colorKey}-600`;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#f8fafc] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border-4 border-white ring-1 ring-white/20 relative">
                
                {/* Premium Header */}
                <div className={`px-6 py-6 border-b border-white/10 flex justify-between items-center text-white relative overflow-hidden ${headerBg}`}>
                    {/* Decor Pattern */}
                    <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12 -mr-4 -mt-4">
                        <Icon className="w-24 h-24" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-inner border border-white/10">
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight leading-none">{title}</h3>
                                <p className="text-white/80 text-xs font-bold mt-1 uppercase tracking-wide opacity-90">{items.length} รายการ</p>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="relative z-10 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-md">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300/50">
                    {items.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <LayoutList className="w-8 h-8 opacity-30" />
                            </div>
                            <p className="text-sm font-medium">ไม่มีรายการในหมวดนี้</p>
                        </div>
                    ) : (
                        items.map((r, idx) => {
                            const submitter = getSubmitter(r.task, users);
                            
                            return (
                                <div 
                                    key={r.id} 
                                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group animate-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Top Row: Title & Round */}
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1 leading-snug group-hover:text-indigo-600 transition-colors">
                                            {r.task?.title || 'Unknown Task'}
                                        </h4>
                                        <span className="shrink-0 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wide">
                                            Draft {r.round}
                                        </span>
                                    </div>

                                    {/* Submitter & Date Info */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                        
                                        {/* Submitter Profile */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                {submitter?.avatarUrl ? (
                                                    <img src={submitter.avatarUrl} className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm" alt={submitter.name} />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500 ring-2 ring-white">
                                                        <UserIcon className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">Submitted by</span>
                                                <span className="text-xs font-bold text-gray-700 leading-none mt-0.5">{submitter?.name.split(' ')[0] || 'Unknown'}</span>
                                            </div>
                                        </div>

                                        {/* Date Badge */}
                                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {format(new Date(r.scheduledAt), 'd MMM HH:mm', { locale: th })}
                                        </span>
                                    </div>

                                    {/* Feedback (Conditional) */}
                                    {r.feedback && (
                                        <div className="mt-3 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-start gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-red-600 font-medium italic line-clamp-2">
                                                "{r.feedback}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                
                {/* Footer Gradient Fade */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#f8fafc] to-transparent pointer-events-none"></div>
            </div>
        </div>,
        document.body
    );
};

const QualityStatsWidget: React.FC<QualityStatsWidgetProps> = ({ reviews, users }) => {
    // Filter Logic
    const pendingList = useMemo(() => reviews.filter(r => r.status === 'PENDING'), [reviews]);
    const passedTodayList = useMemo(() => reviews.filter(r => r.status === 'PASSED' && isToday(new Date(r.scheduledAt))), [reviews]);
    const reviseList = useMemo(() => reviews.filter(r => r.status === 'REVISE'), [reviews]);
    const overdueList = useMemo(() => reviews.filter(r => r.status === 'PENDING' && new Date(r.scheduledAt) < new Date() && !isToday(new Date(r.scheduledAt))), [reviews]);

    // Modal State
    const [activeModal, setActiveModal] = useState<{
        title: string;
        items: ReviewSession[];
        colorClass: string;
        icon: any;
    } | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                
                {/* 1. Pending Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการรอตรวจ (Pending)', items: pendingList, colorClass: 'text-yellow-600', icon: Clock })}
                    className="bg-white p-4 rounded-2xl border border-yellow-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-yellow-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-yellow-600 uppercase tracking-wide">รอตรวจ (Pending)</span>
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition-colors">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-800 mt-2 group-hover:text-yellow-600 transition-colors">{pendingList.length}</p>
                </div>

                {/* 2. Passed Today Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'ผ่านวันนี้ (Passed Today)', items: passedTodayList, colorClass: 'text-green-600', icon: CheckCircle2 })}
                    className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-green-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide">ผ่านวันนี้ (Passed)</span>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-800 mt-2 group-hover:text-green-600 transition-colors">{passedTodayList.length}</p>
                </div>

                {/* 3. Revise Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการสั่งแก้ (Revise)', items: reviseList, colorClass: 'text-red-600', icon: Activity })}
                    className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-red-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wide">สั่งแก้ (Revise)</span>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-800 mt-2 group-hover:text-red-600 transition-colors">{reviseList.length}</p>
                </div>

                {/* 4. Overdue Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการเลยกำหนด (Overdue)', items: overdueList, colorClass: 'text-orange-600', icon: AlertTriangle })}
                    className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-orange-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">เลยกำหนด (Overdue)</span>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-800 mt-2 group-hover:text-orange-600 transition-colors">{overdueList.length}</p>
                </div>
            </div>

            {/* Drill Down Modal */}
            <StatDetailModal 
                isOpen={!!activeModal}
                onClose={() => setActiveModal(null)}
                title={activeModal?.title || ''}
                items={activeModal?.items || []}
                colorClass={activeModal?.colorClass || ''}
                icon={activeModal?.icon || Clock}
                users={users}
            />
        </>
    );
};

export default QualityStatsWidget;
