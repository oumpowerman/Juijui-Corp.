import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, KeyRound, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import {
    staggerContainerVariants,
    staggerItemVariants
} from './workspaceSwitcherConstants';

export const WorkspaceJoinTab: React.FC = () => {
    const {
        pendingInviteCodeFromUrl,
        joinOrganizationByCode,
        closeSwitcherModal
    } = useOrganization();

    const [inviteCodeInput, setInviteCodeInput] = useState(pendingInviteCodeFromUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinResultMessage, setJoinResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (pendingInviteCodeFromUrl) {
            setInviteCodeInput(pendingInviteCodeFromUrl);
        }
    }, [pendingInviteCodeFromUrl]);

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCodeInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setJoinResultMessage(null);
        const res = await joinOrganizationByCode(inviteCodeInput);
        setIsSubmitting(false);
        setJoinResultMessage({
            type: res.success ? 'success' : 'error',
            text: res.message
        });
        if (res.success && res.status === 'ACTIVE') {
            setInviteCodeInput('');
            closeSwitcherModal();
        }
    };

    return (
        <motion.form
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onSubmit={handleJoinSubmit}
            className="space-y-4"
        >
            {/* Hero Guide Card */}
            <motion.div
                variants={staggerItemVariants}
                className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 border border-indigo-100/90 flex items-start gap-3.5 shadow-2xs overflow-hidden"
            >
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                    <KeyRound className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                            เข้าร่วมทีมขององค์กรด้วยรหัสเชิญ (Staff Invite Code)
                        </p>
                    </div>
                    <p className="leading-relaxed">
                        สำหรับพนักงานในบริษัท: กรอกรหัสเชิญที่ได้รับจากผู้ดูแลองค์กรของคุณเพื่อส่งคำขอเข้าสู่พื้นที่ทำงานร่วมกัน
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="p-2 rounded-xl bg-white/90 border border-indigo-100/80 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                1
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700 truncate">
                                รับรหัสจาก Admin
                            </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 border border-indigo-100/80 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                2
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700 truncate">
                                กรอกรหัสเชิญ
                            </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 border border-indigo-100/80 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                3
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700 truncate">
                                เข้าสู่ Workspace
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Ticket Input Section */}
            <motion.div
                variants={staggerItemVariants}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
            >
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                        รหัสเชิญเข้าทีม (Invite Code)
                    </label>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        ตรวจสอบสิทธิ์อัตโนมัติ
                    </span>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        required
                        value={inviteCodeInput}
                        onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                        placeholder="เช่น JUIJUI-HQ หรือ ORG-8F4K92"
                        className="w-full px-4 py-3.5 text-base font-mono font-bold tracking-wider uppercase border-2 border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                    {inviteCodeInput.trim() && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/80">
                            พร้อมส่งคำขอ
                        </span>
                    )}
                </div>

                <p className="text-[11px] text-slate-500">
                    เมื่อส่งคำขอแล้ว ผู้ดูแลองค์กร (Owner / Admin) จะสามารถกดอนุมัติคุณเข้าสู่ทีมได้จากแท็บ &ldquo;สมาชิก&rdquo;
                </p>
            </motion.div>

            <AnimatePresence>
                {joinResultMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                            joinResultMessage.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{joinResultMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                variants={staggerItemVariants}
                whileHover={{ scale: !inviteCodeInput.trim() || isSubmitting ? 1 : 1.01, y: !inviteCodeInput.trim() || isSubmitting ? 0 : -1 }}
                whileTap={{ scale: !inviteCodeInput.trim() || isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={!inviteCodeInput.trim() || isSubmitting}
                className="w-full py-3.5 px-5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังตรวจสอบรหัสเชิญ...' : 'ส่งคำขอเข้าร่วมองค์กร'}</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            </motion.button>
        </motion.form>
    );
};

