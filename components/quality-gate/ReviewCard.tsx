
import React from 'react';
import { ReviewSession, User, Task } from '../../types';
import { format } from 'date-fns';
import { Star, Flame, AlertTriangle, Info, MessageSquare, ThumbsUp, Wrench, FileSearch, PlayCircle, ExternalLink } from 'lucide-react';
import { DIFFICULTY_LABELS } from '../../constants';

interface ReviewCardProps {
    review: ReviewSession;
    users: User[];
    onAction: (id: string, action: 'PASS' | 'REVISE', taskId: string, task: Task) => void;
    onOpenTask: (task: Task) => void;
    getChannelName: (id?: string) => string;
    getStatusInfo: (statusKey: string) => { label: string, color: string }; 
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
    review, 
    users,
    onAction, 
    onOpenTask, 
    getChannelName,
    getStatusInfo
}) => {
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

    // Calculate XP
    const difficulty = review.task?.difficulty || 'MEDIUM';
    const estHours = review.task?.estimatedHours || 0;
    const baseXP = DIFFICULTY_LABELS[difficulty].xp;
    const bonusXP = Math.floor(estHours * 20);
    const totalXP = baseXP + bonusXP;

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start group relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
            
            {/* Status Strip on Left */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${review.status === 'PENDING' ? 'bg-yellow-400' : review.status === 'REVISE' ? 'bg-red-500' : 'bg-green-500'}`}></div>

            {/* Time & Review Status Badge */}
            <div className="flex flex-col items-center min-w-[80px] text-center pt-1 pl-2">
                <span className="text-2xl font-black text-gray-700 leading-none">{format(review.scheduledAt, 'HH:mm')}</span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">{format(review.scheduledAt, 'dd MMM')}</span>
                <div className={`mt-3 px-2.5 py-1 text-[10px] font-black rounded-full border flex items-center justify-center gap-1 w-full ${
                    review.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    review.status === 'PASSED' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {review.status === 'PENDING' ? 'รอตรวจ' : review.status === 'PASSED' ? 'ผ่าน' : 'แก้'}
                </div>
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0 space-y-3">
                
                {/* Header Line */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
                            Draft {review.round}
                        </span>
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-medium">
                            {getChannelName(review.task?.channelId)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <h4 
                        className="text-lg font-bold text-gray-800 hover:text-indigo-600 cursor-pointer leading-snug"
                        onClick={() => review.task && onOpenTask(review.task)}
                    >
                        {review.task?.title || 'Unknown Task'}
                    </h4>
                </div>

                {/* Important & Caution Blocks */}
                {(review.task?.caution || review.task?.importance) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {review.task.caution && (
                            <div className="bg-orange-50/70 border border-orange-100 p-2.5 rounded-xl flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-orange-700 uppercase">ข้อควรระวัง (Caution)</p>
                                    <p className="text-xs text-orange-800 leading-relaxed">{review.task.caution}</p>
                                </div>
                            </div>
                        )}
                        {review.task.importance && (
                            <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-xl flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700 uppercase">สิ่งที่สำคัญ (Key Point)</p>
                                    <p className="text-xs text-blue-800 leading-relaxed">{review.task.importance}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Meta Row: XP, User, Asset */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                    {/* XP Badge */}
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100" title={`Difficulty: ${difficulty}, Est: ${estHours}h`}>
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-black text-gray-600">{totalXP} XP</span>
                        {difficulty === 'HARD' && <Flame className="w-3.5 h-3.5 text-red-500" />}
                    </div>

                    {/* Assignee Avatar */}
                    {primaryAssignee && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 pl-1">
                            <img src={primaryAssignee.avatarUrl} className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-[10px] text-gray-600 font-bold pr-1">{primaryAssignee.name}</span>
                        </div>
                    )}

                    {/* Asset Link Shortcut */}
                    {latestAsset ? (
                        <a 
                            href={latestAsset.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors border border-blue-100 font-bold ml-auto sm:ml-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                            เปิดไฟล์ล่าสุด
                            <ExternalLink className="w-3 h-3 ml-1.5 opacity-50" />
                        </a>
                    ) : (
                        <span className="inline-flex items-center text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 ml-auto sm:ml-0">
                            ⚠️ ยังไม่แนบไฟล์
                        </span>
                    )}
                </div>

                {review.feedback && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold block text-xs uppercase opacity-70 mb-0.5">Feedback ล่าสุด:</span>
                            {review.feedback}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                {review.status === 'PENDING' && review.task && (
                    <>
                        <button 
                            onClick={() => onAction(review.id, 'PASS', review.taskId, review.task!)}
                            className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-sm shadow-emerald-200 active:scale-95"
                        >
                            <ThumbsUp className="w-4 h-4 mr-2" /> ผ่าน (Pass)
                        </button>
                        <button 
                            onClick={() => onAction(review.id, 'REVISE', review.taskId, review.task!)}
                            className="flex-1 md:flex-none px-5 py-2.5 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95"
                        >
                            <Wrench className="w-4 h-4 mr-2" /> แก้ (Revise)
                        </button>
                    </>
                )}
                <button 
                    onClick={() => review.task && onOpenTask(review.task)}
                    className="flex-1 md:flex-none px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                >
                    <FileSearch className="w-4 h-4 mr-2" /> ดูรายละเอียด
                </button>
            </div>
        </div>
    );
};

export default ReviewCard;
