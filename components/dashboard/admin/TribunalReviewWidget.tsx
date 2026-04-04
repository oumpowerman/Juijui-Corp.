
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, CheckCircle, XCircle, Clock, User as UserIcon, AlertTriangle, ExternalLink, MessageSquare, ShieldAlert, Zap, Loader2, Cloud } from 'lucide-react';
import { useTribunal } from '../../../hooks/useTribunal';
import { TribunalReport } from '../../../types';
import { useTeam } from '../../../hooks/useTeam';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface TribunalReviewWidgetProps {
    currentUser: any;
}

const TribunalReviewWidget: React.FC<TribunalReviewWidgetProps> = ({ currentUser }) => {
    const { getReports, resolveReport, isLoading } = useTribunal();
    const { allUsers: users } = useTeam();
    const [reports, setReports] = useState<TribunalReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<TribunalReport | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPendingReports = async () => {
        const data = await getReports('PENDING');
        setReports(data);
    };

    useEffect(() => {
        fetchPendingReports();
    }, []);

    const handleResolve = async (status: 'APPROVE' | 'REJECT') => {
        if (!selectedReport) return;
        setIsSubmitting(true);
        try {
            const success = await resolveReport(selectedReport.id, status, feedback);
            if (success) {
                setReports(prev => prev.filter(r => r.id !== selectedReport.id));
                setSelectedReport(null);
                setFeedback('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getUserName = (uid: string) => {
        return users.find(u => u.id === uid)?.name || 'Unknown User';
    };

    const getUserPhoto = (uid: string) => {
        return users.find(u => u.id === uid)?.avatarUrl;
    };

    if (isLoading && reports.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-xl flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Gavel className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Tribunal Review</h3>
                        <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider">ตรวจสอบคำร้องและตัดสิน</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black">
                        {reports.length} PENDING
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                    {reports.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-gray-400"
                        >
                            <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-bold">ไม่มีคำร้องค้างตรวจสอบ</p>
                        </motion.div>
                    ) : (
                        reports.map(report => (
                            <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setSelectedReport(report)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedReport?.id === report.id ? 'bg-indigo-50 border-indigo-200 shadow-md ring-2 ring-indigo-500/20' : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-white shadow-sm">
                                            {getUserPhoto(report.reporter_id) ? (
                                                <img src={getUserPhoto(report.reporter_id)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                                <UserIcon className="w-full h-full p-1.5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-black text-gray-800">{getUserName(report.reporter_id)}</p>
                                                {report.is_anonymous && (
                                                    <span className="flex items-center gap-0.5 text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
                                                        <Cloud className="w-2 h-2" /> ANONYMOUS
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {format(new Date(report.created_at), 'd MMM HH:mm', { locale: th })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase">
                                        {report.category}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                                    {report.description}
                                </p>

                                {report.target_id && (
                                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-xl border border-red-100/50">
                                        <ShieldAlert className="w-3 h-3 text-red-500" />
                                        <p className="text-[10px] font-bold text-red-700">
                                            Target: <span className="font-black">{getUserName(report.target_id)}</span>
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Resolution Panel */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-100 shadow-2xl p-6 z-20 rounded-t-[2rem]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="font-black text-gray-800 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" />
                                ตัดสินคำร้อง
                            </h4>
                            <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedReport.evidence_url && (
                                <a 
                                    href={selectedReport.evidence_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    ดูหลักฐาน (Google Drive)
                                </a>
                            )}

                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="ใส่เหตุผลหรือคำแนะนำจาก Admin..."
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[80px] resize-none"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleResolve('REJECT')}
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-black hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    ยกเลิก/แจ้งเท็จ
                                </button>
                                <button
                                    onClick={() => handleResolve('APPROVE')}
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    อนุมัติ/หักแต้ม
                                </button>
                            </div>
                            
                            <p className="text-[9px] text-gray-400 text-center flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                การอนุมัติจะส่งผลต่อ HP/JP ของผู้เกี่ยวข้องทันทีตาม Config
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TribunalReviewWidget;
