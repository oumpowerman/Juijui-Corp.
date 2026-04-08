
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, GraduationCap, Briefcase, Calendar, ExternalLink, Trash2, Edit2, MoreVertical, CheckCircle2, Clock, XCircle, User, FileText, Link } from 'lucide-react';
import { InternCandidate, InternStatus } from '../../../../types';
import { format, differenceInDays } from 'date-fns';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';
import { ensureExternalLink } from '../../../../lib/linkUtils';

interface InternListViewProps {
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: InternStatus) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    isLoading: boolean;
}

const InternListView: React.FC<InternListViewProps> = ({ interns, onEdit, onDelete, onUpdateStatus, hasMore, onLoadMore, isLoading }) => {
    const getStatusBadge = (status: InternStatus) => {
        switch (status) {
            case 'ACCEPTED':
                return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black flex items-center gap-1 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> ACCEPTED</span>;
            case 'INTERVIEW_SCHEDULED':
                return <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black flex items-center gap-1 border border-indigo-500/20"><Clock className="w-3 h-3" /> INTERVIEW</span>;
            case 'INTERVIEWED':
                return <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-black flex items-center gap-1 border border-blue-500/20"><User className="w-3 h-3" /> INTERVIEWED</span>;
            case 'REJECTED':
                return <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black flex items-center gap-1 border border-rose-500/20"><XCircle className="w-3 h-3" /> REJECTED</span>;
            case 'ARCHIVED':
                return <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-[10px] font-black flex items-center gap-1 border border-gray-500/20"><Trash2 className="w-3 h-3" /> ARCHIVED</span>;
            default:
                return <span className="px-3 py-1 bg-gray-500/10 text-gray-600 rounded-full text-[10px] font-black flex items-center gap-1 border border-gray-500/20"><Clock className="w-3 h-3" /> APPLIED</span>;
        }
    };

    const getPositionTheme = (position: string) => {
        const p = position.toUpperCase();
        if (p.includes('GRAPHIC')) return { bg: 'bg-indigo-50/60', border: 'border-indigo-100', text: 'text-indigo-600', iconBg: 'bg-indigo-100' };
        if (p.includes('CREATIVE')) return { bg: 'bg-amber-50/60', border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-100' };
        if (p.includes('EDITOR')) return { bg: 'bg-emerald-50/60', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-100' };
        return { bg: 'bg-slate-50/60', border: 'border-slate-100', text: 'text-slate-600', iconBg: 'bg-slate-100' };
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {interns.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-gray-100 text-gray-400 font-bold shadow-sm">
                    ไม่พบข้อมูลผู้สมัคร
                </div>
            ) : (
                interns.map((intern, idx) => {
                    const theme = getPositionTheme(intern.position);
                    return (
                        <motion.div 
                            key={intern.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => onEdit(intern)}
                            className={`${theme.bg} ${theme.border} rounded-[2rem] border-2 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all p-4 group relative overflow-hidden cursor-pointer`}
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black text-lg overflow-hidden shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
                                        {intern.avatarUrl ? (
                                            <img src={getDirectDriveUrl(intern.avatarUrl)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            intern.fullName.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-md font-bold text-gray-800 truncate leading-tight">
                                            {intern.fullName}{intern.nickname ? ` (${intern.nickname})` : ''}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {getStatusBadge(intern.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Position Block - Compact */}
                            <div className={`mb-3 p-2.5 rounded-xl bg-white/80 border ${theme.border} shadow-sm flex items-center gap-2.5`}>
                                <div className={`w-7 h-7 ${theme.iconBg} rounded-lg flex items-center justify-center ${theme.text} shrink-0`}>
                                    <Briefcase className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Position</p>
                                    <p className={`text-[11px] font-black ${theme.text} leading-none truncate`}>{intern.position}</p>
                                </div>
                            </div>

                            {/* Info Grid - More Compact */}
                            <div className="space-y-2 mb-3 px-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <GraduationCap className="w-3 h-3 text-gray-400 shrink-0" />
                                    <p className="text-[12px] font-bold text-gray-500 truncate">{intern.university}</p>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                    <p className="text-[12px] font-bold text-gray-500 truncate">
                                        {format(new Date(intern.startDate), 'dd/MM')} - {format(new Date(intern.endDate), 'dd/MM')}
                                        <span className="ml-1.5 text-[12px] text-indigo-500 font-kanit font-medium bg-white/50 px-1 rounded-md border border-indigo-100/50">
                                            {differenceInDays(new Date(intern.endDate), new Date(intern.startDate)) + 1} วัน
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/40">
                                <div className="flex gap-1.5">
                                    {intern.portfolioUrl && (
                                        <a 
                                            href={ensureExternalLink(intern.portfolioUrl)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 bg-white/80 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-white"
                                            title="ดู Portfolio"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {intern.resumeUrl && (
                                        <a 
                                            href={ensureExternalLink(intern.resumeUrl)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 bg-white/80 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-white"
                                            title="ดู Resume"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {intern.otherUrl && (
                                        <a 
                                            href={ensureExternalLink(intern.otherUrl)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 bg-white/80 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-white"
                                            title="ดู Link เพิ่มเติม"
                                        >
                                            <Link className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(intern.id);
                                    }}
                                    className="p-1.5 bg-white/40 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-white/50 group-hover:bg-white/80 relative z-10"
                                    title="ลบข้อมูล"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })
            )}

            {hasMore && (
                <div className="col-span-full flex justify-center py-8">
                    <button 
                        onClick={onLoadMore}
                        disabled={isLoading}
                        className="px-8 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black text-gray-600 hover:bg-gray-50 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-50"
                    >
                        {isLoading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InternListView;
