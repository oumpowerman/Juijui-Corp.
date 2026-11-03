import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    containerClassName?: string;
    backdropClassName?: string;
    windowClassName?: string;
    zIndex?: number;
    closeOnEscape?: boolean;
    closeOnBackdropClick?: boolean;
}

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: 'easeIn' }
    }
};

const mobileWindowVariants: Variants = {
    hidden: { opacity: 0, y: '100%' },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 340,
            damping: 32,
            mass: 0.85
        }
    },
    exit: {
        opacity: 0,
        y: '100%',
        transition: {
            duration: 0.22,
            ease: [0.4, 0, 1, 1] as const
        }
    }
};

const desktopWindowVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.24,
            ease: [0.16, 1, 0.3, 1] as const
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 16,
        transition: {
            duration: 0.18,
            ease: [0.4, 0, 1, 1] as const
        }
    }
};

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    children,
    containerClassName = 'p-0 sm:p-4 md:p-6',
    backdropClassName = 'bg-slate-900/40 backdrop-blur-sm',
    windowClassName = 'bg-white w-full max-w-xl rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]',
    zIndex = 10000,
    closeOnEscape = true,
    closeOnBackdropClick = true
}) => {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 639px)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia('(max-width: 639px)');
        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        setIsMobile(mql.matches);
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') {
                onClose();
            }
        };

        const origOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = origOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, closeOnEscape]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    className={`fixed inset-0 flex items-end sm:items-center justify-center overflow-y-auto ${containerClassName}`}
                    style={{ zIndex }}
                >
                    {/* Backdrop Motion */}
                    <motion.div
                        key="base-modal-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={closeOnBackdropClick ? onClose : undefined}
                        className={`fixed inset-0 cursor-pointer ${backdropClassName}`}
                    />

                    {/* Window Motion */}
                    <motion.div
                        key="base-modal-window"
                        variants={isMobile ? mobileWindowVariants : desktopWindowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={e => e.stopPropagation()}
                        className={`relative z-10 sm:my-auto ${windowClassName}`}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BaseModal;

