import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    children,
    containerClassName = 'p-3 sm:p-4 md:p-6',
    backdropClassName = 'bg-slate-900/40 backdrop-blur-sm',
    windowClassName = 'bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
    zIndex = 10000,
    closeOnEscape = true,
    closeOnBackdropClick = true
}) => {
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
                    className={`fixed inset-0 flex items-center justify-center overflow-y-auto ${containerClassName}`}
                    style={{ zIndex }}
                >
                    {/* Backdrop Motion */}
                    <motion.div
                        key="base-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={closeOnBackdropClick ? onClose : undefined}
                        className={`fixed inset-0 cursor-pointer ${backdropClassName}`}
                    />

                    {/* Window Motion */}
                    <motion.div
                        key="base-modal-window"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                        onClick={e => e.stopPropagation()}
                        className={`relative z-10 my-auto ${windowClassName}`}
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
