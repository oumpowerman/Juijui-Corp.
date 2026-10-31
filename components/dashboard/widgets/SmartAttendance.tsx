import React, { useState, useMemo, useEffect } from 'react';
import { useAttendanceStatus } from '../../../hooks/attendance/useAttendanceStatus';
import { useAttendanceStats } from '../../../hooks/attendance/useAttendanceStats';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { User, MasterOption, ViewMode } from '../../../types';
import { MapPin, Clock, LogOut, Camera, CheckCircle2, Sparkles, Coffee, Calendar, Flame, Briefcase, PartyPopper, Palmtree, Zap, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface SmartAttendanceProps {
    user: User;
    masterOptions: MasterOption[]; // Receive from parent
    onNavigate: (view: ViewMode) => void;
    hFull?: boolean;
}

const SmartAttendance: React.FC<SmartAttendanceProps> = ({ user, masterOptions, onNavigate, hFull = true }) => {
    const { todayLog, isLoading } = useAttendanceStatus(user.id);
    const { stats } = useAttendanceStats(user.id);
    
    // --- HOLIDAY LOGIC HOOKS ---
    const { exceptions } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();

    const [time, setTime] = useState(new Date());

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- CHECK HOLIDAY & SPECIAL WORK STATUS ---
    const dayStatus = useMemo(() => {
        const currentCheckDate = time; 
        const todayStr = format(currentCheckDate, 'yyyy-MM-dd');
        const dayOfWeek = currentCheckDate.getDay(); // 0 = Sun, 6 = Sat
        
        // 1. Check Exception (Highest Priority)
        const exception = exceptions.find(e => e.date === todayStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return { mode: 'HOLIDAY', name: exception.description || 'วันหยุดพิเศษ' };
            }
            if (exception.type === 'WORK_DAY') {
                return { mode: 'SPECIAL_WORK', name: exception.description || 'วันทำงานพิเศษ' };
            }
        }

        // 2. Check Annual Holiday
        const annual = annualHolidays.find(h => h.isActive && h.day === currentCheckDate.getDate() && h.month === (currentCheckDate.getMonth() + 1));
        if (annual) {
            return { mode: 'HOLIDAY', name: annual.name };
        }

        // 3. Check Weekend (Sat/Sun)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { mode: 'HOLIDAY', name: dayOfWeek === 0 ? 'วันอาทิตย์' : 'วันเสาร์' };
        }

        return { mode: 'NORMAL', name: '' };
    }, [exceptions, annualHolidays, time]);

    // Config-driven Pastel Card configuration
    const config = useMemo(() => {
        const mode = dayStatus.mode;
        
        // Default (NORMAL)
        const base = {
            mode: 'NORMAL',
            bg: 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/80',
            border: 'border-indigo-100',
            shadow: 'shadow-indigo-100/50',
            badgeBg: 'bg-indigo-100',
            badgeText: 'text-indigo-600',
            badgeIcon: Calendar,
            badgeLabel: format(time, 'EEEE, d MMM', { locale: th }),
            title: 'พร้อมลุยไหม?',
            description: 'เริ่มต้นวันใหม่ด้วยพลัง! บันทึกเวลาเข้างานด้วยระบบ Smart GPS & Camera',
            accentColor: 'text-indigo-500',
            icon: Sparkles,
            btnText: 'ไปหน้าลงเวลา',
            btnBg: 'bg-indigo-600',
            btnShadow: 'shadow-indigo-200',
            btnHover: 'hover:bg-indigo-700',
            showBtn: true,
            titleColor: 'text-slate-800'
        };

        if (mode === 'SPECIAL_WORK') {
            return {
                ...base,
                mode: 'SPECIAL_WORK',
                bg: 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80',
                border: 'border-orange-100',
                shadow: 'shadow-orange-100/50',
                badgeBg: 'bg-orange-100',
                badgeText: 'text-orange-600',
                badgeIcon: Zap,
                badgeLabel: dayStatus.name || 'วันทำงานพิเศษ',
                title: 'ลุยงานพิเศษ!',
                description: 'วันนี้มีภารกิจงานพิเศษ สู้ๆ นะครับ! ไปเช็คอินเข้างานกันเลย',
                accentColor: 'text-orange-500',
                btnBg: 'bg-orange-600',
                btnShadow: 'shadow-orange-200',
                btnHover: 'hover:bg-orange-700',
                titleColor: 'text-orange-900'
            };
        }

        if (mode === 'HOLIDAY') {
            return {
                ...base,
                mode: 'HOLIDAY',
                bg: 'bg-gradient-to-br from-rose-50/90 via-white to-pink-50/80',
                border: 'border-rose-100',
                shadow: 'shadow-rose-100/50',
                badgeBg: 'bg-rose-100',
                badgeText: 'text-rose-600',
                badgeIcon: PartyPopper,
                badgeLabel: format(time, 'EEEE, d MMM', { locale: th }),
                title: 'สุขสันต์วันหยุด!',
                description: `วันนี้ "${dayStatus.name}" พักผ่อนให้เต็มที่นะครับ ไม่ต้องลงเวลานะ`,
                accentColor: 'text-rose-500',
                icon: Palmtree,
                btnText: 'แต่ฉันจะทำงาน',
                btnBg: 'bg-rose-500',
                btnShadow: 'shadow-rose-100',
                btnHover: 'hover:bg-rose-600',
                showBtn: true,
                titleColor: 'text-rose-900'
            };
        }
        
        return base;
    }, [dayStatus, time]);

    if (isLoading) {
        return (
            <div className={`w-full ${hFull ? 'h-full' : ''} min-h-[300px] md:min-h-[310px] bg-white/60 rounded-[2.5rem] border-4 border-white animate-pulse p-8 flex flex-col justify-between shadow-sm`}>
                <div className="h-6 w-48 bg-slate-200 rounded-full"></div>
                <div className="h-16 w-3/4 bg-slate-200 rounded-2xl"></div>
                <div className="h-10 w-36 bg-slate-200 rounded-xl self-end"></div>
            </div>
        );
    }

    // Safety check for Leave logs that have no time
    const isLeaveLog = (todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE') && !todayLog?.checkInTime;
    const isCheckedIn = !!todayLog && !!todayLog.checkInTime && !isLeaveLog;
    const isCheckedOut = !!todayLog?.checkOutTime;

    // --- RENDER STATES ---

    // 0. ON LEAVE / WFH (Approved without Time)
    if (isLeaveLog) {
        return (
            <div className={`w-full ${hFull ? 'h-full' : ''}`}>
                <div className={`bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-indigo-50/80 border-4 border-white rounded-[2.5rem] p-7 md:p-8 flex flex-col justify-between shadow-xl shadow-blue-100/50 relative overflow-hidden w-full ${hFull ? 'h-full' : ''} min-h-[300px] md:min-h-[310px] transition-all`}>
                    {/* Top Row */}
                    <div className="flex items-center justify-between relative z-10">
                        <span className="bg-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-white">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            {format(time, 'EEEE, d MMM', { locale: th })}
                        </span>
                        <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-600 flex items-center gap-1.5 shadow-sm border border-white/60">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {format(time, 'HH:mm:ss')} น.
                        </span>
                    </div>

                    {/* Middle Row */}
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10 my-auto py-2">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-md border border-blue-100 shrink-0">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100/60 px-2 py-0.5 rounded-md">APPROVED STATUS</span>
                                <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">
                                    อนุมัติการลาแล้ว 🏖️
                                </h3>
                                <p className="text-sm text-blue-700/80 mt-1 font-medium max-w-md">
                                    {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : 'ได้รับอนุญาตการลา/WFH สำหรับวันนี้เรียบร้อย'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-100/60 shadow-xs max-w-xs text-left">
                            <p className="text-xs font-bold text-blue-900">บันทึกวันลาสำเร็จ</p>
                            <p className="text-[11px] text-blue-700/80 mt-0.5">ระบบเชื่อมต่อตารางงานและไม่คิดเวลาสาย พักผ่อนให้เต็มที่ครับ</p>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-blue-100/60 relative z-10">
                        <span className="text-xs text-blue-600 font-semibold">ขอให้มีวันที่สดใสและราบรื่น</span>
                        <button 
                            onClick={() => onNavigate('ATTENDANCE')}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all hover:scale-102 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>ดูบันทึกการลา</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 1. FINISHED WORK (Pastel Green)
    if (isCheckedOut) {
        return (
            <div className={`w-full ${hFull ? 'h-full' : ''}`}>
                <div 
                    onClick={() => onNavigate('ATTENDANCE')}
                    className={`bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-emerald-100/60 border-4 border-white rounded-[2.5rem] p-7 md:p-8 flex flex-col justify-between shadow-xl shadow-emerald-100/50 relative overflow-hidden group w-full cursor-pointer hover:shadow-2xl transition-all ${hFull ? 'h-full' : ''} min-h-[300px] md:min-h-[310px]`}
                >
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <CheckCircle2 className="w-48 h-48 text-emerald-500" />
                    </div>

                    {/* Top Row */}
                    <div className="flex items-center justify-between relative z-10">
                        <span className="bg-emerald-100 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-white">
                            <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                            {format(time, 'EEEE, d MMM', { locale: th })}
                        </span>
                        <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 flex items-center gap-1.5 shadow-sm border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ลงเวลาครบถ้วนแล้ว
                        </span>
                    </div>

                    {/* Middle Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 my-auto py-2">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-md border border-emerald-100 shrink-0">
                                <Coffee className="w-8 h-8" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">DAILY COMPLETED</span>
                                <h3 className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1">
                                    เลิกงานแล้ว! 🎉
                                </h3>
                                <p className="text-sm text-emerald-700/80 mt-1 font-medium max-w-md">
                                    ขอบคุณสำหรับความทุ่มเทในวันนี้นะครับ พักผ่อนให้เต็มที่ เจอกันวันใหม่!
                                </p>
                            </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-100 shadow-sm">
                            <div className="text-center px-3">
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">เข้างาน</p>
                                <p className="text-base font-bold text-emerald-900 font-mono mt-0.5">
                                    {todayLog?.checkInTime ? format(new Date(todayLog.checkInTime), 'HH:mm') : '--:--'}
                                </p>
                            </div>
                            <div className="h-8 w-px bg-emerald-200"></div>
                            <div className="text-center px-3">
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">ออกงาน</p>
                                <p className="text-base font-bold text-emerald-900 font-mono mt-0.5">
                                    {todayLog?.checkOutTime ? format(new Date(todayLog.checkOutTime), 'HH:mm') : '--:--'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50 relative z-10">
                        <span className="text-xs text-emerald-700 font-semibold">คลิกเพื่อดูสรุปประวัติการทำงาน</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                            <span>ดูประวัติทั้งหมด</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. WORKING NOW (Gradient Border + Glow)
    if (isCheckedIn) {
        return (
            <div className={`w-full ${hFull ? 'h-full' : ''}`}>
                <div className={`relative p-[3px] rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-100/50 w-full ${hFull ? 'h-full' : ''} min-h-[300px] md:min-h-[310px] flex flex-col`}>
                    <div className={`bg-gradient-to-br from-white via-indigo-50/30 to-white rounded-[2.35rem] p-7 md:p-8 flex flex-col justify-between relative overflow-hidden ${hFull ? 'h-full' : ''} w-full`}>
                        {/* Top Row */}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-bold text-emerald-600 tracking-wider">กำลังทำงาน (ACTIVE)</span>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                {todayLog?.workType || 'Office / WFH'}
                            </span>
                        </div>

                        {/* Middle Row */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 my-auto py-2">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-md">
                                    <Clock className="w-8 h-8 animate-pulse text-indigo-600" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        CHECKED IN AT {todayLog?.checkInTime ? format(new Date(todayLog.checkInTime), 'HH:mm น.') : '--:--'}
                                    </span>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">
                                        กำลังปฏิบัติงาน 👨‍💻
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1 font-medium max-w-md">
                                        มุ่งมั่นทำงานให้สำเร็จตามเป้าหมาย หากเสร็จงานแล้วอย่าลืมกดเลิกงานนะ
                                    </p>
                                </div>
                            </div>

                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">เวลาปัจจุบัน</p>
                                <p className="text-2xl font-bold text-indigo-900 font-mono mt-0.5">
                                    {format(time, 'HH:mm:ss')}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
                            <button
                                onClick={() => onNavigate('ATTENDANCE')}
                                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                ดูไทม์ไลน์วันนี้ <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => onNavigate('ATTENDANCE')}
                                className="px-6 py-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-100 hover:border-red-500 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                            >
                                <LogOut className="w-4 h-4" /> 
                                <span>เลิกงาน (Clock Out)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2.5 NOT CHECKED IN / HOLIDAY (Config-driven Pastel Card)
    return (
        <div className={`w-full ${hFull ? 'h-full' : ''}`}>
            <div className={`
                rounded-[2.5rem] p-7 md:p-8 shadow-xl relative overflow-hidden group border-4 border-white w-full transition-all duration-500 flex flex-col justify-between
                ${hFull ? 'h-full' : ''} min-h-[300px] md:min-h-[310px]
                ${config.bg} ${config.shadow}
            `}>
                {/* Dynamic Background Blobs */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white opacity-40 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-30 rounded-full blur-2xl pointer-events-none"></div>
                
                {/* Top Row: Date Badge & Live Clock & Streak */}
                <div className="flex items-center justify-between relative z-10 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className={`${config.badgeBg} ${config.badgeText} px-3.5 py-1.5 rounded-full text-xs font-bold border border-white tracking-wider flex items-center shadow-xs`}>
                            <config.badgeIcon className="w-3.5 h-3.5 mr-1.5" />
                            {config.badgeLabel}
                        </span>
                        <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 flex items-center gap-1.5 shadow-xs border border-white/60">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {format(time, 'HH:mm:ss')} น.
                        </span>
                    </div>

                    {stats.currentStreak > 0 && config.mode !== 'HOLIDAY' ? (
                        <div className="bg-white/70 backdrop-blur-md border border-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
                            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                                {stats.currentStreak} Day Streak!
                            </span>
                        </div>
                    ) : config.mode === 'HOLIDAY' ? (
                        <span className="bg-rose-100/90 text-rose-700 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-rose-200/50 shadow-xs">
                            <Palmtree className="w-3.5 h-3.5 text-rose-500" />
                            วันหยุดพักผ่อน 🌴
                        </span>
                    ) : (
                        <span className="bg-indigo-100/80 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-indigo-200/50 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            Smart Attendance
                        </span>
                    )}
                </div>

                {/* Middle Row: Hero & Context Card */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 my-auto py-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-white shrink-0">
                                <config.icon className={`w-8 h-8 ${config.accentColor} animate-pulse`} />
                            </div>
                            <div>
                                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${config.titleColor}`}>
                                    {config.title}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1 font-medium max-w-lg leading-relaxed">
                                    {config.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Context info box */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-xs max-w-xs shrink-0 w-full md:w-auto">
                        {config.mode === 'HOLIDAY' ? (
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                    <span>🎉</span> วันหยุดตามปฏิทิน
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    ระบบงดเว้นการเช็คชื่อ ไม่บันทึกขาด/สาย และไม่หัก HP วันนี้ครับ
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                    <span>🕒</span> เวลาทำงานปกติ
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    กดลงเวลาเพื่อบันทึกพิกัดและภาพถ่ายเข้าสู่ระบบบริษัท
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-black/5 relative z-10">
                    <button 
                        onClick={() => onNavigate('ATTENDANCE')}
                        className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer py-1.5"
                    >
                        <span>เปิดหน้าบันทึกเวลา & ประวัติ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {config.showBtn && (
                        <button 
                            onClick={() => onNavigate('ATTENDANCE')}
                            className={`group/btn relative px-7 py-3.5 ${config.btnBg} text-white rounded-2xl font-bold text-sm shadow-md ${config.btnShadow} ${config.btnHover} hover:scale-102 active:scale-95 transition-all flex items-center gap-2.5 overflow-hidden w-full sm:w-auto justify-center cursor-pointer`}
                        >
                            <Camera className="w-4 h-4 relative z-10 group-hover/btn:rotate-12 transition-transform" />
                            <span className="relative z-10">{config.btnText}</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartAttendance;
