
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceLog } from '../../../types/attendance';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, Calendar, AlertCircle, CheckCircle2, TrendingUp, X, Image as ImageIcon } from 'lucide-react';

interface Props {
    logs: AttendanceLog[];
    type: 'LATE' | 'ON_TIME' | 'STREAK' | 'HOURS' | null;
    onClose: () => void;
}

const AttendanceDetailCards: React.FC<Props> = ({ logs, type, onClose }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    if (!type) return null;

    const filteredLogs = logs.filter(log => {
        if (type === 'LATE') return log.status === 'LATE';
        if (type === 'ON_TIME') return log.status === 'ON_TIME' || log.status === 'WORKING' || log.status === 'COMPLETED';
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getTitle = () => {
        switch (type) {
            case 'LATE': return 'รายการมาสาย (Late)';
            case 'ON_TIME': return 'รายการมาตรงเวลา (On Time)';
            case 'STREAK': return 'สถิติ Streak ล่าสุด';
            case 'HOURS': return 'ชั่วโมงการทำงานสะสม';
            default: return '';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'LATE': return <AlertCircle className="w-6 h-6 text-rose-500" />;
            case 'ON_TIME': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
            case 'STREAK': return <TrendingUp className="w-6 h-6 text-orange-500" />;
            case 'HOURS': return <Clock className="w-6 h-6 text-blue-500" />;
            default: return null;
        }
    };

    const extractProofUrl = (note?: string) => {
        if (!note) return null;
        const match = note.match(/\[PROOF:(.*?)\]/);
        return match ? match[1] : null;
    };

    const cleanNote = (note?: string) => {
        if (!note) return '';
        return note.replace(/\[PROOF:.*?\]/, '').replace(/\[APPEAL_PENDING\]/, '').replace(/\[MANUAL_ENTRY\]/, '').trim();
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-slate-50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
                {/* Header */}
                <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-2xl shadow-inner border border-slate-100">
                            {getIcon()}
                        </div>
                        <div>
                            <h4 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">{getTitle()}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Attendance Details</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => {
                                const proofUrl = extractProofUrl(log.note);
                                const noteText = cleanNote(log.note);
                                
                                return (
                                    <motion.div 
                                        key={log.id}
                                        layout
                                        className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <span className="text-sm font-black text-slate-700">
                                                    {format(parseISO(log.date), 'd MMMM yyyy', { locale: th })}
                                                </span>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                log.status === 'LATE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {log.status === 'LATE' ? 'สาย' : 'ตรงเวลา'}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Check In
                                                </p>
                                                <p className="text-xl font-black text-slate-800 font-mono">
                                                    {log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--'}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Check Out
                                                </p>
                                                <p className="text-xl font-black text-slate-800 font-mono">
                                                    {log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Proof Image Preview */}
                                        {proofUrl && (
                                            <div className="mb-4 relative group/img">
                                                <div 
                                                    onClick={() => setPreviewImage(proofUrl)}
                                                    className="w-full h-32 rounded-2xl overflow-hidden border border-slate-100 cursor-pointer relative"
                                                >
                                                    <img 
                                                        src={proofUrl} 
                                                        alt="Attendance Proof" 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" /> คลิกเพื่อดูรูปหลักฐาน
                                                </p>
                                            </div>
                                        )}

                                        {noteText && (
                                            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                                <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                                                    <span className="font-black uppercase text-[9px] tracking-widest block mb-1 opacity-60">Note</span>
                                                    "{noteText}"
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-black text-lg">ไม่พบข้อมูลในหมวดนี้</p>
                                <p className="text-slate-300 text-sm font-medium">ลองเลือกดูสถิติหมวดอื่นๆ แทนนะครับ</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button 
                            className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={previewImage} 
                            alt="Full Preview" 
                            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendanceDetailCards;
