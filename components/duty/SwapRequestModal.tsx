
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, type Variants, type PanInfo } from 'framer-motion';
import { X, ArrowRightLeft, Calendar, Search, Check } from 'lucide-react';
import { Duty, User } from '../../types';
import { format, isAfter, isSameDay } from 'date-fns';

interface SwapRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceDuty: Duty | null;
    allDuties: Duty[];
    users: User[];
    currentUser: User;
    onConfirmSwap: (targetDutyId: string) => void;
}

const springTransition = {
    type: 'spring' as const,
    stiffness: 360,
    damping: 32,
    mass: 0.85,
};

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
    },
};

const modalVariants: Variants = {
    hidden: (isMobile: boolean) =>
        isMobile
            ? { y: '100%', opacity: 1, scale: 1 }
            : { y: 18, opacity: 0, scale: 0.92 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: springTransition,
    },
    exit: (isMobile: boolean) =>
        isMobile
            ? {
                  y: '100%',
                  opacity: 1,
                  scale: 1,
                  transition: {
                      type: 'spring' as const,
                      stiffness: 380,
                      damping: 36,
                      mass: 0.8,
                  },
              }
            : {
                  y: 12,
                  opacity: 0,
                  scale: 0.95,
                  transition: {
                      duration: 0.16,
                      ease: [0.4, 0, 1, 1] as const,
                  },
              },
};

const listContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.035,
            delayChildren: 0.05,
        },
    },
};

const listItemVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: springTransition,
    },
};

const SwapRequestModal: React.FC<SwapRequestModalProps> = ({ 
    isOpen, onClose, sourceDuty, allDuties, users, currentUser, onConfirmSwap 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(() =>
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false
    );
    const dragControls = useDragControls();

    // Preserve last valid sourceDuty so exit animation renders smoothly when parent sets sourceDuty to null
    const cachedDutyRef = useRef<Duty | null>(sourceDuty);
    if (sourceDuty) {
        cachedDutyRef.current = sourceDuty;
    }
    const activeDuty = sourceDuty || cachedDutyRef.current;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia('(max-width: 639px)');
        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        setIsMobile(mql.matches);
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedTargetId(null);
            return;
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Filter logic: 
    // 1. Must not be my own duty
    // 2. Must be in the future (or today)
    // 3. Must not be done
    const availableTargets = useMemo(() => {
        if (!activeDuty) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return allDuties.filter(d => 
            d.assigneeId !== currentUser.id && // Not mine
            !d.isDone && // Not done
            (isAfter(new Date(d.date), today) || isSameDay(new Date(d.date), today)) && // Future
            d.id !== activeDuty.id // Not the source itself
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [allDuties, currentUser.id, activeDuty]);

    // Search Filter
    const filteredTargets = useMemo(() => {
        return availableTargets.filter(d => {
            const assignee = users.find(u => u.id === d.assigneeId);
            const nameMatch = assignee?.name.toLowerCase().includes(searchQuery.toLowerCase());
            const titleMatch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
            return nameMatch || titleMatch;
        });
    }, [availableTargets, users, searchQuery]);

    const handleConfirm = () => {
        if (selectedTargetId) {
            onConfirmSwap(selectedTargetId);
            onClose();
            setSelectedTargetId(null);
        }
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 90 || info.velocity.y > 420) {
            onClose();
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait" custom={isMobile}>
            {isOpen && activeDuty && (
                <motion.div
                    key="swap-modal-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        key="swap-modal-dialog"
                        custom={isMobile}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag={isMobile ? 'y' : false}
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.04, bottom: 0.65 }}
                        onDragEnd={handleDragEnd}
                        onClick={e => e.stopPropagation()}
                        className="bg-white w-full max-w-md max-h-[90vh] sm:max-h-[82vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border-t sm:border-4 border-indigo-50"
                    >
                        {/* Mobile Drag Handle + 1. Rigid Header */}
                        <div
                            onPointerDown={e => {
                                if (isMobile) dragControls.start(e);
                            }}
                            style={{ touchAction: isMobile ? 'none' : 'auto' }}
                            className="flex-shrink-0 bg-indigo-50 border-b border-indigo-100 select-none"
                        >
                            {/* Mobile Pull Bar */}
                            <div className="sm:hidden pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
                                <div className="w-10 h-1.5 rounded-full bg-indigo-200/90" />
                            </div>

                            <div className="px-5 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                        <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> ขอแลกเวร (Swap Request)
                                    </h3>
                                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                        เวรของคุณ: <span className="font-bold">{activeDuty.title}</span> ({format(new Date(activeDuty.date), 'd MMM')})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    onPointerDown={e => e.stopPropagation()}
                                    className="p-2 -mr-2 hover:bg-white/60 rounded-xl text-indigo-400 hover:text-indigo-600 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                                    aria-label="ปิดหน้าต่าง"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อเพื่อน หรือวันที่..." 
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Scrollable Body with Staggered List */}
                        <div className="flex-1 overflow-y-auto overscroll-contain p-4 bg-gray-50/30 duty-slim-scroll">
                            {filteredTargets.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={springTransition}
                                    className="text-center py-10 text-gray-400"
                                >
                                    <p className="text-sm font-medium">ไม่พบเวรที่สามารถแลกได้</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    variants={listContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-2"
                                >
                                    {filteredTargets.map(duty => {
                                        const assignee = users.find(u => u.id === duty.assigneeId);
                                        const isSelected = selectedTargetId === duty.id;

                                        return (
                                            <motion.div 
                                                key={duty.id}
                                                variants={listItemVariants}
                                                whileHover={{ y: -1 }}
                                                whileTap={{ scale: 0.985 }}
                                                onClick={() => setSelectedTargetId(duty.id)}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors
                                                    ${isSelected 
                                                        ? 'bg-indigo-50/90 border-indigo-500 shadow-sm' 
                                                        : 'bg-white border-transparent hover:border-indigo-100 shadow-sm'}
                                                `}
                                            >
                                                {/* Avatar */}
                                                <div className="shrink-0">
                                                    {assignee?.avatarUrl ? (
                                                        <img src={assignee.avatarUrl} alt={assignee.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                            {assignee?.name?.[0]}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-gray-900">{assignee?.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {format(new Date(duty.date), 'd MMM')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 truncate">{duty.title}</p>
                                                </div>

                                                {/* Animated Radio Indicator */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white'}`}>
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                key="selected-check"
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                transition={springTransition}
                                                            >
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors active:scale-95"
                            >
                                ยกเลิก
                            </button>
                            <motion.button 
                                type="button"
                                whileTap={selectedTargetId ? { scale: 0.97 } : undefined}
                                onClick={handleConfirm}
                                disabled={!selectedTargetId}
                                className="w-full sm:flex-1 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <ArrowRightLeft className="w-4 h-4" /> ส่งคำขอแลกเวร
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SwapRequestModal;


