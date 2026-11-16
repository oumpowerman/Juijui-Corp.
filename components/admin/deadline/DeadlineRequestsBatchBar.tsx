import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeadlineRequestsBatchBarProps {
    selectedIds: string[];
    isProcessingBatch: boolean;
    handleBatchResolve: (isApproved: boolean) => void;
    otherAdminCount?: number;
}

const DeadlineRequestsBatchBar: React.FC<DeadlineRequestsBatchBarProps> = ({
    selectedIds,
    isProcessingBatch,
    handleBatchResolve,
    otherAdminCount = 0
}) => {
    return (
        <AnimatePresence>
            {selectedIds.length > 0 && (
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
                    className="shrink-0 bg-slate-800 text-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-700 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center justify-center text-xs font-bold tabular-nums shrink-0">
                            {selectedIds.length}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white">
                                ดำเนินการพร้อมกัน {selectedIds.length} รายการ
                            </h4>
                            <p className="text-[11px] text-slate-300">
                                {otherAdminCount > 0
                                    ? `มี ${otherAdminCount} รายการที่ระบุถึง Admin ท่านอื่น (คุณอนุมัติ/ปฏิเสธแทนได้)`
                                    : 'อนุมัติตามวันที่พนักงานร้องขอ หรือปฏิเสธทั้งหมดที่เลือก'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleBatchResolve(false)}
                            disabled={isProcessingBatch}
                            className="px-3.5 py-2 bg-slate-700 hover:bg-rose-600 text-slate-100 text-xs rounded-xl transition-colors font-bold disabled:opacity-50"
                        >
                            ปฏิเสธที่เลือก
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBatchResolve(true)}
                            disabled={isProcessingBatch}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-xl transition-colors font-bold disabled:opacity-50"
                        >
                            อนุมัติที่เลือกทั้งหมด
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DeadlineRequestsBatchBar;
