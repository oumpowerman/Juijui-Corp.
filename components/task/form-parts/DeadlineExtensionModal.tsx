import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Send } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';

interface DeadlineExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newDate: string, reason: string) => void;
    currentEndDate: string;
}

const DeadlineExtensionModal: React.FC<DeadlineExtensionModalProps> = ({ isOpen, onClose, onSubmit, currentEndDate }) => {
    const [newDate, setNewDate] = useState(currentEndDate);
    const [reason, setReason] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDate || !reason.trim()) return;
        onSubmit(newDate, reason);
    };

    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">ขอเลื่อน Deadline</h3>
                        <p className="text-xs text-indigo-600/70">ระบุวันที่ต้องการและเหตุผลที่ชัดเจน</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ต้องการเลื่อนไป (New Date)</label>
                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => setIsDatePickerOpen(true)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 outline-none transition-all text-left flex items-center justify-between"
                            >
                                <span>{formatDisplayDate(newDate)}</span>
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">เหตุผล (Reason)</label>
                        <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="อธิบายเหตุผลที่ทำให้งานล่าช้า..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-28"
                            required
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit"
                            disabled={!newDate || !reason.trim() || newDate <= currentEndDate}
                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            ส่งคำขอ
                        </button>
                    </div>
                </form>
            </div>

            <DatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                selectedDate={newDate ? new Date(newDate) : undefined}
                minDate={currentEndDate ? new Date(currentEndDate) : undefined}
                onSelect={(date) => {
                    if (date) {
                        setNewDate(date.toISOString().split('T')[0]);
                    }
                }}
            />
        </div>
    );
};

export default DeadlineExtensionModal;
