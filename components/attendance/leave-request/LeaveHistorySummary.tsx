import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Calendar, Palmtree, HeartPulse, Briefcase, 
    Sparkles, Clock, AlertCircle, CheckCircle2, XCircle, 
    ChevronRight, ExternalLink, RefreshCw 
} from 'lucide-react';
import { useUserSession } from '../../../context/UserSessionContext';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';
import { useMasterData } from '../../../hooks/useMasterData';
import { isWorkingDay } from '../../../utils/judgeUtils';
import { eachDayOfInterval, isValid } from 'date-fns';

interface LeaveHistorySummaryProps {
    onBack: () => void;
    borderless?: boolean;
    initialFilterType?: string;
}

const PASTEL_THEMES: Record<string, any> = {
    'VACATION': { 
        bg: 'bg-emerald-50/60', 
        text: 'text-emerald-600', 
        border: 'border-emerald-100',
        icon: Palmtree,
        label: 'พักร้อน'
    },
    'SICK': { 
        bg: 'bg-rose-50/60', 
        text: 'text-rose-600', 
        border: 'border-rose-100',
        icon: HeartPulse,
        label: 'ลาป่วย'
    },
    'PERSONAL': { 
        bg: 'bg-amber-50/60', 
        text: 'text-amber-600', 
        border: 'border-amber-100',
        icon: Briefcase,
        label: 'ลากิจ'
    },
    'DEFAULT': {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-100',
        icon: Calendar,
        label: 'ลาอื่นๆ'
    }
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    'APPROVED': { 
        label: 'อนุมัติแล้ว', 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-600', 
        border: 'border-emerald-100',
        icon: CheckCircle2 
    },
    'PENDING': { 
        label: 'รออนุมัติ', 
        bg: 'bg-amber-50', 
        text: 'text-amber-600', 
        border: 'border-amber-100',
        icon: Clock 
    },
    'REJECTED': { 
        label: 'ปฏิเสธ', 
        bg: 'bg-rose-50', 
        text: 'text-rose-600', 
        border: 'border-rose-100',
        icon: XCircle 
    }
};

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const formatThaiDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return '-';
    const d = date.getDate();
    const m = THAI_MONTHS[date.getMonth()];
    const y = date.getFullYear() + 543;
    return `${d} ${m} ${y}`;
};

const LeaveHistorySummary: React.FC<LeaveHistorySummaryProps> = ({ onBack, borderless = false, initialFilterType }) => {
    const { currentUserProfile } = useUserSession();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const { requests, isLoading } = useLeaveRequests(currentUserProfile);
    const [filterType, setFilterType] = useState<string | null>(initialFilterType || null);
    
    // Calculate joining / register year from user profile
    const joinYear = useMemo(() => {
        if (!currentUserProfile) return new Date().getFullYear();
        const joinDate = currentUserProfile.startDate || currentUserProfile.createdAt;
        if (joinDate) {
            const dateObj = new Date(joinDate);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.getFullYear();
            }
        }
        return new Date().getFullYear() - 1; // Fallback to last year
    }, [currentUserProfile]);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    // Generate years from current year down to joinYear (or at least past 3 years to ensure rich selection)
    const availableYears = useMemo(() => {
        const years: number[] = [];
        const startYear = Math.min(joinYear, currentYear - 1);
        for (let y = currentYear; y >= startYear; y--) {
            years.push(y);
        }
        // Always return at least current year and the previous one
        if (years.length < 2) {
            const prev = currentYear - 1;
            if (!years.includes(prev)) {
                years.push(prev);
            }
        }
        return years;
    }, [joinYear, currentYear]);

    // Filter requests belonging to the current user, selected year and leave type
    const filteredRequests = useMemo(() => {
        if (!currentUserProfile) return [];
        let r = requests
            .filter(req => req.userId === currentUserProfile.id)
            .filter(req => {
                const startDate = new Date(req.startDate);
                return startDate.getFullYear() === selectedYear;
            });
            
        if (filterType) {
            r = r.filter(req => req.type === filterType);
        }
        
        return r.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [requests, currentUserProfile, selectedYear, filterType]);

    // Calculate usage stats dynamically for the selected year
    const selectedYearStats = useMemo(() => {
        const stats: Record<string, number> = {
            VACATION: 0,
            SICK: 0,
            PERSONAL: 0
        };

        if (!currentUserProfile) return stats;

        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];

        requests.forEach(req => {
            if (req.userId === currentUserProfile.id && req.status === 'APPROVED') {
                const start = new Date(req.startDate);
                if (start.getFullYear() === selectedYear) {
                    if (LEAVE_TYPES.includes(req.type)) {
                        const end = new Date(req.endDate);
                        if (!isValid(start) || !isValid(end) || start > end) return; 
                        
                        const days = eachDayOfInterval({ start, end });
                        const workingDaysCount = days.filter(d => 
                            isWorkingDay(d, annualHolidays, calendarExceptions, currentUserProfile)
                        ).length;
                        
                        // Map EMERGENCY to SICK or treat under its category
                        const key = req.type as keyof typeof stats;
                        if (key in stats) {
                            stats[key] += workingDaysCount;
                        }
                    }
                }
            }
        });

        return stats;
    }, [requests, currentUserProfile, selectedYear, annualHolidays, calendarExceptions]);

    // Helper to extract specific dates that were counted as leave (working days)
    const getActualLeaveDates = (startDate: string | Date, endDate: string | Date) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isValid(start) || !isValid(end) || start > end) return [];
        
        const days = eachDayOfInterval({ start, end });
        return days.filter(d => 
            isWorkingDay(d, annualHolidays, calendarExceptions, currentUserProfile)
        );
    };

    const content = (
        <>
            {/* Header with back button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5" id="history-summary-header">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    ดูโควตา
                </button>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">LEAVE RECORDS</span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                        ประวัติการใช้วันลา
                    </h3>
                </div>
            </div>

            {/* Year Slider (Horizontal Scrollable Tabs with Spring effects) */}
            <div className="mb-5 flex flex-col gap-1.5" id="history-year-selector-container">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left pl-1">เลือกปีการทำงาน:</span>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x" id="history-year-tabs">
                    {availableYears.map(year => {
                        const isSelected = selectedYear === year;
                        return (
                            <motion.button
                                key={year}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedYear(year)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer snap-center shrink-0 ${
                                    isSelected 
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" 
                                        : "bg-slate-50 text-slate-500 border-slate-200/80 hover:border-slate-300 hover:text-slate-700"
                                }`}
                            >
                                📅 ปี {year + 543} ({year})
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Stats Summary Cards for selected year */}
            <div className="grid grid-cols-3 gap-3 mb-5" id="history-stats-cards-grid">
                {Object.entries(selectedYearStats).map(([type, value]) => {
                    const theme = PASTEL_THEMES[type] || PASTEL_THEMES.DEFAULT;
                    const Icon = theme.icon;
                    const isFiltered = filterType === type;
                    const isAnyFiltered = filterType !== null;

                    return (
                        <button 
                            key={type}
                            onClick={() => {
                                setFilterType(prev => prev === type ? null : type);
                            }}
                            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer w-full relative outline-none select-none ${
                                isFiltered 
                                    ? `ring-4 ring-indigo-500/15 ${theme.border} ${theme.bg} scale-[1.03] shadow-md shadow-indigo-100/50` 
                                    : !isAnyFiltered
                                        ? `${theme.border} ${theme.bg} hover:scale-[1.02] opacity-100 hover:shadow-sm`
                                        : `${theme.border} ${theme.bg} opacity-40 hover:opacity-80 hover:scale-[1.01]`
                            }`}
                        >
                            {isFiltered && (
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            )}
                            <span className={`p-1.5 rounded-xl bg-white/95 shadow-sm ${theme.text} mb-2`}>
                                <Icon className="w-4 h-4" />
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 block truncate max-w-full">{theme.label}</span>
                            <span className="text-base sm:text-lg font-bold text-slate-800 mt-1">{value} <span className="text-[10px] font-medium text-slate-400">วัน</span></span>
                        </button>
                    );
                })}
            </div>

            {/* List of Leave requests */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3" id="history-list-scroll-view">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">
                        {filterType 
                            ? `เฉพาะวันลา: ${PASTEL_THEMES[filterType]?.label || filterType}` 
                            : `รายการวันที่ขอลาหยุดทั้งหมด`
                        } ในปี {selectedYear + 543} ({filteredRequests.length} รายการ):
                    </span>
                    {filterType && (
                        <button 
                            onClick={() => setFilterType(null)}
                            className="text-[9px] font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100/80 transition-colors cursor-pointer"
                        >
                            แสดงทั้งหมด
                        </button>
                    )}
                </div>
                
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 text-slate-400 text-xs font-semibold">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        กำลังโหลดประวัติวันลา...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-5">
                        <span className="text-3xl mb-2">🏖️</span>
                        <p className="text-xs font-bold text-slate-600">ไม่มีประวัติการใช้วันลาในปีนี้</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 max-w-[200px]">คุณยังไม่ได้ใช้วันหยุดพักผ่อนในปีนี้</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredRequests.map((req, index) => {
                            const theme = PASTEL_THEMES[req.type] || PASTEL_THEMES.DEFAULT;
                            const Icon = theme.icon;
                            const statusMeta = STATUS_BADGES[req.status] || STATUS_BADGES.PENDING;
                            const StatusIcon = statusMeta.icon;

                            // Calculate actual days of leave list
                            const actualDates = getActualLeaveDates(req.startDate, req.endDate);

                            return (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className="p-4 bg-white hover:bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all duration-150 flex flex-col gap-3 text-left shadow-sm"
                                >
                                    {/* Header of Item */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className={`p-2 rounded-xl border ${theme.border} ${theme.bg} ${theme.text} shrink-0`}>
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <span className="font-bold text-xs text-slate-800 block truncate">
                                                    {theme.label} ({actualDates.length} วัน)
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                                                    {formatThaiDate(new Date(req.startDate))} - {formatThaiDate(new Date(req.endDate))}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 shrink-0 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    {/* Breakdown of ACTUAL days used (Answers: "ลาวันไหนบ้าง") */}
                                    {actualDates.length > 0 && (
                                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                                            <span className="text-[9px] font-bold text-slate-400 block mb-1">วันที่ใช้หยุดจริง (เฉพาะวันทำการ):</span>
                                            <div className="flex flex-wrap gap-1">
                                                {actualDates.map((date, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="px-2 py-0.5 bg-white border border-slate-200/60 text-slate-600 text-[10px] font-medium rounded-lg"
                                                    >
                                                        {formatThaiDate(date)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason box with elegant quotes */}
                                    <div className="text-left pl-1">
                                        <div className="text-[11px] text-slate-500 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 leading-relaxed break-words">
                                            <span className="font-bold text-slate-300 text-xs mr-0.5">“</span>
                                            {req.reason || 'ไม่ได้ระบุเหตุผลการลา'}
                                            <span className="font-bold text-slate-300 text-xs ml-0.5">”</span>
                                        </div>

                                        {/* Rejection comment */}
                                        {req.status === 'REJECTED' && req.rejectionReason && (
                                            <div className="mt-2.5 p-2.5 bg-rose-50/60 border border-rose-100 rounded-xl flex items-start gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <span className="text-[10px] font-bold text-rose-600 block">เหตุผลที่ไม่อนุมัติ:</span>
                                                    <p className="text-[10px] text-rose-500 font-medium leading-normal">{req.rejectionReason}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Attachment Link if exists */}
                                        {req.attachmentUrl && (
                                            <a 
                                                href={req.attachmentUrl} 
                                                target="_blank" 
                                                rel="referrer noopener"
                                                className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                เอกสารประกอบการลา
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </>
    );

    if (borderless) {
        return (
            <div className="flex flex-col justify-between h-full w-full relative z-10" id="leave-history-summary-root-borderless">
                {content}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border-4 border-[#F8F9FA] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-5 sm:p-7 relative overflow-hidden flex flex-col justify-between" id="leave-history-summary-root">
            {content}
        </div>
    );
};

export default LeaveHistorySummary;
