import React from 'react';
import { X, ArrowLeft, Loader2, Film, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskType } from '../../types';

interface TaskModalHeaderProps {
    viewMode: string;
    setViewMode: (mode: any) => void;
    hasHistory?: boolean;
    onClose: () => void;
    isLoadingDetails: boolean;
    themeColor: string;
    currentTheme: { icon: any, label: string };
    taskData?: Task | null;
    activeTab: TaskType;
}

const TaskModalHeader: React.FC<TaskModalHeaderProps> = ({
    viewMode,
    setViewMode,
    hasHistory,
    onClose,
    isLoadingDetails,
    themeColor,
    currentTheme,
    taskData,
    activeTab
}) => {
    return (
        <div className={`
            relative px-4 sm:px-8 py-2.5 sm:py-5 border-b flex justify-between items-center shrink-0 transition-colors duration-500
            bg-${themeColor}-50/50 border-${themeColor}-100
        `}>
            {/* Top Sync Indicator */}
            <AnimatePresence>
                {isLoadingDetails && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 32 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute inset-x-0 -top-[0px] z-[100] bg-white border-b border-indigo-100 flex items-center justify-center overflow-hidden"
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 tracking-[0.2em] uppercase">
                            <Loader2 className="w-3 h-3 animate-spin"/> Syncing Rich Content...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex items-center gap-3 sm:gap-5">
                {(viewMode !== 'DETAILS' || hasHistory) && (
                    <button 
                        onClick={() => {
                            if (viewMode !== 'DETAILS') {
                                setViewMode('DETAILS');
                            } else if (hasHistory) {
                                onClose();
                            }
                        }} 
                        className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 border bg-white border-${themeColor}-200 text-${themeColor}-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50`}
                        title={viewMode !== 'DETAILS' ? "Back to Details" : "Back to Parent Task"}
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
                <div className="min-w-0">
                    <h2 className={`text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-800 transition-colors truncate`}>
                        {viewMode === 'DETAILS' ? (
                             taskData ? (taskData.title || 'แก้ไขงาน') : (activeTab === 'CONTENT' ? '🎬 สร้างคอนเทนต์ใหม่' : '⚡ สร้างภารกิจใหม่')
                        ) : (
                            <span className={`flex items-center gap-2 text-${themeColor}-600 truncate`}>
                                {React.createElement(currentTheme.icon, { className: "w-5 h-5 sm:w-6 sm:h-6 shrink-0" })}
                                {currentTheme.label}
                                {isLoadingDetails && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                            </span>
                        )}
                    </h2>
                    
                    {/* Meta Badge */}
                    {viewMode === 'DETAILS' && (
                        <div className="flex items-center gap-3 mt-1.5 sm:mt-2">
                             <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest uppercase border-2 shadow-sm relative overflow-hidden
                                    ${activeTab === 'CONTENT' 
                                        ? 'bg-white border-indigo-200 text-indigo-600 shadow-indigo-100/50' 
                                        : 'bg-white border-emerald-200 text-emerald-600 shadow-emerald-100/50'
                                    }
                                `}
                            >
                                <div className={`
                                    flex items-center justify-center w-4 h-4 rounded-full text-white shrink-0
                                    ${activeTab === 'CONTENT' ? 'bg-indigo-500' : 'bg-emerald-500'}
                                `}>
                                    {activeTab === 'CONTENT' ? <Film className="w-2.5 h-2.5" /> : <ActivityIcon className="w-2.5 h-2.5" />}
                                </div>
                                <span className="relative z-10">{activeTab}</span>
                                
                                {/* Ambient Glow for Content */}
                                {activeTab === 'CONTENT' && (
                                    <motion.div 
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                        className="absolute inset-0 bg-indigo-100/50 blur-sm -z-0"
                                    />
                                )}
                            </motion.div>

                            {taskData && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] sm:text-[10px] text-slate-400 font-mono shadow-inner">
                                    <span className="opacity-50 tracking-tighter">ID:</span>
                                    <span className="font-bold">{taskData.id.slice(0,8).toUpperCase()}</span>
                                </div>
                            )}

                            {isLoadingDetails && (
                                <div className="flex items-center gap-1.5 p-1 px-2 bg-indigo-50/50 rounded-lg text-[9px] text-indigo-500 font-black tracking-widest uppercase border border-indigo-100/50">
                                    <Loader2 className="w-3 h-3 animate-spin"/> Syncing
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <button 
                onClick={onClose} 
                className={`p-1.5 sm:p-2 rounded-full transition-all border border-transparent hover:rotate-90 bg-white/50 text-slate-400 hover:text-${themeColor}-500 hover:bg-white shrink-0`}
            >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
    );
};

export default TaskModalHeader;
