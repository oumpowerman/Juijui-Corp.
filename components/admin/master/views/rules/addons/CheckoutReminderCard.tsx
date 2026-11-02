import React, { useState } from 'react';
import { BellRing, Monitor, Play, Sparkles, Settings2, Users, ShieldAlert, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkTimeConfig } from '../WorkTimeCard';
import { supabase } from '../../../../../../lib/supabase';
import { getActiveOrgIdSync } from '../../../../../../lib/tenantStorage';

interface CheckoutReminderCardProps {
    tempTimeConfig: WorkTimeConfig & {
        checkoutAlertEnabled?: string;
        checkoutAlertMode?: string;
        checkoutAlertOffset?: string;
        checkoutAlertTargetRoles?: string;
    };
    setTempTimeConfig: React.Dispatch<React.SetStateAction<any>>;
}

const CheckoutReminderCard: React.FC<CheckoutReminderCardProps> = ({ tempTimeConfig, setTempTimeConfig }) => {
    const [simOut, setSimOut] = useState({ active: false, messageSent: false, time: '' });
    const [selectedSimShiftIdx, setSelectedSimShiftIdx] = useState<number>(0);
    const [pushTesting, setPushTesting] = useState(false);
    const [pushFeedback, setPushFeedback] = useState<string | null>(null);

    const isEnabled = (tempTimeConfig.checkoutAlertEnabled || 'true') === 'true';
    const isProactive = tempTimeConfig.checkoutAlertMode === 'BEFORE_LIMIT';
    const offsetVal = parseInt(tempTimeConfig.checkoutAlertOffset || '5', 10) || 5;
    const targetRoles = tempTimeConfig.checkoutAlertTargetRoles || 'BOTH';

    const endTime = tempTimeConfig.end || '19:00';
    const shiftsEnabled = tempTimeConfig.multipleShiftsEnabled === 'true';

    const getShiftDetails = (shiftStart: string) => {
        try {
            const [sh, sm] = shiftStart.split(':').map(Number);
            const minH = parseInt(tempTimeConfig.minHours || '9', 10);
            
            const endHour = (sh + minH) % 24;
            const endMin = sm;
            const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
            
            const alertDate = new Date();
            if (isProactive) {
                alertDate.setHours(endHour, endMin - offsetVal);
            } else {
                alertDate.setHours(endHour, endMin + offsetVal);
            }
            const alertTimeStr = `${String(alertDate.getHours()).padStart(2, '0')}:${String(alertDate.getMinutes()).padStart(2, '0')}`;
            
            return {
                start: shiftStart,
                end: endTimeStr,
                alert: alertTimeStr
            };
        } catch {
            return {
                start: shiftStart,
                end: '19:00',
                alert: isProactive ? '18:55' : '19:05'
            };
        }
    };

    const shiftsList = tempTimeConfig.multipleShiftsList
        ? tempTimeConfig.multipleShiftsList.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    const evaluatedShifts = shiftsList.map(getShiftDetails);

    const checkoutTargetTime = (() => {
        if (shiftsEnabled && evaluatedShifts.length > 0) {
            const first = evaluatedShifts[0];
            const last = evaluatedShifts[evaluatedShifts.length - 1];
            if (first.alert === last.alert) {
                return `${first.alert} น.`;
            }
            return `${first.alert} - ${last.alert} น.`;
        }
        try {
            const [h, m] = endTime.split(':').map(Number);
            const date = new Date();
            if (isProactive) {
                date.setHours(h, m - offsetVal);
            } else {
                date.setHours(h, m + offsetVal);
            }
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
        } catch {
            return isProactive ? '18:55 น.' : '19:05 น.';
        }
    })();

    const currentSimShift = (shiftsEnabled && evaluatedShifts.length > 0)
        ? (evaluatedShifts[selectedSimShiftIdx] || evaluatedShifts[0])
        : { start: tempTimeConfig.start || '10:00', end: endTime, alert: checkoutTargetTime.replace(' น.', '') };

    const checkoutTitleText = isProactive
        ? '⏰ ใกล้เวลาเลิกงานแล้วน้า อย่าลืมตอกบัตรออกนะคะ'
        : '⏰ เลิกงานแล้วนะคะ อย่าลืมตอกบัตรออกงานน้า';

    const checkoutMessageText = (() => {
        const targetEnd = currentSimShift.end;
        if (isProactive) {
            return `อีก ${offsetVal} นาทีจะถึงเวลาเลิกงานแล้วนะคะ (${targetEnd}) อย่าลืมลงเวลาออกงาน (Check-Out) นะคะ เพื่อเซฟคะแนนและรักษาพลังชีวิต (HP) ของคุณค่ะ 😊`;
        } else {
            return `เลยเวลาเลิกงานของวันนี้แล้วค่ะ (${targetEnd}) ระบบยังไม่พบบันทึกเวลาออกงานของคุณ อย่าลืมเข้าแอปมาลงเวลาออกงาน (Check-Out) เพื่อความเรียบร้อยและรักษา HP กันน้า~ 💖`;
        }
    })();

    const triggerSimulator = () => {
        setSimOut({ active: true, messageSent: false, time: '' });
        
        setTimeout(() => {
            setSimOut({ active: true, messageSent: true, time: currentSimShift.alert });
        }, 1000);
    };

    const triggerRealMobilePushTest = async () => {
        setPushTesting(true);
        setPushFeedback(null);
        triggerSimulator();

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
                    title: checkoutTitleText,
                    message: checkoutMessageText,
                    url: '/?view=ATTENDANCE',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setPushFeedback('ส่งแจ้งเตือนตอกบัตรออกงานเข้าโทรศัพท์มือถือของคุณแล้ว');
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
        <div id="sim-card-checkout" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50/90 text-orange-800 border border-orange-200/70">
                        <BellRing className="w-3.5 h-3.5 text-orange-600 animate-bounce" /> 📋 แผน E (Checkout Reminder • LINE & Push)
                    </span>
                    <button
                        type="button"
                        onClick={() => setTempTimeConfig((prev: any) => ({
                            ...prev,
                            checkoutAlertEnabled: isEnabled ? 'false' : 'true'
                        }))}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border transition-all ${
                            isEnabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </button>
                </div>
                
                <h4 className="font-bold text-stone-800 text-lg tracking-tight mt-3 mb-1.5">
                    เตือนสติเมื่อลืมตอกบัตรออกงาน (LINE + มือถือ)
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    ระบบอบอุ่นช่วยเตือนพนักงานที่เช็คอินแล้วแต่ยังไม่ลงเวลาออกงาน โดยส่งแจ้งเตือนเข้าทั้ง LINE และ Web Push บนโทรศัพท์มือถือแม้ปิดหน้าจอแอปอยู่
                </p>

                {shiftsEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-amber-50/80 border border-amber-200/70 text-amber-900 rounded-2xl flex items-start gap-2.5 text-xs font-medium leading-relaxed shadow-sm"
                    >
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                            <span className="font-bold block text-amber-950 text-[12px] mb-0.5">💡 ระบบเปิดใช้งานหลายกะ (Multiple Shifts Mode)</span>
                            <p className="text-amber-900/90 text-[11px] font-semibold leading-relaxed">
                                ระบบเปิดใช้งานระบบเตือนสติแบบ Dynamic ตามรายกะการทำงาน โดยจะแจ้งเตือนอิงตามเวลาเลิกงานของแต่ละกะ ({tempTimeConfig.minHours || '9'} ชม. จากเวลาเริ่มกะ) แทนการอิงเวลาเลิกงานปกติแบบคงที่
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* 1. Timing Mode Selector */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-bold text-stone-700 tracking-tight flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5 text-orange-600" /> รูปแบบการแจ้งเตือนเวลาออกงาน
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            disabled={!isEnabled}
                            onClick={() => setTempTimeConfig((prev: any) => ({ ...prev, checkoutAlertMode: 'AFTER_LIMIT' }))}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 outline-none ${
                                !isEnabled ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-100' :
                                !isProactive
                                    ? 'bg-orange-50/70 border-orange-300 text-stone-800 shadow-sm ring-2 ring-orange-100/60'
                                    : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50/50'
                            }`}
                        >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${!isProactive && isEnabled ? 'bg-orange-600' : 'bg-stone-400'}`}></span>
                                กันลืมย้อนหลัง (Standard)
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium leading-tight">เตือนหลังเวลาเลิกงาน</span>
                        </button>

                        <button
                            type="button"
                            disabled={!isEnabled}
                            onClick={() => setTempTimeConfig((prev: any) => ({ ...prev, checkoutAlertMode: 'BEFORE_LIMIT' }))}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 outline-none ${
                                !isEnabled ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-100' :
                                isProactive
                                    ? 'bg-orange-50/70 border-orange-300 text-stone-800 shadow-sm ring-2 ring-orange-100/60'
                                    : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50/50'
                            }`}
                        >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isProactive && isEnabled ? 'bg-orange-600' : 'bg-stone-400'}`}></span>
                                เซฟล่วงหน้า (Proactive)
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium leading-tight">เตือนภัยก่อนเวลาเลิกงาน</span>
                        </button>
                    </div>
                </div>

                {/* 2. Dynamic Offset Input Control */}
                <div className="overflow-hidden mt-3">
                    <div className={`p-3 rounded-2xl border transition-all ${
                        isEnabled ? 'bg-stone-50/80 border-stone-200/70' : 'bg-stone-50/40 border-stone-100/50 opacity-50'
                    } space-y-3`}>
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-stone-700">
                                {isProactive ? '⏱️ แจ้งเตือนล่วงหน้าก่อนเลิกงาน' : '⏱️ แจ้งเตือนย้อนหลังหลังเลิกงาน'}
                            </label>
                            <span className="text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                                {shiftsEnabled ? `กะงานขั้นต่ำ ${tempTimeConfig.minHours || '9'} ชม.` : `เลิกงานปกติ ${endTime} น.`}
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="180"
                                disabled={!isEnabled}
                                value={tempTimeConfig.checkoutAlertOffset || '5'}
                                onChange={(e) => setTempTimeConfig((prev: any) => ({ ...prev, checkoutAlertOffset: e.target.value }))}
                                className="w-full pl-4 pr-16 py-2.5 bg-white border border-stone-200 rounded-xl font-bold text-stone-800 text-xs focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition-all shadow-sm disabled:cursor-not-allowed"
                                placeholder="5"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200/60 shadow-sm">
                                Min
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['2', '5', '10', '15', '30'].map((min) => (
                                <button
                                    key={min}
                                    type="button"
                                    disabled={!isEnabled}
                                    onClick={() => setTempTimeConfig((prev: any) => ({ ...prev, checkoutAlertOffset: min }))}
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                                        !isEnabled ? 'cursor-not-allowed opacity-50' :
                                        tempTimeConfig.checkoutAlertOffset === min
                                            ? 'bg-orange-600 text-white shadow-sm'
                                            : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
                                    }`}
                                >
                                    {isProactive ? `ก่อน ${min} นาที` : `หลัง ${min} นาที`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🎯 กลุ่มเป้าหมายที่รับการแจ้งเตือน */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-bold text-stone-700 tracking-tight flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-600" /> กลุ่มเป้าหมายที่ต้องการส่งเตือน
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100/70 border border-stone-200/60 rounded-2xl">
                        {[
                            { value: 'MEMBER', label: 'เฉพาะทั่วไป', desc: 'Member', icon: Users },
                            { value: 'ADMIN', label: 'เฉพาะผู้ดูแล', desc: 'Admin', icon: ShieldAlert },
                            { value: 'BOTH', label: 'ทั้งหมด', desc: 'Both', icon: Sparkles }
                        ].map((role) => {
                            const RoleIcon = role.icon;
                            const isActive = targetRoles === role.value;
                            return (
                                <button
                                    key={role.value}
                                    type="button"
                                    disabled={!isEnabled}
                                    onClick={() => setTempTimeConfig((prev: any) => ({ ...prev, checkoutAlertTargetRoles: role.value }))}
                                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all outline-none relative overflow-hidden select-none cursor-pointer disabled:cursor-not-allowed ${
                                        !isEnabled ? 'opacity-40' :
                                        isActive
                                            ? 'bg-white text-orange-800 shadow-sm border-b-2 border-orange-500'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-white/60'
                                    }`}
                                >
                                    <RoleIcon className={`w-3.5 h-3.5 ${isActive && isEnabled ? 'text-orange-600' : 'text-stone-400'}`} />
                                    <span className="text-[10px] font-bold tracking-tight">{role.label}</span>
                                    <span className="text-[8px] font-semibold opacity-60 leading-none">{role.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* 3. Interactive Visual Timeline / Processing Badge */}
                {shiftsEnabled && evaluatedShifts.length > 0 ? (
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50/70 to-stone-50 rounded-2xl border border-orange-200/60 space-y-2 text-xs font-bold text-stone-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">⏰ เวลาแจ้งเตือนแบบ Dynamic ตามรายกะ:</span>
                            <span className="text-[9px] font-bold text-orange-800 bg-white px-2 py-0.5 rounded-md border border-orange-200/60">
                                {evaluatedShifts.length} กะ (ทำงาน {tempTimeConfig.minHours || '9'} ชม.)
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {evaluatedShifts.map((sh, idx) => (
                                <div key={idx} className="bg-white border border-stone-200/70 p-2 rounded-xl flex items-center justify-between text-[11px] shadow-sm">
                                    <span className="text-stone-700 font-bold">กะ {sh.start}</span>
                                    <span className="text-stone-400 font-medium">→ เลิก {sh.end}</span>
                                    <span className="bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded border border-orange-200/60">
                                        เตือน {sh.alert} น.
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50/70 to-stone-50 rounded-2xl border border-orange-200/60 flex items-center justify-between text-xs font-bold text-stone-800 shadow-sm">
                        <span className="flex items-center gap-1.5">⏰ เวลาแจ้งเตือนบนระบบ:</span>
                        <motion.span 
                            key={checkoutTargetTime}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white border border-orange-200/70 px-3 py-1.5 rounded-xl text-orange-800 shadow-sm tracking-wide font-bold flex flex-col items-end"
                        >
                            <span>{checkoutTargetTime}</span>
                            <span className="text-[8px] font-medium text-stone-400 mt-0.5">
                                {isProactive ? `(ก่อนเลิกงาน ${offsetVal} นาที)` : `(หลังเลิกงาน ${offsetVal} นาที)`}
                            </span>
                        </motion.span>
                    </div>
                )}
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-stone-50/80 rounded-2xl p-3.5 border border-stone-200/80 text-stone-800 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-100/20 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex flex-col gap-3 relative z-10 mb-3 pb-2 border-b border-stone-200/70">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                            <Monitor className="w-4 h-4 text-orange-600" /> จำลองแจ้งเตือนเลิกงาน (LINE + มือถือ)
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={triggerSimulator}
                                disabled={!isEnabled}
                                className="px-3 py-1.5 bg-white text-stone-700 border border-stone-200 rounded-xl text-[11px] font-bold hover:bg-stone-100/80 flex items-center gap-1 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Play className="w-3 h-3 fill-current text-orange-600" /> จำลองภาพ
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={triggerRealMobilePushTest}
                                disabled={!isEnabled || pushTesting}
                                className="px-3 py-1.5 bg-orange-100/90 text-orange-900 border border-orange-300/80 rounded-xl text-[11px] font-bold hover:bg-orange-200/70 flex items-center gap-1 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Smartphone className="w-3.5 h-3.5 text-orange-700" />
                                {pushTesting ? 'กำลังส่ง...' : 'ยิงเข้ามือถือจริง'}
                            </motion.button>
                        </div>
                    </div>

                    {pushFeedback && (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{pushFeedback}</span>
                        </div>
                    )}

                    {shiftsEnabled && evaluatedShifts.length > 0 && (
                        <div className="bg-white/90 p-2 rounded-xl border border-stone-200/60">
                            <label className="text-[10px] font-bold text-stone-600 block mb-1">เลือกกะในการทดสอบจำลองส่งแจ้งเตือน:</label>
                            <div className="flex flex-wrap gap-1">
                                {evaluatedShifts.map((sh, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={simOut.active && !simOut.messageSent}
                                        onClick={() => {
                                            setSelectedSimShiftIdx(idx);
                                            if (simOut.active && simOut.messageSent) {
                                                setSimOut(prev => ({ ...prev, time: sh.alert }));
                                            }
                                        }}
                                        className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                            selectedSimShiftIdx === idx
                                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                        }`}
                                    >
                                        กะ {sh.start} (เลิก {sh.end})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`relative h-[200px] bg-gradient-to-b from-orange-50/40 to-stone-100/50 rounded-xl p-3.5 text-stone-800 border border-stone-200/70 flex flex-col ${simOut.active ? 'justify-start pt-3.5' : 'justify-center'} overflow-y-auto`}>
                    <AnimatePresence mode="wait">
                        {simOut.active ? (
                            <div className="space-y-3 w-full">
                                <div className="text-[10.5px] text-center text-stone-600 font-bold bg-white/90 rounded-lg py-0.5 px-2.5 max-w-[145px] mx-auto border border-stone-200/70 shadow-sm">
                                    วันนี้, {simOut.time || currentSimShift.alert} น.
                                </div>
                                
                                {!simOut.messageSent ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-4 text-xs text-stone-600 font-bold"
                                    >
                                        <div className="flex gap-1.5 mb-2">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                        <span className="text-[11px] font-bold text-stone-600 tracking-wide">กำลังคำนวณรายชื่อและส่งแจ้งเตือน...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="message"
                                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="flex items-start gap-2.5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-orange-200">
                                            HR
                                        </div>
                                        <div className={`relative bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[85%] border ${isProactive ? 'border-amber-200/80' : 'border-orange-200/80'}`}>
                                            <div className={`font-bold flex items-center gap-1.5 mb-1 text-[11px] ${isProactive ? 'text-amber-700' : 'text-orange-700'}`}>
                                                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isProactive ? 'text-amber-500 animate-pulse' : 'text-orange-500'}`} /> 
                                                {isProactive ? 'แจ้งเตือนเตรียมเลิกงาน!' : 'แจ้งเตือนเวลาเลิกงานประจำวัน!'}
                                            </div>
                                            <p className="text-stone-700 font-semibold text-[10.5px] leading-relaxed pr-3">
                                                {checkoutMessageText}
                                            </p>
                                            <div className="mt-1.5 pt-1 border-t border-stone-100 flex items-center justify-between text-[9px] text-stone-400 font-semibold">
                                                <span>📱 เด้งเข้าทั้ง LINE & Web Push มือถือ</span>
                                                <span>{simOut.time} น.</span>
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
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-200/70 mb-1.5 text-orange-600">
                                    <BellRing className="w-5 h-5 animate-pulse" />
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

export default CheckoutReminderCard;
