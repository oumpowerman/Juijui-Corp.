
import React, { useState, useEffect } from 'react';
import { Task, TaskLog, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { History, Loader2, FileCheck, Calendar, Clock } from 'lucide-react';

interface TaskHistoryProps {
    task: Task;
    currentUser?: User;
    onSaveTask: (task: Task) => void; 
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ task, currentUser, onSaveTask }) => {
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    
    // Booking State (Manual Booking)
    const [bookingRound, setBookingRound] = useState(1);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('14:00');

    // Fetch Logs
    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoadingLogs(true);
            try {
                const filterCol = task.type === 'CONTENT' ? 'content_id' : 'task_id';
                const { data, error } = await supabase
                    .from('task_logs')
                    .select(`
                        id, user_id, action, details, reason, created_at,
                        profiles(full_name, avatar_url)
                    `)
                    .eq(filterCol, task.id)
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    const mappedLogs: TaskLog[] = data.map((l: any) => ({
                        id: l.id,
                        taskId: task.id,
                        userId: l.user_id,
                        action: l.action,
                        details: l.details,
                        reason: l.reason,
                        createdAt: new Date(l.created_at),
                        user: l.profiles ? { name: l.profiles.full_name, avatarUrl: l.profiles.avatar_url } : undefined
                    }));
                    setLogs(mappedLogs);
                }
            } catch (e) {
                console.error("Error fetching logs", e);
            } finally {
                setIsLoadingLogs(false);
            }
        };

        if (task.id) fetchLogs();
    }, [task.id]);

    const handleBookReview = async () => {
        if (!task || !bookingDate || !bookingTime) return;
        const scheduledAt = new Date(`${bookingDate}T${bookingTime}`);
        
        try {
            const { error } = await supabase.from('task_reviews').insert({
                task_id: task.id,
                round: bookingRound,
                scheduled_at: scheduledAt.toISOString(),
                status: 'PENDING'
            });
            if (error) throw error;
            
            await supabase.from('task_logs').insert({
                task_id: task.id,
                action: 'REVIEW_BOOKED',
                details: `จองคิวตรวจ Draft ${bookingRound} วันที่ ${format(scheduledAt, 'dd MMM HH:mm')}`,
                user_id: currentUser?.id
            });

            onSaveTask({ ...task, status: 'FEEDBACK' });
            alert('จองคิวตรวจเรียบร้อย!');
        } catch (e) {
            alert('จองคิวไม่สำเร็จ');
        }
    };

    return (
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 space-y-8">
            
            {/* 1. Quality Gate Timeline */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-purple-100 p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-6 flex items-center">
                    <FileCheck className="w-6 h-6 mr-2 text-purple-600" /> 
                    Timeline การส่งตรวจ (Quality Gate)
                </h3>
                
                <div className="relative pl-6 space-y-8">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-purple-100 rounded-full"></div>

                    {task.reviews?.length === 0 && (
                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            ยังไม่มีประวัติการส่งตรวจ
                        </div>
                    )}
                    
                    {task.reviews?.slice().reverse().map((review, index) => {
                        const isLatest = index === 0;
                        return (
                            <div key={review.id} className="relative">
                                {/* Dot Indicator */}
                                <div className={`absolute -left-[21px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                                    review.status === 'PASSED' ? 'bg-green-500' :
                                    review.status === 'REVISE' ? 'bg-red-500' :
                                    'bg-yellow-400'
                                }`}>
                                    {isLatest && <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-inherit"></div>}
                                </div>

                                <div className={`p-4 rounded-2xl border transition-all ${isLatest ? 'bg-white border-purple-200 shadow-md transform scale-[1.01]' : 'bg-gray-50 border-gray-100 opacity-80'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black uppercase tracking-wider mb-1 ${isLatest ? 'text-purple-600' : 'text-gray-500'}`}>
                                                DRAFT {review.round}
                                            </span>
                                            <div className="flex items-center text-sm font-bold text-gray-800">
                                                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                                                {format(review.scheduledAt, 'd MMM yyyy')}
                                                <span className="text-gray-300 mx-2">|</span>
                                                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                                {format(review.scheduledAt, 'HH:mm')}
                                            </div>
                                        </div>
                                        
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            review.status === 'PASSED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            review.status === 'REVISE' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {review.status === 'PASSED' ? 'ผ่านแล้ว ✅' :
                                             review.status === 'REVISE' ? 'ต้องแก้ไข 🛠️' :
                                             'รอตรวจ ⏳'}
                                        </span>
                                    </div>

                                    {/* Feedback Box */}
                                    {review.feedback && (
                                        <div className="mt-3 bg-white p-3 rounded-xl border-l-4 border-red-200 shadow-sm text-sm text-gray-700 relative">
                                            <p className="font-bold text-red-500 text-[10px] uppercase mb-1">Feedback:</p>
                                            "{review.feedback}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Manual Booking Toggle */}
                <details className="mt-8 group">
                    <summary className="list-none flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors">
                        <span className="border-b border-dashed border-purple-300">จองคิวตรวจเอง (Manual Booking)</span>
                    </summary>
                    <div className="mt-4 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">รอบ (Draft)</label>
                                <select className="w-full p-2 rounded-lg border border-purple-200 text-sm bg-white" value={bookingRound} onChange={e => setBookingRound(Number(e.target.value))}>
                                    {[1,2,3,4,5].map(r => <option key={r} value={r}>Draft {r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">เวลานัด</label>
                                <input type="time" className="w-full p-2 rounded-lg border border-purple-200 text-sm" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="mb-3">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">วันที่</label>
                                <input type="date" className="w-full p-2 rounded-lg border border-purple-200 text-sm" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                        </div>
                        <button onClick={handleBookReview} className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-sm transition-all active:scale-95">
                            ยืนยันการจองคิว
                        </button>
                    </div>
                </details>
            </div>

            {/* 2. Audit Logs */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center">
                    <History className="w-4 h-4 mr-2" /> ประวัติการแก้ไข (Audit Logs)
                </h3>
                
                {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-xs">กำลังโหลด...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                        <p className="text-sm">ยังไม่มีประวัติการแก้ไข</p>
                    </div>
                ) : (
                    <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                        {logs.map((log) => (
                            <div key={log.id} className="relative group">
                                <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-100 ${
                                    log.action === 'DELAYED' ? 'bg-orange-400' : 
                                    log.action === 'SENT_TO_QC' ? 'bg-purple-400' :
                                    log.action === 'STATUS_CHANGE' ? 'bg-blue-400' :
                                    'bg-gray-300'
                                }`}></div>
                                
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-700">{log.action.replace('_', ' ')}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{format(log.createdAt, 'dd/MM HH:mm')}</span>
                                </div>
                                
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    {log.details}
                                </p>
                                
                                {log.reason && (
                                    <div className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded w-fit border border-red-100">
                                        Note: {log.reason}
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-1.5 mt-2">
                                    {log.user?.avatarUrl ? (
                                        <img src={log.user.avatarUrl} className="w-4 h-4 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[8px] text-gray-500 font-bold">
                                            {log.user?.name?.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-medium">by {log.user?.name || 'System'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskHistory;
