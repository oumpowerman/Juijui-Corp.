import React, { useState } from 'react';
import { Bell, AlertTriangle, Monitor, Play, Sparkles, Settings2, Users, ShieldAlert, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkTimeConfig } from '../WorkTimeCard';
import { supabase } from '../../../../../../lib/supabase';
import { getActiveOrgIdSync } from '../../../../../../lib/tenantStorage';

interface LateAlertCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const LateAlertCard: React.FC<LateAlertCardProps> = ({ tempTimeConfig, setTempTimeConfig }) => {
    const [simB, setSimB] = useState({ active: false, messageSent: false, time: '' });
    const [pushTesting, setPushTesting] = useState(false);
    const [pushFeedback, setPushFeedback] = useState<string | null>(null);

    const isProactive = tempTimeConfig.lateAlertMode === 'BEFORE_LIMIT';
    const offsetVal = parseInt(tempTimeConfig.lateAlertOffset || '5', 10) || 5;

    const effectiveStartTime = (() => {
        const shiftsEnabled = tempTimeConfig.multipleShiftsEnabled === 'true';
        if (shiftsEnabled && tempTimeConfig.multipleShiftsList) {
            const list = tempTimeConfig.multipleShiftsList
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (list.length > 0) {
                const sorted = [...list].sort((a, b) => {
                    const [ha, ma] = a.split(':').map(Number);
                    const [hb, mb] = b.split(':').map(Number);
                    return (hb * 60 + mb) - (ha * 60 + ma);
                });
                return sorted[0];
            }
        }
        return tempTimeConfig.start || '10:00';
    })();

    const graceLimitTime = (() => {
        try {
            const [h, m] = effectiveStartTime.split(':').map(Number);
            const buf = parseInt(tempTimeConfig.buffer, 10) || 0;
            const date = new Date();
            date.setHours(h, m + buf);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
        } catch {
            return '10:15 น.';
        }
    })();

    const planBTargetTime = (() => {
        try {
            const [h, m] = effectiveStartTime.split(':').map(Number);
            const buf = parseInt(tempTimeConfig.buffer, 10) || 0;
            const date = new Date();
            if (isProactive) {
                date.setHours(h, m + buf - offsetVal);
            } else {
                date.setHours(h, m + buf + 1);
            }
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
        } catch {
            return isProactive ? '10:10 น.' : '10:16 น.';
        }
    })();

    const planBTitleText = isProactive
        ? '⏰ รีบลงเวลางานน้า (ใกล้หมดเวลาผ่อนปรน)'
        : '⏰ ลืมลงเวลาทำงานหรือเปล่าเอ่ย?';

    const planBMessageText = (() => {
        if (isProactive) {
            return `อีก ${offsetVal} นาทีจะสิ้นสุดช่วงผ่อนปรนลงเวลาเข้างานแล้วนะคะ รีบเช็คอินก่อน ${graceLimitTime} น้า~ 😊`;
        } else {
            return `ระบบเลยกำหนดเวลาเช็คอินแล้วค่ะ (${graceLimitTime}) หากลืมลงเวลางาน กรุณาลงเวลาด่วนนะคะ! 😊`;
        }
    })();

    const triggerPlanBSimulator = () => {
        setSimB({ active: true, messageSent: false, time: '' });
        
        setTimeout(() => {
            setSimB({ active: true, messageSent: true, time: planBTargetTime.replace(' น.', '') });
        }, 1000);
    };

    const triggerRealMobilePushTest = async () => {
        setPushTesting(true);
        setPushFeedback(null);
        triggerPlanBSimulator();

        try {
            const { data: authData } = await supabase.auth.getUser();
            const currentUserId = authData?.user?.id;
            const orgId = getActiveOrgIdSync();

            let subscriptionJson: any = undefined;
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const reg = await navigator.serviceWorker.ready;
                    const sub = await reg.pushManager.getSubscription();
                    if (sub) subscriptionJson = sub.toJSON();
                } catch {
                    // Fallback to server-side saved subscription
                }
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (currentUserId) headers['x-user-id'] = currentUserId;
            if (orgId) headers['x-org-id'] = orgId;

            const res = await fetch('/api/push/test', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: currentUserId,
                    subscription: subscriptionJson,
                    title: planBTitleText,
                    message: planBMessageText,
                    url: '/?view=ATTENDANCE',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setPushFeedback('ส่งแจ้งเตือนทดสอบเข้าโทรศัพท์มือถือของคุณแล้ว (เปิดแจ้งเตือนได้แม้ปิดแอป)');
            } else {
                setPushFeedback('จำลองสำเร็จ (หากต้องการให้เด้งเข้ามือถือ กรุณาเปิดรับการแจ้งเตือนที่ไอคอนระฆังด้านบน)');
            }
        } catch {
            setPushFeedback('จำลองข้อความสำเร็จ');
        } finally {
            setPushTesting(false);
            setTimeout(() => setPushFeedback(null), 6000);
        }
    };

    return (
        <div id="sim-card-b" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50/90 text-amber-800 border border-amber-200/70">
                        <Bell className="w-3.5 h-3.5 text-amber-600 animate-swing" /> 📋 แผน A (Late Alert • LINE & Web Push)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50/80 px-3 py-1 rounded-xl border border-emerald-200/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        ทำงานเบื้องหลังแม้ปิดแอป
                    </span>
                </div>
                
                <h4 className="font-bold text-stone-800 text-lg tracking-tight mt-3 mb-1.5">
                    เตือนสติเมื่อลืมเข้างานอัตโนมัติ (LINE + มือถือ)
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    ระบบอัจฉริยะตรวจสอบรายชื่อคนที่ยังไม่เช็คอินตามเวลาจริง และยิงแจ้งเตือนปลุกเข้าทั้ง LINE และ Web Push บนจอมือถือของพนักงานคนนั้นโดยตรงแม้ไม่ได้เปิดแอปค้างไว้
                </p>

                {/* 1. Timing Mode Selector */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-bold text-stone-700 tracking-tight flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5 text-amber-600" /> รูปแบบและเวลาการแจ้งเตือน
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertMode: 'AFTER_LIMIT' }))}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 outline-none ${
                                !isProactive
                                    ? 'bg-amber-50/70 border-amber-300 text-stone-800 shadow-sm ring-2 ring-amber-100/60'
                                    : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50/50'
                            }`}
                        >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${!isProactive ? 'bg-amber-600' : 'bg-stone-400'}`}></span>
                                โหมดเดิม (Standard)
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium leading-tight">เตือนหลังเวลาสายจริง 1 นาที</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertMode: 'BEFORE_LIMIT' }))}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 outline-none ${
                                isProactive
                                    ? 'bg-amber-50/70 border-amber-300 text-stone-800 shadow-sm ring-2 ring-amber-100/60'
                                    : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50/50'
                            }`}
                        >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isProactive ? 'bg-amber-600' : 'bg-stone-400'}`}></span>
                                โหมดเซฟ (Proactive)
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium leading-tight">เตือนภัยล่วงหน้าก่อนสายจริง</span>
                        </button>
                    </div>
                </div>

                {/* 2. Dynamic Offset Input Control */}
                <AnimatePresence>
                    {isProactive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-3"
                        >
                            <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-stone-700">⏱️ แจ้งเตือนล่วงหน้า</label>
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">สิ้นสุดสิทธิ์ผ่อนปรน {graceLimitTime}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={tempTimeConfig.lateAlertOffset || '5'}
                                        onChange={(e) => setTempTimeConfig(prev => ({ ...prev, lateAlertOffset: e.target.value }))}
                                        className="w-full pl-4 pr-16 py-2.5 bg-white border border-stone-200 rounded-xl font-bold text-stone-800 text-xs focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all shadow-sm"
                                        placeholder="5"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200/60 shadow-sm">
                                        Min
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {['2', '5', '10', '15'].map((min) => (
                                        <button
                                            key={min}
                                            type="button"
                                            onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertOffset: min }))}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                                                tempTimeConfig.lateAlertOffset === min
                                                    ? 'bg-amber-600 text-white shadow-sm'
                                                    : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
                                            }`}
                                        >
                                            ก่อน {min} นาที
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 🎯 กลุ่มเป้าหมายที่รับการแจ้งเตือน */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-bold text-stone-700 tracking-tight flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" /> กลุ่มเป้าหมายที่รับการแจ้งเตือนสาย
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100/70 border border-stone-200/60 rounded-2xl">
                        {[
                            { value: 'MEMBER', label: 'เฉพาะทั่วไป', desc: 'Member', icon: Users },
                            { value: 'ADMIN', label: 'เฉพาะผู้ดูแล', desc: 'Admin', icon: ShieldAlert },
                            { value: 'BOTH', label: 'ทั้งหมด', desc: 'Both', icon: Sparkles }
                        ].map((role) => {
                            const RoleIcon = role.icon;
                            const isActive = (tempTimeConfig.lateAlertTargetRoles || 'BOTH') === role.value;
                            return (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertTargetRoles: role.value }))}
                                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all outline-none relative overflow-hidden select-none cursor-pointer ${
                                        isActive
                                            ? 'bg-white text-amber-800 shadow-sm border-b-2 border-amber-500'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-white/60'
                                    }`}
                                >
                                    <RoleIcon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                                    <span className="text-[10px] font-bold tracking-tight">{role.label}</span>
                                    <span className="text-[8px] font-semibold opacity-60 leading-none">{role.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* 3. Interactive Visual Timeline / Processing Badge */}
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50/70 to-stone-50 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs font-bold text-stone-800 shadow-sm">
                    <span className="flex items-center gap-1.5">⏰ เวลาประมวลผลระบบวันนี้:</span>
                    <motion.span 
                        key={planBTargetTime}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white border border-amber-200/70 px-3 py-1.5 rounded-xl text-amber-800 shadow-sm tracking-wide font-bold flex flex-col items-end"
                    >
                        <span>{planBTargetTime}</span>
                        <span className="text-[8px] font-medium text-stone-400 mt-0.5">
                            {isProactive ? `(ก่อนสิ้นสุดสิทธิ์ ${offsetVal} นาที)` : '(หลังสิ้นสุดสิทธิ์ 1 นาที)'}
                        </span>
                    </motion.span>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-stone-50/80 rounded-2xl p-3.5 border border-stone-200/80 text-stone-800 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-100/20 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-200/70 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                        <Monitor className="w-4 h-4 text-amber-600" /> จำลองแจ้งเตือน (LINE + มือถือ)
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={triggerPlanBSimulator}
                            className="px-3 py-1.5 bg-white text-stone-700 border border-stone-200 rounded-xl text-[11px] font-bold hover:bg-stone-100/80 flex items-center gap-1 transition-all shadow-sm"
                        >
                            <Play className="w-3 h-3 fill-current text-amber-600" /> จำลองภาพ
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            disabled={pushTesting}
                            onClick={triggerRealMobilePushTest}
                            className="px-3 py-1.5 bg-amber-100/90 text-amber-900 border border-amber-300/80 rounded-xl text-[11px] font-bold hover:bg-amber-200/70 flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
                        >
                            <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                            {pushTesting ? 'กำลังส่ง...' : 'ยิงเข้ามือถือจริง'}
                        </motion.button>
                    </div>
                </div>

                {pushFeedback && (
                    <div className="mb-2.5 px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{pushFeedback}</span>
                    </div>
                )}

                <div className={`relative h-[200px] bg-gradient-to-b from-amber-50/40 to-stone-100/50 rounded-xl p-3.5 text-stone-800 border border-stone-200/70 flex flex-col ${simB.active ? 'justify-start pt-3.5' : 'justify-center'} overflow-y-auto`}>
                    <AnimatePresence mode="wait">
                        {simB.active ? (
                            <div className="space-y-3 w-full">
                                <div className="text-[10.5px] text-center text-stone-600 font-bold bg-white/90 rounded-lg py-0.5 px-2.5 max-w-[145px] mx-auto border border-stone-200/70 shadow-sm">
                                    วันนี้, {simB.time || planBTargetTime.replace(' น.', '')} น.
                                </div>
                                
                                {!simB.messageSent ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-4 text-xs text-stone-600 font-bold"
                                    >
                                        <div className="flex gap-1.5 mb-2">
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                        <span className="text-[11px] font-bold text-stone-600 tracking-wide">กำลังตรวจสอบคนที่ยังไม่ได้เข้างาน...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="message"
                                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="flex items-start gap-2.5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-amber-200">
                                            HR
                                        </div>
                                        <div className={`relative bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[85%] border ${isProactive ? 'border-amber-200/80' : 'border-rose-200/80'}`}>
                                            <div className={`font-bold flex items-center gap-1.5 mb-1 text-[11px] ${isProactive ? 'text-amber-700' : 'text-rose-700'}`}>
                                                <AlertTriangle className={`w-3.5 h-3.5 animate-pulse shrink-0 ${isProactive ? 'text-amber-500' : 'text-rose-500'}`} /> 
                                                {isProactive ? 'แจ้งเตือนสิทธิ์ผ่อนปรนเข้างาน!' : 'คุณลืมลงเวลางานหรือเปล่าคะ?'}
                                            </div>
                                            <p className="text-stone-700 font-semibold text-[10.5px] leading-relaxed pr-3">
                                                {planBMessageText}
                                            </p>
                                            <div className="mt-1.5 pt-1 border-t border-stone-100 flex items-center justify-between text-[9px] text-stone-400 font-semibold">
                                                <span>📱 เด้งเข้าทั้ง LINE & Web Push มือถือ</span>
                                                <span>{simB.time} น.</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3.5 text-xs text-stone-500 font-semibold"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-200/70 mb-1.5 text-amber-600">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-stone-500 text-center">คลิก "ยิงเข้ามือถือจริง" เพื่อทดสอบแจ้งเตือนเข้าโทรศัพท์ของคุณ</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default LateAlertCard;
