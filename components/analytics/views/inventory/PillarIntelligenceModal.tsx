import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, FileText, ArrowUpRight, Loader2, Plus } from 'lucide-react';
import { Task, MasterOption } from '../../../../types';
import { fetchTasksByPillar } from '../../../../services/analyticsService';

interface PillarIntelligenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    pillarKey: string | null;
    pillarName: string;
    filters: {
        channelId: string;
        startDate: Date;
        endDate: Date;
    };
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
}

const ITEMS_PER_PAGE = 8;

const PillarIntelligenceModal: React.FC<PillarIntelligenceModalProps> = ({
    isOpen,
    onClose,
    pillarKey,
    pillarName,
    filters,
    masterOptions,
    onTaskClick
}) => {
    const [mounted, setMounted] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [totalTasks, setTotalTasks] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loadTasks = useCallback(async (pageNum: number, isInitial: boolean = false) => {
        if (!pillarKey) return;
        setIsLoading(true);
        try {
            const result = await fetchTasksByPillar(pillarKey, {
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                channelId: filters.channelId,
                startDate: filters.startDate.toISOString(),
                endDate: filters.endDate.toISOString()
            });

            if (isInitial) {
                setTasks(result.tasks);
            } else {
                setTasks(prev => [...prev, ...result.tasks]);
            }
            
            setTotalTasks(result.total);
            setHasMore(result.tasks.length === ITEMS_PER_PAGE && (pageNum * ITEMS_PER_PAGE) < result.total);
        } catch (error) {
            console.error('Failed to load tasks for pillar:', error);
        } finally {
            setIsLoading(false);
        }
    }, [pillarKey, filters]);

    useEffect(() => {
        setMounted(true);
        if (isOpen && pillarKey) {
            document.body.style.overflow = 'hidden';
            // Initial load
            setPage(1);
            loadTasks(1, true);
        } else {
            document.body.style.overflow = 'unset';
            setTasks([]);
            setTotalTasks(0);
            setPage(1);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, pillarKey, loadTasks]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadTasks(nextPage);
    };

    const getCategoryLabel = (key?: string) => {
        return masterOptions.find(o => o.key === key)?.label || key;
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Full Screen Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl px-4"
                        style={{ height: '100dvh', width: '100dvw', top: 0, left: 0 }}
                    />
                    
                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_40px_120px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh] border-4 border-white mx-4"
                    >
                        {/* Header */}
                        <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 relative">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-300 transform -rotate-3 transition-transform">
                                    <Target className="w-9 h-9" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2 uppercase">{pillarName}</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Strategic Core Matrix • SaaS Scale Intelligence</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-90"
                            >
                                <X className="w-7 h-7" />
                            </button>

                            <div className="absolute top-0 right-1/4 w-32 h-2 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent rounded-full" />
                        </div>

                        {/* Content List */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-4">
                            {tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (idx % ITEMS_PER_PAGE) * 0.05 }}
                                    onClick={() => onTaskClick(task)}
                                    className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/80 transition-all cursor-pointer overflow-hidden ring-1 ring-transparent hover:ring-indigo-100"
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-7">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                                                    {task.title}
                                                </h4>
                                                <div className="flex items-center gap-5">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                                            {task.endDate ? new Date(task.endDate).toLocaleDateString('th-TH') : 'Unscheduled'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-4 py-1 rounded-full bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100 transition-all">
                                                            {getCategoryLabel(task.category)}
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${
                                                            task.status?.toString().toLowerCase().includes('done')
                                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                                : 'bg-amber-50 border-amber-100 text-amber-600'
                                                        }`}>
                                                            {task.status || 'DONE'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                                                    {(task.performance?.views || 0).toLocaleString()}
                                                </p>
                                                <div className="flex items-center justify-end gap-3 mt-1.5">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Target className="w-2.5 h-2.5" /> {(task.performance?.likes || 0).toLocaleString()} Likes
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
                                                        {(task.performance?.views ?? 0) > 0 
                                                            ? (((( (task.performance?.likes ?? 0) + (task.performance?.comments ?? 0) + (task.performance?.shares ?? 0) ) / (task.performance?.views ?? 0)) * 100).toFixed(1))
                                                            : '0.0'}% ENG
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 border border-indigo-200 shadow-lg shadow-indigo-100">
                                                <ArrowUpRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing Intelligence Assets...</p>
                                </div>
                            )}

                            {hasMore && !isLoading && (
                                <button 
                                    onClick={handleLoadMore}
                                    className="w-full py-6 rounded-[2.5rem] bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-600 font-bold text-sm uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    Load Strategic Assets
                                </button>
                            )}

                            {tasks.length === 0 && !isLoading && (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <p className="text-lg font-bold">ไม่พบข้อมูลคอนเทนต์ในเสาหลักนี้</p>
                                    <p className="text-sm">ลองปรับการกรองข้อมูลหรือเพิ่มคอนเทนต์ใหม่</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Stats */}
                        <div className="px-10 py-6 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Pillar Scale</p>
                                    <p className="text-lg font-bold leading-none">{totalTasks} Assets Detected</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Loaded Strategy</p>
                                    <p className="text-lg font-bold leading-none">
                                        {tasks.length} of {totalTasks}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Scalable SaaS Cloud Sync</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default PillarIntelligenceModal;
