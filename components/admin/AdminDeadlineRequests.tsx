import React, { useState, useMemo } from 'react';
import { User, Task } from '../../types';
import { Calendar, AlertTriangle, UserCheck, ExternalLink } from 'lucide-react';
import { useNotificationContext } from '../../context/NotificationContext';
import AdminDeadlineRequestsModal from './AdminDeadlineRequestsModal';
import { getCalendarDayDiff } from '../../utils/dateUtils';
import { formatDisplayDate } from '../ui/DatePickerModal';

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

    const metrics = useMemo(() => {
        const total = requests.length;
        const now = new Date();

        const urgent = requests.filter((r) => {
            const originalEnd = r.originalDeadline ? new Date(r.originalDeadline) : null;
            if (!originalEnd) return false;
            return originalEnd.getTime() < now.getTime() || originalEnd.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
        }).length;

        const longExtensions = requests.filter((r) => {
            if (!r.originalDeadline) return false;
            return getCalendarDayDiff(r.originalDeadline, r.newDeadline) >= 7;
        }).length;

        const assignedToMe = requests.filter((r) => !r.approverId || r.approverId === currentUser.id).length;

        const requestersCount: Record<string, number> = {};
        requests.forEach((r) => {
            const name = r.user?.name || 'พนักงาน';
            requestersCount[name] = (requestersCount[name] || 0) + 1;
        });

        let topRequester = 'ไม่มี';
        let maxReqVal = 0;
        Object.entries(requestersCount).forEach(([name, count]) => {
            if (count > maxReqVal) {
                maxReqVal = count;
                topRequester = `${name} (${count})`;
            }
        });

        return { total, urgent, longExtensions, assignedToMe, topRequester };
    }, [requests, currentUser.id]);

    const hasPending = requests.length > 0;

    return (
        <div
            id="deadline-requests-widget"
            className={`rounded-3xl border p-5 sm:p-6 space-y-4 relative overflow-hidden text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                hasPending
                    ? 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 border-rose-200/80 shadow-sm'
                    : 'bg-white border-slate-200/70 shadow-2xs'
            }`}
        >
            {/* Widget Header */}
            <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border ${
                            hasPending
                                ? 'bg-rose-100/80 text-rose-700 border-rose-200/80'
                                : 'bg-slate-50 text-slate-400 border-slate-200/70'
                        }`}
                    >
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                            คำขอเลื่อนกำหนดส่งงาน
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {hasPending ? 'มีคำขอจากทีมที่รอการพิจารณา' : 'ไม่มีคำขอค้างพิจารณาในขณะนี้'}
                        </p>
                    </div>
                </div>

                <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold shrink-0 tabular-nums border ${
                        hasPending
                            ? 'bg-rose-100/80 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200/70'
                    }`}
                >
                    {hasPending ? `รอพิจารณา ${requests.length}` : 'เรียบร้อย'}
                </span>
            </div>

            {/* Summary KPI Row */}
            <div className="grid grid-cols-2 gap-2.5 text-left">
                <div
                    className={`p-3 rounded-2xl border ${
                        hasPending && metrics.urgent > 0
                            ? 'bg-white/90 border-rose-200/80'
                            : 'bg-slate-50/70 border-slate-200/60'
                    }`}
                >
                    <span
                        className={`text-[11px] font-semibold flex items-center gap-1 ${
                            hasPending && metrics.urgent > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        เร่งด่วน (ภายใน 24 ชม.)
                    </span>
                    <p
                        className={`text-sm mt-1 font-bold tabular-nums ${
                            hasPending && metrics.urgent > 0 ? 'text-rose-700' : 'text-slate-700'
                        }`}
                    >
                        {metrics.urgent} คำขอ
                    </p>
                </div>

                <div
                    className={`p-3 rounded-2xl border min-w-0 ${
                        hasPending && metrics.assignedToMe > 0
                            ? 'bg-white/90 border-indigo-200/80'
                            : 'bg-slate-50/70 border-slate-200/60'
                    }`}
                >
                    <span
                        className={`text-[11px] font-semibold flex items-center gap-1 ${
                            hasPending && metrics.assignedToMe > 0 ? 'text-indigo-600' : 'text-slate-500'
                        }`}
                    >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        ส่งถึงคุณ / ส่วนกลาง
                    </span>
                    <p
                        className={`text-sm mt-1 font-bold tabular-nums truncate ${
                            hasPending && metrics.assignedToMe > 0 ? 'text-indigo-700' : 'text-slate-700'
                        }`}
                    >
                        {metrics.assignedToMe} คำขอ
                    </p>
                </div>
            </div>

            {/* Preview List when pending */}
            {hasPending && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>รายการล่าสุด</span>
                        <span className="tabular-nums">ขอมากสุด: {metrics.topRequester}</span>
                    </div>

                    <div className="space-y-2">
                        {requests.slice(0, 2).map((req) => {
                            const origDate = req.originalDeadline
                                ? formatDisplayDate(req.originalDeadline)
                                : '-';
                            const newDate = formatDisplayDate(req.newDeadline);
                            const diffDays = req.originalDeadline
                                ? getCalendarDayDiff(req.originalDeadline, req.newDeadline)
                                : 0;

                            return (
                                <div
                                    key={req.id}
                                    onClick={() => setIsCtrlOpen(true)}
                                    className="p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer text-left space-y-1.5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {req.user?.avatarUrl ? (
                                                <img
                                                    src={req.user.avatarUrl}
                                                    alt={req.user.name || 'พนักงาน'}
                                                    referrerPolicy="no-referrer"
                                                    className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                    {req.user?.name?.slice(0, 1) || 'พ'}
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-800 font-bold truncate">
                                                {req.user?.name || 'พนักงาน'}
                                            </span>
                                        </div>

                                        <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
                                            {req.approverId && req.approverId !== currentUser.id
                                                ? `ถึง: ${req.approver?.name || 'Admin'}`
                                                : 'ถึงคุณ'}
                                            {diffDays > 0 ? ` · +${diffDays} วัน` : ''}
                                        </span>
                                    </div>

                                    <p className="text-xs text-indigo-700 font-semibold line-clamp-1">
                                        {req.taskTitle || 'ไม่พบชื่องาน'}
                                    </p>

                                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 tabular-nums">
                                        <span className="truncate italic text-slate-400">
                                            "{req.reason || 'ไม่ได้ระบุเหตุผล'}"
                                        </span>
                                        <span className="shrink-0 font-medium">
                                            {origDate} → <strong className="text-indigo-700">{newDate}</strong>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CTA Button */}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={() => setIsCtrlOpen(true)}
                    className={`w-full py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        hasPending
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                    <span>
                        {hasPending
                            ? `เปิดหน้าพิจารณาคำขอ (${requests.length} รายการ)`
                            : 'เปิดดูรายการคำขอเลื่อนกำหนดส่ง'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
            </div>

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
