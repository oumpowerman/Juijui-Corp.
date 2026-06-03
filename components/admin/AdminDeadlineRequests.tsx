import React, { useState, useMemo } from 'react';
import { User, Task } from '../../types';
import { Calendar, Clock, AlertTriangle, Flame, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { useNotificationContext } from '../../context/NotificationContext';
import AdminDeadlineRequestsModal from './AdminDeadlineRequestsModal';

interface AdminDeadlineRequestsProps {
    currentUser: User;
    users?: User[];
    tasks?: Task[];
}

const AdminDeadlineRequests: React.FC<AdminDeadlineRequestsProps> = ({ 
    currentUser, 
    users = [], 
    tasks = [] 
}) => {
    const { deadlineRequests: requests } = useNotificationContext();
    const [isCtrlOpen, setIsCtrlOpen] = useState(false);

    // Summary intelligence calculations for UI/UX elements
    const metrics = useMemo(() => {
        const total = requests.length;
        const now = new Date();
        
        const urgent = requests.filter(r => {
            const matchedTask = tasks.find(t => t.id === r.taskId);
            if (!matchedTask) return false;
            const originalEnd = new Date(matchedTask.endDate);
            return originalEnd.getTime() < now.getTime() || (originalEnd.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
        }).length;

        const longExtensions = requests.filter(r => {
            const matchedTask = tasks.find(t => t.id === r.taskId);
            if (!matchedTask) return false;
            const originalEnd = new Date(matchedTask.endDate);
            const diffDays = Math.ceil((r.newDeadline.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 7;
        }).length;

        const requestersCount: Record<string, number> = {};
        requests.forEach(r => {
            const name = r.user?.name || 'พนักงาน';
            requestersCount[name] = (requestersCount[name] || 0) + 1;
        });
        
        let topRequester = 'ไม่มี';
        let maxReqVal = 0;
        Object.entries(requestersCount).forEach(([name, count]) => {
            if (count > maxReqVal) {
                maxReqVal = count;
                topRequester = `${name} (${count} รายการ)`;
            }
        });

        return { total, urgent, longExtensions, topRequester };
    }, [requests, tasks]);

    return (
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-4 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-24 h-24 text-indigo-600" />
            </div>

            <div className="flex items-center justify-between gap-3 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                        <Calendar className="w-5 h-5 animate-pulse" />
                    </span>
                    <div className="text-left">
                        <h3 className="text-sm text-slate-800 font-bold">ศูนย์พิจารณาเลื่อนเดดไลน์</h3>
                        <p className="text-[10.5px] text-slate-400">รายการคำขอเลื่อนสิ้นสุดส่งตรงจากพนักงาน</p>
                    </div>
                </div>

                <span className="h-6 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] rounded-full flex items-center justify-center transition-colors font-semibold">
                    ค้างคา {requests.length} ราย
                </span>
            </div>

            {/* Micro Dashboard Insights row */}
            <div className="grid grid-cols-2 gap-2 text-left relative z-10">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase tracking-wider text-rose-500 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> ยื่นฉุกเฉิน
                    </span>
                    <p className="text-base text-slate-850 mt-1 font-bold">{metrics.urgent} คำขอ</p>
                    <p className="text-[8.5px] text-slate-400">เลื่อนภายในวันนี้/พรุ่งนี้</p>
                </div>
                
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-indigo-500 shrink-0" /> ส่งขอบ่อยสุด
                    </span>
                    <p className="text-xs text-slate-750 mt-1.5 truncate font-bold">{metrics.topRequester}</p>
                    <p className="text-[8.5px] text-slate-400">ชื่อและจำนวนสะสมรอบสัปดาห์</p>
                </div>
            </div>

            {/* Launch Command center overlay CTA button */}
            <button 
                onClick={() => setIsCtrlOpen(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 active:scale-99 transition-all text-center focus:outline-none font-bold"
            >
                <SlidersHorizontal className="w-4 h-4" /> 
                เปิดแผงควบคุมเลื่อนเดดไลน์ ({requests.length})
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Refactored separate Modal component */}
            <AdminDeadlineRequestsModal 
                isOpen={isCtrlOpen} 
                onClose={() => setIsCtrlOpen(false)} 
                currentUser={currentUser} 
                users={users} 
                tasks={tasks} 
                metrics={metrics}
            />
        </div>
    );
};

export default AdminDeadlineRequests;
