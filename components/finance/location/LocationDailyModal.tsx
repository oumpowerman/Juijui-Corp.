
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Video, Clock, CheckCircle2, CircleDashed, Film } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ClipData {
    id: string;
    title: string;
    status: string;
    format: string;
    // imageUrl removed
}

interface VisitData {
    date: Date;
    clips: ClipData[];
}

interface LocationDailyModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: VisitData | null;
    locationName: string;
}

const LocationDailyModal: React.FC<LocationDailyModalProps> = ({ isOpen, onClose, visit, locationName }) => {
    if (!isOpen || !visit) return null;

    const completedCount = visit.clips.filter(c => c.status === 'DONE').length;
    const totalCount = visit.clips.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div 
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border-[6px] border-white ring-1 ring-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-indigo-600 p-8 text-white overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 opacity-20 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 uppercase tracking-wider">
                                    Mission Report
                                </span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight leading-none">
                                {format(visit.date, 'd MMMM', { locale: th })}
                            </h3>
                            <p className="text-indigo-100 text-sm font-medium mt-1">
                                @ {locationName}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div 
                                className="h-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all duration-1000" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-100">{completedCount}/{totalCount} Done</span>
                    </div>
                </div>

                {/* Body: List */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-3 scrollbar-thin scrollbar-thumb-indigo-100">
                    {visit.clips.map((clip, idx) => {
                        const isDone = clip.status === 'DONE';
                        return (
                            <div 
                                key={clip.id}
                                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-2 fill-mode-both"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Icon Status */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${isDone ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-sm truncate ${isDone ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {clip.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {clip.format && (
                                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {clip.format}
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isDone ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                            {clip.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white text-center text-xs text-slate-400 font-medium">
                    Mission Log ID: {format(visit.date, 'yyyyMMdd')} • {totalCount} Clips Generated
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LocationDailyModal;
