import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
// Added CheckCircle2 to lucide-react import
import { X, Printer, FileText, TrendingUp, Target, BarChart3, PieChart as PieIcon, Award, Briefcase, Zap, CheckCircle2 } from 'lucide-react';
import { User as UserType, Task, Platform } from '../../../types';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// Fix: Import isTaskCompleted and DIFFICULTY_LABELS from correct config files as constants.ts is not provided
import { isTaskCompleted } from '../../../config/status';
import { DIFFICULTY_LABELS } from '../../../config/taxonomy';

interface MemberReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType;
    tasks: Task[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

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
        // 1. Filter only tasks where this member is involved
        const memberTasks = tasks.filter(t => {
            const isInvolved = 
                t.assigneeIds.includes(user.id) || 
                t.ideaOwnerIds?.includes(user.id) || 
                t.editorIds?.includes(user.id);
            
            if (!isInvolved) return false;
            if (filterType !== 'ALL' && t.type !== filterType) return false;
            
            // Context: Only report items with a deadline within the range
            if (!t.endDate) return false;
            const taskDate = new Date(t.endDate);
            return isWithinInterval(taskDate, { 
                start: startOfDay(start), 
                end: endOfDay(end) 
            });
        });

        // 2. Metrics Calculation
        const completedTasks = memberTasks.filter(t => 
            t.status === 'DONE' || t.status === 'APPROVE' || t.status === 'PASSED'
        );

        // 3. XP Engine Sync
        let totalXPEarned = 0;
        completedTasks.forEach(t => {
            const difficulty = t.difficulty || 'MEDIUM';
            const baseXP = DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS]?.xp || 100;
            const hourlyBonus = (t.estimatedHours || 0) * 20;
            totalXPEarned += (baseXP + hourlyBonus);
        });

        // 4. Role Analysis (Weighted)
        let roles = { Owner: 0, Editor: 0, Support: 0 };
        completedTasks.forEach(t => {
            if (t.ideaOwnerIds?.includes(user.id)) roles.Owner++;
            if (t.editorIds?.includes(user.id)) roles.Editor++;
            // If not owner or editor, must be support (assignee)
            if (!t.ideaOwnerIds?.includes(user.id) && !t.editorIds?.includes(user.id)) {
                roles.Support++;
            }
        });

        const roleData = [
            { name: 'Idea Owner', value: roles.Owner },
            { name: 'Editor', value: roles.Editor },
            { name: 'Support', value: roles.Support },
        ].filter(d => d.value > 0);

        // 5. Platform Analysis
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

        // 6. Productivity Timeline
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:block print:static">
            
            {/* Modal Container */}
            <div className="bg-slate-100 w-full max-w-5xl h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative print:h-auto print:w-full print:max-w-none print:rounded-none print:shadow-none print:bg-white">
                
                {/* --- CONTROLS (Hidden on Print) --- */}
                <div className="bg-white border-b border-gray-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 tracking-tight">Personal Performance Report</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">รายงานสรุปผลงานรายบุคคล</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-gray-200">
                             {(['THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR'] as const).map(r => (
                                 <button
                                    key={r}
                                    onClick={() => setDateRange(r)}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${dateRange === r ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                                 >
                                     {r === 'THIS_MONTH' ? 'เดือนนี้' : r === 'LAST_MONTH' ? 'เดือนก่อน' : 'รายปี'}
                                 </button>
                             ))}
                        </div>

                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                        >
                            <Printer className="w-4 h-4" /> พิมพ์รายงาน
                        </button>
                        
                        <button onClick={onClose} className="p-2.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* --- A4 REPORT PREVIEW --- */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 print:p-0 print:overflow-visible print:bg-white">
                    
                    {/* A4 Paper */}
                    <div 
                        ref={printRef}
                        className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none text-slate-800 font-sans mx-auto print:w-full print:max-w-none print:p-0"
                    >
                        {/* 1. Official Header */}
                        <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8 mb-10">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <img src={user.avatarUrl} className="w-24 h-24 rounded-3xl border-4 border-gray-100 object-cover shadow-md" alt="Profile" />
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black border-4 border-white shadow-sm">
                                        LV.{user.level}
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-1">{user.name}</h1>
                                    <p className="text-lg font-bold text-indigo-600 uppercase tracking-widest">{user.position}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-bold">
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3"/> {user.email}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span>Joined: {user.startDate ? format(new Date(user.startDate), 'dd/MM/yyyy') : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-gray-900 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                                    Official Performance Record
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Reporting Period</p>
                                <p className="text-xl font-black text-gray-900">
                                    {format(start, 'MMM yyyy').toUpperCase()}
                                </p>
                                <p className="text-[10px] text-gray-300 mt-1 font-mono uppercase">Generated: {format(new Date(), 'dd.MM.yyyy @ HH:mm')}</p>
                            </div>
                        </div>

                        {/* 2. Key Performance Indicators (KPIs) */}
                        <div className="mb-12">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center">
                                <Target className="w-4 h-4 mr-2" /> Executive Summary
                            </h3>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-center group">
                                    <p className="text-4xl font-black text-indigo-600 mb-1">{reportData.totalCompleted}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Completed</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-center">
                                    <p className="text-4xl font-black text-emerald-600 mb-1">{reportData.productivityRate}%</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Productivity</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-indigo-600 text-white text-center shadow-xl shadow-indigo-100">
                                    <p className="text-4xl font-black mb-1">+{reportData.totalXPEarned.toLocaleString()}</p>
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">XP Gained</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-center">
                                    <p className="text-4xl font-black text-pink-500 mb-1 truncate px-2">{reportData.topRole}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Top Role</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Detailed Visual Analytics */}
                        <div className="grid grid-cols-2 gap-10 mb-12">
                             {/* Role Breakdown */}
                             <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 h-72 relative">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                    <PieIcon className="w-3.5 h-3.5 mr-2" /> Contribution by Role
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reportData.roleData}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={75}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {reportData.roleData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                        <ReTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                             </div>

                             {/* Platform Distribution */}
                             <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 h-72 relative">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                    <BarChart3 className="w-3.5 h-3.5 mr-2" /> Platform Distribution
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData.platformData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
                                        <ReTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20}>
                                            {reportData.platformData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        </div>

                        {/* 4. Task History Table */}
                        <div className="mb-16">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Task Fulfillment History
                            </h3>
                            <div className="overflow-hidden border-2 border-slate-50 rounded-[2rem]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                                            <th className="py-4 pl-6">Delivery Date</th>
                                            <th className="py-4">Project / Task Title</th>
                                            <th className="py-4 text-center">Involvement</th>
                                            <th className="py-4 text-right pr-8">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs font-bold text-gray-600">
                                        {reportData.tasks.length === 0 ? (
                                            <tr><td colSpan={4} className="py-12 text-center text-gray-300 italic">No historical records found for this period.</td></tr>
                                        ) : reportData.tasks.map((task, i) => {
                                            const difficulty = task.difficulty || 'MEDIUM';
                                            const xpValue = (DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS]?.xp || 100) + ((task.estimatedHours || 0) * 20);
                                            
                                            // Detect role for this specific task
                                            let myRole = 'Support';
                                            if (task.ideaOwnerIds?.includes(user.id)) myRole = 'Owner';
                                            else if (task.editorIds?.includes(user.id)) myRole = 'Editor';

                                            return (
                                                <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 pl-6 font-mono text-gray-400">{format(new Date(task.endDate), 'dd MMM yyyy')}</td>
                                                    <td className="py-4 text-gray-900 max-w-[250px] truncate">{task.title}</td>
                                                    <td className="py-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                                            myRole === 'Owner' ? 'bg-yellow-100 text-yellow-700' : 
                                                            myRole === 'Editor' ? 'bg-purple-100 text-purple-700' : 
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {myRole}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right pr-8">
                                                        <span className="text-emerald-600">+{xpValue} XP</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 5. Validation & Sign-off */}
                        <div className="mt-auto pt-10 grid grid-cols-2 gap-20">
                            <div className="text-center">
                                <div className="border-b-2 border-gray-200 h-16 mb-4 flex items-end justify-center">
                                    {/* Placeholder for Signature */}
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member Acknowledgment</p>
                                <p className="text-xs font-bold text-gray-800 mt-1">{user.name}</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-2 border-gray-200 h-16 mb-4 flex items-end justify-center">
                                    {/* Placeholder for Signature */}
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Management Sign-off</p>
                                <p className="text-xs font-bold text-gray-800 mt-1">Admin / Head of Production</p>
                            </div>
                        </div>

                        <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                            <span>Powered by Juijui Planner V7 Architecture</span>
                            <span>Confidentially Recorded • {format(new Date(), 'yyyy')}</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MemberReportModal;