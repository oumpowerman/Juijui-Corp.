import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface TimeCorrectionWarningProps {
    selectedType?: string;
}

export const TimeCorrectionWarning: React.FC<TimeCorrectionWarningProps> = ({ selectedType }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isOutOfRange = selectedType === 'OUT_OF_RANGE_CHECKOUT';

    return (
        <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`border rounded-2xl p-3.5 transition-colors text-left relative overflow-hidden ${
                isOutOfRange 
                    ? 'border-rose-100 bg-rose-50/30 hover:bg-rose-50/50' 
                    : 'border-orange-100 bg-orange-50/30 hover:bg-orange-50/50'
            }`}
        >
            {/* Top decorative gradient bar for a cute modern look */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                isOutOfRange 
                    ? 'from-rose-300 via-amber-300 to-rose-400' 
                    : 'from-orange-300 via-amber-300 to-orange-400'
            }`} />

            <div className="flex gap-2.5 items-start">
                <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                    isOutOfRange ? 'bg-rose-100/80 text-rose-600' : 'bg-orange-100/80 text-orange-600'
                }`}>
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <h5 className={`font-bold text-xs flex items-center gap-1 ${
                            isOutOfRange ? 'text-rose-800' : 'text-orange-800'
                        }`}>
                            <span>{isOutOfRange ? 'คำแนะนำการยื่นอุทธรณ์พิกัดนอกพื้นที่' : 'ข้อควรระวังในการขออนุมัติแก้ไขเวลา'}</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        </h5>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-0.5 select-none ${
                                isOutOfRange 
                                    ? 'text-rose-600 hover:text-rose-800 bg-rose-100/50 hover:bg-rose-100' 
                                    : 'text-orange-600 hover:text-orange-800 bg-orange-100/50 hover:bg-orange-100'
                            }`}
                        >
                            <span>{isExpanded ? 'ย่อหน้า' : 'อ่านเพิ่ม'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>
                    
                    <p className={`text-[11px] leading-relaxed font-medium ${
                        isOutOfRange ? 'text-rose-700/90' : 'text-orange-700/90'
                    }`}>
                        {isOutOfRange 
                            ? 'ระบบตรวจพบว่าพิกัดการลงเวลานอกพื้นที่ของท่านไม่ถูกต้องหรือเกินระยะกำหนด ท่านจำเป็นต้องส่งอุทธรณ์พิกัด...'
                            : 'การขอแก้ไขเวลาเข้า-ออกงานจะต้องเป็นกรณีสุดวิสัยจริงๆ เท่านั้น ไม่ใช่ความประมาทเลินเล่อ...'}
                    </p>

                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className={`pt-2 border-t mt-2 space-y-1.5 text-[11px] font-medium leading-relaxed ${
                                    isOutOfRange 
                                        ? 'border-rose-100/50 text-rose-700/85' 
                                        : 'border-orange-100/50 text-orange-700/85'
                                }`}>
                                    {isOutOfRange ? (
                                        <>
                                            <p>
                                                📍 โปรดระบุข้อมูลพิกัดจีพีเอสที่ถูกต้อง และรายละเอียดงานภายนอกที่ทำให้ครบถ้วนในช่องเหตุผล
                                            </p>
                                            <p>
                                                📸 แนะนำให้ <strong>"แนบรูปภาพหรือภาพถ่ายหน้าจอพิกัดแผนที่ (GPS) หรือรูปสถานที่จริง"</strong> เพื่อให้ฝ่ายพิจารณาและผู้จัดการสามารถอนุมัติคำขอของท่านได้รวดเร็วยิ่งขึ้นครับ
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p>
                                                ⚠️ โปรดหลีกเลี่ยงการระบุเหตุผลทั่วไป เช่น "ลืมกดเพราะรีบ" หรือ "ลืมสแกน" 
                                            </p>
                                            <p>
                                                คุณจำเป็นต้องชี้แจงรายะเอียดงานที่ปฏิบัติในช่วงเวลานั้นให้ชัดเจนที่สุด 
                                                พร้อมแนบไฟล์หรือรูปภาพประกอบ เช่น พิกัดหน้างาน หรือประวัติแชทกลุ่ม เพื่อประโยชน์ในการพิจารณาอนุมัติของ Admin
                                            </p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
