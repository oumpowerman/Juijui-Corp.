import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { InventoryItem, ChecklistItem } from '../../types';
import { X, CheckCircle2, Box } from 'lucide-react';

interface ItemVerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ChecklistItem;
    inventoryItem?: InventoryItem;
    onConfirm: () => void;
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

const ItemVerifyModal: React.FC<ItemVerifyModalProps> = ({
    isOpen,
    onClose,
    item,
    inventoryItem,
    onConfirm
}) => {
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
                    key="item-verify-backdrop"
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        key="item-verify-dialog"
                        custom={isMobile}
                        variants={modalVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Pull Indicator for Mobile */}
                        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-2.5 -mb-1 shrink-0" />

                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-base truncate pr-2">
                                รายละเอียดอุปกรณ์
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                                title="ปิดหน้าต่าง"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                            <div className="relative h-56 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                                {inventoryItem?.imageUrl ? (
                                    <img
                                        src={inventoryItem.imageUrl}
                                        alt={item.text}
                                        className="w-full h-full object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <Box className="w-14 h-14 mb-2 opacity-60" />
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            ไม่มีรูปภาพตัวอย่าง
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xl font-bold text-gray-900 leading-tight mb-1.5">
                                    {item.text}
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {inventoryItem?.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับอุปกรณ์ชิ้นนี้'}
                                </p>
                            </div>
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                            >
                                ปิด
                            </button>
                            {!item.isChecked && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>ยืนยันติ๊กเช็คอุปกรณ์นี้</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ItemVerifyModal;
