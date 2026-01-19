
import React, { useState } from 'react';
import { CalendarClock, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface DelayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    taskTitle: string;
    oldDate: Date;
    newDate: Date;
}

const DELAY_REASONS = [
    "ลูกค้าขอเลื่อน / แก้บรีฟ (Client Change)",
    "ถ่ายทำไม่ทัน / ปัญหาหน้างาน (Production Issue)",
    "ป่วย / ลากิจ (Sick/Leave)",
    "ไฟล์เสีย / ปัญหาเทคนิค (Technical Issue)",
    "รออนุมัติ / รอ Feedback (Waiting)",
    "งานแทรก / งานด่วนอื่น (Urgent Task)",
    "อื่นๆ (Other)"
];

const DelayModal: React.FC<DelayModalProps> = ({ isOpen, onClose, onConfirm, taskTitle, oldDate, newDate }) => {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        const finalReason = reason === 'อื่นๆ (Other)' ? customReason : reason;
        if (!finalReason.trim()) {
            alert('กรุณาระบุเหตุผลด้วยครับ');
            return;
        }
        onConfirm(finalReason);
        setReason('');
        setCustomReason('');
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-2 border-orange-100 overflow-hidden">
                <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                        <CalendarClock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-orange-900">มีการเลื่อนกำหนดส่ง! ⏳</h3>
                        <p className="text-xs text-orange-700">ระบบต้องบันทึกสาเหตุเพื่อเก็บ Stat</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">เดิม</p>
                            <p className="font-bold text-gray-600 line-through decoration-red-400 decoration-2">
                                {format(oldDate, 'd MMM')}
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">ใหม่</p>
                            <p className="font-bold text-indigo-600 text-lg">
                                {format(newDate, 'd MMM')}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ทำไมถึงเลื่อน? (Reason)</label>
                        <div className="space-y-2">
                            {DELAY_REASONS.map(r => (
                                <label key={r} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${reason === r ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="delay_reason" 
                                        value={r} 
                                        checked={reason === r}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-4 h-4 text-indigo-600 accent-indigo-600 mr-3"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{r}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {reason === 'อื่นๆ (Other)' && (
                        <textarea 
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="ระบุเหตุผลเพิ่มเติม..."
                            rows={2}
                            value={customReason}
                            onChange={e => setCustomReason(e.target.value)}
                            autoFocus
                        />
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                            ยกเลิก (ไม่เลื่อน)
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                        >
                            ยืนยันการเลื่อน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DelayModal;
