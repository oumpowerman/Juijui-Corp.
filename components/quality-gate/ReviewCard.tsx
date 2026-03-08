
import React from 'react';
import { ReviewSession, User, Task } from '../../types';
import { format, differenceInCalendarDays } from 'date-fns';
import { Star, Flame, AlertTriangle, Info, MessageSquare, ThumbsUp, Wrench, FileSearch, PlayCircle, ExternalLink, Clock, ShieldCheck, CalendarCheck, AlarmClock } from 'lucide-react';
import { DIFFICULTY_LABELS } from '../../constants';

interface ReviewCardProps {
    review: ReviewSession;
    users: User[];
    onAction: (id: string, action: 'PASS' | 'REVISE', taskId: string, task: Task) => void;
    onOpenTask: (task: Task) => void;
    getChannelName: (id?: string) => string;
    getStatusInfo: (statusKey: string) => { label: string, color: string };
    
    // New Props for context styling and permission
    isOverdue?: boolean;
    highlightRevise?: boolean;
    currentUser: User;
    canReview: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
    review, 
    users,
    onAction, 
    onOpenTask, 
    getChannelName,
    getStatusInfo,
    isOverdue,
    highlightRevise,
    currentUser,
    canReview
}) => {
    const today = new Date();
    // Helper to find the latest asset link
    const latestAsset = review.task?.assets && review.task.assets.length > 0 
        ? review.task.assets[review.task.assets.length - 1] 
        : null;

    const taskStatus = review.task?.status || 'UNKNOWN';
    const statusInfo = getStatusInfo(taskStatus);

    // Identify Assignee (Owner of the task)
    let taskAssigneeIds = review.task?.assigneeIds || [];
    if (taskAssigneeIds.length === 0 && review.task?.ideaOwnerIds && review.task.ideaOwnerIds.length > 0) {
        taskAssigneeIds = review.task.ideaOwnerIds;
    } else if (taskAssigneeIds.length === 0 && review.task?.editorIds && review.task.editorIds.length > 0) {
        taskAssigneeIds = review.task.editorIds;
    }

    const primaryAssignee = users.find(u => u.id === taskAssigneeIds[0]);

    // FIND REVIEWER (If reviewed)
    const reviewer = review.reviewerId ? users.find(u => u.id === review.reviewerId) : null;

    // Calculate XP
    const difficulty = review.task?.difficulty || 'MEDIUM';
    const estHours = review.task?.estimatedHours || 0;
    const baseXP = DIFFICULTY_LABELS[difficulty].xp;
    const bonusXP = Math.floor(estHours * 20);
    const totalXP = baseXP + bonusXP;

    // Admin Review Overdue Calculation
    const adminDaysLate = differenceInCalendarDays(today, review.scheduledAt);

    // --- NEW: Task Punctuality Logic (Does the user submit on time?) ---
    // Compare Submission Time (review.scheduledAt) vs Task Deadline (review.task.endDate)
    const getPunctualityBadge = () => {
        if (!review.task?.endDate) return null;
        
        const submitDate = new Date(review.scheduledAt);
        const deadlineDate = new Date(review.task.endDate);
        
        // Reset hours to compare dates fairly
        submitDate.setHours(0,0,0,0);
        deadlineDate.setHours(0,0,0,0);

        const diff = differenceInCalendarDays(deadlineDate, submitDate);

        if (diff < 0) {
            // Late
            const days = Math.abs(diff);
            return (
                <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100" title={`Deadline was ${format(deadlineDate, 'd MMM')}`}>
                    <AlarmClock className="w-3 h-3" /> Late {days} Days
                </span>
            );
        } else if (diff >= 1) {
            // Early Bird
            return (
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    <Flame className="w-3 h-3" /> Early Bird (+Bonus)
                </span>
            );
        } else {
            // On Time (Same Day)
            return (
                <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    <CalendarCheck className="w-3 h-3" /> On Time
                </span>
            );
        }
    };

    // Styling Logic
    const borderClass = isOverdue 
        ? 'border-rose-500/30 bg-rose-500/5 shadow-rose-500/10' 
        : highlightRevise 
            ? 'border-amber-500/30 bg-amber-500/5 shadow-amber-500/10' 
            : 'border-white/5 bg-slate-900/40 shadow-indigo-500/5';
    
    const statusColor = review.status === 'PENDING' ? 'bg-indigo-500' : review.status === 'REVISE' ? 'bg-rose-500' : 'bg-emerald-500';

    return (
        <div className={`p-6 rounded-[2rem] border backdrop-blur-xl shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col md:flex-row gap-6 items-start group relative overflow-hidden ring-1 ring-white/5 hover:ring-indigo-500/30 hover:-translate-y-1 ${borderClass}`}>
            
            {/* Status Strip on Left */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${statusColor} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            
            {/* Subtle Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

            {/* Time & Review Status Badge */}
            <div className="flex flex-col items-center min-w-[100px] text-center pt-1 pl-2 relative z-10">
                <span className="text-3xl font-black text-white leading-none italic tracking-tighter">{format(review.scheduledAt, 'HH:mm')}</span>
                <span className="text-[10px] text-indigo-400/60 font-black uppercase tracking-[0.3em] mt-1">{format(review.scheduledAt, 'dd MMM')}</span>
                
                {isOverdue ? (
                    <div className="mt-4 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black w-full border border-rose-500/30 shadow-lg shadow-rose-900/20 uppercase tracking-widest animate-pulse" title="แอดมินดองงาน (Admin Pending)">
                        +{adminDaysLate} Days Late
                    </div>
                ) : (
                    <div className={`mt-4 px-3 py-1.5 text-[10px] font-black rounded-xl border flex items-center justify-center gap-2 w-full uppercase tracking-widest shadow-lg ${
                        review.status === 'PENDING' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-indigo-900/20' :
                        review.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-900/20' :
                        'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-900/20'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            review.status === 'PENDING' ? 'bg-indigo-400' :
                            review.status === 'PASSED' ? 'bg-emerald-400' :
                            'bg-rose-400'
                        }`}></div>
                        {review.status === 'PENDING' ? 'Pending' : review.status === 'PASSED' ? 'Passed' : 'Revise'}
                    </div>
                )}
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0 space-y-4 relative z-10">
                
                {/* Header Line */}
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {isOverdue && <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center shadow-lg shadow-rose-900/40 italic uppercase tracking-tighter"><AlertTriangle className="w-3 h-3 mr-1"/> ADMIN DELAY</span>}
                        
                        <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-indigo-500/20 uppercase tracking-widest">
                            Draft {review.round}
                        </span>

                        {review.task?.channelId && (
                            <span className="text-[10px] text-indigo-300/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 font-black uppercase tracking-widest">
                                {getChannelName(review.task.channelId)}
                            </span>
                        )}
                        
                        {/* Punctuality Badge (Dynamic) */}
                        {getPunctualityBadge()}
                    </div>
                    <h4 
                        className="text-2xl font-black text-white hover:text-indigo-400 cursor-pointer leading-tight italic tracking-tight transition-colors"
                        onClick={() => review.task && onOpenTask(review.task)}
                    >
                        {review.task?.title || 'Unknown Task'}
                    </h4>
                </div>

                {/* Important & Caution Blocks */}
                {(review.task?.caution || review.task?.importance) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {review.task.caution && (
                            <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-2xl flex items-start gap-3 backdrop-blur-md group/caution hover:bg-amber-500/10 transition-colors">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 group-hover/caution:scale-110 transition-transform" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Caution</p>
                                    <p className="text-xs text-amber-200/80 leading-relaxed font-medium">{review.task.caution}</p>
                                </div>
                            </div>
                        )}
                        {review.task.importance && (
                            <div className="bg-indigo-500/5 border border-indigo-500/20 p-3.5 rounded-2xl flex items-start gap-3 backdrop-blur-md group/info hover:bg-indigo-500/10 transition-colors">
                                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 group-hover/info:scale-110 transition-transform" />
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mb-1">Key Point</p>
                                    <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">{review.task.importance}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Meta Row: XP, User, Asset */}
                <div className="flex items-center gap-4 pt-1 flex-wrap">
                    {/* XP Badge */}
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner" title={`Difficulty: ${difficulty}, Est: ${estHours}h`}>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-black text-indigo-100 uppercase tracking-widest">{totalXP} XP</span>
                        {difficulty === 'HARD' && <Flame className="w-4 h-4 text-rose-500 animate-pulse" />}
                    </div>

                    {/* Assignee Avatar */}
                    {primaryAssignee && (
                        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/5 pl-1.5 hover:bg-white/10 transition-colors cursor-pointer">
                            <img src={primaryAssignee.avatarUrl} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                            <span className="text-[10px] text-indigo-200/80 font-black uppercase tracking-widest pr-2">{primaryAssignee.name}</span>
                        </div>
                    )}

                    {/* Asset Link Shortcut */}
                    {latestAsset ? (
                        <a 
                            href={latestAsset.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center text-[10px] text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition-all border border-indigo-500/20 font-black uppercase tracking-widest ml-auto sm:ml-0 group/link"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PlayCircle className="w-4 h-4 mr-2 group-hover/link:scale-110 transition-transform" />
                            Review File
                            <ExternalLink className="w-3 h-3 ml-2 opacity-30" />
                        </a>
                    ) : (
                        <span className="inline-flex items-center text-[10px] text-indigo-400/40 bg-white/5 px-3 py-2 rounded-xl border border-white/5 ml-auto sm:ml-0 font-black uppercase tracking-widest">
                            ⚠️ No Assets Attached
                        </span>
                    )}
                </div>

                {review.feedback && (
                    <div className="text-sm text-rose-300 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 flex items-start gap-3 backdrop-blur-md">
                        <MessageSquare className="w-5 h-5 mt-0.5 shrink-0 text-rose-400" />
                        <div>
                            <span className="font-black block text-[10px] uppercase tracking-widest text-rose-500/60 mb-1">Latest Feedback:</span>
                            <p className="font-medium leading-relaxed">{review.feedback}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto mt-2 md:mt-0 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6 relative z-10">
                
                {/* SHOW REVIEWER IF COMPLETED */}
                {(review.status === 'PASSED' || review.status === 'REVISE') && reviewer && (
                     <div className="flex items-center gap-3 mb-2 p-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                         <img src={reviewer.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                         <div className="min-w-0">
                             <p className="text-[9px] text-indigo-400/40 font-black uppercase tracking-widest leading-none mb-1">Inspector</p>
                             <p className="text-xs font-black text-white truncate max-w-[100px] uppercase tracking-tight italic">{reviewer.name}</p>
                         </div>
                     </div>
                )}

                {/* ACTION BUTTONS (Only if Pending and Permission Granted) */}
                {review.status === 'PENDING' && review.task && (
                    canReview ? (
                        <>
                            <button 
                                onClick={() => onAction(review.id, 'PASS', review.taskId, review.task!)}
                                className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center transition-all shadow-xl shadow-emerald-900/40 active:scale-95 border border-emerald-400/30 italic"
                            >
                                <ThumbsUp className="w-4 h-4 mr-2" /> Pass
                            </button>
                            <button 
                                onClick={() => onAction(review.id, 'REVISE', review.taskId, review.task!)}
                                className="flex-1 md:flex-none px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center transition-all active:scale-95 border border-white/5 italic"
                            >
                                <Wrench className="w-4 h-4 mr-2" /> Revise
                            </button>
                        </>
                    ) : (
                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6 text-indigo-500/40 mx-auto mb-2" />
                            <p className="text-[9px] text-indigo-400/40 font-black uppercase tracking-widest">Awaiting Inspection</p>
                        </div>
                    )
                )}

                <button 
                    onClick={() => review.task && onOpenTask(review.task)}
                    className="flex-1 md:flex-none px-6 py-3.5 bg-white/5 hover:bg-white/10 text-indigo-200/60 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center transition-all border border-white/5 italic"
                >
                    <FileSearch className="w-4 h-4 mr-2" /> Details
                </button>
            </div>
        </div>
    );
};

export default ReviewCard;
