
import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, Wrench, Check, Send, MessageSquare, Calculator, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { Task, MasterOption } from '../../types';
import { DIFFICULTY_LABELS } from '../../config/taxonomy';

interface ReviewActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: 'PASS' | 'REVISE' | null;
    task?: Task; // Added Task prop to calculate base score
    onConfirm: (feedback?: string, adjustment?: number) => void;
    masterOptions?: MasterOption[]; // New Prop
}

const ReviewActionModal: React.FC<ReviewActionModalProps> = ({ isOpen, onClose, actionType, task, onConfirm, masterOptions = [] }) => {
    const [feedback, setFeedback] = useState('');
    const [adjustment, setAdjustment] = useState<number>(0);
    const [showReasons, setShowReasons] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFeedback('');
            setAdjustment(0);
            setShowReasons(false);
        }
    }, [isOpen]);

    // Dynamic Rejection Reasons
    const rejectionReasons = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'REJECTION_REASON' && o.isActive)
            .sort((a,b) => a.sortOrder - b.sortOrder)
            .map(o => o.label);
    }, [masterOptions]);

    // Fallback if empty
    const quickReasons = rejectionReasons.length > 0 ? rejectionReasons : [
        "เสียงเบา / ไม่ชัดเจน",
        "สีเพี้ยน / White Balance ไม่ตรง",
        "ตัดต่อไม่กระชับ / ยืดเยื้อ",
        "คำผิด / Subtitle ไม่ตรง",
        "เพลงดังกลบเสียงพูด",
        "ลืมใส่ Logo / Credit",
        "จังหวะการเล่าเรื่องยังไม่ดี"
    ];

    // Calculate Base Score
    const baseScoreInfo = useMemo(() => {
        if (!task) return { base: 0, timeBonus: 0, total: 0 };
        
        const difficulty = task.difficulty || 'MEDIUM';
        // @ts-ignore
        const diffXP = DIFFICULTY_LABELS[difficulty]?.xp || 100;
        const timeXP = (task.estimatedHours || 0) * 20;
        
        return {
            base: diffXP,
            timeBonus: timeXP,
            total: diffXP + timeXP
        };
    }, [task]);

    if (!isOpen || !actionType) return null;

    const isPass = actionType === 'PASS';
    const finalScore = baseScoreInfo.total + adjustment;

    const quickAdjust = (val: number) => {
        setAdjustment(prev => prev + val);
    };
    
    const handleQuickReason = (reason: string) => {
        setFeedback(prev => prev ? `${prev}\n- ${reason}` : `- ${reason}`);
        setShowReasons(false);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className={`bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 ${isPass ? 'border-green-50' : 'border-red-50'} overflow-hidden`}>
                
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-center ${isPass ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <h3 className={`font-bold flex items-center ${isPass ? 'text-green-800' : 'text-red-800'}`}>
                        {isPass ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Wrench className="w-5 h-5 mr-2" />}
                        {isPass ? 'ประเมินและอนุมัติ (Approve & Grade)' : 'ส่งกลับแก้ไข (Revise)'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-5">
                    
                    {/* --- PASS MODE: GRADING SYSTEM --- */}
                    {isPass && task ? (
                        <div className="space-y-4">
                            {/* Base Score Card */}
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Difficulty ({task.difficulty}):</span>
                                    <span className="font-mono">{baseScoreInfo.base} XP</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 border-b border-dashed border-gray-200 pb-2">
                                    <span>Time Bonus ({task.estimatedHours}h):</span>
                                    <span className="font-mono">+{baseScoreInfo.timeBonus} XP</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-700 pt-1">
                                    <span>คะแนนพื้นฐาน (Base Score):</span>
                                    <span>{baseScoreInfo.total} XP</span>
                                </div>
                            </div>

                            {/* Adjustment Controls */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center justify-between">
                                    <span>Performance Adjustment</span>
                                    <span className={`text-xs ${adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {adjustment > 0 ? '+' : ''}{adjustment} XP
                                    </span>
                                </label>
                                
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="range" 
                                        min="-100" 
                                        max="100" 
                                        step="10"
                                        value={adjustment}
                                        onChange={(e) => setAdjustment(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => quickAdjust(-20)} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center">
                                        <TrendingDown className="w-3 h-3 mr-1" /> Late/Fix -20
                                    </button>
                                    <button onClick={() => setAdjustment(0)} className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold hover:bg-gray-200 transition-colors">
                                        Reset
                                    </button>
                                    <button onClick={() => quickAdjust(20)} className="px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold hover:bg-green-100 transition-colors flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" /> Fast/Good +20
                                    </button>
                                    <button onClick={() => quickAdjust(50)} className="px-2 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded text-[10px] font-bold hover:bg-yellow-100 transition-colors flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" /> Excellent +50
                                    </button>
                                </div>
                            </div>

                            {/* Final Score Display */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Calculator className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase opacity-80">Total XP Awarded</span>
                                        <span className="text-xs">แจกคะแนนให้ทีม</span>
                                    </div>
                                </div>
                                <div className="text-3xl font-black">{finalScore}</div>
                            </div>
                        </div>
                    ) : (
                        // --- REVISE MODE ---
                        <>
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-sm text-gray-600 font-medium">
                                    กรุณาระบุสิ่งที่ต้องแก้ไข:
                                </p>
                                {/* Quick Reasons Toggle */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowReasons(!showReasons)}
                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 flex items-center"
                                    >
                                        + Quick Reason <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>
                                    
                                    {showReasons && (
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl z-20 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 p-1">
                                            {quickReasons.map((reason, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleQuickReason(reason)}
                                                    className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded-lg text-gray-700 block"
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <MessageSquare className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                                <textarea 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none text-sm min-h-[120px] resize-none"
                                    placeholder="เช่น เสียงเบาไปนิด, สีเพี้ยนช่วงนาทีที่ 2..."
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2.5 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                            ยกเลิก
                        </button>
                        <button 
                            onClick={() => onConfirm(feedback, adjustment)}
                            className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center ${isPass ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                        >
                            {isPass ? <Check className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            {isPass ? 'Confirm Pass' : 'Send Revise'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewActionModal;
