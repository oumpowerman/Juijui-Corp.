import React from 'react';
import { Clock, Crown, Play, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useDemoSandbox } from '../../context/DemoSandboxContext';

export const DemoTrialLaunchCard: React.FC = () => {
    const {
        isQuotaLoading,
        remainingSeconds,
        quotaSeconds,
        isDemoExpired,
        isDemoBlocked,
        formattedRemainingTime,
        demoRole,
        switchDemoRole,
        startDemoMode
    } = useDemoSandbox();

    const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / Math.max(1, quotaSeconds)) * 100));

    return (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 mb-5 shadow-lg space-y-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                            REAL-SYSTEM SANDBOX DEMO
                        </div>
                        <div className="text-base font-bold text-white truncate">
                            ทดลองเล่นระบบจริงระหว่างรออนุมัติ
                        </div>
                    </div>
                </div>

                <div
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono tabular-nums ${
                        isDemoExpired
                            ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                            : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    }`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isQuotaLoading ? '...' : formattedRemainingTime}</span>
                </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
                เข้าสัมผัสหน้ากระดานงานจริง ปฏิทินคอนเทนต์ ระบบสต็อก และการตั้งค่าบริษัทจำลองได้ทันที{' '}
                <span className="font-bold text-indigo-200">
                    (ข้อมูลในโหมดนี้จะไม่บันทึกลงฐานข้อมูลจริง และรีเซ็ตใหม่เมื่อกด Refresh)
                </span>
            </p>

            {/* Quota Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span>โควต้าเวลาทดลองเล่น (นับเฉพาะตอนเปิดใช้งาน)</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                        เหลือ {formattedRemainingTime} นาที
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className={`h-full transition-all duration-500 ${
                            isDemoExpired ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-400 to-emerald-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Role Selection Before Entering Demo */}
            {!isDemoExpired && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-300">เลือกมุมมองเริ่มต้น:</span>
                    <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                        <button
                            type="button"
                            onClick={() => switchDemoRole('ADMIN')}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                demoRole === 'ADMIN'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Admin บริษัทจำลอง</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => switchDemoRole('MEMBER')}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                demoRole === 'MEMBER'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>มุมมองพนักงาน</span>
                        </button>
                    </div>
                </div>
            )}

            {isDemoExpired ? (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center gap-2.5 text-xs font-bold text-rose-200">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-300" />
                    <span>
                        {isDemoBlocked
                            ? 'สิทธิ์การทดลองเล่นของบัญชีนี้ถูกระงับโดยผู้ดูแลระบบ'
                            : 'บัญชีนี้ใช้เวลาทดลองเล่นครบโควต้า 10 นาทีแล้ว หากต้องการขอเวลาเพิ่มสามารถแจ้งผู้ดูแลระบบได้ครับ'}
                    </span>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={isQuotaLoading}
                    onClick={() => startDemoMode()}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                        เข้าทดลองเล่นระบบจริงทันที (เหลือเวลา {formattedRemainingTime} นาที)
                    </span>
                </button>
            )}
        </div>
    );
};
