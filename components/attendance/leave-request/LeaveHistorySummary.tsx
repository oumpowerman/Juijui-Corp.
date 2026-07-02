import React, { useMemo, useState, useEffect, useRef } from 'react';
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
    const [isScrolled, setIsScrolled] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll reset on mount
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
        setIsScrolled(false);
    }, []);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    // Scroll reset when filter or year changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        setIsScrolled(false);
    }, [filterType, selectedYear]);

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
            {/* Header / Filter Switcher Panel (Smooth Unified Morphing Header) */}
            <motion.div 
                animate={{ 
                    paddingTop: isScrolled ? '12px' : '20px',
                    paddingBottom: isScrolled ? '12px' : '20px',
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="sticky top-0 bg-white z-20 flex flex-col shrink-0 border-b border-slate-100" 
                id="history-top-panel-wrapper"
            >
                {/* Header title/back row */}
                <div className="flex items-center justify-between pb-2" id="history-header-row">
                    <motion.button 
                        onClick={onBack}
                        animate={{
                            paddingTop: isScrolled ? '4px' : '6px',
                            paddingBottom: isScrolled ? '4px' : '6px',
                            paddingLeft: isScrolled ? '10px' : '14px',
                            paddingRight: isScrolled ? '10px' : '14px',
                            borderRadius: isScrolled ? '8px' : '12px',
                            fontSize: isScrolled ? '10px' : '12px',
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 border border-slate-200/60 font-bold transition-all cursor-pointer active:scale-95"
                    >
                        <ArrowLeft className={isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"} />
                        <span>ดูโควตา</span>
                    </motion.button>

                    <div className="text-right flex flex-col items-end justify-center min-h-[36px]">
                        <AnimatePresence mode="wait">
                            {!isScrolled ? (
                                <motion.div
                                    key="full-title"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-end"
                                >
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">
                                        LEAVE RECORDS
                                    </span>
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                                        <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                                        ประวัติการใช้วันลา
                                    </h3>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="compact-title"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                        ปี {selectedYear + 543}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                        ประวัติการลา
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Year Slider Container */}
                <motion.div
                    animate={{
                        height: isScrolled ? 0 : 'auto',
                        opacity: isScrolled ? 0 : 1,
                        marginTop: isScrolled ? 0 : 12,
                        marginBottom: isScrolled ? 0 : 4,
                    }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden flex flex-col gap-1.5"
                    id="history-year-selector-container-full"
                >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left pl-1 block">
                        เลือกปีการทำงาน:
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x" id="history-year-tabs-full">
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
                                    📅 ปี {year + 543}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Stats Summary Cards (Full Grid) */}
                <motion.div
                    animate={{
                        height: isScrolled ? 0 : 'auto',
                        opacity: isScrolled ? 0 : 1,
                        marginTop: isScrolled ? 0 : 12,
                        marginBottom: isScrolled ? 0 : 4,
                    }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                    id="history-stats-cards-grid-full-wrapper"
                >
                    <div className="grid grid-cols-3 gap-3 pt-1" id="history-stats-cards-grid-full">
                        {Object.entries(selectedYearStats).map(([type, value]) => {
                            const theme = PASTEL_THEMES[type] || PASTEL_THEMES.DEFAULT;
                            const Icon = theme.icon;
                            const isFiltered = filterType === type;
                            const isAnyFiltered = filterType !== null;

                            return (
                                <motion.button 
                                    key={type}
                                    onClick={() => {
                                        setFilterType(prev => prev === type ? null : type);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer w-full relative outline-none select-none ${
                                        isFiltered 
                                            ? `ring-4 ring-indigo-500/15 ${theme.border} ${theme.bg} scale-[1.03] shadow-md shadow-indigo-100/50` 
                                            : !isAnyFiltered
                                                ? `${theme.border} ${theme.bg} hover:scale-[1.02] opacity-100 hover:shadow-sm`
                                                : `${theme.border} ${theme.bg} opacity-40 hover:opacity-80 hover:scale-[1.01]`
                                    }`}
                                >
                                    {isFiltered && (
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                    )}
                                    <span className={`p-1.5 rounded-xl bg-white/95 shadow-sm ${theme.text} mb-2`}>
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-500 block truncate max-w-full">
                                        {theme.label}
                                    </span>
                                    <span className="text-base font-bold text-slate-800 mt-1">
                                        {value}<span className="text-[10px] font-medium text-slate-400 ml-0.5">วัน</span>
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Compact Horizontal Stats Row */}
                <motion.div
                    animate={{
                        height: isScrolled ? 'auto' : 0,
                        opacity: isScrolled ? 1 : 0,
                        marginTop: isScrolled ? 8 : 0,
                    }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                    id="history-compact-stats-wrapper"
                >
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none snap-x animate-in fade-in slide-in-from-top-2 duration-300" id="history-compact-stats">
                        {Object.entries(selectedYearStats).map(([type, value]) => {
                            const theme = PASTEL_THEMES[type] || PASTEL_THEMES.DEFAULT;
                            const Icon = theme.icon;
                            const isFiltered = filterType === type;
                            const isAnyFiltered = filterType !== null;
                            
                            return (
                                <motion.button
                                    key={type}
                                    onClick={() => setFilterType(prev => prev === type ? null : type)}
                                    whileTap={{ scale: 0.97 }}
                                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer snap-center shrink-0 ${
                                        isFiltered 
                                            ? `ring-2 ring-indigo-500/10 ${theme.border} ${theme.bg} ${theme.text}` 
                                            : !isAnyFiltered
                                                ? `${theme.border} ${theme.bg} ${theme.text} hover:scale-102`
                                                : `${theme.border} ${theme.bg} opacity-40 ${theme.text}`
                                    }`}
                                >
                                    <Icon className="w-3 h-3 shrink-0" />
                                    <span>{theme.label}</span>
                                    <span className="font-extrabold ml-1">{value} วัน</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>

            {/* List of Leave requests */}
            <div 
                ref={containerRef}
                onScroll={(e) => {
                    setIsScrolled(e.currentTarget.scrollTop > 45);
                }}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-100/60 pr-1 py-4 pb-20 flex flex-col space-y-3" 
                id="history-list-scroll-view"
            >
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
            <div 
                className="flex flex-col h-full w-full relative z-10 min-h-0 overflow-hidden" 
                id="leave-history-summary-root-borderless"
            >
                {content}
            </div>
        );
    }

    return (
        <div 
            className="bg-white rounded-[2rem] sm:rounded-[3rem] border-4 border-[#F8F9FA] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-5 sm:p-7 relative overflow-hidden flex flex-col h-full min-h-0" 
            id="leave-history-summary-root"
        >
            {content}
        </div>
    );
};

export default LeaveHistorySummary;
