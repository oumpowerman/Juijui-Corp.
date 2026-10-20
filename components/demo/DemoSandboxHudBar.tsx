import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Crown,
    KeyRound,
    PauseCircle,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    UserCheck
} from 'lucide-react';
import { useDemoSandbox } from '../../context/DemoSandboxContext';

export const DemoSandboxHudBar: React.FC = () => {
    const {
        isDemoMode,
        demoRole,
        remainingSeconds,
        quotaSeconds,
        isDemoExpired,
        isDemoBlocked,
        formattedRemainingTime,
        switchDemoRole,
        resetDemoData,
        pauseAndExitDemoMode
    } = useDemoSandbox();

    if (!isDemoMode) return null;

    const isLowTime = remainingSeconds <= 120 && remainingSeconds > 30;
    const isCriticalTime = remainingSeconds <= 30;
    const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / Math.max(1, quotaSeconds)) * 100));

    return (
        <>
            {/* Top Sticky Sandbox HUD Control Bar */}
            <div className="sticky top-0 z-[90] w-full bg-slate-900 text-white border-b border-indigo-500/40 shadow-md">
                <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5">
                    {/* Left: Sandbox Mode Indicator & Live Active Timer */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                            <span>SANDBOX DEMO</span>
                        </div>

                        <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold transition-colors shrink-0 ${
                                isCriticalTime
                                    ? 'bg-rose-500/25 border-rose-400/50 text-rose-200 animate-pulse'
                                    : isLowTime
                                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                                    : 'bg-slate-800 border-slate-700 text-slate-100'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-slate-300 hidden sm:inline">เวลาทดลองเล่นคงเหลือ:</span>
                            <span className="font-mono text-sm font-bold tabular-nums tracking-wider text-white">
                                {formattedRemainingTime}
                            </span>
                            <div className="hidden md:block w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        isCriticalTime
                                            ? 'bg-rose-500'
                                            : isLowTime
                                            ? 'bg-amber-400'
                                            : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        <span className="hidden xl:inline text-[11px] font-medium text-slate-400 truncate">
                            ข้อมูลที่สร้างหรือแก้ไขในโหมดนี้จะไม่ถูกบันทึกลงฐานข้อมูลจริง และรีเซ็ตใหม่เมื่อกด Refresh
                        </span>
                    </div>

                    {/* Right: Role Perspective Switcher + Reset + Pause/Exit */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Role Perspective Segmented Control */}
                        <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                            <button
                                type="button"
                                onClick={() => switchDemoRole('ADMIN')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    demoRole === 'ADMIN'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                <Crown className="w-3.5 h-3.5" />
                                <span>มุมมอง Admin (บริษัท)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => switchDemoRole('MEMBER')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    demoRole === 'MEMBER'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>มุมมองพนักงาน</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={resetDemoData}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            title="ล้างการแก้ไขกลับเป็นข้อมูลตัวอย่างเริ่มต้น"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-300" />
                            <span className="hidden sm:inline">รีเซ็ตข้อมูลจำลอง</span>
                        </button>

                        <button
                            type="button"
                            onClick={pauseAndExitDemoMode}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                            title="หยุดนับเวลาชั่วคราวเพื่อเก็บเวลาที่เหลือไว้เล่นต่อครั้งหน้า"
                        >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>พักเวลา / ออกจาก Demo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Full-Screen Quota Exhausted / Blocked Modal Overlay */}
            <AnimatePresence>
                {isDemoExpired && (
                    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
                        >
                            {/* 1. Rigid Header */}
                            <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {isDemoBlocked
                                            ? 'สิทธิ์การทดลองเล่นถูกระงับชั่วคราว'
                                            : 'ครบกำหนดเวลาทดลองเล่นฟรี 10 นาทีแล้วครับ'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                                        ขอบคุณที่ร่วมทดลองสัมผัสระบบบริหารงานคอนเทนต์ Juijui ERP
                                    </p>
                                </div>
                            </div>

                            {/* 2. Scrollable Body */}
                            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4">
                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2">
                                    <div className="text-xs font-bold text-indigo-900">
                                        ต้องการเปิดใช้งานพื้นที่ทำงานจริงของบริษัทคุณใช่ไหมครับ?
                                    </div>
                                    <p className="text-xs text-indigo-700 leading-relaxed">
                                        เมื่อเปิดแพ็กเกจองค์กรจริง ข้อมูลทุกอย่างจะถูกบันทึกบนฐานข้อมูล Cloud ส่วนตัวของบริษัทคุณอย่างปลอดภัย พร้อมระบบแยกสิทธิ์พนักงานและการแจ้งเตือนครบวงจร
                                    </p>
                                </div>

                                <div className="space-y-2.5 text-xs text-slate-600">
                                    <div className="font-bold text-slate-800">ขั้นตอนถัดไปที่คุณเลือกได้:</div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        1. หากคุณได้รับรหัส <span className="font-mono font-bold text-emerald-700">CLAIM-XXXX</span> หรือ <span className="font-mono font-bold text-indigo-700">Invite Code</span> แล้ว สามารถกดปุ่มด้านล่างเพื่อกลับไปกรอกรหัสเข้าองค์กรจริงได้ทันที
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        2. หากต้องการขอขยายเวลาทดลองเล่นเพิ่มเติมสำหรับทีมผู้บริหาร สามารถแจ้งทีมงานดูแลลูกค้าให้กดเพิ่มเวลาให้บัญชีของคุณได้ทันทีครับ
                                    </div>
                                </div>
                            </div>

                            {/* 3. Rigid Sticky Footer */}
                            <div className="flex-shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                <button
                                    type="button"
                                    onClick={pauseAndExitDemoMode}
                                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    <span>กลับไปหน้ากรอกรหัสองค์กร / ติดต่อทีมงาน</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
