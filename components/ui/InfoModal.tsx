import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const backdropVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.22, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: 'easeIn' }
    }
};

const modalVariants: Variants = {
    initial: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 44,
        opacity: isMobile ? 1 : 0,
        scale: isMobile ? 1 : 0.96
    }),
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 380,
            damping: 32,
            mass: 0.85
        }
    },
    exit: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 44,
        opacity: isMobile ? 1 : 0,
        scale: isMobile ? 1 : 0.96,
        transition: {
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1] as const
        }
    })
};

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, children }) => {
    const [isMobile, setIsMobile] = useState<boolean>(() =>
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Escape Key Listener
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="info-modal-backdrop"
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-[11000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        key="info-modal-dialog"
                        custom={isMobile}
                        variants={modalVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-gray-100 ring-1 ring-slate-900/[0.04]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Pull Indicator for Mobile */}
                        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-2.5 -mb-1 shrink-0" />

                        {/* 1. Rigid Header */}
                        <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </span>
                                    <span>{title}</span>
                                </h3>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-1 font-medium">
                                    คู่มือการใช้งานฉบับย่อ (Quick Guide)
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                                title="ปิดหน้าต่าง"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <div className="p-5 sm:p-6 md:p-8 overflow-y-auto overscroll-contain flex-1 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-300">
                            {children}
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0 text-center sm:text-right pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <button
                                onClick={onClose}
                                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full sm:w-auto min-h-[44px]"
                            >
                                เข้าใจแล้ว! ลุยเลย 🚀
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InfoModal;
