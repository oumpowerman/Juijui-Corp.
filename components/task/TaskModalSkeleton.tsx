
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const TaskModalSkeleton: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]"
            >
                {/* Header Skeleton */}
                <div className="p-8 border-b border-white/40 flex items-center justify-between bg-white/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="w-32 h-4 bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                         <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                </div>

                {/* Body Skeleton */}
                <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-hidden">
                    {/* Main Content Area */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-3">
                            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                            <div className="w-full h-32 bg-slate-50 rounded-3xl animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                            <div className="w-full h-48 bg-slate-50 rounded-3xl animate-pulse" />
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-white/40 space-y-4">
                             <div className="w-full h-10 bg-slate-200/50 rounded-xl animate-pulse" />
                             <div className="w-full h-10 bg-slate-200/50 rounded-xl animate-pulse" />
                             <div className="w-full h-10 bg-slate-200/50 rounded-xl animate-pulse" />
                        </div>
                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-white/40 space-y-4">
                             <div className="w-full h-24 bg-slate-100 rounded-2xl animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Footer / Loading Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px] pointer-events-none">
                    <div className="bg-white/80 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-3 border border-white">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-400">กำลังเตรียมข้อมูล...</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TaskModalSkeleton;
