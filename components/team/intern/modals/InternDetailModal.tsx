
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    User, 
    Mail, 
    Phone, 
    GraduationCap, 
    Briefcase, 
    Calendar, 
    Link as LinkIcon, 
    MessageSquare, 
    Edit2,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Globe,
    Quote
} from 'lucide-react';
import { InternCandidate, InternStatus } from '../../../../types';
import { format } from 'date-fns';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';
import { ensureExternalLink } from '../../../../lib/linkUtils';

interface InternDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    intern: InternCandidate | null;
    onEdit: (intern: InternCandidate) => void;
}

const InternDetailModal: React.FC<InternDetailModalProps> = ({ isOpen, onClose, intern, onEdit }) => {
    if (typeof document === 'undefined' || !intern) return null;

    const getStatusInfo = (status: InternStatus) => {
        switch (status) {
            case 'APPLIED': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Applied', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent' };
            case 'INTERVIEW_SCHEDULED': return { icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', label: 'Scheduled', gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent' };
            case 'INTERVIEWED': return { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Interviewed', gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent' };
            case 'ACCEPTED': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Accepted', gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent' };
            case 'REJECTED': return { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: 'Rejected', gradient: 'from-rose-500/20 via-pink-500/10 to-transparent' };
            case 'ARCHIVED': return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', label: 'Archived', gradient: 'from-gray-500/20 via-slate-500/10 to-transparent' };
            default: return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', label: 'Unknown', gradient: 'from-gray-500/20 to-transparent' };
        }
    };

    const [isImageViewOpen, setIsImageViewOpen] = React.useState(false);

    const statusInfo = getStatusInfo(intern.status);
    const StatusIcon = statusInfo.icon;

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                type: "spring" as const, 
                damping: 20 
            } 
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full max-w-2xl bg-slate-50 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-white overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Header Section (Hero Background) */}
                        <div className={`relative h-56 shrink-0 bg-gradient-to-br ${statusInfo.gradient} overflow-visible`}>
                            {/* Decorative Mesh */}
                            <div className="absolute inset-0 opacity-40 overflow-hidden">
                                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-white blur-[100px]" />
                                <div className="absolute bottom-[-30%] right-[-10%] w-[70%] h-[90%] rounded-full bg-white blur-[120px]" />
                            </div>
                            
                            {/* Top Bar Controls */}
                            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-30">
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-white/90 backdrop-blur-md text-slate-500 hover:text-indigo-600 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        onEdit(intern);
                                        onClose();
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-kanit font-medium shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 group"
                                >
                                    <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    แก้ไขข้อมูล
                                </button>
                            </div>

                            {/* Identity Section (Floating Profile) */}
                            <div className="absolute -bottom-16 left-10 right-10 flex items-end gap-8 z-40">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                    className="relative shrink-0"
                                >
                                    <div 
                                        onClick={() => intern.avatarUrl && setIsImageViewOpen(true)}
                                        className={`w-36 h-36 rounded-[2.5rem] bg-white p-2 shadow-2xl border border-slate-100 overflow-hidden ${intern.avatarUrl ? 'cursor-zoom-in group/avatar' : ''}`}
                                    >
                                        {intern.avatarUrl ? (
                                            <div className="relative w-full h-full overflow-hidden rounded-[2rem]">
                                                <img 
                                                    src={getDirectDriveUrl(intern.avatarUrl)} 
                                                    alt={intern.fullName}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/10 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-[2rem]">
                                                <User className="w-14 h-14 text-slate-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-lg border border-slate-50 flex items-center justify-center ${statusInfo.color}`}>
                                        <StatusIcon className="w-5 h-5" />
                                    </div>
                                </motion.div>

                                <div className="mb-4 pb-2 flex-1 min-w-0 relative">
                                    {/* Glassy Plate for Name & Position */}
                                    <div className="absolute -inset-x-6 -inset-y-4 bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-sm -z-10" />
                                    
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-3 ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} shadow-sm`}>
                                        {statusInfo.label}
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-2 truncate">
                                        {intern.fullName}{intern.nickname ? ` (${intern.nickname})` : ''}
                                    </h2>
                                    <p className="text-base font-medium text-slate-500 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-indigo-400" />
                                        {intern.position || 'ยังไม่ระบุตำแหน่ง'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex-1 overflow-y-auto pt-24 pb-10 px-10 space-y-8 custom-slim-scrollbar bg-white/40 backdrop-blur-sm"
                        >
                            {/* Bento Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Card */}
                                <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 text-blue-600 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-kanit font-bold uppercase tracking-wider">ข้อมูลติดต่อ</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-kanit font-medium text-slate-400 uppercase tracking-widest mb-1">อีเมล</span>
                                            <span className="text-sm font-kanit font-bold text-slate-700 break-all">{intern.email}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-kanit font-medium text-slate-400 uppercase tracking-widest mb-1">เบอร์โทรศัพท์</span>
                                            <span className="text-sm font-kanit font-bold text-slate-700">{intern.phoneNumber}</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Education Card - Redesigned for better spacing */}
                                <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 text-purple-600 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-kanit font-bold uppercase tracking-wider">การศึกษา</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[11px] font-kanit font-medium text-slate-400 uppercase tracking-widest mb-1">สถาบัน</span>
                                            <p className="text-sm font-kanit font-bold text-slate-700 leading-tight">{intern.university || '-'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-50">
                                            <div>
                                                <span className="text-[11px] font-kanit font-medium text-slate-400 uppercase tracking-widest mb-1">คณะ</span>
                                                <p className="text-sm font-kanit font-bold text-slate-700">{intern.faculty || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-kanit font-medium text-slate-400 uppercase tracking-widest mb-1">ชั้นปี</span>
                                                <div className="inline-flex px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                                                    {intern.academicYear || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Timeline Card */}
                                <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 text-emerald-600 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-kanit font-bold uppercase tracking-wider">ระยะเวลาฝึกงาน</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-center">
                                            <span className="text-[13px] font-kanit font-medium text-slate-400 uppercase tracking-widest block mb-1">เริ่ม</span>
                                            <span className="text-sm font-kanit font-bold text-slate-700">{format(new Date(intern.startDate), 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex-1 mx-4 flex items-center justify-center">
                                            <div className="w-full h-[2px] bg-emerald-100 relative">
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[13px] font-kanit font-medium text-slate-400 uppercase tracking-widest block mb-1">สิ้นสุด</span>
                                            <span className="text-sm font-kanit font-bold text-slate-700">{format(new Date(intern.endDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Portfolio & Links Card */}
                                <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 text-rose-600 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-kanit font-bold uppercase tracking-wider">ผลงานและเอกสาร</span>
                                    </div>
                                    <div className="space-y-3">
                                        {intern.portfolioUrl ? (
                                            <a 
                                                href={ensureExternalLink(intern.portfolioUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-rose-50/30 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all group/link"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Globe className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-bold">Portfolio</span>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                            </a>
                                        ) : (
                                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                                <p className="text-[10px] font-kanit font-medium text-slate-400 italic">ไม่ได้ระบุ Portfolio</p>
                                            </div>
                                        )}

                                        {intern.resumeUrl && (
                                            <a 
                                                href={ensureExternalLink(intern.resumeUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-indigo-50/30 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-50 transition-all group/link"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-bold">Resume</span>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                            </a>
                                        )}

                                        {intern.otherUrl && (
                                            <a 
                                                href={ensureExternalLink(intern.otherUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group/link"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <LinkIcon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-bold">Other Link</span>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Notes Section - Editorial Quote Style */}
                            {intern.notes && (
                                <motion.div variants={itemVariants} className="relative">
                                    <div className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-900/10 overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full -ml-12 -mb-12 blur-xl" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 text-indigo-300 mb-4">
                                                <Quote className="w-6 h-6 rotate-180" />
                                                <span className="text-xs font-kanit font-bold uppercase tracking-[0.2em]">Candidate Notes</span>
                                            </div>
                                            <p className="text-base font-kanit font-medium text-indigo-50 leading-relaxed italic">
                                                {intern.notes}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Image Viewer Modal */}
                    <AnimatePresence>
                        {isImageViewOpen && intern.avatarUrl && (
                            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsImageViewOpen(false)}
                                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative max-w-4xl w-full aspect-square sm:aspect-auto sm:h-[80vh] flex items-center justify-center"
                                >
                                    <button
                                        onClick={() => setIsImageViewOpen(false)}
                                        className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
                                    >
                                        <X className="w-8 h-8" />
                                    </button>
                                    <img 
                                        src={getDirectDriveUrl(intern.avatarUrl)} 
                                        alt={intern.fullName}
                                        className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/10"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute -bottom-12 left-0 right-0 text-center">
                                        <p className="text-white/70 text-sm font-medium">{intern.fullName}</p>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InternDetailModal;
