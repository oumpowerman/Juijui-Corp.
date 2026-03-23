import React from 'react';
import { motion } from 'framer-motion';
import { History, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { RandomizerHistoryItem } from './types';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface RandomizerHistoryViewProps {
    history: RandomizerHistoryItem[];
    isLoading: boolean;
    onDelete: (id: string) => void;
}

const RandomizerHistoryView: React.FC<RandomizerHistoryViewProps> = ({ history, isLoading, onDelete }) => {
    const { showConfirm } = useGlobalDialog();

    const handleDeleteClick = async (id: string, topic: string) => {
        const confirmed = await showConfirm(
            `คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการสุ่มหัวข้อ "${topic}"?`,
            'ยืนยันการลบประวัติ'
        );
        
        if (confirmed) {
            onDelete(id);
        }
    };

    return (
        <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 w-full"
        >
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                ประวัติการสุ่มล่าสุด
            </h3>
            
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    ยังไม่มีประวัติการสุ่ม
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                    <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{item.topic}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs">{format(new Date(item.created_at), 'd MMM yyyy HH:mm', { locale: th })}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.winners?.map((w, i) => (
                                        <div key={w.id} className="flex items-center gap-2 bg-slate-50 pr-3 rounded-full border border-slate-100">
                                            <img 
                                                src={w.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=random`}
                                                alt="Winner"
                                                className="w-8 h-8 rounded-full object-cover border border-indigo-100"
                                            />
                                            <span className="font-bold text-slate-800 text-sm">{w.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteClick(item.id, item.topic)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors self-end sm:self-center"
                                title="ลบประวัติ"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default RandomizerHistoryView;
