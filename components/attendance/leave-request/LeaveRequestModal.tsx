
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveType, LeaveUsage, LeaveRequest } from '../../../types/attendance';
import { MasterOption } from '../../../types';
import LeaveTypeSelector from './LeaveTypeSelector';
import LeaveFormContainer from './LeaveFormContainer';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    masterOptions?: MasterOption[];
    leaveUsage?: LeaveUsage; 
    pendingUsage?: LeaveUsage;
    requests?: LeaveRequest[];
    initialDate?: Date;
    initialReason?: string; // Add Prop
    fixedType?: LeaveType;
}

const slideVariants = {
    initial: (direction: 'forward' | 'back') => ({
        opacity: 0,
        x: direction === 'forward' ? 32 : -32,
    }),
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 380,
            damping: 32,
        },
    },
    exit: (direction: 'forward' | 'back') => ({
        opacity: 0,
        x: direction === 'forward' ? -32 : 32,
        transition: {
            duration: 0.18,
            ease: 'easeIn' as const,
        },
    }),
};

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ 
    isOpen, onClose, onSubmit, masterOptions = [], leaveUsage, pendingUsage, initialDate, initialReason, fixedType
}) => {
    const [step, setStep] = useState<'SELECT' | 'FORM'>('SELECT');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const { isAuthenticated: isDriveConnected, login: connectDrive } = useGoogleDrive();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (fixedType) {
                setSelectedType(fixedType);
                setDirection('forward');
                setStep('FORM');
            } else {
                setSelectedType(null);
                setDirection('forward');
                setStep('SELECT');
            }
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, fixedType]);

    const handleSelectType = (key: string) => {
        setDirection('forward');
        setSelectedType(key);
        setStep('FORM');
    };

    const handleBack = () => {
        if (fixedType) {
            onClose();
        } else {
            setDirection('back');
            setStep('SELECT');
            setSelectedType(null);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 overscroll-none">
                    {/* Backdrop animate-in / animate-out */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal container animate-in / animate-out with scale & lift */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative bg-white w-full sm:max-w-lg rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] border-0 sm:border-4 border-white ring-0 sm:ring-1 sm:ring-gray-100/50"
                    >
                        <AnimatePresence mode="wait" custom={direction}>
                            {step === 'SELECT' ? (
                                <motion.div
                                    key="select-step"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="flex flex-col h-full min-h-0 w-full"
                                >
                                     <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">เลือกรายการ</h3>
                                            <p className="text-gray-400 text-[11px] sm:text-xs font-medium">คุณต้องการส่งคำขอเรื่องอะไร?</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col items-end mr-1">
                                                {isDriveConnected ? (
                                                    <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Drive Ready</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={connectDrive}
                                                        type="button"
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full animate-pulse hover:bg-rose-100 transition-all text-left"
                                                    >
                                                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                                                        <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">[ เชื่อมต่อ Drive ]</span>
                                                    </button>
                                                )}
                                            </div>
                                            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-5 overflow-y-auto bg-[#f8fafc] flex-1 overscroll-contain">
                                        <LeaveTypeSelector masterOptions={masterOptions} onSelect={handleSelectType} />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form-step"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="flex flex-col h-full min-h-0 w-full"
                                >
                                    <LeaveFormContainer 
                                        selectedType={selectedType!}
                                        onBack={handleBack}
                                        onSubmit={onSubmit}
                                        onClose={onClose}
                                        masterOptions={masterOptions}
                                        leaveUsage={leaveUsage}
                                        pendingUsage={pendingUsage}
                                        initialDate={initialDate}
                                        initialReason={initialReason}
                                        fixedType={!!fixedType}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LeaveRequestModal;
