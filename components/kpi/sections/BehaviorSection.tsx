
import React from 'react';
import { MasterOption } from '../../../types';
import { HeartPulse, Star, UserCircle, ShieldCheck, Sparkles, Quote, Zap } from 'lucide-react';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { motion } from 'framer-motion';

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
    selfReflectionPride?: string;
    selfReflectionImprovement?: string;
    onSelfFeedbackChange?: (val: string) => void;
    onPrideChange?: (val: string) => void;
    onImprovementChange?: (val: string) => void;

    onSave: (status: 'DRAFT' | 'FINAL' | 'PAID') => void;
    onSaveSelf?: (pride: string, improvement: string) => void;
    
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
    selfReflectionPride = '', onPrideChange,
    selfReflectionImprovement = '', onImprovementChange,
    onSave, onSaveSelf,
    currentStatus, finalScore, canPay
}) => {
    const { showConfirm } = useGlobalDialog();
    
    // Helper to render the Dual Slider
    const renderSlider = (criterionKey: string) => {
        const managerVal = scores[criterionKey] || 0;
        const selfVal = selfScores[criterionKey] || 0;

        if (isSelfEval) {
            // Member Mode: Just a simple slider for self
            return (
                <div className="flex items-center gap-4">
                    <div className="relative w-32 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(selfVal / 5) * 100}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                        />
                        <input 
                            type="range" min="0" max="5" 
                            value={selfVal} 
                            onChange={e => onSelfScoreChange(criterionKey, parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                    <span className="font-bold text-indigo-600 text-lg w-6 text-center">{selfVal}</span>
                </div>
            );
        }

        // Admin Mode: Manager Slider + Ghost Self Marker
        return (
            <div className="flex items-center gap-4 relative min-w-[140px]">
                {/* Visual Track for Ghost */}
                <div className="relative w-32 h-3 bg-gray-100 rounded-full border border-gray-200 shadow-inner">
                     {/* Manager Fill */}
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(managerVal / 5) * 100}%` }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full" 
                     />
                     
                     {/* Self Ghost Marker */}
                     {selfVal > 0 && (
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-indigo-400 rounded-full border-2 border-white shadow-lg z-10 opacity-80 pointer-events-none ring-2 ring-indigo-100"
                            style={{ left: `calc(${(selfVal / 5) * 100}% - 10px)` }}
                            title={`พนักงานให้ตัวเอง: ${selfVal}`}
                        />
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
                    <span className="font-bold text-pink-600 text-lg">{managerVal}</span>
                    {selfVal > 0 && <span className="text-[11px] text-indigo-400 font-bold">({selfVal})</span>}
                </div>
            </div>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-50/50 rounded-bl-full -mr-12 -mt-12 blur-3xl transition-transform duration-700 group-hover:scale-110"></div>

            <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center text-2xl tracking-tight">
                        <HeartPulse className="w-8 h-8 mr-3 text-pink-500 animate-pulse" />
                        พฤติกรรม (Behavioral Core Values)
                    </h3>
                    <p className="text-sm font-bold text-gray-400 mt-1 ml-11">ประเมินตามค่านิยมหลักขององค์กร</p>
                </div>
                
                {/* Legend */}
                {isAdmin && (
                    <div className="flex gap-4 text-[11px] font-bold bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm uppercase tracking-widest">
                        <span className="flex items-center text-pink-600"><div className="w-2.5 h-2.5 rounded-full bg-pink-500 mr-2 shadow-sm"></div> คุณประเมิน</span>
                        <span className="flex items-center text-indigo-500"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400 opacity-70 mr-2 shadow-sm"></div> น้องประเมิน</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
                {criteria.map((c, idx) => (
                    <motion.div 
                        key={c.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md hover:border-pink-100 border border-transparent transition-all group/item"
                    >
                        <span className="text-base font-bold text-gray-700 group-hover/item:text-pink-600 transition-colors">{c.label}</span>
                        {renderSlider(c.key)}
                    </motion.div>
                ))}
            </div>

            {/* Summary & Feedback */}
            <div className="mt-12 pt-10 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                
                {/* Self Reflection Column */}
                <div className="space-y-6">
                    <label className="block text-sm font-bold text-indigo-600 uppercase mb-4 flex items-center tracking-widest">
                        <UserCircle className="w-5 h-5 mr-2" /> สิ่งที่พนักงานอยากบอก (Self Reflection)
                    </label>
                    
                    {isSelfEval ? (
                        <div className="space-y-6">
                            <div className="relative">
                                <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-yellow-500" /> ความภูมิใจในเดือนนี้ ✨
                                </p>
                                <textarea 
                                    className="w-full p-5 bg-indigo-50/30 rounded-[1.5rem] border-2 border-indigo-100 outline-none focus:border-indigo-400 focus:bg-white text-base font-medium transition-all resize-none h-32 shadow-inner"
                                    placeholder="เล่าสิ่งที่คุณทำได้ดีที่สุดในเดือนนี้..."
                                    value={selfReflectionPride}
                                    onChange={e => onPrideChange && onPrideChange(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-indigo-500" /> สิ่งที่อยากทำให้ดีขึ้น 🛠️
                                </p>
                                <textarea 
                                    className="w-full p-5 bg-indigo-50/30 rounded-[1.5rem] border-2 border-indigo-100 outline-none focus:border-indigo-400 focus:bg-white text-base font-medium transition-all resize-none h-32 shadow-inner"
                                    placeholder="จุดที่ยังบกพร่องและอยากปรับปรุง..."
                                    value={selfReflectionImprovement}
                                    onChange={e => onImprovementChange && onImprovementChange(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="p-6 bg-gradient-to-br from-indigo-50/50 to-white rounded-[2rem] border-2 border-indigo-100 shadow-sm relative"
                            >
                                <Quote className="absolute top-4 right-4 w-8 h-8 text-indigo-100" />
                                <p className="text-[11px] font-bold text-indigo-400 mb-2 uppercase tracking-widest">ความภูมิใจ:</p>
                                <p className="text-base text-gray-700 font-bold leading-relaxed italic">"{selfReflectionPride || 'ไม่ได้ระบุ'}"</p>
                            </motion.div>
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="p-6 bg-gradient-to-br from-indigo-50/50 to-white rounded-[2rem] border-2 border-indigo-100 shadow-sm relative"
                            >
                                <Quote className="absolute top-4 right-4 w-8 h-8 text-indigo-100" />
                                <p className="text-[11px] font-bold text-indigo-400 mb-2 uppercase tracking-widest">สิ่งที่อยากปรับปรุง:</p>
                                <p className="text-base text-gray-700 font-bold leading-relaxed italic">"{selfReflectionImprovement || 'ไม่ได้ระบุ'}"</p>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Manager Feedback Column */}
                <div className="space-y-6">
                    <label className="block text-sm font-bold text-pink-600 uppercase mb-4 flex items-center tracking-widest">
                        <ShieldCheck className="w-5 h-5 mr-2" /> ความเห็นหัวหน้า (Manager Feedback)
                    </label>
                    {isAdmin ? (
                        <textarea 
                            className="w-full p-5 bg-pink-50/30 rounded-[1.5rem] border-2 border-pink-100 outline-none focus:border-pink-400 focus:bg-white text-base font-medium transition-all resize-none h-full min-h-[300px] shadow-inner"
                            placeholder="สิ่งที่ทำได้ดี และสิ่งที่ควรปรับปรุง..."
                            value={feedback}
                            onChange={e => onFeedbackChange(e.target.value)}
                        />
                    ) : (
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="p-8 bg-gradient-to-br from-pink-50/30 to-white rounded-[2.5rem] text-lg text-gray-700 font-bold italic border-2 border-pink-100 min-h-[300px] shadow-sm flex items-center justify-center text-center leading-relaxed"
                        >
                            "{feedback || 'รอหัวหน้าประเมิน'}"
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <motion.div 
                layout
                className="mt-12 flex flex-col sm:flex-row justify-between items-center bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl gap-6 relative z-10 border border-gray-800"
            >
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-2xl shadow-inner">
                        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                    </div>
                    <div>
                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-[0.2em]">Final Assessment Grade</p>
                        <p className="text-4xl font-bold text-white leading-none mt-1">{isAdmin ? finalScore : '???'}</p>
                    </div>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    {isSelfEval ? (
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSaveSelf && onSaveSelf(selfReflectionPride, selfReflectionImprovement)} 
                            className="flex-1 sm:flex-none px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-900/50 transition-all uppercase tracking-widest"
                        >
                            บันทึกผลประเมินตนเอง
                        </motion.button>
                    ) : isAdmin && (
                        <>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSave('DRAFT')} className="flex-1 sm:flex-none px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest border border-gray-700">Save Draft</motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={async () => { if(await showConfirm('ยืนยันผลประเมิน?')) onSave('FINAL'); }} className="flex-1 sm:flex-none px-8 py-4 bg-pink-600 hover:bg-pink-500 rounded-2xl text-sm font-bold shadow-xl shadow-pink-900/50 transition-all uppercase tracking-widest">Approve Result</motion.button>
                            {currentStatus === 'FINAL' && canPay && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={async () => { if(await showConfirm('ยืนยันการจ่ายโบนัส?')) onSave('PAID'); }} className="flex-1 sm:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-sm font-bold shadow-xl shadow-emerald-900/50 transition-all uppercase tracking-widest">Pay Bonus</motion.button>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default BehaviorSection;
