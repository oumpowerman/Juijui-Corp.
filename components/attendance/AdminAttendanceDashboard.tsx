
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import { format, isSameDay } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import th from 'date-fns/locale/th';
import { 
    Users, Clock, AlertTriangle, Calendar, Download, 
    ChevronLeft, ChevronRight, Search, BarChart3, HeartPulse 
} from 'lucide-react';
import { AttendanceLog } from '../../types/attendance';

interface AdminAttendanceDashboardProps {
    users: User[];
}

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
}

const AdminAttendanceDashboard: React.FC<AdminAttendanceDashboardProps> = ({ users }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Logs for the selected month
    useEffect(() => {
        const fetchMonthLogs = async () => {
            setIsLoading(true);
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            try {
                const { data, error } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .gte('date', start)
                    .lte('date', end);

                if (error) throw error;
                
                if (data) {
                    setLogs(data.map((l: any) => ({
                        id: l.id,
                        userId: l.user_id,
                        date: l.date,
                        checkInTime: l.check_in_time ? new Date(l.check_in_time) : null,
                        checkOutTime: l.check_out_time ? new Date(l.check_out_time) : null,
                        workType: l.work_type,
                        status: l.status,
                        note: l.note
                    })));
                }
            } catch (err) {
                console.error("Fetch admin logs error", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMonthLogs();
    }, [currentMonth]);

    // Calculate Stats per User
    const userStats = useMemo(() => {
        const statsMap: Record<string, UserStat> = {};

        // Initialize for all active users
        users.filter(u => u.isActive).forEach(u => {
            statsMap[u.id] = {
                userId: u.id,
                present: 0,
                late: 0,
                leaves: 0,
                totalHours: 0,
                avgCheckIn: '-',
                logs: []
            };
        });

        // Process Logs
        logs.forEach(log => {
            if (statsMap[log.userId]) {
                const stat = statsMap[log.userId];
                stat.logs.push(log);

                if (log.status === 'LEAVE' || log.workType === 'LEAVE') {
                    stat.leaves++;
                } else {
                    stat.present++; // Only count working days as present

                    // Late Check (Hardcoded 10:00 AM rule for now)
                    if (log.checkInTime) {
                        const hour = log.checkInTime.getHours();
                        const minute = log.checkInTime.getMinutes();
                        if (hour > 10 || (hour === 10 && minute > 0)) {
                            stat.late++;
                        }
                    }

                    // Hours Check
                    if (log.checkInTime && log.checkOutTime) {
                        const diffMs = log.checkOutTime.getTime() - log.checkInTime.getTime();
                        stat.totalHours += diffMs / (1000 * 60 * 60);
                    }
                }
            }
        });

        return Object.values(statsMap);
    }, [users, logs]);

    // Filtering
    const filteredStats = userStats.filter(stat => {
        const user = users.find(u => u.id === stat.userId);
        return user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => b.present - a.present); // Sort by most present

    // Aggregates
    const totalCheckins = logs.filter(l => l.status !== 'LEAVE').length;
    const totalLeaves = logs.filter(l => l.status === 'LEAVE').length;
    const totalLates = userStats.reduce((sum, s) => sum + s.late, 0);
    const lateRate = totalCheckins > 0 ? Math.round((totalLates / totalCheckins) * 100) : 0;

    const getGrade = (stat: UserStat) => {
        // Simple Grading Logic (Can be adjusted via Master Data later)
        if (stat.present === 0 && stat.leaves === 0) return { grade: 'N/A', color: 'bg-gray-100 text-gray-400' };
        if (stat.late === 0) return { grade: 'A+', color: 'bg-green-100 text-green-700' };
        if (stat.late <= 2) return { grade: 'B', color: 'bg-blue-100 text-blue-700' };
        if (stat.late <= 4) return { grade: 'C', color: 'bg-yellow-100 text-yellow-700' };
        return { grade: 'F', color: 'bg-red-100 text-red-700' };
    };

    // --- CSV Export Logic ---
    const handleExportCSV = () => {
        // 1. Header
        const headers = ["Employee Name", "Position", "Days Present", "Late Count", "Leave Days", "Total Hours", "Performance Grade"];
        
        // 2. Rows
        const rows = filteredStats.map(stat => {
            const user = users.find(u => u.id === stat.userId);
            const gradeInfo = getGrade(stat);
            return [
                `"${user?.name || 'Unknown'}"`,
                `"${user?.position || '-'}"`,
                stat.present,
                stat.late,
                stat.leaves,
                stat.totalHours.toFixed(2),
                `"${gradeInfo.grade}"`
            ].join(",");
        });

        // 3. Combine & Download
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        const fileName = `Attendance_Report_${format(currentMonth, 'MMMM_yyyy')}.csv`;
        
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                    <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"><ChevronLeft className="w-5 h-5"/></button>
                    <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center capitalize">
                        {format(currentMonth, 'MMMM yyyy')}
                    </div>
                    <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"><ChevronRight className="w-5 h-5"/></button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาพนักงาน..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Check-ins</p>
                        <h3 className="text-3xl font-black text-indigo-900">{totalCheckins}</h3>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm"><Users className="w-6 h-6"/></div>
                </div>
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-orange-400 uppercase">Late Arrivals</p>
                        <h3 className="text-3xl font-black text-orange-900">{totalLates} <span className="text-xs text-orange-400 font-bold">({lateRate}%)</span></h3>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm"><Clock className="w-6 h-6"/></div>
                </div>
                <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-pink-400 uppercase">Total Leaves</p>
                        <h3 className="text-3xl font-black text-pink-900">{totalLeaves}</h3>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-pink-500 shadow-sm"><HeartPulse className="w-6 h-6"/></div>
                </div>
                <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-green-600 uppercase">Active Users</p>
                        <h3 className="text-3xl font-black text-green-900">{users.filter(u => u.isActive).length}</h3>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-green-600 shadow-sm"><BarChart3 className="w-6 h-6"/></div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase">
                                <th className="px-6 py-4 font-bold">Employee</th>
                                <th className="px-6 py-4 font-bold text-center">Days Present</th>
                                <th className="px-6 py-4 font-bold text-center">Late Count</th>
                                <th className="px-6 py-4 font-bold text-center">Leaves</th>
                                <th className="px-6 py-4 font-bold text-center">Total Hours</th>
                                <th className="px-6 py-4 font-bold text-center">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-20 text-center text-gray-400">Loading Report...</td></tr>
                            ) : filteredStats.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-gray-400">No data found</td></tr>
                            ) : (
                                filteredStats.map(stat => {
                                    const user = users.find(u => u.id === stat.userId);
                                    if (!user) return null;
                                    const grade = getGrade(stat);

                                    return (
                                        <tr key={stat.userId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100" />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.position}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
                                                    {stat.present}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.late > 0 ? 'bg-red-50 text-red-600' : 'text-gray-400'}`}>
                                                    {stat.late}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.leaves > 0 ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}>
                                                    {stat.leaves}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-mono text-gray-600">
                                                    {stat.totalHours.toFixed(1)} h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block w-10 py-1 rounded-lg text-xs font-black ${grade.color}`}>
                                                    {grade.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                >
                    <Download className="w-4 h-4" /> Export CSV Report
                </button>
            </div>
        </div>
    );
};

export default AdminAttendanceDashboard;
