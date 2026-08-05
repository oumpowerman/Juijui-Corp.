import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, AlertCircle, RefreshCw, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { format, subMonths } from 'date-fns';
import th from 'date-fns/locale/th';

interface OTHistoryItem {
    id: string;
    date: Date;
    dateStr: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    reason: string;
    status: string;
    type: string;
    isFixed: boolean;
}

interface OvertimeHistoryTabProps {
    userId: string | undefined;
    isOpen: boolean;
}

const OvertimeHistoryTab: React.FC<OvertimeHistoryTabProps> = ({ userId, isOpen }) => {
    const [otHistoryList, setOtHistoryList] = useState<OTHistoryItem[]>([]);
    const [loadedMonthsOffset, setLoadedMonthsOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [initialFetched, setInitialFetched] = useState<boolean>(false);

    const fetchOTHistory = async (offset: number, isInitial: boolean = false) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const today = new Date();
            const endDate = subMonths(today, offset);
            const startDate = subMonths(today, offset + 3);

            const endDateStr = format(endDate, 'yyyy-MM-dd');
            const startDateStr = format(startDate, 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('ot_requests')
                .select('*')
                .eq('user_id', userId)
                .gte('date', startDateStr)
                .lte('date', endDateStr)
                .order('date', { ascending: false })
                .order('start_time', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped: OTHistoryItem[] = data.map((item: any) => ({
                    id: item.id,
                    date: new Date(item.date),
                    dateStr: item.date,
                    startTime: item.start_time,
                    endTime: item.end_time,
                    durationHours: item.duration_hours || 0,
                    reason: item.reason || '',
                    status: item.status || 'PENDING',
                    type: item.type || 'NORMAL_DAY',
                    isFixed: !!item.is_fixed
                }));

                setOtHistoryList(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newItems = mapped.filter(m => !existingIds.has(m.id));
                    const combined = [...prev, ...newItems];
                    return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
                });

                if (mapped.length === 0) {
                    setHasMore(false);
                } else if (offset >= 24) { // Max limit 2 years
                    setHasMore(false);
                }
            }
        } catch (err) {
            console.error('Failed to fetch OT history:', err);
        } finally {
            setIsLoading(false);
            if (isInitial) setInitialFetched(true);
        }
    };

    // Lazy load upon activation and open
    useEffect(() => {
        if (isOpen && !initialFetched && userId) {
            fetchOTHistory(0, true);
        }
    }, [isOpen, initialFetched, userId]);

    // Reset when modal gets closed completely
    useEffect(() => {
        if (!isOpen) {
            setOtHistoryList([]);
            setLoadedMonthsOffset(0);
            setHasMore(true);
            setInitialFetched(false);
        }
    }, [isOpen]);

    const handleLoadMore = () => {
        if (isLoading || !hasMore) return;
        const nextOffset = loadedMonthsOffset + 3;
        setLoadedMonthsOffset(nextOffset);
        fetchOTHistory(nextOffset);
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    const totalApprovedHours = otHistoryList
        .filter(item => item.status === 'APPROVED')
        .reduce((sum, item) => sum + item.durationHours, 0);

    const totalPendingHours = otHistoryList
        .filter(item => item.status === 'PENDING')
        .reduce((sum, item) => sum + item.durationHours, 0);

    return (
        <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 text-left">
            {/* Summary statistics bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-50 border border-slate-200/60 p-4 rounded-3xl shadow-sm mt-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                            Overtime History
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                            ข้อมูลประวัติการทำงานล่วงเวลา
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold shadow-sm flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        อนุมัติ: {totalApprovedHours.toFixed(1)} ชม.
                    </div>
                    <div className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-[10px] font-bold shadow-sm flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        รอตรวจ: {totalPendingHours.toFixed(1)} ชม.
                    </div>
                </div>
            </div>

            {/* List block */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {otHistoryList.length > 0 ? (
                    otHistoryList.map((item, index) => {
                        const statusConfig = {
                            'APPROVED': {
                                border: 'border-l-4 border-l-emerald-500 border-slate-100',
                                bg: 'bg-emerald-50/20',
                                badge: 'bg-emerald-100 text-emerald-700',
                                label: 'อนุมัติแล้ว',
                                icon: CheckCircle2
                            },
                            'PENDING': {
                                border: 'border-l-4 border-l-amber-500 border-slate-100',
                                bg: 'bg-amber-50/20',
                                badge: 'bg-amber-100 text-amber-700',
                                label: 'รอตรวจสอบ',
                                icon: Clock
                            },
                            'REJECTED': {
                                border: 'border-l-4 border-l-rose-500 border-slate-100',
                                bg: 'bg-rose-50/20',
                                badge: 'bg-rose-100 text-rose-700',
                                label: 'ปฏิเสธ',
                                icon: XCircle
                            }
                        }[item.status] || {
                            border: 'border-l-4 border-l-slate-400 border-slate-100',
                            bg: 'bg-slate-50/40',
                            badge: 'bg-slate-100 text-slate-700',
                            label: 'ไม่ระบุ',
                            icon: AlertCircle
                        };

                        const StatusIcon = statusConfig.icon;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.25 }}
                                className={`p-4 rounded-2xl border ${statusConfig.border} ${statusConfig.bg} shadow-sm/5 flex flex-col gap-2 transition-all hover:translate-x-1 duration-200`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-100/80 rounded-lg text-slate-600 border border-slate-200">
                                            <Calendar className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">
                                            {format(item.date, 'd MMMM yyyy', { locale: th })}
                                        </span>
                                    </div>

                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 ${statusConfig.badge}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 font-semibold mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        เวลา: {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200/40">
                                        ยอดทำจริง: <strong className="text-slate-800 font-bold">{item.durationHours.toFixed(1)} ชม.</strong>
                                    </span>
                                    {item.isFixed && (
                                        <span className="px-1.5 py-0.2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-[9px] font-bold">
                                            เหมาจ่าย
                                        </span>
                                    )}
                                </div>

                                {item.reason && (
                                    <div className="text-[10px] text-slate-400 font-semibold italic flex items-start gap-1 mt-1 bg-white/40 p-2 rounded-xl border border-slate-100/50">
                                        <MessageSquare className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">"{item.reason}"</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                ) : (
                    !isLoading && (
                        <div className="flex-1 h-full min-h-[350px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border-2 border-dashed border-slate-200/60 rounded-[2.5rem] p-8">
                            <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">ไม่มีประวัติ OT</p>
                            <p className="text-xs text-slate-400 mt-2 text-center max-w-xs leading-relaxed">
                                ยังไม่มีประวัติการทำงานล่วงเวลาที่ได้รับการอนุมัติหรือทำรายการในระบบในช่วงเวลานี้
                            </p>
                        </div>
                    )
                )}

                {isLoading && otHistoryList.length === 0 && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 animate-pulse h-24 flex flex-col justify-between" />
                        ))}
                    </div>
                )}

                {hasMore && otHistoryList.length > 0 && (
                    <div className="pt-2 text-center pb-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            onClick={handleLoadMore}
                            className="px-6 py-2.5 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#000] text-slate-700 hover:text-slate-900 rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    กำลังโหลด...
                                </>
                            ) : (
                                <>
                                    ดูเพิ่มเติม (ย้อนหลังอีก 3 เดือน)
                                </>
                            )}
                        </motion.button>
                    </div>
                )}

                {!hasMore && otHistoryList.length > 0 && (
                    <p className="text-center text-[10px] text-slate-400 font-bold py-4">
                        — สิ้นสุดประวัติทำงานล่วงเวลาที่ดึงมาแล้ว —
                    </p>
                )}
            </div>
        </div>
    );
};

export default OvertimeHistoryTab;
