import React, { useState, useEffect, useMemo } from 'react';
import { User, MasterOption } from '../../types';
import { AttendanceLog, WorkLocation } from '../../types/attendance';
import { supabase } from '../../lib/supabase';
import { 
    format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, 
    isSameDay, isToday, startOfMonth, endOfMonth, addMonths, isWeekend
} from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    ChevronLeft, ChevronRight, Search, Camera, MapPin, 
    Clock, AlertTriangle, CheckCircle2, User as UserIcon,
    X, Filter, Calendar, LayoutGrid, List, Layers, 
    ArrowRight, ArrowDown, UserX, Image as ImageIcon,
    // Added Loader2 and Info to imports
    Download, Briefcase, Loader2, Info
} from 'lucide-react';
import { checkIsLate } from '../../lib/attendanceUtils';

// --- Sub-Component: Cell (The actual record) ---
const TimesheetCell = ({ 
    log, 
    isWeekend, 
    isToday, 
    onClick 
}: { 
    log?: AttendanceLog, 
    isWeekend: boolean, 
    isToday: boolean,
    onClick: () => void
}) => {
    if (!log) {
        return (
            <div className={`h-16 w-full flex items-center justify-center border-r border-slate-100/50 ${isWeekend ? 'bg-slate-50/50' : 'bg-transparent'}`}>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            </div>
        );
    }

    const late = log.checkInTime && checkIsLate(log.checkInTime, '10:00', 15);
    const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';

    return (
        <div 
            onClick={onClick}
            className={`
                h-16 w-full border-r border-slate-100/50 p-1 transition-all duration-300 cursor-pointer group/cell relative
                ${isToday ? 'bg-indigo-50/30' : ''}
                hover:z-10
            `}
        >
            <div className={`
                w-full h-full rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all group-hover/cell:scale-105 group-hover/cell:shadow-md
                ${isLeave ? 'bg-sky-50 border-sky-100 text-sky-600' :
                  late ? 'bg-orange-50 border-orange-200 text-orange-600' :
                  'bg-emerald-50 border-emerald-100 text-emerald-600'}
            `}>
                <span className="text-[10px] font-black font-mono leading-none">
                    {log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--'}
                </span>
                <div className="w-4 h-[1px] bg-current opacity-20"></div>
                <span className="text-[10px] font-black font-mono leading-none opacity-60">
                    {log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--'}
                </span>
                
                {/* Proof Indicator */}
                {log.note?.includes('[PROOF:') && (
                    <div className="absolute top-1 right-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard ---
const AdminWeeklyTimesheet: React.FC<{ users: User[] }> = ({ users }) => {
    // View States
    const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'LATE' | 'ABSENT'>('ALL');
    
    // Data States
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);

    // Calculate Range
    const dateRange = useMemo(() => {
        const start = viewMode === 'WEEK' 
            ? startOfWeek(currentDate, { weekStartsOn: 1 }) 
            : startOfMonth(currentDate);
        const end = viewMode === 'WEEK' 
            ? endOfWeek(currentDate, { weekStartsOn: 1 }) 
            : endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate, viewMode]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const startStr = format(dateRange[0], 'yyyy-MM-dd');
            const endStr = format(dateRange[dateRange.length - 1], 'yyyy-MM-dd');
            
            try {
                const { data, error } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .gte('date', startStr)
                    .lte('date', endStr);

                if (error) throw error;
                setLogs(data.map((l: any) => ({
                    id: l.id, userId: l.user_id, date: l.date,
                    checkInTime: l.check_in_time ? new Date(l.check_in_time) : null,
                    checkOutTime: l.check_out_time ? new Date(l.check_out_time) : null,
                    workType: l.work_type, status: l.status, note: l.note,
                    locationName: l.location_name, checkOutLocationName: l.check_out_location_name
                })));
            } catch (err) {
                console.error("Fetch logs failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    // Department Grouping Logic
    const departments = useMemo(() => {
        const set = new Set(users.map(u => u.position || 'General'));
        return Array.from(set).sort();
    }, [users]);

    const filteredAndGroupedUsers = useMemo(() => {
        const filtered = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = filterDepartment === 'ALL' || u.position === filterDepartment;
            
            // Status filter logic (Check if ever late or absent in current range)
            if (filterStatus === 'ALL') return matchesSearch && matchesDept;
            
            const userLogs = logs.filter(l => l.userId === u.id);
            if (filterStatus === 'LATE') {
                return matchesSearch && matchesDept && userLogs.some(l => l.checkInTime && checkIsLate(l.checkInTime, '10:00', 15));
            }
            if (filterStatus === 'ABSENT') {
                // If expected work days > actual logs
                return matchesSearch && matchesDept && userLogs.length < dateRange.length;
            }
            return matchesSearch && matchesDept;
        });

        // Grouping
        const groups: Record<string, User[]> = {};
        filtered.forEach(u => {
            const dept = u.position || 'General';
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(u);
        });
        return groups;
    }, [users, logs, searchTerm, filterDepartment, filterStatus, dateRange]);

    const nav = (offset: number) => {
        setCurrentDate(prev => viewMode === 'WEEK' ? addWeeks(prev, offset) : addMonths(prev, offset));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            
            {/* --- TOP CONTROL BAR --- */}
            <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-slate-800 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
                    {/* Left: Nav & Range */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold tracking-tight">Timesheet Central</h2>
                                <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-[10px] font-black uppercase tracking-widest">{viewMode}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                                <button onClick={() => nav(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all"><ChevronLeft className="w-4 h-4"/></button>
                                <span className="text-sm font-black min-w-[180px] text-center px-2">
                                    {format(dateRange[0], 'd MMM')} - {format(dateRange[dateRange.length-1], 'd MMM yyyy', { locale: th })}
                                </span>
                                <button onClick={() => nav(1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>

                    {/* Center: Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                         {/* View Toggle */}
                         <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 flex">
                            <button 
                                onClick={() => setViewMode('WEEK')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'WEEK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                WEEKLY
                            </button>
                            <button 
                                onClick={() => setViewMode('MONTH')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'MONTH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                MONTHLY
                            </button>
                        </div>

                        {/* Department Select */}
                        <div className="relative">
                            <select 
                                value={filterDepartment}
                                onChange={e => setFilterDepartment(e.target.value)}
                                className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 py-2.5 pl-9 pr-8 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                            >
                                <option value="ALL">ทุกแผนก (All Teams)</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>

                        {/* Search */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อลูกทีม..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-200"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- GRID VIEW --- */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px] relative">
                
                {/* Scrollable Container */}
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full border-collapse table-fixed min-w-[1200px]">
                        <thead className="sticky top-0 z-30">
                            <tr className="bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
                                <th className="w-64 p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-slate-50 z-40 border-r border-slate-200">
                                    Member Profile
                                </th>
                                {dateRange.map(day => {
                                    const isWeekendDay = isWeekend(day);
                                    const isTodayDay = isToday(day);
                                    return (
                                        <th key={day.toString()} className={`p-2 text-center w-24 ${isTodayDay ? 'bg-indigo-50/50' : ''}`}>
                                            <p className={`text-[10px] font-black ${isWeekendDay ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {format(day, 'EEE')}
                                            </p>
                                            <p className={`text-sm font-black ${isTodayDay ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {format(day, 'd MMM')}
                                            </p>
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
                                            {/* Fix 1: Loader2 is now correctly imported */}
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
                                    {/* Department Header Row */}
                                    <tr className="bg-slate-100/50 border-y border-slate-200/50">
                                        <td colSpan={dateRange.length + 1} className="px-6 py-2">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{dept}</span>
                                                {/* Fix 2: Explicit cast ensures deptUsers is seen as User[] */}
                                                <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[8px] font-bold text-slate-400">{deptUsers.length} MEMBERS</span>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* Employee Rows */}
                                    {/* Fix 3: Explicit cast ensures map exists on deptUsers */}
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
                                                return (
                                                    <td key={day.toString()} className="p-0">
                                                        <TimesheetCell 
                                                            log={log} 
                                                            isWeekend={isWeekend(day)} 
                                                            isToday={isToday(day)}
                                                            onClick={() => log && setSelectedLog(log)}
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

            {/* --- CUSTOM DETAIL MODAL (No Native Browser UI) --- */}
            {selectedLog && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedLog(null)}
                >
                    <div 
                        className="bg-white w-full max-w-xl rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 border-4 border-white"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Image/Proof Header */}
                        <div className="relative h-72 bg-slate-900 flex items-center justify-center group/img">
                            {(() => {
                                const proofMatch = selectedLog.note?.match(/\[PROOF:(.*?)\]/);
                                const url = proofMatch ? proofMatch[1] : null;
                                
                                // Google Drive Proxy detection
                                const isDrive = url?.includes('drive.google.com');
                                const displayUrl = isDrive ? `https://lh3.googleusercontent.com/d/${url?.split('id=')[1] || url?.split('/d/')[1]?.split('/')[0]}=s1000` : url;

                                return url ? (
                                    <>
                                        <img 
                                            src={displayUrl || url} 
                                            className="w-full h-full object-cover opacity-90 group-hover/img:scale-105 transition-transform duration-700" 
                                            alt="Proof"
                                            onError={(e) => {
                                                // Fallback if image fails or needs direct access
                                                (e.target as any).src = url; 
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">Image Verified</span>
                                            </div>
                                            <a href={url} target="_blank" className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-all">
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-500 gap-4">
                                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700">
                                            <Camera className="w-10 h-10 opacity-20" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">No Visual Record</p>
                                    </div>
                                );
                            })()}
                            <button onClick={() => setSelectedLog(null)} className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-red-500 text-white rounded-full transition-all shadow-xl backdrop-blur-md"><X className="w-6 h-6"/></button>
                        </div>

                        {/* Details Content */}
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Time Analysis Log</p>
                                    <h3 className="text-3xl font-black text-slate-800">
                                        {format(new Date(selectedLog.date), 'EEEE d MMMM', { locale: th })}
                                    </h3>
                                </div>
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner">
                                    <Clock className="w-8 h-8" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><LogIn className="w-3 h-3 mr-1 text-emerald-500" /> Start Mission</p>
                                    <p className="text-3xl font-black text-indigo-600 font-mono">
                                        {selectedLog.checkInTime ? format(selectedLog.checkInTime, 'HH:mm') : '--:--'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/> {selectedLog.locationName || 'Unspecified'}</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-orange-200 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><LogOut className="w-3 h-3 mr-1 text-orange-500" /> Mission End</p>
                                    <p className="text-3xl font-black text-slate-700 font-mono">
                                        {selectedLog.checkOutTime ? format(selectedLog.checkOutTime, 'HH:mm') : '--:--'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/> {selectedLog.checkOutLocationName || 'Unspecified'}</p>
                                </div>
                            </div>

                            {selectedLog.note && (
                                <div className="bg-indigo-900 rounded-[2rem] p-6 text-indigo-100 shadow-2xl relative overflow-hidden">
                                    {/* Fix 4: Info icon is now imported correctly */}
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-indigo-400">Official Note</h4>
                                    <p className="text-sm font-medium leading-relaxed italic">
                                        "{selectedLog.note.replace(/\[.*?\]/g, '').trim() || 'ไม่มีหมายเหตุเพิ่มเติม'}"
                                    </p>
                                </div>
                            )}

                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm tracking-widest uppercase hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                            >
                                Close Command
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper components missing from standard imports
const LogIn = ({ className }: { className?: string }) => <ArrowRight className={className} />;
const LogOut = ({ className }: { className?: string }) => <ArrowRight className={className} />;
const Settings2 = ({ className }: { className?: string }) => <LayoutGrid className={className} />;

export default AdminWeeklyTimesheet;