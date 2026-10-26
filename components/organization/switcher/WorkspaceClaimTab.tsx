import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import {
    staggerContainerVariants,
    staggerItemVariants
} from './workspaceSwitcherConstants';

export const WorkspaceClaimTab: React.FC = () => {
    const {
        pendingClaimTokenFromUrl,
        claimOrganizationOwnership,
        closeSwitcherModal
    } = useOrganization();

    const [claimTokenInput, setClaimTokenInput] = useState(pendingClaimTokenFromUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [claimResultMessage, setClaimResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (pendingClaimTokenFromUrl) {
            setClaimTokenInput(pendingClaimTokenFromUrl);
        }
    }, [pendingClaimTokenFromUrl]);

    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!claimTokenInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setClaimResultMessage(null);
        const res = await claimOrganizationOwnership(claimTokenInput);
        setIsSubmitting(false);
        setClaimResultMessage({
            type: res.success ? 'success' : 'error',
            text: res.message
        });
        if (res.success) {
            setClaimTokenInput('');
            closeSwitcherModal();
        }
    };

    return (
        <motion.form
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onSubmit={handleClaimSubmit}
            className="space-y-4"
        >
            {/* Hero Executive Onboarding Card */}
            <motion.div
                variants={staggerItemVariants}
                className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 border border-amber-200/90 flex items-start gap-3.5 shadow-2xs overflow-hidden"
            >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                    <Crown className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 min-w-0">
                    <p className="font-bold text-sm text-slate-900">
                        รับมอบสิทธิ์เจ้าขององค์กร (Owner Onboarding Token)
                    </p>
                    <p className="leading-relaxed">
                        สำหรับลูกค้าที่สั่งซื้อแพ็กเกจ: กรอกรหัสรับมอบองค์กร (Owner Claim Token) ที่ได้รับจากผู้ให้บริการ เพื่อเปิดใช้งานและรับสิทธิ์เป็น <span className="font-bold text-amber-700">OWNER</span> สูงสุดทันที
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-amber-200/80 text-[11px] font-semibold text-amber-800">
                            <Award className="w-3 h-3 text-amber-500" />
                            สิทธิ์สูงสุดระดับ OWNER
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-amber-200/80 text-[11px] font-semibold text-amber-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            จัดการทีมและใบอนุญาตครบวงจร
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Token Input Box */}
            <motion.div
                variants={staggerItemVariants}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
            >
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                        รหัสรับมอบองค์กร (Owner Claim Token)
                    </label>
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                        One-Time License Key
                    </span>
                </div>

                <input
                    type="text"
                    required
                    value={claimTokenInput}
                    onChange={e => setClaimTokenInput(e.target.value.toUpperCase())}
                    placeholder="เช่น COMP-8F4K92-X7M9P2"
                    className="w-full px-4 py-3.5 text-base font-mono font-bold tracking-wider uppercase border-2 border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-300 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                />

                <p className="text-[11px] text-slate-500">
                    หมายเหตุ: รหัสรับมอบองค์กรแต่ละชุดสามารถใช้ยืนยันสิทธิ์ OWNER ครั้งแรกได้เพียงครั้งเดียวเพื่อความปลอดภัยสูงสุด
                </p>
            </motion.div>

            <AnimatePresence>
                {claimResultMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                            claimResultMessage.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{claimResultMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                variants={staggerItemVariants}
                whileHover={{ scale: !claimTokenInput.trim() || isSubmitting ? 1 : 1.01, y: !claimTokenInput.trim() || isSubmitting ? 0 : -1 }}
                whileTap={{ scale: !claimTokenInput.trim() || isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={!claimTokenInput.trim() || isSubmitting}
                className="w-full py-3.5 px-5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>
                    {isSubmitting
                        ? 'กำลังยืนยันสิทธิ์เจ้าขององค์กร...'
                        : 'ยืนยันรับมอบสิทธิ์เป็น OWNER ขององค์กร'}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            </motion.button>
        </motion.form>
    );
};

