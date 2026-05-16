
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronRight, Trash2, Edit3, FileText, Activity, Check } from 'lucide-react';
import { Task, User, Channel } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface ContentDetailHeaderProps {
    task: Task;
    users: User[];
    channels: Channel[];
    isExpanded: boolean;
    onToggleExpand: (val: boolean) => void;
    onEdit: () => void;
    onDelete?: () => void;
    activeTab: 'CONTENT' | 'EDIT';
    setActiveTab: (tab: 'CONTENT' | 'EDIT') => void;
    viewSubTab?: 'INFO' | 'INSIGHT';
    setViewSubTab?: (tab: 'INFO' | 'INSIGHT') => void;
    isInsightOverdue?: boolean;
    isInsightCompleted?: boolean;
}

const ContentDetailHeader: React.FC<ContentDetailHeaderProps> = ({
    task, users, channels, isExpanded, onToggleExpand, onEdit, onDelete, activeTab, setActiveTab,
    viewSubTab = 'INFO', setViewSubTab, isInsightOverdue = false, isInsightCompleted = false
}) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const getUserById = (id: string) => users.find(u => u.id === id);
    
    const handleDeleteClick = async () => {
        if (!onDelete) return;
        const confirm = await showConfirm(
            `คุณแน่ใจว่าต้องการลบโปรเจกต์ "${task.title}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ และงานย่อยทั้งหมดจะถูกลบไปด้วย`,
            'ยืนยันการลบโครงการ'
        );
        if (confirm) {
            onDelete();
        }
    };

    return (
        <motion.div 
            layout
            animate={{ height: isExpanded ? 'auto' : 46 }}
            transition={{ height: { type: 'spring', damping: 25, stiffness: 120 } }}
            className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] overflow-hidden relative"
        >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 opacity-80" />

            <AnimatePresence initial={false}>
                {!isExpanded ? (
                    <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onToggleExpand(true)}
                        className="h-[44px] flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-400 border border-indigo-100/40`}>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                PROJECT CONTROLS
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 mr-2">
                                {task.assigneeIds?.slice(0, 3).map((id, index) => {
                                    const user = getUserById(id);
                                    return user ? (
                                        <img 
                                            key={id} 
                                            src={user.avatarUrl} 
                                            alt={user.name} 
                                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                                            style={{ zIndex: 3 - index }}
                                        />
                                    ) : null;
                                })}
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors">EXPAND CONTROLS</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 sm:px-10 py-3 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-10"
                    >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-5 flex-1 min-w-0 w-full lg:w-auto">
                            <motion.div 
                                onClick={() => onToggleExpand(false)}
                                whileHover={{ rotate: -8, scale: 1.15 }}
                                className={`w-10 h-10 sm:w-16 sm:h-16 rounded-[0.85rem] sm:rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-rose-50 text-rose-400 border border-rose-100/50 shrink-0 mt-1 sm:mt-0 cursor-pointer group`}
                            >
                                <ChevronUp className="w-5 h-5 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                            </motion.div>
                            <div className="flex-1 min-w-0 text-left">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'CONTENT' && setViewSubTab && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="inline-flex items-center p-1.5 bg-slate-900/5 backdrop-blur-md rounded-[1.25rem] border border-slate-200/50 shadow-inner overflow-hidden"
                                        >
                                            {[
                                                { id: 'INFO', label: 'ข้อมูลทั่วไป', icon: FileText, color: 'text-indigo-600' },
                                                { id: 'INSIGHT', label: 'สถิติ (INSIGHT)', icon: Activity, color: 'text-amber-600' }
                                            ].map((tab) => {
                                                const isActive = viewSubTab === tab.id;
                                                const isInsight = tab.id === 'INSIGHT';
                                                
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setViewSubTab(tab.id as any)}
                                                        className={`
                                                            relative flex items-center gap-2.5 px-6 py-2.5 rounded-[0.9rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 z-10
                                                            ${isActive ? tab.color : 'text-slate-400 hover:text-slate-600'}
                                                        `}
                                                    >
                                                        {isActive && (
                                                            <motion.div
                                                                layoutId="subTabPill"
                                                                className="absolute inset-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-[0.9rem] -z-10"
                                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                            />
                                                        )}
                                                        
                                                        <tab.icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                                        <span className="hidden xs:inline">{tab.label}</span>

                                                        {isInsight && isInsightOverdue && !isActive && (
                                                            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-slate-50"></span>
                                                            </span>
                                                        )}
                                                        
                                                        {isInsight && isInsightCompleted && (
                                                            <div className={`ml-1 flex items-center justify-center w-4 h-4 rounded-full ${isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'} transition-colors`}>
                                                                <Check strokeWidth={4} className="w-2.5 h-2.5" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* --- MODE SWITCHER (DETAIL | EDIT) --- */}
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 w-fit shrink-0 shadow-inner">
                            <button 
                                onClick={() => setActiveTab('CONTENT')}
                                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-500 overflow-hidden ${activeTab === 'CONTENT' ? 'text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                title="View Detail"
                            >
                                {activeTab === 'CONTENT' && (
                                    <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-white ring-1 ring-slate-200/60" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />
                                )}
                                <span className="relative flex items-center gap-2">
                                    <FileText className={`w-4 h-4 ${activeTab === 'CONTENT' ? 'text-indigo-500' : 'text-slate-400'}`} />
                                    <span className="hidden sm:inline">DETAIL</span>
                                </span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('EDIT')}
                                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-500 overflow-hidden ${activeTab === 'EDIT' ? 'text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                title="Edit Project"
                            >
                                {activeTab === 'EDIT' && (
                                    <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-white ring-1 ring-slate-200/60" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />
                                )}
                                <span className="relative flex items-center gap-2">
                                    <Edit3 className={`w-4 h-4 ${activeTab === 'EDIT' ? 'text-indigo-500' : 'text-slate-400'}`} />
                                    <span className="hidden sm:inline">EDIT</span>
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                            {onDelete && (
                                <motion.button 
                                    whileHover={{ scale: 1.1, backgroundColor: '#fff1f2', color: '#f43f5e' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleDeleteClick}
                                    className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-slate-300 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ContentDetailHeader;
