import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock } from 'lucide-react';
import { LeaveUsage } from '../../../types/attendance';
import LeaveQuotaWidget from './LeaveQuotaWidget';
import OvertimeHistoryTab from './OvertimeHistoryTab';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSession } from '../../../context/UserSessionContext';

interface LeaveQuotaModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaveUsage: LeaveUsage;
    onHistoryClick: () => void;
}

const LeaveQuotaModal: React.FC<LeaveQuotaModalProps> = ({ 
    isOpen, onClose, leaveUsage, onHistoryClick 
}) => {
    const { currentUserProfile } = useUserSession();
    const [activeTab, setActiveTab] = useState<'quota' | 'ot'>('quota');
    const [isTabHovered, setIsTabHovered] = useState<boolean>(false);

    // Dynamic clean up when modal closes
    const handleClose = () => {
        onClose();
        // Keep active tab as quota for next session
        setTimeout(() => {
            setActiveTab('quota');
        }, 300);
    };

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
                        onClick={handleClose}
                    />

                    {/* Modal Card */}
                    <motion.div 
                        initial={{ 
                            opacity: 0, 
                            scale: 0.9, 
                            y: 80,
                            filter: 'blur(4px)'
                        }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            filter: 'blur(0px)'
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.9, 
                            y: 80,
                            filter: 'blur(4px)'
                        }}
                        transition={{ 
                            type: 'spring', 
                            damping: 18, 
                            stiffness: 140
                        }}
                        className="bg-white w-full sm:max-w-xl h-[85vh] sm:h-[85vh] sm:max-h-[700px] rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-slate-900 relative overflow-hidden z-10 flex flex-col min-h-0"
                        id="leave-quota-modal-card"
                    >
                        {/* Close Button */}
                        <motion.button 
                            whileHover={{ scale: 1.15, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleClose} 
                            className="absolute top-5 right-5 z-20 p-2.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>

                        {/* Interactive Self-Expanding Tab Switcher */}
                        <div className="px-6 pt-6 pb-2 shrink-0 flex justify-start">
                            <motion.div
                                onMouseEnter={() => setIsTabHovered(true)}
                                onMouseLeave={() => setIsTabHovered(false)}
                                animate={{
                                    width: isTabHovered ? 260 : 128
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 24
                                }}
                                className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] overflow-hidden select-none"
                            >
                                <button
                                    onClick={() => setActiveTab('quota')}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeTab === 'quota' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {activeTab === 'quota' && (
                                        <motion.div 
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        />
                                    )}
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    <AnimatePresence initial={false}>
                                        {isTabHovered && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                animate={{ opacity: 1, width: "auto", marginLeft: 4 }}
                                                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="overflow-hidden whitespace-nowrap text-[11px]"
                                            >
                                                โควตาวันลา
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>

                                <button
                                    onClick={() => setActiveTab('ot')}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeTab === 'ot' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {activeTab === 'ot' && (
                                        <motion.div 
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        />
                                    )}
                                    <Clock className="w-4 h-4 shrink-0" />
                                    <AnimatePresence initial={false}>
                                        {isTabHovered && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                animate={{ opacity: 1, width: "auto", marginLeft: 4 }}
                                                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="overflow-hidden whitespace-nowrap text-[11px]"
                                            >
                                                ประวัติ OT
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </motion.div>
                        </div>

                        {/* Main Content View with Slide transitions */}
                        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-indigo-50/10 to-white">
                            <AnimatePresence mode="wait">
                                {activeTab === 'quota' ? (
                                    <motion.div
                                        key="quota-tab"
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 12 }}
                                        transition={{ duration: 0.18 }}
                                        className="flex-1 flex flex-col min-h-0 p-2"
                                    >
                                        <LeaveQuotaWidget 
                                            leaveUsage={leaveUsage}
                                            onHistoryClick={() => {
                                                onHistoryClick();
                                                handleClose();
                                            }}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ot-tab"
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -12 }}
                                        transition={{ duration: 0.18 }}
                                        className="flex-1 flex flex-col min-h-0"
                                    >
                                        <OvertimeHistoryTab 
                                            userId={currentUserProfile?.id} 
                                            isOpen={isOpen}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LeaveQuotaModal;
