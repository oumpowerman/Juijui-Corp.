
import React from 'react';
import { 
    Calendar, 
    Clock, 
    Tag, 
    Edit3, 
    Trash2, 
    Layout, 
    Users,
    FileText,
    MessageSquare,
    Paperclip,
    Globe,
    Sparkles,
    Copy,
    Film,
    AlertTriangle
} from 'lucide-react';
import { Task, User, MasterOption, Platform, Channel } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PLATFORM_ICONS } from '../../config/taxonomy';
import Markdown from 'react-markdown';
import { useToast } from '../../context/ToastContext';

interface ContentDetailProps {
    task: Task;
    users: User[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onEdit: () => void;
    onDelete?: () => void;
    onClose: () => void;
}

const ContentDetail: React.FC<ContentDetailProps> = ({ 
    task, users, channels, masterOptions, onEdit, onDelete, onClose 
}) => {
    const { showToast } = useToast();
    
    const getOptionLabel = (key: string | undefined, type: string) => {
        if (!key) return 'ไม่ระบุ';
        const option = masterOptions.find(o => o.key === key && o.type === type);
        return option?.label || key;
    };

    const getStatusInfo = (status: string) => {
        const option = masterOptions.find(o => o.key === status && o.type === 'STATUS');
        return {
            label: option?.label || status,
            color: option?.color || 'slate'
        };
    };

    const getChannelInfo = (id: string | undefined) => {
        if (!id) return null;
        return channels.find(c => c.id === id);
    };

    const getPriorityInfo = (priority: string) => {
        switch (priority) {
            case 'URGENT': return { label: 'ด่วนที่สุด', color: 'rose' };
            case 'HIGH': return { label: 'สำคัญมาก', color: 'orange' };
            case 'MEDIUM': return { label: 'ปกติ', color: 'indigo' };
            case 'LOW': return { label: 'ต่ำ', color: 'slate' };
            default: return { label: priority, color: 'slate' };
        }
    };

    const getPlatformStyle = (platform: string) => {
        switch (platform) {
            case 'YOUTUBE': return 'bg-[#FFF0F0] text-[#FF4B4B] border-[#FFE0E0]';
            case 'FACEBOOK': return 'bg-[#EBF5FF] text-[#1877F2] border-[#D1E9FF]';
            case 'TIKTOK': return 'bg-[#F8F8F8] text-[#000000] border-[#EEEEEE]';
            case 'INSTAGRAM': return 'bg-[#FFF0F5] text-[#E4405F] border-[#FFE0EB]';
            default: return 'bg-[#F9FAFB] text-[#9CA3AF] border-[#F3F4F6]';
        }
    };

    const getUserById = (id: string) => users.find(u => u.id === id);

    const statusInfo = getStatusInfo(task.status);
    const priorityInfo = getPriorityInfo(task.priority);
    const channel = getChannelInfo(task.channelId);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const sectionVariants: Variants = {
        hidden: { opacity: 0, scale: 0.98, y: 15 },
        visible: { 
            opacity: 1, 
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 20, stiffness: 120 }
        }
    };

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    const handleCopyId = () => {
        navigator.clipboard.writeText(task.id);
        showToast('คัดลอก ID เรียบร้อยแล้ว ✨', 'success');
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            {/* --- SOFT PASTEL HEADER --- */}
            <div className="sticky top-0 z-40 px-6 sm:px-10 py-6 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 flex items-center justify-between shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-5">
                    <motion.div 
                        whileHover={{ rotate: -8, scale: 1.15 }}
                        className={`
                            w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)]
                            bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100
                        `}
                    >
                        <Layout className="w-7 h-7" />
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-2xl font-semibold text-slate-700 tracking-tight leading-none">{task.title}</h3>
                            <button 
                                onClick={handleCopyId}
                                className="p-1.5 rounded-xl bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 transition-all active:scale-90"
                                title="Copy ID"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-${statusInfo.color}-50 text-${statusInfo.color}-500 border border-${statusInfo.color}-100/50`}>
                                {statusInfo.label}
                            </span>
                            {channel && (
                                <motion.div 
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    className="flex items-center justify-center w-8 h-8 bg-white border border-slate-100 rounded-full shadow-sm overflow-hidden"
                                    title={channel.name}
                                >
                                    {channel.logoUrl ? (
                                        <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: channel.color || '#cbd5e1' }}>
                                            {channel.name.charAt(0)}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                            <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-${priorityInfo.color}-50 text-${priorityInfo.color}-400 border border-${priorityInfo.color}-100`}>
                                {priorityInfo.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button 
                        whileHover={bouncyHover}
                        whileTap={{ scale: 0.95 }}
                        onClick={onEdit}
                        className="group flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-2xl font-semibold text-sm shadow-[0_4px_12px_-2px_rgba(79,70,229,0.1)] hover:bg-indigo-100 transition-all"
                    >
                        <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        EDIT CONTENT
                    </motion.button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 scrollbar-hide">
                
                {/* --- SECTION 1: STRATEGY BENTO --- */}
                <motion.section variants={sectionVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-300 px-1">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Strategy & Identity</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Pillar Card */}
                        <motion.div 
                            whileHover={bouncyHover}
                            className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
                        >
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Content Pillar</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-300 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <p className="text-lg font-semibold text-slate-600">{getOptionLabel(task.pillar, 'PILLAR')}</p>
                            </div>
                        </motion.div>

                        {/* Category Card */}
                        <motion.div 
                            whileHover={bouncyHover}
                            className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
                        >
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Category</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-300 flex items-center justify-center">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <p className="text-lg font-semibold text-slate-600">{getOptionLabel(task.category, 'CATEGORY')}</p>
                            </div>
                        </motion.div>

                        {/* Format Card */}
                        <motion.div 
                            whileHover={bouncyHover}
                            className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 sm:col-span-2"
                        >
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Content Format</p>
                            <div className="flex flex-wrap gap-2">
                                {task.contentFormats && task.contentFormats.length > 0 ? (
                                    task.contentFormats.map(f => (
                                        <span key={f} className="px-4 py-2 bg-amber-50 text-amber-500 rounded-xl text-sm font-semibold border border-amber-100 shadow-sm">
                                            {getOptionLabel(f, 'FORMAT')}
                                        </span>
                                    ))
                                ) : (
                                    <span key={task.contentFormat} className="px-4 py-2 bg-amber-50 text-amber-500 rounded-xl text-sm font-semibold border border-amber-100 shadow-sm">
                                        {getOptionLabel(task.contentFormat, 'FORMAT')}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* --- SECTION 2: PRODUCTION & TIMELINE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Timeline */}
                    <motion.section variants={sectionVariants} className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <Clock className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Production Timeline</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-2 gap-8 relative overflow-hidden"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-300 flex items-center justify-center shrink-0">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Publish Date</p>
                                        <p className="text-xl font-semibold text-slate-600">
                                            {task.endDate ? format(new Date(task.endDate), 'd MMMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1 font-medium">
                                            {task.startDate ? `เริ่มผลิต: ${format(new Date(task.startDate), 'd MMM', { locale: th })}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-300 flex items-center justify-center shrink-0">
                                        <Film className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Shoot Date</p>
                                        <p className="text-xl font-semibold text-slate-600">
                                            {task.shootDate ? format(new Date(task.shootDate), 'd MMMM yyyy', { locale: th }) : 'ยังไม่ระบุวันถ่าย'}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1 font-medium italic">
                                            {task.shootLocation ? `@ ${task.shootLocation}` : 'ยังไม่ระบุสถานที่'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Target Platforms</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'].map(p => {
                                        const isActive = task.targetPlatforms?.includes(p as Platform);
                                        const Icon = PLATFORM_ICONS[p as Platform] || Globe;
                                        const pastelStyle = getPlatformStyle(p);
                                        return (
                                            <motion.div 
                                                key={p} 
                                                whileHover={isActive ? { scale: 1.05 } : {}}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-2xl border transition-all
                                                    ${isActive ? `${pastelStyle} shadow-[0_4px_12px_rgba(0,0,0,0.03)] font-semibold` : 'bg-slate-50 border-slate-50 text-slate-200 opacity-40'}
                                                `}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-[10px] font-semibold tracking-wider uppercase">{p}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.section>

                    {/* Team */}
                    <motion.section variants={sectionVariants} className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <Users className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">The Creative Crew</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
                        >
                            {[
                                { label: 'Idea Owner', ids: task.ideaOwnerIds, color: 'indigo' },
                                { label: 'Assignee', ids: task.assigneeIds, color: 'emerald' },
                                { label: 'Editor', ids: task.editorIds, color: 'rose' }
                            ].map((role) => (
                                <div key={role.label} className="space-y-3">
                                    <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">{role.label}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {role.ids && role.ids.length > 0 ? (
                                            role.ids.map(id => {
                                                const user = getUserById(id);
                                                return user ? (
                                                    <motion.div 
                                                        key={id} 
                                                        whileHover={{ scale: 1.1, x: 5 }}
                                                        className="group flex items-center gap-2 p-1 pr-3 bg-slate-50/50 border border-slate-100/50 rounded-full hover:bg-white hover:shadow-sm transition-all cursor-default"
                                                    >
                                                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                                                        <span className="text-[11px] font-semibold text-slate-500">{user.name}</span>
                                                    </motion.div>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-[10px] text-slate-200 italic">Not Assigned</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.section>
                </div>

                {/* --- SECTION 3: BRIEF & REMARK --- */}
                <motion.section variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Content Brief</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[300px] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
                            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-500 prose-p:leading-relaxed prose-strong:text-slate-700">
                                {task.description ? (
                                    <Markdown>{task.description}</Markdown>
                                ) : (
                                    <p className="italic text-slate-200 text-lg">No description provided for this content.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-8">
                        {task.remark && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-300 px-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Important Remark</h4>
                                </div>
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-amber-50/20 p-8 rounded-[2.5rem] border border-amber-100/20 shadow-sm relative overflow-hidden"
                                >
                                    <p className="text-sm text-amber-600/80 font-semibold leading-relaxed relative z-10">{task.remark}</p>
                                </motion.div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-300 px-1">
                                <Paperclip className="w-4 h-4" />
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Quick Assets</h4>
                            </div>
                            <motion.div 
                                whileHover={bouncyHover}
                                className="bg-slate-50/30 p-8 rounded-[2.5rem] text-slate-400 border border-slate-100/50 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Paperclip className="w-12 h-12 rotate-12" />
                                </div>
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2">Attached Files</p>
                                <p className="text-4xl font-semibold text-slate-400/80 mb-1">{task.assets?.length || 0}</p>
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Total Assets Linked</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

            </div>

            {/* --- MINIMAL FOOTER --- */}
            <div className="px-10 py-6 bg-white border-t border-slate-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-8">
                    {task.createdAt && (
                        <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                            <span className="text-[11px] font-semibold text-slate-400">{format(new Date(task.createdAt), 'd MMM yyyy, HH:mm', { locale: th })}</span>
                        </div>
                    )}
                    <div className="w-px h-6 bg-slate-100" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Comments</span>
                        <span className="text-[11px] font-semibold text-slate-400">0 Messages</span>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                >
                    Close Window
                </button>
            </div>
        </motion.div>
    );
};

export default ContentDetail;
