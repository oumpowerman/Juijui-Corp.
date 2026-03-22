
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
    AlertCircle
} from 'lucide-react';
import { InternCandidate, InternStatus } from '../../../../types';
import { format } from 'date-fns';

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
            case 'APPLIED': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/80', border: 'border-amber-100', label: 'Applied', pastel: 'from-amber-100 to-orange-50' };
            case 'INTERVIEW_SCHEDULED': return { icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50/80', border: 'border-indigo-100', label: 'Interview', pastel: 'from-indigo-100 to-blue-50' };
            case 'INTERVIEWED': return { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50/80', border: 'border-blue-100', label: 'Interviewed', pastel: 'from-blue-100 to-cyan-50' };
            case 'ACCEPTED': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/80', border: 'border-emerald-100', label: 'Accepted', pastel: 'from-emerald-100 to-teal-50' };
            case 'REJECTED': return { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50/80', border: 'border-rose-100', label: 'Rejected', pastel: 'from-rose-100 to-pink-50' };
            case 'ARCHIVED': return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50/80', border: 'border-gray-100', label: 'Archived', pastel: 'from-gray-100 to-slate-50' };
            default: return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50/80', border: 'border-gray-100', label: 'Unknown', pastel: 'from-gray-100 to-slate-50' };
        }
    };

    const statusInfo = getStatusInfo(intern.status);
    const StatusIcon = statusInfo.icon;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
                    {/* Backdrop with premium blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/40 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: -15 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-3xl bg-white/90 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
                    >
                        {/* Left Side: Visual Profile & Status */}
                        <div className={`w-full md:w-72 bg-gradient-to-br ${statusInfo.pastel} p-8 flex flex-col items-center justify-center relative overflow-hidden shrink-0`}>
                            {/* Floating Decorative Orbs */}
                            <motion.div 
                                animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 -left-10 w-32 h-32 bg-white/40 rounded-full blur-3xl" 
                            />
                            <motion.div 
                                animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/30 rounded-full blur-3xl" 
                            />

                            <motion.div 
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="relative z-10 mb-6"
                            >
                                <div className="w-40 h-40 rounded-[3rem] bg-white p-2 shadow-2xl border-4 border-white overflow-hidden group">
                                    {intern.avatarUrl ? (
                                        <img 
                                            src={intern.avatarUrl} 
                                            alt={intern.fullName}
                                            className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-110 transition-transform duration-700"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-[2.5rem]">
                                            <User className="w-16 h-16 text-gray-200" />
                                        </div>
                                    )}
                                </div>
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center border-2 border-white"
                                >
                                    <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                                </motion.div>
                            </motion.div>

                            <div className="text-center relative z-10">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest mb-3 ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} shadow-sm`}
                                >
                                    {statusInfo.label}
                                </motion.div>
                                <motion.h3 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-tight mb-2"
                                >
                                    {intern.fullName}
                                </motion.h3>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-xs font-bold text-gray-400 uppercase tracking-widest"
                                >
                                    Candidate ID: #{intern.id.slice(-6).toUpperCase()}
                                </motion.p>
                            </div>
                        </div>

                        {/* Right Side: Detailed Info */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm">
                            {/* Top Bar */}
                            <div className="p-6 flex justify-between items-center border-b border-gray-100">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            onEdit(intern);
                                            onClose();
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-2xl transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                                {/* Position & Education Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-5 h-5 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                                                <Briefcase className="w-3 h-3" />
                                            </div>
                                            Position
                                        </label>
                                        <div className="p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm group hover:border-indigo-200 transition-colors">
                                            <p className="text-sm font-black text-gray-800">{intern.position}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-5 h-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                                                <GraduationCap className="w-3 h-3" />
                                            </div>
                                            University
                                        </label>
                                        <div className="p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm group hover:border-emerald-200 transition-colors">
                                            <p className="text-sm font-bold text-gray-700">{intern.university}</p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Contact Section */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="space-y-4"
                                >
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                            <User className="w-3 h-3" />
                                        </div>
                                        Contact Information
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                                <p className="text-xs font-bold text-gray-700 truncate">{intern.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                                                <p className="text-xs font-bold text-gray-700">{intern.phoneNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Timeline & Portfolio Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="space-y-4"
                                    >
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-5 h-5 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                                                <Calendar className="w-3 h-3" />
                                            </div>
                                            Internship Period
                                        </label>
                                        <div className="p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                                            <div className="text-center flex-1">
                                                <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Start</p>
                                                <p className="text-xs font-black text-gray-800">{format(new Date(intern.startDate), 'dd MMM yyyy')}</p>
                                            </div>
                                            <div className="w-px h-8 bg-gray-100 mx-4" />
                                            <div className="text-center flex-1">
                                                <p className="text-[9px] text-gray-400 uppercase font-black mb-1">End</p>
                                                <p className="text-xs font-black text-gray-800">{format(new Date(intern.endDate), 'dd MMM yyyy')}</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="space-y-4"
                                    >
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-5 h-5 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                                                <LinkIcon className="w-3 h-3" />
                                            </div>
                                            Portfolio
                                        </label>
                                        {intern.portfolioUrl ? (
                                            <a 
                                                href={intern.portfolioUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-rose-50/50 text-rose-600 rounded-[1.5rem] border border-rose-100 hover:bg-rose-100 transition-all group shadow-sm"
                                            >
                                                <span className="text-xs font-black truncate pr-4">View Portfolio</span>
                                                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </a>
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 text-center">
                                                <p className="text-[10px] font-bold text-gray-400 italic">No portfolio provided</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Notes Section */}
                                {intern.notes && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.9 }}
                                        className="space-y-4"
                                    >
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-5 h-5 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                                                <MessageSquare className="w-3 h-3" />
                                            </div>
                                            Candidate Notes
                                        </label>
                                        <div className="p-6 bg-white/80 rounded-[2rem] border border-gray-100 italic text-xs text-gray-600 leading-relaxed shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200" />
                                            {intern.notes}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InternDetailModal;
