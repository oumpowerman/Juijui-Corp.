
import React from 'react';
import { X, Calendar, Clock, AlertCircle, Skull, Info, CheckCircle2 } from 'lucide-react';
import { DisciplineAuditLog } from '../../types';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface DisciplineDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'LATE' | 'ABSENT' | 'TASK_OVERDUE' | 'MISSED_DUTY' | null;
    logs: DisciplineAuditLog[];
    monthKey: string;
}

const DisciplineDetailModal: React.FC<DisciplineDetailModalProps> = ({ isOpen, onClose, type, logs, monthKey }) => {
    if (!isOpen || !type) return null;

    const getCategoryInfo = () => {
        switch (type) {
            case 'LATE': return { title: 'ประวัติการมาสาย', icon: <Clock className="w-6 h-6 text-yellow-500" />, color: 'yellow' };
            case 'ABSENT': return { title: 'ประวัติการขาดงาน', icon: <Info className="w-6 h-6 text-gray-500" />, color: 'gray' };
            case 'TASK_OVERDUE': return { title: 'ประวัติการส่งงานเลท', icon: <AlertCircle className="w-6 h-6 text-orange-500" />, color: 'orange' };
            case 'MISSED_DUTY': return { title: 'ประวัติการพลาดเวร', icon: <Skull className="w-6 h-6 text-red-500" />, color: 'red' };
            default: return { title: 'ประวัติวินัย', icon: <Info className="w-6 h-6 text-blue-500" />, color: 'blue' };
        }
    };

    const info = getCategoryInfo();
    const filteredLogs = logs.filter(l => l.type === type);
    const totalPenalty = filteredLogs.reduce((sum, l) => sum + (l.penalty ?? 0), 0);

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${info.color}-100 rounded-2xl`}>
                            {info.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{info.title}</h3>
                            <p className="text-xs text-gray-400">ประจำเดือน {format(new Date(monthKey), 'MMMM yyyy', { locale: th })}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {filteredLogs.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h4 className="font-bold text-gray-800">ยอดเยี่ยมมาก!</h4>
                            <p className="text-sm text-gray-400 mt-1">ไม่มีประวัติการทำผิดในหมวดนี้สำหรับเดือนนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2 mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">รายการทั้งหมด ({filteredLogs.length})</span>
                                <span className="text-xs font-bold text-red-500">หักคะแนนรวม -{totalPenalty}%</span>
                            </div>
                            {filteredLogs.map(log => (
                                <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4 hover:border-indigo-100 transition-colors">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-gray-800">{log.title}</p>
                                            <span className="text-xs font-bold text-red-500">-{log.penalty}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{format(log.date, 'dd MMMM yyyy', { locale: th })}</p>
                                        {log.detail && (
                                            <div className="mt-2 p-2 bg-white/50 rounded-lg border border-gray-100 text-[11px] text-gray-500 italic">
                                                {log.detail}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                        รับทราบ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisciplineDetailModal;
