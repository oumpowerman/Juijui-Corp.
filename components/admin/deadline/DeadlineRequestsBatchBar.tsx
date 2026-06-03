import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeadlineRequestsBatchBarProps {
    selectedIds: string[];
    isProcessingBatch: boolean;
    handleBatchResolve: (isApproved: boolean) => void;
}

const DeadlineRequestsBatchBar: React.FC<DeadlineRequestsBatchBarProps> = ({
    selectedIds,
    isProcessingBatch,
    handleBatchResolve
}) => {
    return (
        <AnimatePresence>
            {selectedIds.length > 0 && (
                <motion.div
                     initial={{ y: 50, opacity: 0, x: '-50%' }}
                     animate={{ y: 0, opacity: 1, x: '-50%' }}
                     exit={{ y: 50, opacity: 0, x: '-50%' }}
                     transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                     className="absolute bottom-6 left-1/2 bg-slate-900 text-white rounded-2xl shadow-xl px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 z-50 w-[95%] max-w-lg border border-slate-800 text-left"
                >
                    <div className="text-left flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                            {selectedIds.length}
                        </div>
                        <div className="text-left">
                            <h4 className="text-[10px] text-slate-350 tracking-wider uppercase font-bold">การอนุมัติคำขอแบบหมู่คณะ (Batch Actions)</h4>
                            <p className="text-[9px] text-slate-400">ประมวลผลคำขอเดดไลน์ {selectedIds.length} รายการพร้อมสุ่มแบบเรียลไทม์</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 shrink-0">
                        <button
                            onClick={() => handleBatchResolve(false)}
                            disabled={isProcessingBatch}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-350 text-[10px] rounded-lg transition-colors font-bold"
                        >
                            ปฏิเสธชุดนี้
                        </button>
                        <button
                            onClick={() => handleBatchResolve(true)}
                            disabled={isProcessingBatch}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg shadow-sm transition-colors font-bold"
                        >
                            อนุมัติชุดนี้ตามขอ
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DeadlineRequestsBatchBar;
