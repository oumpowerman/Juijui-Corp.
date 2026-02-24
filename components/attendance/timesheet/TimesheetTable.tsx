
import React from 'react';
import { format, isToday, isPast } from 'date-fns';
import { Loader2, UserX, Layers } from 'lucide-react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import TimesheetCell from './TimesheetCell';

interface TimesheetTableProps {
    isLoading: boolean;
    dateRange: Date[];
    filteredAndGroupedUsers: Record<string, User[]>;
    logs: AttendanceLog[];
    getEffectiveDayStatus: (date: Date) => { status: 'WORK_DAY' | 'HOLIDAY', source: string, desc: string };
    onCellClick: (log: AttendanceLog) => void;
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({
    isLoading,
    dateRange,
    filteredAndGroupedUsers,
    logs,
    getEffectiveDayStatus,
    onCellClick
}) => {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px] relative">
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full border-collapse table-fixed min-w-[1200px]">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
                            <th className="w-64 p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-slate-50 z-40 border-r border-slate-200">
                                Member Profile
                            </th>
                            {dateRange.map(day => {
                                const dayStatus = getEffectiveDayStatus(day);
                                const isHoliday = dayStatus.status === 'HOLIDAY';
                                const isTodayDay = isToday(day);
                                return (
                                    <th key={day.toString()} className={`p-2 text-center w-24 ${isTodayDay ? 'bg-indigo-50/50' : ''} ${isHoliday ? 'bg-slate-50/30' : ''}`}>
                                        <p className={`text-[10px] font-black ${isHoliday ? 'text-rose-400' : 'text-slate-400'}`}>
                                            {format(day, 'EEE')}
                                        </p>
                                        <p className={`text-sm font-black ${isTodayDay ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {format(day, 'd MMM')}
                                        </p>
                                        {dayStatus.source === 'EXCEPTION' && (
                                            <div className="flex justify-center mt-0.5">
                                                <div className={`w-1 h-1 rounded-full ${dayStatus.status === 'WORK_DAY' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                            </div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={dateRange.length + 1} className="py-32">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                                        <p className="font-bold text-sm tracking-widest uppercase">Initializing Interface...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : Object.keys(filteredAndGroupedUsers).length === 0 ? (
                            <tr>
                                <td colSpan={dateRange.length + 1} className="py-32 text-center text-slate-400">
                                    <UserX className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <p className="font-bold">ไม่พบข้อมูลพนักงานที่ตรงเงื่อนไข</p>
                                </td>
                            </tr>
                        ) : (Object.entries(filteredAndGroupedUsers) as [string, User[]][]).map(([dept, deptUsers]) => (
                            <React.Fragment key={dept}>
                                <tr className="bg-slate-100/50 border-y border-slate-200/50">
                                    <td colSpan={dateRange.length + 1} className="px-6 py-2">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{dept}</span>
                                            <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[8px] font-bold text-slate-400">{deptUsers.length} MEMBERS</span>
                                        </div>
                                    </td>
                                </tr>
                                
                                {deptUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-20 border-r border-slate-100 shadow-[4px_0_10px_rgba(0,0,0,0.02)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" />
                                                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${user.workStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-800 truncate">{user.name}</p>
                                                    <p className="text-[10px] text-indigo-500 font-bold uppercase truncate opacity-70">Lv.{user.level} {user.position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {dateRange.map(day => {
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            const log = logs.find(l => l.userId === user.id && l.date === dateStr);
                                            const dayStatus = getEffectiveDayStatus(day);
                                            return (
                                                <td key={day.toString()} className="p-0">
                                                    <TimesheetCell 
                                                        date={day}
                                                        log={log} 
                                                        dayStatus={dayStatus}
                                                        isToday={isToday(day)}
                                                        onClick={() => {
                                                            if (log) {
                                                                onCellClick(log);
                                                            }
                                                        }}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TimesheetTable;
