
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, GraduationCap, Briefcase, Calendar, ExternalLink, Trash2, CheckCircle2, Clock, XCircle, User, FileText, Link } from 'lucide-react';
import { InternCandidate, InternStatus } from '../../../../types';
import { format, differenceInDays } from 'date-fns';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';
import { ensureExternalLink } from '../../../../lib/linkUtils';

interface InternTableViewProps {
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: InternStatus) => void;
    isLoading: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

const InternTableView: React.FC<InternTableViewProps> = ({ 
    interns, onEdit, onDelete, onUpdateStatus, isLoading, hasMore, onLoadMore 
}) => {
    const getStatusBadge = (status: InternStatus) => {
        switch (status) {
            case 'ACCEPTED':
                return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black flex items-center gap-1 border border-emerald-500/20 w-fit"><CheckCircle2 className="w-3 h-3" /> ACCEPTED</span>;
            case 'INTERVIEW_SCHEDULED':
                return <span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg text-[10px] font-black flex items-center gap-1 border border-indigo-500/20 w-fit"><Clock className="w-3 h-3" /> INTERVIEW</span>;
            case 'INTERVIEWED':
                return <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-black flex items-center gap-1 border border-blue-500/20 w-fit"><User className="w-3 h-3" /> INTERVIEWED</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-black flex items-center gap-1 border border-rose-500/20 w-fit"><XCircle className="w-3 h-3" /> REJECTED</span>;
            case 'ARCHIVED':
                return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded-lg text-[10px] font-black flex items-center gap-1 border border-gray-500/20 w-fit"><Trash2 className="w-3 h-3" /> ARCHIVED</span>;
            default:
                return <span className="px-2 py-1 bg-gray-500/10 text-gray-600 rounded-lg text-[10px] font-black flex items-center gap-1 border border-gray-500/20 w-fit"><Clock className="w-3 h-3" /> APPLIED</span>;
        }
    };

    const getPositionTheme = (position: string) => {
        const p = position.toUpperCase();
        if (p.includes('GRAPHIC')) return { bg: 'hover:bg-indigo-50/40', text: 'text-indigo-600', iconBg: 'bg-indigo-100' };
        if (p.includes('CREATIVE')) return { bg: 'hover:bg-amber-50/40', text: 'text-amber-600', iconBg: 'bg-amber-100' };
        if (p.includes('EDITOR')) return { bg: 'hover:bg-emerald-50/40', text: 'text-emerald-600', iconBg: 'bg-emerald-100' };
        return { bg: 'hover:bg-slate-50/40', text: 'text-slate-600', iconBg: 'bg-slate-100' };
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                            <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</th>
                            <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">University</th>
                            <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</th>
                            <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {interns.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-gray-400 font-bold">
                                    ไม่พบข้อมูลผู้สมัคร
                                </td>
                            </tr>
                        ) : (
                            interns.map((intern, idx) => {
                                const theme = getPositionTheme(intern.position);
                                return (
                                    <motion.tr 
                                        key={intern.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => onEdit(intern)}
                                        className={`group ${theme.bg} transition-colors cursor-pointer`}
                                    >
                                        {/* Candidate Info */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600 font-black text-sm overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                                    {intern.avatarUrl ? (
                                                        <img src={getDirectDriveUrl(intern.avatarUrl)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        intern.fullName.charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[17px] font-kanit font-medium text-gray-800 truncate leading-none mb-1">
                                                        {intern.fullName}{intern.nickname ? ` (${intern.nickname})` : ''}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-gray-400 truncate">{intern.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Position */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 ${theme.iconBg} rounded-lg flex items-center justify-center ${theme.text} shrink-0`}>
                                                    <Briefcase className="w-3 h-3" />
                                                </div>
                                                <span className={`text-xs font-black ${theme.text}`}>{intern.position}</span>
                                            </div>
                                        </td>

                                        {/* University */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-3.5 h-3.5 text-gray-300" />
                                                <span className="text-xs font-bold text-gray-500 truncate max-w-[150px]">{intern.university}</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6">
                                            {getStatusBadge(intern.status)}
                                        </td>

                                        {/* Period */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
                                                    {format(new Date(intern.startDate), 'dd/MM')} - {format(new Date(intern.endDate), 'dd/MM')}
                                                    <span className="ml-1.5 text-[10px] text-indigo-400 font-black bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                                        ({differenceInDays(new Date(intern.endDate), new Date(intern.startDate)) + 1} วัน)
                                                    </span>
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {intern.portfolioUrl && (
                                                    <a 
                                                        href={ensureExternalLink(intern.portfolioUrl)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                        title="ดู Portfolio"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {intern.resumeUrl && (
                                                    <a 
                                                        href={ensureExternalLink(intern.resumeUrl)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                        title="ดู Resume"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {intern.otherUrl && (
                                                    <a 
                                                        href={ensureExternalLink(intern.otherUrl)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                        title="ดู Link เพิ่มเติม"
                                                    >
                                                        <Link className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(intern.id);
                                                    }}
                                                    className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all relative z-10"
                                                    title="ลบข้อมูล"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {hasMore && !isLoading && (
                <div className="p-4 text-center border-t border-gray-50 bg-gray-50/30">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onLoadMore?.();
                        }}
                        className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        ดูเพิ่มเติม
                    </button>
                </div>
            )}
            {isLoading && (
                <div className="py-6 text-center border-t border-gray-50 bg-gray-50/30">
                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                </div>
            )}
        </div>
    );
};

export default InternTableView;
