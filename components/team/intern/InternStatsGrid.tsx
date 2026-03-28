
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraduationCap, UserPlus, CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';

interface CounterProps {
    value: number;
}

const Counter: React.FC<CounterProps> = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, value, { duration: 1, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

interface StatCardProps {
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
    description: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ label, count, icon: Icon, color, description }) => (
    <div className="relative overflow-hidden p-5 rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-indigo-500/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 group h-32 flex flex-col justify-between">
        {/* Decorative Background Glow */}
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform duration-700 group-hover:scale-150 bg-${color}-500`} />
        
        <div className="flex justify-between items-start relative z-10">
            <div className="space-y-0.5">
                <span className="text-[16px] font-kanit font-bold uppercase tracking-widest text-gray-400">{label}</span>
                <p className="text-[12px] font-kanit font-medium text-gray-400/80 italic">{description}</p>
            </div>
            <div className={`p-2.5 rounded-2xl bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-sm group-hover:rotate-12 transition-transform duration-500`}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        
        <div className="relative z-10 flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-800 tracking-tighter">
                <Counter value={count} />
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase ml-1">คน</span>
        </div>
    </div>
));

const InternStatsGrid: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [stats, setStats] = useState({
        applied: 0,
        interview: 0,
        accepted: 0,
        rejected: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const statsRef = useRef(stats);

    // Sync ref with state for realtime patching
    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        const start = startOfMonth(currentMonth).toISOString();
        const end = endOfMonth(currentMonth).toISOString();

        try {
            // We fetch counts for the selected month range
            const [applied, interview, accepted, rejected] = await Promise.all([
                supabase.from('intern_candidates').select('id', { count: 'exact', head: true })
                    .gte('application_date', start).lte('application_date', end).eq('status', 'APPLIED'),
                supabase.from('intern_candidates').select('id', { count: 'exact', head: true })
                    .eq('status', 'INTERVIEW_SCHEDULED'), // Interview is usually global/current
                supabase.from('intern_candidates').select('id', { count: 'exact', head: true })
                    .gte('start_date', start).lte('start_date', end).eq('status', 'ACCEPTED'),
                supabase.from('intern_candidates').select('id', { count: 'exact', head: true })
                    .gte('application_date', start).lte('application_date', end).eq('status', 'REJECTED')
            ]);

            setStats({
                applied: applied.count || 0,
                interview: interview.count || 0,
                accepted: accepted.count || 0,
                rejected: rejected.count || 0
            });
        } catch (error) {
            console.error("Error fetching intern stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Real-time Patching Logic
    useEffect(() => {
        const channel = supabase
            .channel('intern-stats-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'intern_candidates' }, (payload) => {
                const start = startOfMonth(currentMonth);
                const end = endOfMonth(currentMonth);
                
                const isDateInRange = (dateStr: string) => {
                    if (!dateStr) return false;
                    return isWithinInterval(new Date(dateStr), { start, end });
                };

                if (payload.eventType === 'INSERT') {
                    const newItem = payload.new;
                    setStats(prev => {
                        const newStats = { ...prev };
                        if (newItem.status === 'APPLIED' && isDateInRange(newItem.application_date)) newStats.applied++;
                        if (newItem.status === 'INTERVIEW_SCHEDULED') newStats.interview++;
                        if (newItem.status === 'ACCEPTED' && isDateInRange(newItem.start_date)) newStats.accepted++;
                        if (newItem.status === 'REJECTED' && isDateInRange(newItem.application_date)) newStats.rejected++;
                        return newStats;
                    });
                } else if (payload.eventType === 'DELETE') {
                    const oldItem = payload.old;
                    // Note: DELETE payload only has ID, so patching is harder without knowing old status.
                    // In this case, we fallback to a debounced re-fetch for safety.
                    fetchStats();
                } else if (payload.eventType === 'UPDATE') {
                    // For updates, it's safer to re-fetch or we need both old and new data
                    // Let's do a quick re-fetch to ensure accuracy when status changes
                    fetchStats();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentMonth, fetchStats]);

    const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const prevMonth = () => setCurrentMonth(prev => subMonths(prev, -1));

    return (
        <div className="space-y-3">
            {/* Toggle Bar */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-indigo-500/5 hover:bg-white/80 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">สถิติภาพรวมประจำเดือน</h3>
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                            {format(currentMonth, 'MMMM yyyy', { locale: th })} • รวม {stats.applied + stats.interview + stats.accepted + stats.rejected} รายการ
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 mr-2">
                        {[
                            { color: 'bg-indigo-400', val: stats.applied },
                            { color: 'bg-amber-400', val: stats.interview },
                            { color: 'bg-emerald-400', val: stats.accepted }
                        ].map((dot, i) => dot.val > 0 && (
                            <div key={i} className={`w-2 h-2 rounded-full border border-white ${dot.color}`} />
                        ))}
                    </div>
                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-indigo-600 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 pt-1 pb-2">
                            {/* Month Selector */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-bold text-gray-800 leading-none">เลือกช่วงเวลา</h3>
                                        <p className="text-[12px] font-kanit font-medium text-gray-400 uppercase tracking-widest mt-1">
                                            ข้อมูลจะอัปเดตตามเดือนที่เลือก
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-1 shadow-sm">
                                    <button 
                                        onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setCurrentMonth(new Date())}
                                        className="px-4 py-1.5 text-[14px] font-kanit font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all uppercase tracking-widest"
                                    >
                                        เดือนนี้
                                    </button>
                                    <button 
                                        onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ${isLoading ? 'opacity-50 blur-[2px]' : 'opacity-100 blur-0'}`}>
                                <StatCard 
                                    label="ผู้สมัครใหม่" 
                                    count={stats.applied} 
                                    icon={UserPlus} 
                                    color="indigo" 
                                    description="สมัครเข้ามาในเดือนนี้"
                                />
                                <StatCard 
                                    label="รอสัมภาษณ์" 
                                    count={stats.interview} 
                                    icon={Clock} 
                                    color="amber" 
                                    description="นัดหมายสัมภาษณ์แล้ว"
                                />
                                <StatCard 
                                    label="รับเข้าฝึกงาน" 
                                    count={stats.accepted} 
                                    icon={CheckCircle2} 
                                    color="emerald" 
                                    description="เริ่มฝึกงานในเดือนนี้"
                                />
                                <StatCard 
                                    label="ไม่ผ่านการคัดเลือก" 
                                    count={stats.rejected} 
                                    icon={XCircle} 
                                    color="rose" 
                                    description="คัดออกในเดือนนี้"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(InternStatsGrid);
