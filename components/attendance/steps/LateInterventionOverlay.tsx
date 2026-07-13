import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

interface LateInterventionOverlayProps {
    startTime: string;
    onSwitchToLeave?: () => void;
    onClose: () => void;
    onConfirm: () => void;
    onGoBack: () => void;
}

const LateInterventionOverlay: React.FC<LateInterventionOverlayProps> = ({
    startTime,
    onSwitchToLeave,
    onClose,
    onConfirm,
    onGoBack,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
        >
            <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="bg-red-50 p-4 rounded-full mb-4 animate-in fade-in"
            >
                <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">เข้างานสายเกินกำหนด! 😱</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                ตอนนี้เลยกำหนดเวลาเริ่มเข้างานแล้ว ({startTime} น.) <br/>
                ระบบจะบันทึกสถานะว่า <b>"มาสาย"</b> และอาจมีการหักแต้ม HP อัตโนมัติ
            </p>
            
            <div className="w-full space-y-3">
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        if (onSwitchToLeave) onSwitchToLeave();
                        else onClose();
                    }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                    <Clock className="w-5 h-5" /> แจ้งขออนุญาตลา / เข้าสายพิเศษ
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className="w-full py-3.5 bg-white border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                    เช็คอินทันที (ยอมรับเงื่อนไขการสาย) <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onGoBack}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs"
                >
                    ย้อนกลับไปเลือกประเภทงาน
                </motion.button>
            </div>
        </motion.div>
    );
};

export default LateInterventionOverlay;
