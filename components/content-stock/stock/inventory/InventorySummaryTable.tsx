import React, { useState, useMemo } from 'react';
import { MasterOption, Task } from '../../../../types';
import { Landmark, Tags, Layers, Search, X, Calendar, ClipboardList, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to compute subtask checklist progress percentage
const getChecklistPercentage = (task: Task, masterOptions: MasterOption[]) => {
    if (!task.status || !masterOptions) return 0;
    
    const groupKey = task.status.trim().toUpperCase();
    
    const checklistSteps = masterOptions
        .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    
    const totalCount = checklistSteps.length;
    if (totalCount === 0) return 0;

    const localProgress = task.subChecklistProgress || {};
    
    let definedWeightSum = 0;
    let definedWeightCount = 0;
    
    const stepsData = checklistSteps.map(step => {
        let weight: number | null = null;
        if (typeof step.progressValue === 'number' && step.progressValue > 0) {
            weight = step.progressValue;
        } else {
            try {
                const desc = JSON.parse(step.description || '{}');
                if (typeof desc.weight === 'number') {
                    weight = desc.weight;
                }
            } catch (e) {}
        }

        if (weight !== null) {
            definedWeightSum += weight;
            definedWeightCount++;
        }

        return {
            key: step.key,
            weight,
            isChecked: !!localProgress[step.key]
        };
    });

    if (definedWeightCount === totalCount) {
        if (definedWeightSum === 0) return 0;
        const checkedWeightSum = stepsData
            .filter(s => s.isChecked)
            .reduce((sum, s) => sum + (s.weight || 0), 0);
        return Math.round((checkedWeightSum / definedWeightSum) * 100);
    }

    const undefinedCount = totalCount - definedWeightCount;
    const remainingWeight = Math.max(0, 100 - definedWeightSum);
    const defaultWeightPerUndefined = undefinedCount > 0 ? remainingWeight / undefinedCount : 0;

    let totalPercentage = 0;
    stepsData.forEach(s => {
        if (s.isChecked) {
            if (s.weight !== null) {
                totalPercentage += s.weight;
            } else {
                totalPercentage += defaultWeightPerUndefined;
            }
        }
    });

    return Math.round(totalPercentage);
};

const getStatusBadgeStyles = (status: string = '') => {
    const s = status.toUpperCase();
    if (s.includes('IDEA') || s.includes('BACKLOG')) return 'bg-blue-50 text-blue-600 border-blue-100/50';
    if (s.includes('SCRIPT')) return 'bg-purple-50 text-purple-600 border-purple-100/50';
    if (s.includes('SHOOT') || s.includes('FILM')) return 'bg-amber-50 text-amber-600 border-amber-100/50';
    if (s.includes('EDIT')) return 'bg-pink-50 text-pink-600 border-pink-100/50';
    if (s.includes('DONE') || s.includes('APPROVE') || s.includes('COMPLETE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
    return 'bg-gray-50 text-gray-600 border-gray-100';
};

const getStatusLabel = (status: string = '', masterOptions: MasterOption[]) => {
    const option = masterOptions.find(o => o.type === 'STATUS' && o.key === status);
    return option?.label || status;
};

interface InventorySummaryTableProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    selectedChannel?: string;
    onEditTask?: (task: Task) => void;
}

const InventorySummaryTable: React.FC<InventorySummaryTableProps> = ({ tasks, masterOptions, selectedChannel = 'ALL', onEditTask }) => {
    const [selectedBreakdown, setSelectedBreakdown] = useState<{
        type: 'PILLAR' | 'CATEGORY';
        key: string;
        label: string;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const pillarOptions = masterOptions.filter(o => 
        o.type === 'PILLAR' && 
        (selectedChannel === 'ALL' || !o.parentKey || o.parentKey === selectedChannel)
    );
    const categoryOptions = masterOptions.filter(o => 
        o.type === 'CATEGORY' && 
        (selectedChannel === 'ALL' || !o.parentKey || o.parentKey === selectedChannel)
    );

    // Grouping logic
    const pillarCounts = pillarOptions.map(p => ({
        key: p.key,
        label: p.label,
        count: tasks.filter(t => t.pillar === p.key).length
    })).sort((a, b) => b.count - a.count);

    const categoryCounts = categoryOptions.map(c => ({
        key: c.key,
        label: c.label,
        count: tasks.filter(t => t.category === c.key).length
    })).sort((a, b) => b.count - a.count);

    const filteredBreakdownTasks = useMemo(() => {
        if (!selectedBreakdown) return [];
        
        const baseTasks = tasks.filter(t => {
            if (selectedBreakdown.type === 'PILLAR') {
                return t.pillar === selectedBreakdown.key;
            } else {
                return t.category === selectedBreakdown.key;
            }
        });

        if (!searchQuery.trim()) return baseTasks;

        const query = searchQuery.toLowerCase().trim();
        return baseTasks.filter(t => t.title?.toLowerCase().includes(query));
    }, [tasks, selectedBreakdown, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pillar Breakdown */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Breakdown by Pillar</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">คลิกแถวเพื่อดูรายการเนื้อหา</p>
                        </div>
                    </div>
                    <div className="p-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <th className="px-4 py-3">Pillar Name</th>
                                    <th className="px-4 py-3 text-right">Count</th>
                                    <th className="px-4 py-3 text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pillarCounts.map(item => (
                                    <tr 
                                        key={item.key} 
                                        onClick={() => setSelectedBreakdown({ type: 'PILLAR', key: item.key, label: item.label })}
                                        className="hover:bg-blue-50/40 cursor-pointer transition-all duration-150 group active:scale-[0.995]"
                                    >
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700 group-hover:text-blue-600 flex items-center gap-1.5">
                                            <span>{item.label}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{item.count}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {tasks.length > 0 ? ((item.count / tasks.length) * 100).toFixed(1) : 0}%
                                                </span>
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-500 rounded-full" 
                                                        style={{ width: `${tasks.length > 0 ? (item.count / tasks.length) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Tags className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Breakdown by Category</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">คลิกแถวเพื่อดูรายการเนื้อหา</p>
                        </div>
                    </div>
                    <div className="p-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <th className="px-4 py-3">Category Name</th>
                                    <th className="px-4 py-3 text-right">Count</th>
                                    <th className="px-4 py-3 text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {categoryCounts.map(item => (
                                    <tr 
                                        key={item.key} 
                                        onClick={() => setSelectedBreakdown({ type: 'CATEGORY', key: item.key, label: item.label })}
                                        className="hover:bg-emerald-50/40 cursor-pointer transition-all duration-150 group active:scale-[0.995]"
                                    >
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700 group-hover:text-emerald-600 flex items-center gap-1.5">
                                            <span>{item.label}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{item.count}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {tasks.length > 0 ? ((item.count / tasks.length) * 100).toFixed(1) : 0}%
                                                </span>
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-500 rounded-full" 
                                                        style={{ width: `${tasks.length > 0 ? (item.count / tasks.length) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Breakdown Tasks Detail Modal */}
            <AnimatePresence>
                {selectedBreakdown && (
                    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 sm:p-6 font-sans">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedBreakdown(null);
                                setSearchQuery('');
                            }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl h-[75vh] bg-white rounded-[2.5rem] shadow-[0_20px_70px_-12px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${selectedBreakdown.type === 'PILLAR' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {selectedBreakdown.type === 'PILLAR' ? <Landmark className="w-5 h-5" /> : <Tags className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                            <span>คลังคอนเทนต์ ({selectedBreakdown.type === 'PILLAR' ? 'Pillar' : 'Category'})</span>
                                        </h3>
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                                            {selectedBreakdown.label} • {filteredBreakdownTasks.length} รายการที่กำลังดำเนินการ
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedBreakdown(null);
                                        setSearchQuery('');
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Bar / Filter Panel */}
                            <div className="px-8 py-4 bg-slate-50/50 border-b border-gray-100 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อคอนเทนต์ในกลุ่มนี้..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Modal Body / Table List */}
                            <div className="flex-1 overflow-y-auto px-8 py-4 scrollbar-hide">
                                {filteredBreakdownTasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                                        <Layers className="w-10 h-10 text-gray-300 mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">ไม่พบคอนเทนต์ในกลุ่มนี้</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredBreakdownTasks.map(task => {
                                            const pct = getChecklistPercentage(task, masterOptions);
                                            return (
                                                <div 
                                                    key={task.id} 
                                                    onClick={() => {
                                                        if (onEditTask) {
                                                            onEditTask({ ...task, _isPartial: true, type: 'CONTENT' });
                                                        }
                                                    }}
                                                    className="py-4 flex items-center justify-between gap-4 group hover:bg-slate-50/80 px-4 -mx-4 rounded-2xl cursor-pointer transition-all duration-200"
                                                >
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                            {task.title || 'Untitled Content'}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                            {/* Format Pills */}
                                                            {task.contentFormats && task.contentFormats.length > 0 && (
                                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black">
                                                                    {task.contentFormats.join(', ')}
                                                                </span>
                                                            )}
                                                            
                                                            {/* Shoot Date */}
                                                            {task.shootDate ? (
                                                                <span className="flex items-center gap-1 text-slate-500 font-bold bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100/30">
                                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                                    <span>{new Date(task.shootDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300">ไม่มีวันนัดถ่าย</span>
                                                            )}

                                                            {/* Subtask progress text */}
                                                            <span className="flex items-center gap-1 text-indigo-500 font-bold">
                                                                <ClipboardList className="w-3 h-3 shrink-0" />
                                                                <span>Checklist {pct}%</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Status Tag and Action */}
                                                    <div className="flex items-center gap-3.5 shrink-0">
                                                        {/* Status Badge */}
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusBadgeStyles(task.status)}`}>
                                                            {getStatusLabel(task.status, masterOptions)}
                                                        </span>

                                                        {/* Progress bar */}
                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                                            <div 
                                                                className="h-full bg-indigo-500 rounded-full"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>

                                                        {/* Quick Go button */}
                                                        <div className="p-1.5 bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>พบทั้งหมด {filteredBreakdownTasks.length} รายการ</span>
                                <span>คลิกเพื่อดูรายละเอียดเชิงลึกและสคริปต์ได้ทันที</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventorySummaryTable;
