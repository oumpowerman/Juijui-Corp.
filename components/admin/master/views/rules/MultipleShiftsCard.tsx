import React, { useState } from 'react';
import { Layers, Plus, Trash2, Clock, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { WorkTimeConfig } from './WorkTimeCard';
import TimePickerModal from '../../../../ui/TimePickerModal';
import { motion, AnimatePresence } from 'framer-motion';

interface MultipleShiftsCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const MultipleShiftsCard: React.FC<MultipleShiftsCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const isEnabled = tempTimeConfig.multipleShiftsEnabled === 'true';
    const shiftsList = tempTimeConfig.multipleShiftsList
        ? tempTimeConfig.multipleShiftsList.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const [newShiftTime, setNewShiftTime] = useState('08:00');
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const handleToggle = (checked: boolean) => {
        setTempTimeConfig((prev) => ({
            ...prev,
            multipleShiftsEnabled: checked ? 'true' : 'false',
        }));
    };

    const handleAddShift = () => {
        if (!newShiftTime) return;
        if (shiftsList.includes(newShiftTime)) {
            return; // Duplicate
        }

        const updatedList = [...shiftsList, newShiftTime].sort((a, b) => {
            const [ha, ma] = a.split(':').map(Number);
            const [hb, mb] = b.split(':').map(Number);
            return (ha * 60 + ma) - (hb * 60 + mb);
        });

        setTempTimeConfig((prev) => ({
            ...prev,
            multipleShiftsList: updatedList.join(', '),
        }));
    };

    const handleRemoveShift = (timeToRemove: string) => {
        const updatedList = shiftsList.filter((t) => t !== timeToRemove);
        setTempTimeConfig((prev) => ({
            ...prev,
            multipleShiftsList: updatedList.join(', '),
        }));
    };

    return (
        <div id="multiple-shifts-card" className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm relative overflow-hidden mt-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/20 rounded-bl-full pointer-events-none"></div>

            <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                        <Layers className="w-5 h-5 text-teal-600 animate-pulse" />
                        ระบบล็อกกะทำงาน (Multiple Shifts Mode)
                    </h3>
                    <p className="text-xs text-gray-400">
                        เลือกเปิด-ปิดเพื่อสลับการลงเวลาของพนักงานระหว่าง เวลาทำการปกติ (Normal) และ ระบบล็อกกะงานอัตโนมัติ (Multiple Shifts)
                    </p>
                </div>

                {/* TOGGLE SWITCH BUTTON */}
                <div className="flex items-center gap-2.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-150 shrink-0">
                    <span className={`text-xs font-bold ${isEnabled ? 'text-teal-600' : 'text-gray-400'}`}>
                        {isEnabled ? 'เปิดใช้งานแบบกะ' : 'ปิดการใช้งาน'}
                    </span>
                    <button
                        type="button"
                        onClick={() => handleToggle(!isEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                            isEnabled ? 'bg-teal-500' : 'bg-gray-300'
                        }`}
                        aria-label="Toggle shifts mode"
                    >
                        <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                                isEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!isEnabled ? (
                    <motion.div
                        key="normal-mode"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-gray-700">โหมดปัจจุบัน: เวลาทำการปกติ (Normal Mode)</h4>
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    ระบบจะตรวจสอบการสายโดยอิงตาม <b>เวลาเข้างานปกติ ({tempTimeConfig.start} น.)</b> ที่ตั้งไว้ด้านบนเป็นหลัก หากพนักงานเข้างานเกินเวลาที่กำหนดร่วมกับช่วงผ่อนปรน (Buffer) จะถือว่าเข้างานสายทันที
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="shifts-mode"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-6">
                            {/* Shift Description banner */}
                            <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-2xl flex items-start gap-3">
                                <div className="p-2 bg-teal-500 text-white rounded-xl shrink-0 shadow-sm shadow-teal-100">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-teal-800">โหมดล็อกกะอัตโนมัติเปิดทำงานอยู่</h4>
                                    <p className="text-[11px] text-teal-600/90 leading-relaxed">
                                        พนักงานที่ลงเวลาเข้างาน ระบบจะคำนวณหารอบกะงานที่ใกล้เคียงที่สุดจากรายการด้านล่างให้อัตโนมัติ หากมาเกินช่วงของแต่ละกะ ระบบจะลงเวลาสายสำหรับกะนั้นๆ และหากเลยช่วงผ่อนปรนของกะสุดท้าย ระบบจะล็อคการเข้างานปกติและบังคับส่งคำร้องพิเศษย้อนหลังแทนเพื่อความปลอดภัยของข้อมูล
                                    </p>
                                </div>
                            </div>

                            {/* Shift List UI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Column 1: Existing Shifts List */}
                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-600 flex items-center gap-1.5 px-1">
                                        <Info className="w-3.5 h-3.5 text-teal-500" />
                                        รายการกะงานในระบบ ({shiftsList.length} กะ)
                                    </h4>

                                    {shiftsList.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-gray-400">
                                            <AlertCircle className="w-5 h-5 mx-auto mb-1.5 text-gray-300" />
                                            ยังไม่มีกะงานที่ลงทะเบียน กรุณาเพิ่มกะงานด้านขวาค่ะ
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                                            <AnimatePresence initial={false}>
                                                {shiftsList.map((time) => (
                                                    <motion.div
                                                        key={time}
                                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="flex items-center justify-between px-3 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-teal-200 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                                                <Clock className="w-3 h-3" />
                                                            </div>
                                                            <span className="font-mono font-bold text-xs text-gray-700">
                                                                {time} น.
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveShift(time)}
                                                            className="p-1 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                            title={`ลบกะ ${time}`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>

                                {/* Column 2: Add New Shift */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h4 className="text-xs font-bold text-gray-700">เพิ่มกะงานใหม่ (Add Shift Slot)</h4>
                                    
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsTimePickerOpen(true)}
                                            className="flex-1 px-4 py-3 bg-teal-50/20 text-teal-700 border border-teal-100 rounded-xl font-bold flex items-center justify-between hover:bg-teal-50/40 hover:border-teal-300 transition-all shadow-sm outline-none cursor-pointer text-xs"
                                        >
                                            <span>เวลาที่เลือก: {newShiftTime} น.</span>
                                            <Clock className="w-4 h-4 text-teal-500" />
                                        </button>
                                        
                                        <TimePickerModal
                                            isOpen={isTimePickerOpen}
                                            onClose={() => setIsTimePickerOpen(false)}
                                            initialTime={newShiftTime}
                                            onSelect={(val) => {
                                                setNewShiftTime(val);
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={handleAddShift}
                                            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-50 active:scale-95 text-xs cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            เพิ่มกะ
                                        </button>
                                    </div>
                                    
                                    <div className="p-3 bg-gray-50 rounded-xl text-[10px] text-gray-400 leading-normal border border-gray-100">
                                        💡 <b>คำแนะนำ:</b> ควรเพิ่มกะงานเรียงลำดับจากเช้าไปสาย (เช่น 08:00, 08:30, 09:00 น.) ระบบจะทำหน้าที่จับคู่ลงกะที่ใกล้เคียงให้อย่างชาญฉลาดโดยอัตโนมัติ
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultipleShiftsCard;
