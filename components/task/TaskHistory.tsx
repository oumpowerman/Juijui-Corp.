
import React, { useState, useEffect } from 'react';
import { Task, TaskLog, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { format, addHours } from 'date-fns';
import { History, Loader2, FileCheck, ThumbsUp, Wrench } from 'lucide-react';

interface TaskHistoryProps {
    task: Task;
    currentUser?: User;
    onSaveTask: (task: Task) => void; // Need to update task status from here
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ task, currentUser, onSaveTask }) => {
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    
    // Booking State
    const [bookingRound, setBookingRound] = useState(1);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('14:00');
    
    // Review Action State
    const [reviseNote, setReviseNote] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

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

    // Handlers from original TaskModal
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

            // Update status via parent prop to ensure consistent state
            onSaveTask({ ...task, status: 'FEEDBACK' });
            alert('จองคิวตรวจเรียบร้อย!');
        } catch (e) {
            alert('จองคิวไม่สำเร็จ');
        }
    };

    return (
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 space-y-6">
            {/* 1. Review History (Quality Gate) */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <FileCheck className="w-5 h-5 mr-2" /> ประวัติการส่งตรวจ (Quality Gate)
                </h3>
                
                {/* Render Reviews List */}
                <div className="space-y-4 mb-6">
                    {task.reviews?.length === 0 && <p className="text-sm text-gray-400 text-center italic">ยังไม่มีประวัติการส่งตรวจ</p>}
                    
                    {task.reviews?.slice().reverse().map((review) => (
                        <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Draft {review.round}</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">{format(review.scheduledAt, 'd MMM yyyy, HH:mm')}</p>
                                    </div>
                                </div>
                                {review.status === 'PENDING' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">รอตรวจ</span>}
                                {review.status === 'PASSED' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ผ่านแล้ว ✅</span>}
                                {review.status === 'REVISE' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">ต้องแก้ไข 🛠️</span>}
                            </div>
                            
                            {/* FEEDBACK COMMENT SECTION */}
                            {review.feedback && (
                                <div className="mt-2 bg-white p-3 rounded-lg border border-red-100 text-sm text-gray-700 relative">
                                    <div className="absolute -top-2 left-4 w-3 h-3 bg-white border-t border-l border-red-100 transform rotate-45"></div>
                                    <p className="font-bold text-red-600 text-xs mb-1">คอมเมนต์จากหัวหน้า:</p>
                                    "{review.feedback}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Manual Booking Form */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-sm font-bold text-purple-900 mb-3">จองคิวตรวจเอง (Manual):</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">รอบ (Draft)</label>
                            <select className="w-full p-2 rounded-lg border border-purple-200 text-sm" value={bookingRound} onChange={e => setBookingRound(Number(e.target.value))}>
                                <option value={1}>Draft 1</option>
                                <option value={2}>Draft 2</option>
                                <option value={3}>Draft 3</option>
                                <option value={4}>Final</option>
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
                    <button onClick={handleBookReview} className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-sm">ยืนยันการจองคิว</button>
                </div>
            </div>

            {/* 2. Audit Log */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">ประวัติการทำงาน (System Logs)</h3>
                {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-xs">กำลังโหลด...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>ยังไม่มีประวัติการแก้ไข</p>
                    </div>
                ) : (
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                        {logs.map((log) => (
                            <div key={log.id} className="relative">
                                <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 border-white ${log.action === 'DELAYED' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${log.action === 'DELAYED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                                        <span className="text-xs text-gray-400">{format(log.createdAt, 'dd/MM HH:mm')}</span>
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium">{log.details}</p>
                                    {log.reason && <p className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded-lg">Reason: {log.reason}</p>}
                                    <div className="flex items-center gap-1 mt-2">
                                        {log.user?.avatarUrl ? <img src={log.user.avatarUrl} className="w-4 h-4 rounded-full" /> : <div className="w-4 h-4 bg-gray-200 rounded-full"></div>}
                                        <span className="text-[10px] text-gray-500">by {log.user?.name || 'Unknown'}</span>
                                    </div>
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
