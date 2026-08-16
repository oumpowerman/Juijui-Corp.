
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Check, Trash2, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { MasterOption } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface DayHighlightModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    masterOptions: MasterOption[];
    currentHighlightType?: string;
    onSave: (typeKey: string, note?: string) => void;
    onRemove: () => void;
    onAddPlan?: (date: Date) => void;
}

const DayHighlightModal: React.FC<DayHighlightModalProps> = ({
    isOpen, onClose, date, masterOptions, currentHighlightType, onSave, onRemove, onAddPlan
}) => {
    const [note, setNote] = useState('');

    // Filter only EVENT_TYPE options
    const eventTypes = masterOptions
        .filter(o => o.type === 'EVENT_TYPE' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const handleSelect = (key: string) => {
        onSave(key, note);
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && date && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div 
                        initial={{ y: 80, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gray-50/80 backdrop-blur-md px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {format(date, 'd MMM yyyy')}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">เลือกประเภทวัน (Day Type)</p>
                            
                            <div className="space-y-2 mb-5">
                                {eventTypes.length === 0 ? (
                                     <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                                         ยังไม่ได้ตั้งค่า EVENT_TYPE <br/>ใน Master Data
                                     </div>
                                ) : (
                                    eventTypes.map(type => (
                                        <button
                                            key={type.key}
                                            onClick={() => handleSelect(type.key)}
                                            className={`
                                                w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-250
                                                ${currentHighlightType === type.key 
                                                    ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/20 text-indigo-950 font-black' 
                                                    : 'bg-white border-gray-100 hover:bg-gray-50/65 hover:border-gray-200 text-gray-700'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full ${type.color?.split(' ')[0] || 'bg-gray-200'} shadow-sm`}></div>
                                                <span className="text-sm font-bold">
                                                    {type.label}
                                                </span>
                                            </div>
                                            {currentHighlightType === type.key && <Check className="w-4 h-4 text-indigo-600 stroke-[3px]" />}
                                        </button>
                                    ))
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    if (onAddPlan && date) {
                                        onAddPlan(date);
                                    }
                                    onClose();
                                }}
                                className="w-full mb-3 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center justify-center transition-all gap-2 shadow-lg shadow-fuchsia-100"
                            >
                                <CalendarPlus className="w-4 h-4" />
                                <span>เพิ่มแพลน / นัดหมายทั่วไป</span>
                            </button>

                            {currentHighlightType && (
                                <button 
                                    onClick={() => { onRemove(); onClose(); }}
                                    className="w-full py-3 text-red-500 bg-red-50 hover:bg-red-100 active:scale-[0.98] rounded-2xl text-xs font-bold flex items-center justify-center transition-all"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> ลบไฮไลท์ (Clear)
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default DayHighlightModal;
