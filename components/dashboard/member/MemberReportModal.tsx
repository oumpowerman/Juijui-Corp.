import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, TrendingUp, Target, BarChart3, PieChart as PieIcon, Award, Briefcase, Zap, CheckCircle2 } from 'lucide-react';
import { User as UserType, Task, Platform } from '../../../types';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { isTaskCompleted } from '../../../config/status';
import { DIFFICULTY_LABELS } from '../../../config/taxonomy';
import { motion, AnimatePresence } from "framer-motion";

// Import Sub-components
import GlassyCard from './report/GlassyCard';
import ReportHeader from './report/ReportHeader';
import ReportSummary from './report/ReportSummary';
import ReportCharts from './report/ReportCharts';
import ReportTaskTable from './report/ReportTaskTable';
import ReportSignOff from './report/ReportSignOff';

interface MemberReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType;
    tasks: Task[];
}

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#22d3ee'];

const MemberReportModal: React.FC<MemberReportModalProps> = ({ isOpen, onClose, user, tasks }) => {
    const [dateRange, setDateRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('THIS_MONTH');
    const [filterType, setFilterType] = useState<'ALL' | 'CONTENT' | 'TASK'>('ALL');
    const printRef = useRef<HTMLDivElement>(null);

    const getRange = () => {
        const now = new Date();
        if (dateRange === 'THIS_MONTH') return { start: startOfMonth(now), end: endOfMonth(now) };
        if (dateRange === 'LAST_MONTH') return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
        if (dateRange === 'THIS_YEAR') return { start: startOfYear(now), end: endOfYear(now) };
        return { start: startOfMonth(now), end: endOfMonth(now) };
    };

    const { start, end } = getRange();

    // --- Core Data Processing Engine ---
    const reportData = useMemo(() => {
        const memberTasks = tasks.filter(t => {
            const isInvolved = 
                t.assigneeIds.includes(user.id) || 
                t.ideaOwnerIds?.includes(user.id) || 
                t.editorIds?.includes(user.id);
            
            if (!isInvolved) return false;
            if (filterType !== 'ALL' && t.type !== filterType) return false;
            if (!t.endDate) return false;
            const taskDate = new Date(t.endDate);
            return isWithinInterval(taskDate, { 
                start: startOfDay(start), 
                end: endOfDay(end) 
            });
        });

        const completedTasks = memberTasks.filter(t => 
            t.status === 'DONE' || t.status === 'APPROVE' || t.status === 'PASSED'
        );

        let totalXPEarned = 0;
        completedTasks.forEach(t => {
            const difficulty = t.difficulty || 'MEDIUM';
            const baseXP = DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS]?.xp || 100;
            const hourlyBonus = (t.estimatedHours || 0) * 20;
            totalXPEarned += (baseXP + hourlyBonus);
        });

        let roles = { Owner: 0, Editor: 0, Support: 0 };
        completedTasks.forEach(t => {
            if (t.ideaOwnerIds?.includes(user.id)) roles.Owner++;
            if (t.editorIds?.includes(user.id)) roles.Editor++;
            if (!t.ideaOwnerIds?.includes(user.id) && !t.editorIds?.includes(user.id)) {
                roles.Support++;
            }
        });

        const roleData = [
            { name: 'Idea Owner', value: roles.Owner },
            { name: 'Editor', value: roles.Editor },
            { name: 'Support', value: roles.Support },
        ].filter(d => d.value > 0);

        const platformMap: Record<string, number> = {};
        completedTasks.forEach(t => {
            if (t.targetPlatforms && t.targetPlatforms.length > 0) {
                t.targetPlatforms.forEach(p => {
                    platformMap[p] = (platformMap[p] || 0) + 1;
                });
            } else {
                platformMap['OTHER'] = (platformMap['OTHER'] || 0) + 1;
            }
        });
        const platformData = Object.entries(platformMap).map(([name, value]) => ({ name, value }));

        const timelineMap: Record<string, number> = {};
        completedTasks.forEach(t => {
            const dateKey = format(new Date(t.endDate), 'yyyy-MM-dd');
            timelineMap[dateKey] = (timelineMap[dateKey] || 0) + 1;
        });
        
        const timelineData = Object.entries(timelineMap)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([dateKey, count]) => ({
                name: format(new Date(dateKey), 'd MMM'),
                count
            }));

        return {
            tasks: completedTasks.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()),
            totalCompleted: completedTasks.length,
            totalXPEarned,
            productivityRate: memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0,
            roleData,
            platformData,
            timelineData,
            topRole: roleData.sort((a, b) => b.value - a.value)[0]?.name || '-'
        };
    }, [tasks, user.id, start, end, filterType]);

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 print:p-0 print:bg-white print:block print:static">
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-slate-50/80 backdrop-blur-2xl w-full max-w-6xl h-[95vh] rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden relative border border-white/40 print:h-auto print:w-full print:max-w-none print:rounded-none print:shadow-none print:bg-white"
                >
                    
                    {/* --- HEADER --- */}
                    <ReportHeader 
                        dateRange={dateRange} 
                        setDateRange={setDateRange} 
                        onPrint={handlePrint} 
                        onClose={onClose} 
                    />

                    {/* --- REPORT CONTENT --- */}
                    <div className="flex-1 overflow-y-auto p-12 bg-gradient-to-br from-indigo-50/30 via-white/50 to-purple-50/30 print:p-0 print:overflow-visible print:bg-white custom-scrollbar">
                        
                        {/* A4 Paper Simulation */}
                        <div 
                            ref={printRef}
                            className="bg-white/70 backdrop-blur-sm w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl rounded-[2rem] border border-white/60 print:shadow-none text-slate-800 font-sans mx-auto print:w-full print:max-w-none print:p-0 print:bg-white"
                        >
                            {/* 1. Profile Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-12 mb-12">
                                <div className="flex items-center gap-8">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <img src={user.avatarUrl} className="relative w-32 h-32 rounded-[2.2rem] border-4 border-white object-cover shadow-2xl" alt="Profile" />
                                        <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-2xl text-xs font-black border-4 border-white shadow-xl">
                                            LV.{user.level}
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">{user.name}</h1>
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100">{user.position}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">Member ID: #{user.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="flex items-center gap-6 mt-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-400"/> {user.email}</span>
                                            <span className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-indigo-400"/> Joined: {user.startDate ? format(new Date(user.startDate), 'dd MMM yyyy') : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] mb-4 inline-block shadow-xl shadow-slate-200">
                                        Performance Record
                                    </div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Reporting Period</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight">
                                        {format(start, 'MMMM yyyy').toUpperCase()}
                                    </p>
                                    <p className="text-[10px] text-slate-300 mt-2 font-black uppercase tracking-widest">Ref: {format(new Date(), 'yyyyMMdd-HHmm')}</p>
                                </div>
                            </div>

                            {/* 2. KPIs */}
                            <ReportSummary 
                                totalCompleted={reportData.totalCompleted} 
                                productivityRate={reportData.productivityRate} 
                                totalXPEarned={reportData.totalXPEarned} 
                                topRole={reportData.topRole} 
                            />

                            {/* 3. Charts */}
                            <ReportCharts 
                                roleData={reportData.roleData} 
                                platformData={reportData.platformData} 
                                colors={COLORS} 
                            />

                            {/* 4. Task Table */}
                            <ReportTaskTable 
                                tasks={reportData.tasks} 
                                userId={user.id} 
                            />

                            {/* 5. Sign-off */}
                            <ReportSignOff userName={user.name} />

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default MemberReportModal;
