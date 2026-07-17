import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HpPenaltySectionProps {
    hpPenalty: number;
    setHpPenalty: (val: number) => void;
}

export const HpPenaltySection: React.FC<HpPenaltySectionProps> = ({
    hpPenalty,
    setHpPenalty
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="p-4 bg-red-50/45 rounded-3xl border border-red-100/70 space-y-3 mt-4">
            {/* Header Trigger to Expand/Collapse */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                id="hp-penalty-toggle-header"
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-xl">💔</span>
                    <div>
                        <h4 className="text-xs font-bold text-red-900 tracking-wide uppercase group-hover:text-red-700 transition-colors">
                            บทลงโทษปรับลด HP (Suspicious HP Penalty)
                        </h4>
                        <p className="text-[10px] text-red-600 font-medium">
                            ในกรณีที่เหตุผลการเข้างาน/ส่งคำขอแปลกๆ หรือน่าสงสัย
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`font-mono font-bold text-xs px-3 py-1.5 rounded-2xl shadow-xs transition-all ${
                        hpPenalty > 0 
                            ? 'bg-red-500 text-white' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {hpPenalty > 0 ? `-${hpPenalty} HP` : 'ไม่มีโทษ'}
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-red-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                    )}
                </div>
            </button>

            {/* Collapsible Slider Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 pb-1 space-y-3.5">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] text-red-600 font-bold px-1">
                                    <span>ไม่มีโทษ (0 HP)</span>
                                    <span className="text-red-700 font-mono text-xs">{hpPenalty} HP</span>
                                    <span>สูงสุด (-10 HP)</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={hpPenalty}
                                    onChange={(e) => setHpPenalty(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
                                    id="hp-penalty-slider-component"
                                />

                                <div className="flex gap-2">
                                    {[0, 2, 5, 8, 10].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setHpPenalty(val)}
                                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                hpPenalty === val
                                                    ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-100 scale-105'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {val === 0 ? 'ไม่มีโทษ' : `-${val}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
