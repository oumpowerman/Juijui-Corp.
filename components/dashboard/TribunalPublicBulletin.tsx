
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, CheckCircle, XCircle, Clock, User as UserIcon, ShieldAlert, MessageSquare, ChevronRight } from 'lucide-react';
import { useTribunal } from '../../hooks/useTribunal';
import { TribunalReport } from '../../types';
import { useTeam } from '../../hooks/useTeam';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const TribunalPublicBulletin: React.FC = () => {
    const { getReports } = useTribunal();
    const { allUsers } = useTeam();
    const [verdicts, setVerdicts] = useState<TribunalReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVerdicts = async () => {
            const data = await getReports('ALL');
            // Filter only resolved reports (Approved or Rejected)
            const resolved = data.filter(r => r.status !== 'PENDING').slice(0, 5);
            setVerdicts(resolved);
            setIsLoading(false);
        };
        fetchVerdicts();
    }, [getReports]);

    const getUserName = (id?: string, isAnonymous?: boolean) => {
        if (isAnonymous) return 'ผู้ไม่ประสงค์ออกนาม';
        if (!id) return 'Unknown';
        return allUsers.find(u => u.id === id)?.name || 'Unknown User';
    };

    const getUserPhoto = (id?: string, isAnonymous?: boolean) => {
        if (isAnonymous || !id) return null;
        return allUsers.find(u => u.id === id)?.avatarUrl;
    };

    if (isLoading && verdicts.length === 0) return null;
    if (verdicts.length === 0) return null;

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-red-50/50 to-orange-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl text-red-600">
                        <Gavel className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800">กระดานคำตัดสิน</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">คำตัดสินล่าสุดจากศาลเตี้ย</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {verdicts.map((verdict) => (
                    <motion.div
                        key={verdict.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-red-100 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-white shadow-sm">
                                    {getUserPhoto(verdict.reporter_id, verdict.is_anonymous) ? (
                                        <img src={getUserPhoto(verdict.reporter_id, verdict.is_anonymous)!} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <UserIcon className="w-full h-full p-1.5 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-800">{getUserName(verdict.reporter_id, verdict.is_anonymous)}</p>
                                    <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {format(new Date(verdict.resolved_at || verdict.created_at), 'd MMM HH:mm', { locale: th })}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                verdict.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {verdict.status === 'APPROVED' ? 'GUILTY' : 'REJECTED'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[8px] font-black uppercase">
                                    {verdict.category}
                                </span>
                                {verdict.target_id && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                                        <ShieldAlert className="w-3 h-3" />
                                        <span>Target: {getUserName(verdict.target_id)}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-600 line-clamp-2 italic">
                                "{verdict.admin_feedback || verdict.description}"
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">
                    Justice has been served
                </p>
            </div>
        </div>
    );
};

export default TribunalPublicBulletin;
