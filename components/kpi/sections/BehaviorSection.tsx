
import React from 'react';
import { MasterOption } from '../../../types';
import { HeartPulse, Star, UserCircle, ShieldCheck } from 'lucide-react';

interface BehaviorSectionProps {
    criteria: MasterOption[];
    
    // Manager Scores
    scores: Record<string, number>;
    onScoreChange: (key: string, value: number) => void;
    
    // Self Scores (New)
    selfScores?: Record<string, number>;
    onSelfScoreChange: (key: string, value: number) => void;
    
    isAdmin: boolean;
    isSelfEval: boolean; // Toggle Mode
    
    feedback: string;
    onFeedbackChange: (val: string) => void;
    
    selfFeedback?: string; // To show to admin
    onSelfFeedbackChange?: (val: string) => void;

    onSave: (status: 'DRAFT' | 'FINAL' | 'PAID') => void;
    onSaveSelf?: () => void;
    
    currentStatus: string;
    finalScore: number;
    canPay: boolean;
}

const BehaviorSection: React.FC<BehaviorSectionProps> = ({ 
    criteria, 
    scores, onScoreChange,
    selfScores = {}, onSelfScoreChange,
    isAdmin, isSelfEval,
    feedback, onFeedbackChange,
    selfFeedback = '', onSelfFeedbackChange,
    onSave, onSaveSelf,
    currentStatus, finalScore, canPay
}) => {
    
    // Helper to render the Dual Slider
    const renderSlider = (criterionKey: string) => {
        const managerVal = scores[criterionKey] || 0;
        const selfVal = selfScores[criterionKey] || 0;

        if (isSelfEval) {
            // Member Mode: Just a simple slider for self
            return (
                <div className="flex items-center gap-3">
                    <input 
                        type="range" min="0" max="5" 
                        value={selfVal} 
                        onChange={e => onSelfScoreChange(criterionKey, parseInt(e.target.value))}
                        className="w-24 accent-indigo-500 cursor-pointer"
                    />
                    <span className="font-black text-indigo-600 w-6 text-center">{selfVal}</span>
                </div>
            );
        }

        // Admin Mode: Manager Slider + Ghost Self Marker
        return (
            <div className="flex items-center gap-3 relative min-w-[120px]">
                {/* Visual Track for Ghost */}
                <div className="relative w-24 h-1.5 bg-gray-200 rounded-full">
                     {/* Manager Fill */}
                     <div 
                        className="absolute top-0 left-0 h-full bg-pink-500 rounded-full" 
                        style={{ width: `${(managerVal / 5) * 100}%` }}
                     ></div>
                     
                     {/* Self Ghost Marker */}
                     {selfVal > 0 && (
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-400 rounded-full border-2 border-white shadow-sm z-10 opacity-70 pointer-events-none"
                            style={{ left: `calc(${(selfVal / 5) * 100}% - 8px)` }}
                            title={`พนักงานให้ตัวเอง: ${selfVal}`}
                        ></div>
                     )}

                     {/* Invisible Input for Interaction */}
                     <input 
                        type="range" min="0" max="5" 
                        value={managerVal} 
                        onChange={e => onScoreChange(criterionKey, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                </div>
                
                <div className="flex flex-col items-center leading-none">
                    <span className="font-black text-pink-600 text-sm">{managerVal}</span>
                    {selfVal > 0 && <span className="text-[10px] text-indigo-400 font-bold">({selfVal})</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <HeartPulse className="w-5 h-5 mr-2 text-pink-500" />
                    พฤติกรรม (Behavioral Core Values)
                </h3>
                
                {/* Legend */}
                {isAdmin && (
                    <div className="flex gap-3 text-[10px] font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <span className="flex items-center text-pink-600"><div className="w-2 h-2 rounded-full bg-pink-500 mr-1"></div> คุณประเมิน</span>
                        <span className="flex items-center text-indigo-500"><div className="w-2 h-2 rounded-full bg-indigo-400 opacity-70 mr-1"></div> น้องประเมิน</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {criteria.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-bold text-gray-600">{c.label}</span>
                        {renderSlider(c.key)}
                    </div>
                ))}
            </div>

            {/* Summary & Feedback */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Self Feedback Column */}
                <div>
                    <label className="block text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center">
                        <UserCircle className="w-4 h-4 mr-1" /> สิ่งที่พนักงานอยากบอก (Self Reflection)
                    </label>
                    {isSelfEval ? (
                        <textarea 
                            className="w-full p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 outline-none focus:border-indigo-400 text-sm transition-all resize-none h-32"
                            placeholder="สิ่งที่ทำได้ดีในเดือนนี้..."
                            value={selfFeedback}
                            onChange={e => onSelfFeedbackChange && onSelfFeedbackChange(e.target.value)}
                        />
                    ) : (
                        <div className="p-4 bg-indigo-50/30 rounded-xl text-sm text-gray-600 italic border border-indigo-50 min-h-[128px]">
                            "{selfFeedback || 'น้องไม่ได้เขียนอะไรมา'}"
                        </div>
                    )}
                </div>

                {/* Manager Feedback Column */}
                <div>
                    <label className="block text-xs font-bold text-pink-500 uppercase mb-2 flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-1" /> ความเห็นหัวหน้า (Manager Feedback)
                    </label>
                    {isAdmin ? (
                        <textarea 
                            className="w-full p-3 bg-pink-50/30 rounded-xl border border-pink-100 outline-none focus:border-pink-400 text-sm transition-all resize-none h-32"
                            placeholder="สิ่งที่ทำได้ดี และสิ่งที่ควรปรับปรุง..."
                            value={feedback}
                            onChange={e => onFeedbackChange(e.target.value)}
                        />
                    ) : (
                        <div className="p-4 bg-pink-50/20 rounded-xl text-sm text-gray-600 italic border border-pink-50 min-h-[128px]">
                            "{feedback || 'รอหัวหน้าประเมิน'}"
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-gray-900 text-white p-4 rounded-2xl shadow-lg gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-full">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Final Grade</p>
                        <p className="text-3xl font-black text-white leading-none">{isAdmin ? finalScore : '???'}</p>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    {isSelfEval ? (
                        <button 
                            onClick={() => onSaveSelf && onSaveSelf()} 
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
                        >
                            บันทึกผลประเมินตนเอง
                        </button>
                    ) : isAdmin && (
                        <>
                            <button onClick={() => onSave('DRAFT')} className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold transition-colors">Save Draft</button>
                            <button onClick={() => { if(confirm('ยืนยันผล?')) onSave('FINAL'); }} className="flex-1 sm:flex-none px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded-xl text-xs font-bold shadow-lg shadow-pink-900/50 transition-all active:scale-95">Approve</button>
                            {currentStatus === 'FINAL' && canPay && (
                                <button onClick={() => { if(confirm('จ่ายเงิน?')) onSave('PAID'); }} className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-xs font-bold shadow-lg shadow-green-900/50 transition-all active:scale-95">Pay</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BehaviorSection;
