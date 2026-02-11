
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Wrench, Check, Send, MessageSquare } from 'lucide-react';

interface ReviewActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: 'PASS' | 'REVISE' | null;
    onConfirm: (feedback?: string) => void;
}

const ReviewActionModal: React.FC<ReviewActionModalProps> = ({ isOpen, onClose, actionType, onConfirm }) => {
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFeedback('');
        }
    }, [isOpen]);

    if (!isOpen || !actionType) return null;

    const isPass = actionType === 'PASS';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className={`bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 ${isPass ? 'border-green-50' : 'border-red-50'} overflow-hidden`}>
                <div className={`p-4 border-b flex justify-between items-center ${isPass ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <h3 className={`font-bold flex items-center ${isPass ? 'text-green-800' : 'text-red-800'}`}>
                        {isPass ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Wrench className="w-5 h-5 mr-2" />}
                        {isPass ? 'ยืนยันให้ผ่าน (Pass)' : 'ส่งกลับแก้ไข (Revise)'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 font-medium">
                        {isPass 
                            ? 'งานนี้จะถูกเปลี่ยนสถานะเป็น "DONE" และระบบจะแจก XP ให้ทีมงานทันที ยืนยันหรือไม่?' 
                            : 'กรุณาระบุสิ่งที่ต้องแก้ไข เพื่อแจ้งให้ทีมทราบ:'}
                    </p>
                    
                    {!isPass && (
                        <div className="relative">
                            <MessageSquare className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                            <textarea 
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none text-sm min-h-[100px] resize-none"
                                placeholder="เช่น เสียงเบาไปนิด, สีเพี้ยนช่วงนาทีที่ 2..."
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2.5 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                            ยกเลิก
                        </button>
                        <button 
                            onClick={() => onConfirm(feedback)}
                            className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center ${isPass ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                        >
                            {isPass ? <Check className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            ยืนยัน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewActionModal;
