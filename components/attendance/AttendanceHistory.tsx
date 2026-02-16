
import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceLog, LeaveType } from '../../types/attendance';
import { useAttendance, AttendanceFilters } from '../../hooks/useAttendance'; 
import { useLeaveRequests } from '../../hooks/useLeaveRequests'; // Import Hook
import { format, isSameDay, differenceInDays } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import th from 'date-fns/locale/th';
import { 
    Clock, Calendar, CheckCircle2, MapPin, XCircle, Image as ImageIcon, 
    ExternalLink, ChevronLeft, ChevronRight, Filter, RefreshCw, Loader2, ArrowRight,
    Hourglass, FileText, AlertTriangle, ChevronDown, ChevronUp, Bell
} from 'lucide-react';
import { parseAttendanceMetadata } from '../../lib/attendanceUtils';
import LeaveRequestModal from './LeaveRequestModal'; // Reuse modal for re-submit

interface AttendanceHistoryProps {
    userId: string;
}

const PAGE_SIZE = 15;

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ userId }) => {
    const { getAttendanceLogs, isLoading } = useAttendance(userId);
    const { requests, submitRequest } = useLeaveRequests({ id: userId } as any);

    // Data State
    const [historyLogs, setHistoryLogs] = useState<AttendanceLog[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    
    // Filter State
    const [filters, setFilters] = useState<AttendanceFilters>({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        workType: 'ALL'
    });
    
    const [isFetching, setIsFetching] = useState(false);
    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
    
    // Re-submit State
    const [resubmitLog, setResubmitLog] = useState<AttendanceLog | null>(null);
    const [isResubmitOpen, setIsResubmitOpen] = useState(false);

    // UI State: Collapsible Requests
    const [isRequestsExpanded, setIsRequestsExpanded] = useState(false);

    // Filter MY requests: Pending + Recent Rejected (Last 7 Days)
    const myRequests = useMemo(() => {
        const today = new Date();
        return requests.filter(r => {
             if (r.userId !== userId) return false;
             
             // 1. Show all PENDING
             if (r.status === 'PENDING') return true;
             
             // 2. Show REJECTED only if within 7 days
             if (r.status === 'REJECTED') {
                 const daysDiff = differenceInDays(today, new Date(r.createdAt));
                 return daysDiff <= 7;
             }
             
             return false;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Newest first
        .slice(0, 5); // Limit to 5 most recent
    }, [requests, userId]);

    // Initial Fetch & Filter Change
    useEffect(() => {
        fetchData();
    }, [page, filters]); 
    
    // Auto-expand if there are requests initially (Optional: set to true if you want auto-open)
    useEffect(() => {
        if (myRequests.length > 0) {
             // We keep it collapsed by default as requested to show the notification badge logic, 
             // or you can set setIsRequestsExpanded(true) here if you prefer auto-open.
        }
    }, [myRequests.length]);

    const fetchData = async () => {
        setIsFetching(true);
        const { data, count } = await getAttendanceLogs(page, PAGE_SIZE, filters);
        setHistoryLogs(data);
        setTotalCount(count);
        setIsFetching(false);
    };

    const handleFilterChange = (key: keyof AttendanceFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); 
    };

    const resetFilters = () => {
        setFilters({
            startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
            workType: 'ALL'
        });
        setPage(1);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Helpers
    const isLate = (log: AttendanceLog) => {
        if (!log.checkInTime) return false;
        const hour = log.checkInTime.getHours();
        return hour > 10 || (hour === 10 && log.checkInTime.getMinutes() > 0);
    };

    const getProofUrl = (log: AttendanceLog) => {
        if (log.note && log.note.includes('[PROOF:')) {
            const meta = parseAttendanceMetadata(log.note);
            return meta.proofUrl;
        }
        return null;
    };

    const getLocationDisplay = (log: AttendanceLog) => {
        if (log.locationName) return log.locationName;
        const meta = parseAttendanceMetadata(log.note);
        return meta.locationName || (meta.location ? `${meta.location.lat.toFixed(4)}, ${meta.location.lng.toFixed(4)}` : '-');
    };

    const getWorkHours = (log: AttendanceLog) => {
        if (!log.checkInTime || !log.checkOutTime) return '-';
        const diffMs = log.checkOutTime.getTime() - log.checkInTime.getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    };

    const getLeaveLabel = (type: string) => {
        switch(type) {
            case 'LATE_ENTRY': return 'ขอเข้าสาย';
            case 'FORGOT_CHECKIN': return 'ลืมเช็คอิน';
            case 'FORGOT_CHECKOUT': return 'ลืมเช็คออก';
            case 'SICK': return 'ลาป่วย';
            case 'VACATION': return 'ลาพักร้อน';
            case 'OVERTIME': return 'ขอ OT';
            case 'WFH': return 'Work From Home';
            default: return type;
        }
    };
    
    // Determine status badge color
    const getStatusStyle = (log: AttendanceLog) => {
        if (log.status === 'PENDING_VERIFY') return 'bg-orange-100 text-orange-700 border-orange-200';
        if (log.status === 'ACTION_REQUIRED') return 'bg-red-100 text-red-700 border-red-200 animate-pulse';
        if (log.status === 'WORKING') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const handleResubmit = (log: AttendanceLog) => {
        setResubmitLog(log);
        setIsResubmitOpen(true);
    };
    
    const handleResubmitSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        // Reuse existing submit logic which handles updates
        const success = await submitRequest(type, start, end, reason, file);
        if (success) {
            fetchData(); // Refresh list to see status change
        }
        return success;
    };

    return (
        <div className="space-y-6">
            
            {/* --- SECTION 1: REQUEST STATUS (Collapsible) --- */}
            {myRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden animate-in slide-in-from-top-2">
                    <button 
                        onClick={() => setIsRequestsExpanded(!isRequestsExpanded)}
                        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${isRequestsExpanded ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isRequestsExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800 text-sm">สถานะคำขอ (Requests)</h3>
                                <p className="text-[10px] text-gray-400">รายการที่รอดำเนินการหรือเพิ่งอัปเดต</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Notification Badge: Show ONLY when collapsed */}
                            {!isRequestsExpanded && (
                                <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full shadow-md shadow-red-200 animate-pulse">
                                    <Bell className="w-3 h-3 fill-white" />
                                    <span className="text-xs font-black">{myRequests.length}</span>
                                </div>
                            )}
                            
                            <div className="text-gray-400">
                                {isRequestsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>
                    </button>

                    {/* Expandable Content */}
                    {isRequestsExpanded && (
                        <div className="p-4 space-y-3 bg-indigo-50/30 border-t border-indigo-100">
                            {myRequests.map(req => (
                                <div 
                                    key={req.id} 
                                    className={`
                                        border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm relative overflow-hidden gap-3 bg-white
                                        ${req.status === 'PENDING' ? 'border-orange-200' : 'border-red-200'}
                                    `}
                                >
                                    {/* Status Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${req.status === 'PENDING' ? 'bg-orange-400' : 'bg-red-500'}`}></div>
                                    
                                    <div className="flex items-center gap-3 pl-2">
                                        <div className={`p-2 rounded-full shadow-sm shrink-0 ${req.status === 'PENDING' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                            {req.status === 'PENDING' ? <Hourglass className="w-5 h-5 animate-spin-slow" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-gray-800 text-sm">{getLeaveLabel(req.type)}</p>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <Calendar className="w-3 h-3" /> 
                                                {format(new Date(req.startDate), 'd MMM')} 
                                                {req.startDate !== req.endDate && ` - ${format(new Date(req.endDate), 'd MMM')}`}
                                            </div>
                                            
                                            {req.status === 'REJECTED' && req.rejectionReason && (
                                                <div className="mt-2 text-xs bg-red-50 p-2 rounded-lg border border-red-100 text-red-800 font-medium">
                                                    <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> เหตุผลที่ปฏิเสธ:</span> "{req.rejectionReason}"
                                                </div>
                                            )}
                                            {req.status === 'PENDING' && (
                                                 <p className="text-[10px] text-gray-400 mt-1 italic max-w-[200px] truncate">
                                                    Note: "{req.reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Date Submitted */}
                                    <div className="text-right pl-4 border-l border-gray-100 hidden md:block">
                                         <p className="text-[10px] text-gray-400 uppercase font-bold">Submitted</p>
                                         <p className="text-xs font-medium text-gray-600">{format(req.createdAt, 'd MMM HH:mm')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- SECTION 2: HISTORY LOGS --- */}
            <div className="space-y-4">
                
                {/* --- Filter Bar --- */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-full sm:w-auto">
                            <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-24"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            />
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-24"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            />
                        </div>

                        {/* Work Type Filter */}
                        <div className="relative w-full sm:w-40">
                            <select 
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 appearance-none outline-none focus:border-indigo-400 cursor-pointer"
                                value={filters.workType}
                                onChange={(e) => handleFilterChange('workType', e.target.value)}
                            >
                                <option value="ALL">ทุกรูปแบบ (All Types)</option>
                                <option value="OFFICE">เข้าออฟฟิศ</option>
                                <option value="WFH">Work From Home</option>
                                <option value="SITE">On Site (ข้างนอก)</option>
                            </select>
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={resetFilters} 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="ล้างตัวกรอง"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={fetchData} 
                            className={`p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all ${isFetching ? 'animate-spin' : ''}`}
                            title="โหลดข้อมูลใหม่"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- Data Table --- */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time In</th>
                                    <th className="px-6 py-4">Time Out</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">Duration</th>
                                    <th className="px-6 py-4 text-center">Proof</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isFetching && historyLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-gray-400">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : historyLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-20 text-gray-400">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            ไม่พบประวัติการลงเวลาในช่วงนี้
                                        </td>
                                    </tr>
                                ) : (
                                    historyLogs.map(log => {
                                        const late = isLate(log);
                                        const proof = getProofUrl(log);
                                        const statusStyle = getStatusStyle(log);
                                        
                                        return (
                                            <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${isSameDay(new Date(log.date), new Date()) ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                        <div>
                                                            <span className="block text-sm font-bold text-gray-700">{format(new Date(log.date), 'd MMM yyyy')}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{format(new Date(log.date), 'EEEE', { locale: th })}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.status === 'ACTION_REQUIRED' ? (
                                                        <button 
                                                            onClick={() => handleResubmit(log)}
                                                            className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold border border-red-200 hover:bg-red-200 transition-colors shadow-sm"
                                                        >
                                                            <AlertTriangle className="w-3 h-3" /> แก้ไขด่วน
                                                        </button>
                                                    ) : (
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide ${statusStyle}`}>
                                                            {log.status.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.checkInTime ? (
                                                        <span className={`font-mono font-bold text-sm ${late ? 'text-red-500' : 'text-green-600'}`}>
                                                            {format(log.checkInTime, 'HH:mm')}
                                                            {late && <span className="ml-2 text-[9px] bg-red-100 px-1.5 py-0.5 rounded text-red-600 uppercase">LATE</span>}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.checkOutTime ? (
                                                        <span className="font-mono font-bold text-sm text-gray-600">{format(log.checkOutTime, 'HH:mm')}</span>
                                                    ) : log.status === 'PENDING_VERIFY' ? (
                                                        <span className="text-orange-400 italic text-xs">Waiting Approval</span>
                                                    ) : (
                                                        <span className="text-gray-300 italic text-xs">Working...</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide w-fit ${
                                                            log.workType === 'OFFICE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            log.workType === 'WFH' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-orange-50 text-orange-600 border-orange-100'
                                                        }`}>
                                                            {log.workType}
                                                        </span>
                                                        <span className="text-xs text-gray-500 truncate max-w-[120px]" title={getLocationDisplay(log)}>
                                                            {getLocationDisplay(log)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{getWorkHours(log)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {proof ? (
                                                        <button onClick={() => setViewProofUrl(proof)} className="p-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-gray-400 transition-all shadow-sm">
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-200 text-lg">•</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Pagination */}
                    {totalCount > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                            </span>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isFetching}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-gray-700 px-2">
                                    Page {page} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isFetching}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Proof Modal */}
                {viewProofUrl && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewProofUrl(null)}>
                        <div className="relative max-w-lg w-full bg-white p-2 rounded-2xl shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setViewProofUrl(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
                                <XCircle className="w-8 h-8" />
                            </button>
                            <img src={viewProofUrl} className="w-full h-auto rounded-xl shadow-inner bg-gray-100" alt="Proof" />
                            <a href={viewProofUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center mt-3 text-indigo-600 font-bold text-sm hover:underline py-2">
                                เปิดรูปต้นฉบับ <ExternalLink className="w-4 h-4 ml-1.5" />
                            </a>
                        </div>
                    </div>
                )}
                
                {/* Resubmit Modal (Reusing LeaveRequestModal logic essentially) */}
                <LeaveRequestModal 
                    isOpen={isResubmitOpen}
                    onClose={() => { setIsResubmitOpen(false); setResubmitLog(null); }}
                    onSubmit={handleResubmitSubmit}
                />
            </div>
        </div>
    );
};

export default AttendanceHistory;
