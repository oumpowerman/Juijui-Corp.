
import React, { useState } from 'react';
import { useReviews } from '../hooks/useReviews';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { CheckCircle2, AlertTriangle, Clock, Search, ChevronRight, FileSearch, X, MessageSquare, ThumbsUp, Wrench, Filter, ExternalLink, PlayCircle } from 'lucide-react';
import { Channel, Task, ReviewSession, Status } from '../types';
import MentorTip from './MentorTip';
import { supabase } from '../lib/supabase'; // Import supabase for direct task update

interface QualityGateViewProps {
    channels: Channel[];
    onOpenTask: (task: Task) => void;
}

// Define Props Interface explicitly
interface ReviewCardProps {
    review: ReviewSession;
    onAction: (id: string, action: 'PASS' | 'REVISE', taskId: string) => void;
    onOpenTask: (task: Task) => void;
    getChannelName: (id?: string) => string;
}

// Use React.FC to include standard props like 'key'
const ReviewCard: React.FC<ReviewCardProps> = ({ 
    review, 
    onAction, 
    onOpenTask, 
    getChannelName 
}) => {
    // Helper to find the latest asset link
    const latestAsset = review.task?.assets && review.task.assets.length > 0 
        ? review.task.assets[review.task.assets.length - 1] 
        : null;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center group">
            {/* Time & Status Badge */}
            <div className="flex flex-col items-center min-w-[80px] text-center">
                <span className="text-lg font-black text-gray-700">{format(review.scheduledAt, 'HH:mm')}</span>
                <span className="text-xs text-gray-400 font-medium">{format(review.scheduledAt, 'dd MMM')}</span>
                <span className={`mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    review.status === 'PASSED' ? 'bg-green-100 text-green-700 border-green-200' :
                    'bg-red-100 text-red-700 border-red-200'
                }`}>
                    {review.status}
                </span>
            </div>

            {/* Task Info */}
            <div className="flex-1 border-l border-gray-100 pl-4 md:pl-6 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold">Draft {review.round}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{getChannelName(review.task?.channelId)}</span>
                </div>
                <h4 
                    className="text-base font-bold text-gray-800 hover:text-indigo-600 cursor-pointer mb-1 truncate"
                    onClick={() => review.task && onOpenTask(review.task)}
                >
                    {review.task?.title || 'Unknown Task'}
                </h4>
                
                {/* Asset Link Shortcut */}
                {latestAsset ? (
                    <a 
                        href={latestAsset.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg mt-1 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <PlayCircle className="w-3 h-3 mr-1" />
                        ไฟล์ล่าสุด: {latestAsset.name}
                        <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                ) : (
                    <span className="inline-flex items-center text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg mt-1">
                        ⚠️ ยังไม่แนบไฟล์
                    </span>
                )}

                {review.feedback && (
                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mt-2 inline-block max-w-full break-words">
                        💬 <b>Feedback:</b> {review.feedback}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                {review.status === 'PENDING' && (
                    <>
                        <button 
                            onClick={() => onAction(review.id, 'PASS', review.taskId)}
                            className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-sm"
                        >
                            <ThumbsUp className="w-3 h-3 mr-1.5" /> ผ่าน (Pass)
                        </button>
                        <button 
                            onClick={() => onAction(review.id, 'REVISE', review.taskId)}
                            className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center justify-center transition-colors"
                        >
                            <Wrench className="w-3 h-3 mr-1.5" /> แก้ (Revise)
                        </button>
                    </>
                )}
                <button 
                    onClick={() => review.task && onOpenTask(review.task)}
                    className="flex-1 md:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center transition-colors"
                >
                    <FileSearch className="w-3 h-3 mr-1.5" /> ดูงาน
                </button>
            </div>
        </div>
    );
};

const QualityGateView: React.FC<QualityGateViewProps> = ({ channels, onOpenTask }) => {
    const { reviews, isLoading, updateReviewStatus } = useReviews();
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVISE' | 'PASSED'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');

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

    // Updated Handler: Syncs Task Status
    const handleQuickAction = async (reviewId: string, action: 'PASS' | 'REVISE', taskId: string) => {
        if (action === 'PASS') {
            if(confirm('ยืนยันให้ผ่าน (Approve) และเปลี่ยนสถานะงานเป็น DONE?')) {
                // 1. Update Review
                await updateReviewStatus(reviewId, 'PASSED');
                // 2. Sync Task Status -> DONE (or APPROVE based on your flow)
                await supabase.from('tasks').update({ status: 'DONE' }).eq('id', taskId);
                
                // Add Log
                await supabase.from('task_logs').insert({
                    task_id: taskId,
                    action: 'STATUS_CHANGE',
                    details: 'Quality Gate: PASSED -> Status set to DONE'
                });
            }
        } else {
            const feedback = prompt('ระบุสิ่งที่ต้องแก้ (Feedback):');
            if (feedback) {
                // 1. Update Review
                await updateReviewStatus(reviewId, 'REVISE', feedback);
                // 2. Sync Task Status -> EDIT_DRAFT_2 (or generic EDIT/DOING)
                // Logic: If current is Draft 1, maybe move to Edit Draft 2? 
                // For simplicity, let's move back to "EDIT_DRAFT_1" or "DOING" to signal work needed.
                await supabase.from('tasks').update({ status: 'DOING' }).eq('id', taskId);

                // Add Log
                await supabase.from('task_logs').insert({
                    task_id: taskId,
                    action: 'STATUS_CHANGE',
                    details: `Quality Gate: REVISE -> ${feedback}`
                });
            }
        }
    };

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name || 'Unknown Channel';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="purple" messages={[
                "Tip หัวหน้า: กด 'Pass' จะเปลี่ยนสถานะงานเป็น Done ให้เลย ไม่ต้องไปแก้ซ้ำซ้อน", 
                "Tip: กด 'Revise' งานจะเด้งกลับไป Doing ให้ทีมงานแก้ต่อทันที"
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
                                    onAction={handleQuickAction} 
                                    onOpenTask={onOpenTask} 
                                    getChannelName={getChannelName} 
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
                                    onAction={handleQuickAction} 
                                    onOpenTask={onOpenTask} 
                                    getChannelName={getChannelName} 
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
                                        onAction={handleQuickAction} 
                                        onOpenTask={onOpenTask} 
                                        getChannelName={getChannelName} 
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
                                        onAction={handleQuickAction} 
                                        onOpenTask={onOpenTask} 
                                        getChannelName={getChannelName} 
                                    />
                                ))}
                                {groupedReviews.upcoming.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีคิวตรวจล่วงหน้า</p>}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default QualityGateView;
