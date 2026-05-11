
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Sparkles, Heart, Zap, CheckCircle2, PartyPopper } from 'lucide-react';
import { AppNotification } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ResurrectionModalProps {
    notification: AppNotification | undefined;
    onAcknowledge: (id: string) => void;
}

const ResurrectionModal: React.FC<ResurrectionModalProps> = ({ notification, onAcknowledge }) => {
    if (!notification) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-white/10 backdrop-blur-3xl overflow-hidden font-sans">
                {/* Background Golden Glow */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    className="absolute w-[800px] h-[800px] bg-yellow-400/20 rounded-full blur-[120px] pointer-events-none"
                />
                
                {/* Content Card */}
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.9 }}
                    className="bg-white border-4 border-yellow-400 w-full max-w-lg rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(234,179,8,0.4)] overflow-hidden relative flex flex-col items-center text-center p-12"
                >
                    {/* Sparkles particles effect (simplified) */}
                    <div className="absolute top-10 left-10 text-yellow-400 animate-bounce delay-75"><Sparkles className="w-8 h-8" /></div>
                    <div className="absolute top-20 right-12 text-yellow-500 animate-pulse"><Sun className="w-10 h-10" /></div>
                    <div className="absolute bottom-20 left-12 text-yellow-600 animate-bounce delay-200"><Zap className="w-6 h-6" /></div>

                    <div className="w-32 h-32 bg-yellow-50 rounded-full flex items-center justify-center mb-8 shadow-2xl border-4 border-yellow-400 relative animate-in zoom-in-50 duration-500">
                        <Heart className="w-16 h-16 text-red-500 fill-red-500 animate-pulse" />
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-4 border-dashed border-yellow-200 rounded-full"
                        />
                    </div>

                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">
                        BORN AGAIN!
                    </h2>
                    
                    <div className="flex items-center gap-2 mb-8 uppercase tracking-[0.3em] font-black text-yellow-600 text-sm">
                        <PartyPopper className="w-5 h-5" />
                        ยินดีต้อนรับกลับสู่ทีม
                        <PartyPopper className="w-5 h-5" />
                    </div>

                    <div className="bg-yellow-50/50 rounded-3xl p-8 border border-yellow-200 mb-10 w-full relative group">
                        <p className="text-slate-700 text-xl leading-relaxed font-bold italic">
                            "{notification.message}"
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest border-t border-yellow-200 pt-6">
                            <span>Status: Restored</span>
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                            <span>Spirit: Unleashed</span>
                        </div>
                    </div>

                    <p className="text-slate-500 mb-10 text-sm font-medium px-4">
                        คุณได้รับโอกาสที่สองแล้ว! จงใช้มันเพื่อสร้างสรรค์ผลงานชั้นยอดและดูแลรักษาสุขภาพใจ (HP) ให้ดีกว่าเดิมนะ
                    </p>

                    <button
                        onClick={() => onAcknowledge(notification.id)}
                        className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 p-6 text-white transition-all hover:bg-yellow-400 hover:text-black active:scale-[0.98] shadow-2xl"
                    >
                        <div className="relative z-10 flex items-center justify-center gap-3 font-black text-lg">
                            <CheckCircle2 className="w-7 h-7" /> 
                            เริ่มต้นชีวิตใหม่ ลุย!
                        </div>
                        {/* Shine effect on button */}
                        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-3">
                        <div className="h-px w-10 bg-slate-200"></div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Official Resurrection Records
                        </p>
                        <div className="h-px w-10 bg-slate-200"></div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ResurrectionModal;
