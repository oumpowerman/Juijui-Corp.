
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LeaveUsage } from '../../../types/attendance';
import LeaveQuotaWidget from './LeaveQuotaWidget';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveQuotaModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaveUsage: LeaveUsage;
    onHistoryClick: () => void;
}

const LeaveQuotaModal: React.FC<LeaveQuotaModalProps> = ({ 
    isOpen, onClose, leaveUsage, onHistoryClick 
}) => {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Card with suspenseful spring and tilt animation on open, elegant exit on close */}
                    <motion.div 
                        initial={{ 
                            opacity: 0, 
                            scale: 0.5, 
                            y: 120, 
                            rotate: -10,
                            filter: 'blur(8px)'
                        }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0, 
                            rotate: 0,
                            filter: 'blur(0px)'
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.85, 
                            y: 100, 
                            rotate: 8,
                            filter: 'blur(4px)',
                            transition: {
                                duration: 0.25,
                                ease: "easeInOut"
                            }
                        }}
                        transition={{ 
                            type: 'spring', 
                            damping: 14, 
                            stiffness: 120,
                            mass: 1.0
                        }}
                        className="bg-white w-full sm:max-w-xl h-[80vh] sm:h-auto rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-slate-900 relative overflow-hidden z-10 flex flex-col min-h-0"
                        id="leave-quota-modal-card"
                    >
                        {/* Close Button with spin hover */}
                        <motion.button 
                            whileHover={{ scale: 1.15, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose} 
                            className="absolute top-5 right-5 z-20 p-2.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>

                        <div className="p-2 bg-gradient-to-b from-indigo-50/10 to-white flex-1 flex flex-col min-h-0">
                            <LeaveQuotaWidget 
                                leaveUsage={leaveUsage}
                                onHistoryClick={() => {
                                    onHistoryClick();
                                    onClose();
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LeaveQuotaModal;
