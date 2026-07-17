
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle2, HelpCircle, Info, MessageSquare, Loader2, Trophy, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGlobalDialog } from '../context/GlobalDialogContext';

const SparkleStar = ({ delay, left, top, size }: { delay: number; left: string; top: string; size: number }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0, y: 15, rotate: 0 }}
        animate={{ 
            scale: [0, 1.2, 1, 0.8, 0], 
            opacity: [0, 1, 1, 0.6, 0],
            y: -60,
            rotate: [0, 45, -45, 90, 0]
        }}
        transition={{ 
            duration: 4, 
            repeat: Infinity, 
            delay,
            ease: "easeInOut"
        }}
        className="absolute pointer-events-none text-amber-400"
        style={{ left, top, width: size, height: size }}
    >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </svg>
    </motion.div>
);

const RotatingGlow = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem] z-0">
        {/* Deep background golden radial aura */}
        <motion.div 
            animate={{ 
                scale: [1, 1.15, 0.95, 1.08, 1],
                opacity: [0.12, 0.22, 0.12, 0.18, 0.12]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-400/30 blur-3xl"
        />
        {/* Shimmering diagonal sweep of elegant white light */}
        <motion.div 
            animate={{ 
                x: ['-120%', '160%'],
                opacity: [0, 0.25, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
        />
    </div>
);

const GlobalDialog: React.FC = () => {
    const { dialogState, closeDialog, isLoading, loadingMessage } = useGlobalDialog();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (dialogState.isOpen && dialogState.type === 'prompt') {
            setInputValue(dialogState.defaultValue || '');
        }
    }, [dialogState.isOpen, dialogState.type, dialogState.defaultValue]);

    const { type, title, message, onConfirm, onCancel, isDanger, isCelebrate } = dialogState;

    // Icon mapping
    const getIcon = () => {
        if (isDanger) {
            return <AlertCircle className="w-10 h-10 text-rose-500" />;
        }
        if (isCelebrate) {
            return (
                <motion.div
                    animate={{ 
                        y: [0, -4, 0],
                        rotate: [0, -3, 3, -3, 0]
                    }}
                    transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                >
                    <Trophy className="w-10 h-10 text-amber-500 filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]" />
                </motion.div>
            );
        }
        switch (type) {
            case 'confirm': return <HelpCircle className="w-10 h-10 text-indigo-500" />;
            case 'prompt': return <MessageSquare className="w-10 h-10 text-blue-500" />;
            case 'success': return <CheckCircle2 className="w-10 h-10 text-green-500" />;
            case 'error': return <AlertCircle className="w-10 h-10 text-red-500" />;
            default: return <Info className="w-10 h-10 text-blue-500" />;
        }
    };

    const getColors = () => {
        if (isDanger) {
            return 'border-rose-100 bg-rose-50/50';
        }
        if (isCelebrate) {
            return 'border-amber-200/50 bg-gradient-to-b from-white via-amber-50/15 to-white shadow-2xl shadow-amber-500/5';
        }
        switch (type) {
            case 'confirm': return 'border-indigo-100 bg-indigo-50/50';
            case 'prompt': return 'border-blue-100 bg-blue-50/50';
            case 'success': return 'border-green-100 bg-green-50/50';
            case 'error': return 'border-red-100 bg-red-50/50';
            default: return 'border-blue-100 bg-blue-50/50';
        }
    };

    const dialogContent = (
        <>
            {/* Render Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[110000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
                    >
                        <div className="text-center space-y-6">
110:                             <div className="relative flex justify-center">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                <Loader2 className="w-20 h-20 animate-spin text-indigo-500 relative z-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white tracking-tight">
                                    {loadingMessage || 'กำลังดำเนินการ...'}
                                </h3>
                                <p className="text-indigo-300 font-medium animate-pulse">
                                    กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Render Dialog */}
            <AnimatePresence>
                {dialogState.isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 15, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className={`bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 relative border-2 ${getColors()}`}
                        >
                            {/* Premium Background Visualizer for Celebrate Mode */}
                            {isCelebrate && <RotatingGlow />}

                            {/* Floating Sparkles inside celebrate mode container */}
                            {isCelebrate && (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2.5rem] z-0">
                                    <SparkleStar delay={0} left="12%" top="25%" size={14} />
                                    <SparkleStar delay={1.2} left="80%" top="18%" size={18} />
                                    <SparkleStar delay={0.6} left="15%" top="70%" size={16} />
                                    <SparkleStar delay={1.8} left="85%" top="65%" size={12} />
                                    <SparkleStar delay={2.4} left="50%" top="10%" size={15} />
                                </div>
                            )}

                            {/* Icon Wrapper */}
                            <div className="flex justify-center mb-5 relative z-10">
                                <div className="bg-white p-3.5 rounded-full shadow-md border border-gray-100/80 relative">
                                    {isCelebrate && (
                                        <>
                                            {/* Slow spinning light ray ring */}
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                                className="absolute -inset-2 rounded-full border border-dashed border-amber-300/60"
                                            />
                                            {/* Soft radial aura under the icon */}
                                            <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-300/40 via-yellow-200/20 to-amber-400/40 blur-md opacity-70" />
                                        </>
                                    )}
                                    <div className="relative z-10 flex items-center justify-center">
                                        {getIcon()}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mb-6 relative z-10 px-1">
                                {title && (
                                    <h3 className={`text-xl font-extrabold mb-2.5 tracking-tight ${
                                        isCelebrate 
                                            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 bg-clip-text text-transparent font-black' 
                                            : 'text-gray-800'
                                    }`}>
                                        {title}
                                    </h3>
                                )}
                                <p className="text-gray-500 text-sm leading-relaxed font-semibold">
                                    {message}
                                </p>
                            </div>

                            {type === 'prompt' && (
                                <div className="mb-6 relative z-10">
                                    <input 
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="w-full p-3 border-2 border-blue-100 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all font-medium text-gray-800"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (onConfirm) onConfirm(inputValue);
                                                else closeDialog();
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 relative z-10">
                                {type === 'confirm' || type === 'prompt' ? (
                                    <>
                                        <button 
                                            onClick={() => { if(onCancel) onCancel(); else closeDialog(); }}
                                            className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 border border-gray-150/70 hover:bg-gray-100/80 rounded-xl transition-all text-sm cursor-pointer active:scale-98"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button 
                                            onClick={() => { if(onConfirm) onConfirm(inputValue); else closeDialog(); }}
                                            className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-sm cursor-pointer ${
                                                isDanger 
                                                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                                                    : isCelebrate
                                                        ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 hover:brightness-105 active:brightness-95 shadow-amber-200/50'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                            }`}
                                        >
                                            ตกลง
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => { if(onConfirm) onConfirm(); else closeDialog(); }}
                                        className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-sm cursor-pointer ${
                                            isDanger 
                                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                                                : isCelebrate
                                                    ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 hover:brightness-105 active:brightness-95 shadow-amber-200/50'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                        }`}
                                    >
                                        {isCelebrate ? 'ดำเนินการต่อ' : 'รับทราบ'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    return createPortal(dialogContent, document.body);
};

export default GlobalDialog;
