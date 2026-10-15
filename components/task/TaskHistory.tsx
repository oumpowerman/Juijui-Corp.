
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskLog, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { History, Loader2, FileCheck, Calendar, Clock, Activity, Download, Filter, Users, HardDrive } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TimePickerModal from '../ui/TimePickerModal';
import DatePickerModal, { formatDisplayDate } from '../ui/DatePickerModal';

interface TaskHistoryProps {
    task: Task;
    currentUser?: User;
    onSaveTask: (task: Task) => void; 
}

type AuditFilterCategory = 'ALL' | 'STATUS_QC' | 'PEOPLE' | 'DATES' | 'FILES_STORAGE';

const TaskHistory: React.FC<TaskHistoryProps> = ({ task, currentUser, onSaveTask }) => {
    const { showAlert } = useGlobalDialog();
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [activeFilter, setActiveFilter] = useState<AuditFilterCategory>('ALL');
    
    // Booking State (Manual Booking)
    const [bookingRound, setBookingRound] = useState(1);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('14:00');
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Fetch Logs
    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoadingLogs(true);
            try {
                // Correctly switch filter column based on type
                const filterCol = task.type === 'CONTENT' ? 'content_id' : 'task_id';
                const { data, error } = await supabase
                    .from('task_logs')
                    .select(`
                        id, user_id, action, details, reason, metadata, created_at,
                        profiles(full_name, avatar_url)
                    `)
                    .eq(filterCol, task.id)
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    const mappedLogs: TaskLog[] = data.map((l: any) => {
                        const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
                        return {
                            id: l.id,
                            taskId: task.id,
                            userId: l.user_id,
                            action: l.action,
                            details: l.details,
                            reason: l.reason,
                            metadata: l.metadata || undefined,
                            createdAt: new Date(l.created_at),
                            user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined
                        };
                    });
                    setLogs(mappedLogs);
                }
            } catch (e) {
                console.error("Error fetching logs", e);
            } finally {
                setIsLoadingLogs(false);
            }
        };

        if (task.id) fetchLogs();
        
        // --- REALTIME SUBSCRIPTION FOR LOGS ---
        const filterCol = task.type === 'CONTENT' ? `content_id=eq.${task.id}` : `task_id=eq.${task.id}`;
        const channel = supabase
            .channel(`logs-${task.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'task_logs', filter: filterCol },
                (payload) => {
                    supabase
                        .from('task_logs')
                        .select(`id, user_id, action, details, reason, metadata, created_at, profiles(full_name, avatar_url)`)
                        .eq('id', payload.new.id)
                        .single()
                        .then(({ data }) => {
                            if (data) {
                                const logData = data as any;
                                const profile = Array.isArray(logData.profiles) ? logData.profiles[0] : logData.profiles;

                                const newLog: TaskLog = {
                                    id: logData.id,
                                    taskId: task.id,
                                    userId: logData.user_id,
                                    action: logData.action,
                                    details: logData.details,
                                    reason: logData.reason,
                                    metadata: logData.metadata || undefined,
                                    createdAt: new Date(logData.created_at),
                                    user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined
                                };
                                setLogs(prev => [newLog, ...prev]);
                            }
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [task.id, task.type]);

    const handleBookReview = async () => {
        if (!task || !bookingDate || !bookingTime) return;
        const scheduledAt = new Date(`${bookingDate}T${bookingTime}`);
        
        try {
            const { error } = await supabase.from('task_reviews').insert({
                [task.type === 'CONTENT' ? 'content_id' : 'task_id']: task.id,
                round: bookingRound,
                scheduled_at: scheduledAt.toISOString(),
                status: 'PENDING'
            });
            if (error) throw error;
            
            await supabase.from('task_logs').insert({
                [task.type === 'CONTENT' ? 'content_id' : 'task_id']: task.id,
                action: 'REVIEW_BOOKED',
                details: `จองคิวตรวจ Draft ${bookingRound} วันที่ ${format(scheduledAt, 'dd MMM HH:mm')}`,
                user_id: currentUser?.id,
                metadata: {
                    category: 'STATUS_QC',
                    round: bookingRound,
                    scheduledAt: scheduledAt.toISOString()
                }
            });

            onSaveTask({ ...task, status: 'FEEDBACK' });
            showAlert('จองคิวตรวจเรียบร้อย!', 'สำเร็จ');
        } catch (e) {
            showAlert('จองคิวไม่สำเร็จ', 'ข้อผิดพลาด');
        }
    };

    // Filter counts calculation
    const filterCounts = useMemo(() => {
        const counts: Record<AuditFilterCategory, number> = {
            ALL: logs.length,
            STATUS_QC: 0,
            PEOPLE: 0,
            DATES: 0,
            FILES_STORAGE: 0
        };

        logs.forEach(log => {
            const action = log.action || '';
            const details = log.details || '';
            const changes = log.metadata?.changes || [];

            if (
                action === 'STATUS_CHANGE' || action === 'REVIEW_BOOKED' || action === 'SENT_TO_QC' || 
                action === 'DELAYED' || action === 'CHECKLIST_TOGGLED' || details.includes('สถานะ') || 
                details.includes('ขั้นตอนย่อย') || changes.some(c => c.category === 'STATUS_QC')
            ) {
                counts.STATUS_QC++;
            }
            if (
                details.includes('ผู้รับผิดชอบ') || details.includes('คนตัดต่อ') || details.includes('เจ้าของไอเดีย') || 
                details.includes('คนช่วย') || changes.some(c => c.category === 'PEOPLE')
            ) {
                counts.PEOPLE++;
            }
            if (
                details.includes('กำหนดส่ง') || details.includes('วันเริ่ม') || details.includes('วันถ่าย') || 
                details.includes('เวลา') || changes.some(c => c.category === 'DATES')
            ) {
                counts.DATES++;
            }
            if (
                details.includes('ไฟล์แนบ') || details.includes('Local Path') || details.includes('Drive') || 
                details.includes('Storage') || changes.some(c => c.category === 'FILES_STORAGE')
            ) {
                counts.FILES_STORAGE++;
            }
        });

        return counts;
    }, [logs]);

    // Filtered logs
    const filteredLogs = useMemo(() => {
        if (activeFilter === 'ALL') return logs;

        return logs.filter(log => {
            const changes = log.metadata?.changes || [];
            if (changes.length > 0) {
                const matchCategory = changes.some(c => c.category === activeFilter);
                if (matchCategory) return true;
            }

            const action = log.action || '';
            const details = log.details || '';

            if (activeFilter === 'STATUS_QC') {
                return (
                    action === 'STATUS_CHANGE' || action === 'REVIEW_BOOKED' || action === 'SENT_TO_QC' || 
                    action === 'DELAYED' || action === 'CHECKLIST_TOGGLED' || details.includes('สถานะ') || 
                    details.includes('ขั้นตอนย่อย')
                );
            }
            if (activeFilter === 'PEOPLE') {
                return (
                    details.includes('ผู้รับผิดชอบ') || details.includes('คนตัดต่อ') || 
                    details.includes('เจ้าของไอเดีย') || details.includes('คนช่วย')
                );
            }
            if (activeFilter === 'DATES') {
                return (
                    details.includes('กำหนดส่ง') || details.includes('วันเริ่ม') || 
                    details.includes('วันถ่าย') || details.includes('เวลา')
                );
            }
            if (activeFilter === 'FILES_STORAGE') {
                return (
                    details.includes('ไฟล์แนบ') || details.includes('Local Path') || 
                    details.includes('Drive') || details.includes('Storage')
                );
            }
            return false;
        });
    }, [logs, activeFilter]);

    // Action badge style lookup
    const getActionBadge = (action: string) => {
        switch (action) {
            case 'STATUS_CHANGE':
                return { label: 'เปลี่ยนสถานะ', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
            case 'REVIEW_BOOKED':
                return { label: 'จองคิวตรวจ', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
            case 'SENT_TO_QC':
                return { label: 'ส่งตรวจงาน', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', dot: 'bg-fuchsia-500' };
            case 'CHECKLIST_TOGGLED':
                return { label: 'ขั้นตอนย่อย', bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' };
            case 'DELAYED':
                return { label: 'เลื่อนกำหนดส่ง', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
            case 'UPDATED':
                return { label: 'แก้ไขข้อมูล', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' };
            default:
                return { label: action.replace('_', ' '), bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
        }
    };

    // Export CSV with UTF-8 BOM
    const handleExportCSV = () => {
        if (!logs.length) return;

        const headers = ['ลำดับ', 'วันเวลา', 'ประเภทกิจกรรม', 'ผู้ดำเนินการ', 'รายละเอียด', 'เหตุผล/หมายเหตุ'];
        const rows = logs.map((log, index) => [
            index + 1,
            format(log.createdAt, 'yyyy-MM-dd HH:mm:ss'),
            log.action,
            log.user?.name || 'ระบบ',
            `"${(log.details || '').replace(/"/g, '""')}"`,
            `"${(log.reason || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeTitle = (task.title || 'task').replace(/[/\\?%*:|"<>]/g, '_').trim();
        link.setAttribute('href', url);
        link.setAttribute('download', `Audit_Log_${safeTitle}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                                            <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLatest ? 'text-purple-600' : 'text-gray-500'}`}>
                                                รอบที่ {review.round}
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

                <details className="mt-8 group">
                    <summary className="list-none flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors">
                        <span className="border-b border-dashed border-purple-300">จองคิวตรวจเอง</span>
                    </summary>
                    <div className="mt-4 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">รอบ (Draft)</label>
                                <select className="w-full p-2 rounded-lg border border-purple-200 text-sm bg-white" value={bookingRound} onChange={e => setBookingRound(Number(e.target.value))}>
                                    {[1,2,3,4,5].map(r => <option key={r} value={r}>รอบที่ {r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">เวลานัด</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsTimePickerOpen(true)}
                                    className="w-full p-2 rounded-lg border border-purple-200 text-sm bg-white text-left flex items-center justify-between"
                                >
                                    <span>{bookingTime || '--:--'}</span>
                                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                                </button>
                            </div>
                        </div>
                        <div className="mb-3">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">วันที่</label>
                                <button
                                    type="button"
                                    onClick={() => setIsDatePickerOpen(true)}
                                    className="w-full p-2 rounded-lg border border-purple-200 text-sm bg-white text-left flex items-center justify-between font-bold text-purple-700"
                                >
                                    <span>{formatDisplayDate(bookingDate)}</span>
                                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                </button>
                        </div>
                        <button onClick={handleBookReview} className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-sm transition-all active:scale-95">
                            ยืนยันการจองคิว
                        </button>
                    </div>
                    
                    <DatePickerModal
                        isOpen={isDatePickerOpen}
                        onClose={() => setIsDatePickerOpen(false)}
                        selectedDate={bookingDate ? new Date(bookingDate) : undefined}
                        onSelect={(date) => {
                            if (date) {
                                setBookingDate(date.toISOString().split('T')[0]);
                            }
                        }}
                    />

                    <TimePickerModal 
                        isOpen={isTimePickerOpen}
                        onClose={() => setIsTimePickerOpen(false)}
                        initialTime={bookingTime}
                        onSelect={(time) => setBookingTime(time)}
                    />
                </details>
            </div>

            {/* 2. Audit Logs */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-200 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center">
                            <History className="w-4 h-4 mr-2 text-indigo-500" /> ประวัติการแก้ไข (Audit Logs)
                        </h3>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            {filteredLogs.length}
                        </span>
                    </div>

                    {logs.length > 0 && (
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
                            title="ดาวน์โหลดประวัติเป็นไฟล์ CSV"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export CSV</span>
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                {logs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {[
                            { key: 'ALL', label: 'ทั้งหมด', icon: Filter, count: filterCounts.ALL },
                            { key: 'STATUS_QC', label: 'สถานะ & ตรวจงาน', icon: FileCheck, count: filterCounts.STATUS_QC },
                            { key: 'PEOPLE', label: 'สมาชิก', icon: Users, count: filterCounts.PEOPLE },
                            { key: 'DATES', label: 'วันเวลา', icon: Calendar, count: filterCounts.DATES },
                            { key: 'FILES_STORAGE', label: 'ไฟล์ & ไดรฟ์', icon: HardDrive, count: filterCounts.FILES_STORAGE }
                        ].map((filterTab) => {
                            const isActive = activeFilter === filterTab.key;
                            return (
                                <button
                                    key={filterTab.key}
                                    onClick={() => setActiveFilter(filterTab.key as AuditFilterCategory)}
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none
                                        ${isActive 
                                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-500/20' 
                                            : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 border border-slate-200/50'}
                                    `}
                                >
                                    <filterTab.icon className="w-3 h-3" />
                                    <span>{filterTab.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        {filterTab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
                
                {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-xs font-medium">กำลังโหลดประวัติ...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                        <p className="text-sm font-medium">
                            {logs.length === 0 ? 'ยังไม่มีประวัติการแก้ไข' : 'ไม่มีรายการในหมวดหมู่ที่เลือก'}
                        </p>
                    </div>
                ) : (
                    <div className="relative pl-4 border-l-2 border-gray-100 space-y-6 pt-2">
                        {filteredLogs.map((log) => {
                            const badge = getActionBadge(log.action);
                            const hasStructuredChanges = log.metadata?.changes && Array.isArray(log.metadata.changes) && log.metadata.changes.length > 0;

                            return (
                                <div key={log.id} className="relative group animate-in slide-in-from-left-2 duration-300">
                                    <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-100 ${badge.dot}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}>
                                            {log.action === 'UPDATED' && <Activity className="w-3 h-3"/>}
                                            {badge.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono font-medium">{format(log.createdAt, 'dd/MM HH:mm')}</span>
                                    </div>
                                    
                                    {/* Visual Diff Rendering */}
                                    {hasStructuredChanges ? (
                                        <div className="flex flex-col gap-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                            {log.metadata!.changes!.map((change, idx) => (
                                                <div key={idx} className="flex flex-wrap items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-2xs">
                                                    <span className="font-semibold text-slate-700 shrink-0">{change.label}:</span>
                                                    
                                                    {change.old !== undefined && change.new !== undefined ? (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="line-through text-slate-400 text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50">
                                                                {change.old}
                                                            </span>
                                                            <span className="text-slate-400 text-[10px]">➔</span>
                                                            <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                {change.new}
                                                            </span>
                                                        </div>
                                                    ) : change.new !== undefined ? (
                                                        <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            {change.new}
                                                        </span>
                                                    ) : change.old !== undefined ? (
                                                        <span className="text-rose-700 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                                            {change.old}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600 font-medium">{log.details}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 group-hover:bg-white group-hover:shadow-xs transition-all whitespace-pre-wrap font-sans">
                                            {log.details}
                                        </p>
                                    )}
                                    
                                    {log.reason && (
                                        <div className="mt-1.5 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg w-fit border border-rose-100 font-medium">
                                            หมายเหตุ: {log.reason}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-1.5 mt-2">
                                        {log.user?.avatarUrl ? (
                                            <img src={log.user.avatarUrl} className="w-4 h-4 rounded-full object-cover shadow-xs" alt={log.user.name} />
                                        ) : (
                                            <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[8px] text-gray-500 font-bold">
                                                {log.user?.name?.charAt(0) || 'S'}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-400 font-medium">โดย {log.user?.name || 'ระบบ'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskHistory;
