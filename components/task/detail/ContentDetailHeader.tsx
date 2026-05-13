
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, ChevronRight, Copy, Trash2, Edit3 } from 'lucide-react';
import { Task, User, Channel } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useMasterData } from '../../../hooks/useMasterData';

interface ContentDetailHeaderProps {
    task: Task;
    users: User[];
    channels: Channel[];
    isExpanded: boolean;
    onToggleExpand: (val: boolean) => void;
    onEdit: () => void;
    onDelete?: () => void;
}

const ContentDetailHeader: React.FC<ContentDetailHeaderProps> = ({
    task, users, channels, isExpanded, onToggleExpand, onEdit, onDelete
}) => {
    const { masterOptions } = useMasterData();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const getUserById = (id: string) => users.find(u => u.id === id);
    const getChannelInfo = (id: string | undefined) => id ? channels.find(c => c.id === id) : null;
    
    const getStatusInfo = (status: string) => {
        const option = masterOptions.find(o => o.key === status && o.type === 'STATUS');
        return {
            label: option?.label || status,
            color: option?.color || 'slate'
        };
    };

    const statusInfo = getStatusInfo(task.status);
    const channel = getChannelInfo(task.channelId);

    const handleCopyTitle = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(task.title);
        showToast('คัดลอกชื่อรายการเรียบร้อยแล้ว ✨', 'success');
    };

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
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100/40`}>
                                <Layout className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                {task.title.length > 50 ? task.title.slice(0, 50) + '...' : task.title}
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
                                className={`w-10 h-10 sm:w-16 sm:h-16 rounded-[0.85rem] sm:rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100/50 shrink-0 mt-1 sm:mt-0 cursor-pointer`}
                            >
                                <Layout className="w-5 h-5 sm:w-8 sm:h-8" />
                            </motion.div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-start sm:items-center gap-2 mb-1.5 group justify-start">
                                    <h3 className="text-lg sm:text-2xl lg:text-2xl font-bold text-slate-600 tracking-tight leading-[1.2] lg:leading-tight line-clamp-2">
                                        {task.title}
                                    </h3>
                                    <button onClick={handleCopyTitle} className="mt-1 sm:mt-0 p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-400 opacity-0 group-hover:opacity-100 hidden sm:block transition-all">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                                    <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest bg-${statusInfo.color}-50 text-${statusInfo.color}-500 border border-${statusInfo.color}-100/50`}>
                                        {statusInfo.label}
                                    </span>
                                    {channel && (
                                        <div className="flex items-center justify-center w-6 h-6 sm:w-9 sm:h-9 bg-white border border-slate-100 rounded-full shadow-sm overflow-hidden">
                                            {channel.logoUrl ? (
                                                <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] sm:text-[12px] font-bold text-white uppercase" style={{ backgroundColor: channel.color || '#cbd5e1' }}>
                                                    {channel.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => onToggleExpand(false)} className="text-[12px] font-bold text-indigo-400 hover:text-indigo-600 px-2 py-1 bg-indigo-50/50 rounded-lg transition-colors">
                                        CLOSE TOOLS
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                            {onDelete && (
                                <motion.button 
                                    whileHover={{ scale: 1.1, backgroundColor: '#fff1f2', color: '#f43f5e' }}
                                    onClick={handleDeleteClick}
                                    className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-slate-300 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.button>
                            )}
                            <motion.button 
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(238, 242, 255, 0.8)' }}
                                onClick={onEdit}
                                className="flex-1 sm:flex-none group flex items-center justify-center gap-2.5 px-5 sm:px-8 py-3.5 sm:py-4 bg-indigo-50/50 text-indigo-500 border border-indigo-100/50 rounded-[1rem] sm:rounded-[1.25rem] font-bold text-xs sm:text-sm shadow-sm"
                            >
                                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                                <span>EDIT CONTENT</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ContentDetailHeader;
