import React, { useState } from 'react';
import { Camera, Save, Shield, ShieldAlert, Check, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDeterministicVerificationDays } from '../../../../../lib/selfieUtils';

interface SelfieVerificationCardProps {
    selfieMode: string;
    setSelfieMode: React.Dispatch<React.SetStateAction<string>>;
    selfieDays: string;
    setSelfieDays: React.Dispatch<React.SetStateAction<string>>;
    isSavingSelfie: boolean;
    handleSaveSelfieConfig: () => Promise<void>;
}

const SelfieVerificationCard: React.FC<SelfieVerificationCardProps> = ({
    selfieMode,
    setSelfieMode,
    selfieDays,
    setSelfieDays,
    isSavingSelfie,
    handleSaveSelfieConfig,
}) => {
    const isEnabled = selfieMode !== 'ALWAYS_OFF';
    
    // Local simulation state for the premium preview
    const [simUserId, setSimUserId] = useState('EMP-007');
    const [simWeek, setSimWeek] = useState(() => {
        // Simple current ISO week calculation or default
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil(days / 7).toString();
    });

    const handleToggleMaster = (checked: boolean) => {
        if (checked) {
            setSelfieMode('ALWAYS_ON');
        } else {
            setSelfieMode('ALWAYS_OFF');
        }
    };

    // Calculate days for simulation
    const daysOfWeek = [
        { key: 0, label: 'อา', fullLabel: 'อาทิตย์' },
        { key: 1, label: 'จ', fullLabel: 'จันทร์' },
        { key: 2, label: 'อ', fullLabel: 'อังคาร' },
        { key: 3, label: 'พ', fullLabel: 'พุธ' },
        { key: 4, label: 'พฤ', fullLabel: 'พฤหัสบดี' },
        { key: 5, label: 'ศ', fullLabel: 'ศุกร์' },
        { key: 6, label: 'ส', fullLabel: 'เสาร์' }
    ];

    const currentYear = new Date().getFullYear();
    const simDaysCount = parseInt(selfieDays, 10) || 3;
    const simulatedActiveDays = getDeterministicVerificationDays(
        simUserId || 'EMP-007',
        currentYear,
        parseInt(simWeek, 10) || 26,
        simDaysCount
    );

    return (
        <div 
            id="selfie-verification-card" 
            className={`bg-white rounded-3xl p-6 relative overflow-hidden transition-all duration-500 ${
                isEnabled 
                    ? 'border-2 border-purple-300 ring-4 ring-purple-100/30 shadow-lg shadow-purple-50/50' 
                    : 'border border-gray-200 shadow-sm'
            }`}
        >
            {/* Ambient Background Glow & Pulse */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-bl-full transition-all duration-500 pointer-events-none opacity-40 blur-2xl ${
                isEnabled ? 'bg-purple-200/50 animate-pulse' : 'bg-gray-100'
            }`}></div>

            {/* Header with Switch */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100 relative z-10">
                <div className="flex items-center gap-3.5">
                    <div className={`p-3.5 rounded-2xl transition-all duration-500 ${
                        isEnabled 
                            ? 'bg-purple-600 text-white ring-4 ring-purple-100/50 shadow-md shadow-purple-200' 
                            : 'bg-gray-100 text-gray-400'
                    }`}>
                        <Camera className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
                            ระบบถ่ายรูปยืนยันตัวตน
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-500 ${
                                isEnabled 
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200 animate-pulse' 
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-purple-600 animate-ping' : 'bg-gray-400'}`}></span>
                                {isEnabled ? 'SECURITY ACTIVE' : 'SECURITY OFF'}
                            </span>
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">
                            ควบคุมความปลอดภัยและเพิ่มความยืดหยุ่นในการตอกบัตร
                        </p>
                    </div>
                </div>

                {/* Premium Segmented Slide Controller */}
                <div className="relative flex p-1 bg-gray-100/80 rounded-2xl border border-gray-200/60 w-full lg:w-auto max-w-md shrink-0 select-none">
                    {/* Sliding Background Indicator */}
                    <div className="absolute inset-y-1 left-1 right-1 pointer-events-none">
                        <div className="relative w-full h-full">
                            <motion.div
                                layoutId="active-switch-pill"
                                className="absolute top-0 bottom-0 rounded-xl bg-white shadow-sm border border-gray-200/40"
                                style={{
                                    width: '50%',
                                    left: isEnabled ? '50%' : '0%'
                                }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        </div>
                    </div>

                    <button
                        id="toggle-selfie-off"
                        type="button"
                        onClick={() => handleToggleMaster(false)}
                        className={`relative z-10 flex-1 lg:flex-none lg:w-48 flex items-center justify-center gap-2 px-4 py-3 text-xs font-black rounded-xl transition-all duration-300 min-h-[48px] focus:outline-none ${
                            !isEnabled 
                                ? 'text-gray-900' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>🚫 ปิดใช้งานระบบกล้อง</span>
                    </button>

                    <button
                        id="toggle-selfie-on"
                        type="button"
                        onClick={() => handleToggleMaster(true)}
                        className={`relative z-10 flex-1 lg:flex-none lg:w-48 flex items-center justify-center gap-2 px-4 py-3 text-xs font-black rounded-xl transition-all duration-300 min-h-[48px] focus:outline-none ${
                            isEnabled 
                                ? 'text-purple-700' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>📸 เปิดระบบตรวจรูปภาพ</span>
                        {isEnabled && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                </div>
            </div>

            {/* Config & Simulation Section with AnimatePresence */}
            <div className="mt-6 relative z-10">
                <AnimatePresence mode="wait">
                    {!isEnabled ? (
                        <motion.div
                            key="disabled-state"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center py-10"
                        >
                            <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
                            <h4 className="font-bold text-gray-700 text-sm">ปิดการใช้ระบบกล้องยืนยันตัวตน</h4>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                                พนักงานจะข้ามขั้นตอนถ่ายภาพตอกบัตรไปทันทีเพื่อความสะดวกรวดเร็ว การตอกบัตรจะสามารถทำได้ด้วยคลิกเดียว
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="enabled-state"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Verification Mode Radio Cards */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    เลือกระดับความเข้มงวดในการตรวจสอบ (Verification Level)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* ALWAYS_ON Option */}
                                    <button
                                        id="radio-selfie-always-on"
                                        type="button"
                                        onClick={() => setSelfieMode('ALWAYS_ON')}
                                        className={`p-4 rounded-2xl border text-left flex gap-3 transition-all duration-300 relative overflow-hidden ${
                                            selfieMode === 'ALWAYS_ON'
                                                ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-100 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            selfieMode === 'ALWAYS_ON' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                                                เปิดใช้งานตลอดเวลา
                                                {selfieMode === 'ALWAYS_ON' && (
                                                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                พนักงานทุกคนต้องถ่ายรูปยืนยันตัวตนทุกๆ ครั้งที่มีการเช็คอินเข้างานเพื่อความปลอดภัยสูงสุด
                                            </p>
                                        </div>
                                        {selfieMode === 'ALWAYS_ON' && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white p-0.5 rounded-full">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </button>

                                    {/* RANDOM Option */}
                                    <button
                                        id="radio-selfie-random"
                                        type="button"
                                        onClick={() => setSelfieMode('RANDOM')}
                                        className={`p-4 rounded-2xl border text-left flex gap-3 transition-all duration-300 relative overflow-hidden ${
                                            selfieMode === 'RANDOM'
                                                ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-100 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            selfieMode === 'RANDOM' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            <HelpCircle className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                                                สุ่มตรวจความปลอดภัยรายสัปดาห์
                                                {selfieMode === 'RANDOM' && (
                                                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                สุ่มระบุวันที่ต้องถ่ายเซลฟี่ของพนักงานแต่ละคนตามจำนวนวันที่ระบุ โดยสลับวันไม่ซ้ำซ้อนกัน
                                            </p>
                                        </div>
                                        {selfieMode === 'RANDOM' && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white p-0.5 rounded-full">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Slider & simulation only if RANDOM mode is active */}
                            <AnimatePresence>
                                {selfieMode === 'RANDOM' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6 pt-4 border-t border-dashed border-gray-100"
                                    >
                                        {/* Slider Input */}
                                        <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm">จำนวนวันที่ต้องการสุ่มตรวจ</h4>
                                                    <p className="text-xs text-gray-400 mt-0.5">ระบุความเข้มงวดของระบบสุ่ม ยิ่งจำนวนวันเยอะ ความปลอดภัยยิ่งสูง</p>
                                                </div>
                                                <span className="self-start sm:self-auto bg-purple-100 text-purple-700 font-extrabold px-4 py-2 rounded-2xl border border-purple-200 text-sm shrink-0">
                                                    🎯 {selfieDays} วัน / สัปดาห์
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    id="input-selfie-days-range"
                                                    type="range" 
                                                    min="1" 
                                                    max="7"
                                                    className="flex-1 accent-purple-600 h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer"
                                                    value={selfieDays}
                                                    onChange={e => setSelfieDays(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Real-time Deterministic Simulation */}
                                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-1.5 mb-4">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">
                                                    จำลองผลลัพธ์การสุ่มแบบ Deterministic (Deterministic Sandbox Preview)
                                                </h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">รหัสพนักงาน (User ID)</label>
                                                    <input 
                                                        id="sim-user-id"
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white"
                                                        value={simUserId}
                                                        onChange={e => setSimUserId(e.target.value)}
                                                        placeholder="EMP-007"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">สัปดาห์ที่ต้องการจำลอง (Week No)</label>
                                                    <input 
                                                        id="sim-week-no"
                                                        type="number"
                                                        min="1"
                                                        max="53"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white"
                                                        value={simWeek}
                                                        onChange={e => setSimWeek(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <div className="text-[11px] text-gray-400 bg-white px-3 py-2 border border-gray-100 rounded-xl w-full text-center">
                                                        ปี {currentYear} • สัปดาห์ {simWeek}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Days Grid Simulation */}
                                            <div className="space-y-3">
                                                <label className="block text-[10px] font-bold text-gray-400">ตารางสุ่มลงภาพของพนักงานท่านนี้:</label>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {daysOfWeek.map(day => {
                                                        const isActive = simulatedActiveDays.includes(day.key);
                                                        return (
                                                            <div 
                                                                key={day.key}
                                                                className={`p-2.5 rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                                                                    isActive 
                                                                        ? 'border-purple-300 bg-purple-600 text-white shadow-sm font-extrabold' 
                                                                        : 'border-gray-200 bg-white text-gray-400 font-medium'
                                                                }`}
                                                                title={day.fullLabel}
                                                            >
                                                                <span className="text-[10px] uppercase tracking-wider">{day.label}</span>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                                    isActive ? 'bg-white' : 'bg-transparent'
                                                                }`}></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[11px] text-gray-400 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/30 leading-relaxed">
                                                    💡 <b>หลักธรรมของการสุ่ม:</b> อัลกอริทึมจะใช้ <code>{simUserId || 'EMP-007'}</code> ร่วมกับสัปดาห์ปัจจุบันเป็น Seed ปล่อยให้ระบบสุ่มวันที่ต้องถ่ายรูปอย่างเป็นธรรม โดยไม่เปลี่ยนไปเปลี่ยนมาเมื่อเปิดใหม่หรือรีเฟรชหน้าจอ!
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save Button */}
                <div className="col-span-full flex justify-end pt-5 border-t border-dashed border-gray-100 mt-6">
                    <button 
                        id="btn-save-selfie-config"
                        onClick={handleSaveSelfieConfig}
                        disabled={isSavingSelfie}
                        className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-100 flex items-center gap-2 text-xs"
                    >
                        <Save className="w-4 h-4" /> 
                        {isSavingSelfie ? 'กำลังบันทึกความปลอดภัย...' : 'บันทึกการตั้งค่ากล้องถ่ายรูป'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelfieVerificationCard;
