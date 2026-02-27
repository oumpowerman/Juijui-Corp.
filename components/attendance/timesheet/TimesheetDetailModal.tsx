
import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { X, ImageIcon, Download, Clock, MapPin, Info, ArrowRight } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';

interface TimesheetDetailModalProps {
    log: AttendanceLog;
    onClose: () => void;
}

const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({ log, onClose }) => {
    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-xl rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 border-4 border-white"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative h-72 bg-slate-900 flex items-center justify-center group/img">
                    {(() => {
                        const proofMatch = log.note?.match(/\[PROOF:(.*?)\]/);
                        const url = proofMatch ? proofMatch[1] : null;
                        const isDrive = url?.includes('drive.google.com');
                        const displayUrl = isDrive ? `https://lh3.googleusercontent.com/d/${url?.split('id=')[1] || url?.split('/d/')[1]?.split('/')[0]}=s1000` : url;

                        return url ? (
                            <>
                                <img 
                                    src={displayUrl || url} 
                                    className="w-full h-full object-cover opacity-90 group-hover/img:scale-105 transition-transform duration-700" 
                                    alt="Proof"
                                    onError={(e) => { (e.target as any).src = url; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Image Verified</span>
                                    </div>
                                    <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-all">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-slate-500 gap-4">
                                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700">
                                    <ImageIcon className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">No Visual Record</p>
                            </div>
                        );
                    })()}
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-red-500 text-white rounded-full transition-all shadow-xl backdrop-blur-md"><X className="w-6 h-6"/></button>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Time Analysis Log</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {format(new Date(log.date), 'EEEE d MMMM', { locale: th })}
                            </h3>
                            {(() => {
                                const leaveMatch = log.note?.match(/\[APPROVED LEAVE: (.*?)\]/);
                                if (leaveMatch) {
                                    return (
                                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest border border-sky-200">
                                            {leaveMatch[1]} LEAVE
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner">
                            <Clock className="w-8 h-8" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-emerald-200 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><ArrowRight className="w-3 h-3 mr-1 text-emerald-500" /> Start Mission</p>
                            <p className="text-3xl font-black text-indigo-600 font-mono">
                                {log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/> {log.locationName || 'Unspecified'}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-orange-200 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><ArrowRight className="w-3 h-3 mr-1 text-orange-500 rotate-180" /> Mission End</p>
                            <p className="text-3xl font-black text-slate-700 font-mono">
                                {log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/> {log.checkOutLocationName || 'Unspecified'}</p>
                        </div>
                    </div>

                    {log.note && (
                        <div className="bg-indigo-900 rounded-[2rem] p-6 text-indigo-100 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-indigo-400">Official Note</h4>
                            <p className="text-sm font-medium leading-relaxed italic">
                                "{log.note.replace(/\[.*?\]/g, '').trim() || 'ไม่มีหมายเหตุเพิ่มเติม'}"
                            </p>
                        </div>
                    )}

                    <button 
                        onClick={onClose}
                        className="w-full mt-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm tracking-widest uppercase hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        Close Command
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimesheetDetailModal;
