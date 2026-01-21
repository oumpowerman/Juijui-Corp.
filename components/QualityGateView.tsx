
import React, { useState } from 'react';
import { useReviews } from '../hooks/useReviews';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { CheckCircle2, AlertTriangle, Clock, Search, FileSearch, ThumbsUp, Wrench, Filter, ExternalLink, PlayCircle, X, MessageSquare, Check, User as UserIcon, Send, Info, Star, Flame } from 'lucide-react';
import { Channel, Task, ReviewSession, MasterOption, User } from '../types';
import { DIFFICULTY_LABELS } from '../constants';
import MentorTip from './MentorTip';
import { supabase } from '../lib/supabase';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useToast } from '../context/ToastContext'; // Import Toast

interface QualityGateViewProps {
    channels: Channel[];
    users: User[]; // Users list to map avatars
    masterOptions: MasterOption[]; 
    onOpenTask: (task: Task) => void;
}

// Define Props Interface explicitly
interface ReviewCardProps {
    review: ReviewSession;
    users: User[];
    onAction: (id: string, action: 'PASS' | 'REVISE', taskId: string, task: Task) => void; // Pass Task object
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
    // Fallback logic if task type is CONTENT
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
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start group relative overflow-hidden">
            
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

// Internal Modal for Review Actions
const ReviewActionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    actionType: 'PASS' | 'REVISE' | null;
    onConfirm: (feedback?: string) => void;
}> = ({ isOpen, onClose, actionType, onConfirm }) => {
    const [feedback, setFeedback] = useState('');

    if (!isOpen || !actionType) return null;

    const isPass = actionType === 'PASS';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className={`bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 ${isPass ? 'border-green-50' : 'border-red-50'} overflow-hidden`}>
                <div className={`p-4 border-b flex justify-between items-center ${isPass ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <h3 className={`font-bold flex items-center ${isPass ? 'text-green-800' : 'text-red-800'}`}>
                        {isPass ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Wrench className="w-5 h-5 mr-2" />}
                        {isPass ? 'ยืนยันให้ผ่าน (Pass)' : 'ส่งกลับแก้ไข (Revise)'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 font-medium">
                        {isPass 
                            ? 'งานนี้จะถูกเปลี่ยนสถานะเป็น "DONE" และระบบจะแจก XP ให้ทีมงานทันที ยืนยันหรือไม่?' 
                            : 'กรุณาระบุสิ่งที่ต้องแก้ไข เพื่อแจ้งให้ทีมทราบ:'}
                    </p>
                    
                    {!isPass && (
                        <div className="relative">
                            <MessageSquare className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                            <textarea 
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none text-sm min-h-[100px] resize-none"
                                placeholder="เช่น เสียงเบาไปนิด, สีเพี้ยนช่วงนาทีที่ 2..."
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2.5 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                            ยกเลิก
                        </button>
                        <button 
                            onClick={() => onConfirm(feedback)}
                            className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center ${isPass ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                        >
                            {isPass ? <Check className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            ยืนยัน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const QualityGateView: React.FC<QualityGateViewProps> = ({ channels, users, masterOptions, onOpenTask }) => {
    const { reviews, isLoading, updateReviewStatus } = useReviews();
    const { showConfirm, showAlert } = useGlobalDialog();
    const { showToast } = useToast();
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVISE' | 'PASSED'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, type: 'PASS' | 'REVISE' | null, reviewId: string, taskId: string, task?: Task }>({
        isOpen: false,
        type: null,
        reviewId: '',
        taskId: '',
        task: undefined
    });

    const filteredReviews = reviews.filter(r => {
        const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
        const taskTitle = r.task?.title || '';
        const matchesSearch = taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const groupedReviews = {
        overdue: filteredReviews.filter(r => isPast(r.scheduledAt) && !isToday(r.scheduledAt) && r.status === 'PENDING'),
        today: filteredReviews.filter(r => isToday(r.scheduledAt)),
        tomorrow: filteredReviews.filter(r => isTomorrow(r.scheduledAt)),
        upcoming: filteredReviews.filter(r => isFuture(r.scheduledAt) && !isTomorrow(r.scheduledAt) && !isToday(r.scheduledAt)),
    };

    const getStatusInfo = (statusKey: string) => {
        const option = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === statusKey);
        if (option) {
            return {
                label: option.label,
                color: option.color || 'bg-gray-100 text-gray-500'
            };
        }
        return { label: statusKey, color: 'bg-gray-100 text-gray-500' };
    };

    // XP Update Helper Function (Replicated directly here for Quality Gate)
    const distributeXP = async (task: Task) => {
        try {
            const baseXP = DIFFICULTY_LABELS[task.difficulty || 'MEDIUM'].xp;
            const hourlyBonus = Math.floor((task.estimatedHours || 0) * 20);
            const isLate = new Date() > new Date(task.endDate);
            const penalty = isLate ? 50 : 0;
            const finalXP = Math.max(10, (baseXP + hourlyBonus) - penalty);

            const peopleToReward = new Set([
                ...(task.assigneeIds || []),
                ...(task.ideaOwnerIds || []),
                ...(task.editorIds || [])
            ]);

            // Execute XP updates
            for (const userId of Array.from(peopleToReward)) {
                // Fetch current user data
                const { data: user, error: getError } = await supabase
                    .from('profiles')
                    .select('xp, available_points')
                    .eq('id', userId)
                    .single();
                
                if (getError) continue; // Skip if error

                let newXP = (user.xp || 0) + finalXP;
                let newPoints = (user.available_points || 0) + finalXP;
                let newLevel = Math.floor(newXP / 1000) + 1;

                await supabase
                    .from('profiles')
                    .update({ xp: newXP, level: newLevel, available_points: newPoints })
                    .eq('id', userId);
            }
            
            showToast(`🎉 อนุมัติและแจก +${finalXP} XP ให้ทีมงานแล้ว!`, 'success');
        } catch (err) {
            console.error("XP Distribution Error:", err);
        }
    };

    const handleActionClick = (reviewId: string, action: 'PASS' | 'REVISE', taskId: string, task: Task) => {
        setModalConfig({
            isOpen: true,
            type: action,
            reviewId,
            taskId,
            task
        });
    };

    const handleConfirmAction = async (feedback?: string) => {
        const { type, reviewId, taskId, task } = modalConfig;
        const tableName = task?.type === 'CONTENT' ? 'contents' : 'tasks';
        
        if (type === 'PASS') {
            await updateReviewStatus(reviewId, 'PASSED');
            await supabase.from(tableName).update({ status: 'DONE' }).eq('id', taskId);
            await supabase.from('task_logs').insert({
                task_id: task?.type !== 'CONTENT' ? taskId : null,
                content_id: task?.type === 'CONTENT' ? taskId : null,
                action: 'STATUS_CHANGE',
                details: 'Quality Gate: PASSED -> Status set to DONE'
            });

            // Trigger XP Distribution
            if (task) {
                await distributeXP(task);
            }

        } else {
            if (!feedback?.trim()) {
                alert("กรุณาระบุสิ่งที่ต้องแก้ไข");
                return;
            }
            await updateReviewStatus(reviewId, 'REVISE', feedback);
            await supabase.from(tableName).update({ status: 'DOING' }).eq('id', taskId);
            await supabase.from('task_logs').insert({
                task_id: task?.type !== 'CONTENT' ? taskId : null,
                content_id: task?.type === 'CONTENT' ? taskId : null,
                action: 'STATUS_CHANGE',
                details: `Quality Gate: REVISE -> ${feedback}`
            });
        }
        
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="purple" messages={[
                "Tip หัวหน้า: กด 'Pass' จะเปลี่ยนสถานะเป็น Done และแจก XP ให้ลูกทีมทันที! 🎉", 
                "Tip: กด 'Revise' งานจะเด้งกลับไป Doing พร้อมคอมเมนต์ เพื่อให้แก้ไขต่อ",
                "Dropdown ด้านล่าง 'รอตรวจ/กำลังแก้' คือสถานะของคิวตรวจ ไม่ใช่สถานะงานนะ"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        ห้องตรวจงาน 🔍 (Quality Gate)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        จัดการคิวตรวจ Draft และอนุมัติงานแบบ Real-time
                    </p>
                </div>
                
                {/* Search & Filters */}
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหางาน..." 
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <select 
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl text-sm font-bold cursor-pointer focus:outline-none focus:border-indigo-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="PENDING">⏳ รอตรวจ (Pending)</option>
                            <option value="REVISE">🛠️ กำลังแก้ (Revise)</option>
                            <option value="PASSED">✅ ผ่านแล้ว (Passed)</option>
                            <option value="ALL">📋 ทั้งหมด (All)</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-8">
                
                {/* 1. Overdue (Warning) */}
                {groupedReviews.overdue.length > 0 && (
                    <div className="space-y-3 animate-pulse-slow">
                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" /> เลยกำหนดตรวจ (Overdue)
                        </h3>
                        <div className="space-y-3">
                            {groupedReviews.overdue.map(r => (
                                <ReviewCard 
                                    key={r.id} 
                                    review={r} 
                                    users={users}
                                    onAction={handleActionClick} 
                                    onOpenTask={onOpenTask} 
                                    getChannelName={getChannelName} 
                                    getStatusInfo={getStatusInfo}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Today */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center bg-indigo-50 w-fit px-3 py-1 rounded-lg">
                        <Clock className="w-4 h-4 mr-2" /> วันนี้ (Today)
                    </h3>
                    {groupedReviews.today.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                            ไม่มีคิวตรวจงานวันนี้ จุ๊ยๆ เลย 🍹
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {groupedReviews.today.map(r => (
                                <ReviewCard 
                                    key={r.id} 
                                    review={r} 
                                    users={users}
                                    onAction={handleActionClick} 
                                    onOpenTask={onOpenTask} 
                                    getChannelName={getChannelName} 
                                    getStatusInfo={getStatusInfo}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Tomorrow & Upcoming */}
                {(groupedReviews.tomorrow.length > 0 || groupedReviews.upcoming.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">วันพรุ่งนี้ (Tomorrow)</h3>
                            <div className="space-y-3">
                                {groupedReviews.tomorrow.map(r => (
                                    <ReviewCard 
                                        key={r.id} 
                                        review={r} 
                                        users={users}
                                        onAction={handleActionClick} 
                                        onOpenTask={onOpenTask} 
                                        getChannelName={getChannelName} 
                                        getStatusInfo={getStatusInfo}
                                    />
                                ))}
                                {groupedReviews.tomorrow.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีคิวตรวจ</p>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">เร็วๆ นี้ (Upcoming)</h3>
                            <div className="space-y-3">
                                {groupedReviews.upcoming.map(r => (
                                    <ReviewCard 
                                        key={r.id} 
                                        review={r} 
                                        users={users}
                                        onAction={handleActionClick} 
                                        onOpenTask={onOpenTask} 
                                        getChannelName={getChannelName} 
                                        getStatusInfo={getStatusInfo}
                                    />
                                ))}
                                {groupedReviews.upcoming.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีคิวตรวจล่วงหน้า</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            <ReviewActionModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                actionType={modalConfig.type}
                onConfirm={handleConfirmAction}
            />
        </div>
    );
};

export default QualityGateView;
