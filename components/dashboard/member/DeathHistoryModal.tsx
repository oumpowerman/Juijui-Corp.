
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HPDeathLog } from '../../../types';
import { X, Skull, Calendar, AlertTriangle, ChevronRight, History, Zap, Ghost } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface DeathHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const DeathHistoryModal: React.FC<DeathHistoryModalProps> = ({ isOpen, onClose, userId }) => {
    const [logs, setLogs] = useState<HPDeathLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<HPDeathLog | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchLogs();
        }
    }, [isOpen, userId]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('hp_death_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data) {
                setLogs(data.map(d => ({
                    id: d.id,
                    userId: d.user_id,
                    deathNumber: d.death_number,
                    snapshotData: d.snapshot_data,
                    createdAt: new Date(d.created_at)
                })));
            }
        } catch (err) {
            console.error('Fetch death logs failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20"
            >
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Skull className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <History className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">ประวัติการ HP หมด (Death Logs)</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">บันทึกเหตุการณ์ที่ทำให้พลังชีวิตเป็น 0</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* List Side */}
                    <div className={`w-full md:w-2/5 border-r border-slate-100 overflow-y-auto p-4 space-y-3 ${selectedLog ? 'hidden md:block' : 'block'}`}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-xs font-bold">กำลังดึงข้อมูลวิญญาณ...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-300 text-center">
                                <Ghost className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-sm font-bold">ยังไม่เคยตุยเลย! <br/>รักษาสุขภาพดีเยี่ยม ✨</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <button 
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${selectedLog?.id === log.id ? 'border-red-500 bg-red-50 shadow-md' : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedLog?.id === log.id ? 'text-red-500' : 'text-slate-400'}`}>
                                            ครั้งที่ {log.deathNumber}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {format(log.createdAt, 'd MMM yy', { locale: th })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`font-black ${selectedLog?.id === log.id ? 'text-red-700' : 'text-slate-700'}`}>
                                            HP CRITICAL
                                        </p>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedLog?.id === log.id ? 'translate-x-1 text-red-500' : 'text-slate-300 group-hover:translate-x-1'}`} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Detail Side */}
                    <div className={`flex-1 overflow-y-auto p-6 bg-slate-50/30 ${selectedLog ? 'block' : 'hidden md:flex items-center justify-center text-slate-300'}`}>
                        {selectedLog ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="md:hidden flex items-center gap-2 text-slate-400 font-bold text-xs mb-4"
                                >
                                    <X className="w-4 h-4" /> กลับไปดูรายการ
                                </button>

                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        สาเหตุที่ทำให้ HP หมด
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">บทลงโทษล่าสุด (Recent Penalties)</p>
                                        {selectedLog.snapshotData.recentPenalties.filter(p => p.hpChange < 0).slice(0, 3).map((penalty, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                                <div className="bg-red-500 text-white p-1 rounded-lg shrink-0">
                                                    <Zap className="w-3 h-3 fill-white" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-red-700">{penalty.description}</p>
                                                    <p className="text-[10px] text-red-400 font-medium">HP {penalty.hpChange} • {format(new Date(penalty.createdAt), 'HH:mm น.')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedLog.snapshotData.overdueTasks.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-orange-500" />
                                            งานค้าง ณ ตอนนั้น
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedLog.snapshotData.overdueTasks.map((task, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[70%]">{task.title}</span>
                                                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                        เกินกำหนด {task.delayDays} วัน
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Level</p>
                                        <p className="text-xl font-black text-indigo-600">{selectedLog.snapshotData.statsAtDeath.level}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">XP</p>
                                        <p className="text-xl font-black text-yellow-600">{selectedLog.snapshotData.statsAtDeath.xp}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Coins</p>
                                        <p className="text-xl font-black text-emerald-600">{selectedLog.snapshotData.statsAtDeath.availablePoints}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold">เลือกรายการเพื่อดูรายละเอียดความผิดพลาด</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DeathHistoryModal;
