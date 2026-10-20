import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Lock,
    RefreshCw,
    ShieldCheck,
    X
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { format } from 'date-fns';

const modalVariants: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }
    },
    exit: {
        opacity: 0,
        y: 16,
        scale: 0.98,
        transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const }
    }
};

export const SubscriptionGateOverlay: React.FC = () => {
    const {
        currentOrg,
        myOrganizations,
        isSuperAdmin,
        computedSubscriptionStatus,
        daysUntilExpiry,
        graceDaysRemaining,
        isSubscriptionLocked,
        invoices,
        openSwitcherModal,
        submitRenewalRequest,
        renewOrganizationSubscription
    } = useOrganization();

    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [superAdminBypass, setSuperAdminBypass] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [paymentNote, setPaymentNote] = useState('');
    const [slipReference, setSlipReference] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const planPreset = SAAS_PLAN_PRESETS[currentOrg.planTier || 'PRO'] || SAAS_PLAN_PRESETS.PRO;
    const selectedPrice = selectedCycle === 'YEARLY' ? planPreset.yearlyPriceTHB : planPreset.monthlyPriceTHB;
    const orgInvoices = invoices.filter(inv => inv.orgId === currentOrg.id);
    const hasPendingRenewal = orgInvoices.some(inv => inv.paymentStatus === 'PENDING');

    const handleRenewalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        const ok = await submitRenewalRequest({
            billingCycle: selectedCycle,
            amount: selectedPrice,
            note: paymentNote.trim() || `แจ้งชำระเงินต่ออายุแพ็กเกจ ${planPreset.name} (${selectedCycle})`,
            slipUrl: slipReference.trim() || undefined
        });
        setIsSubmitting(false);
        if (ok) {
            setPaymentNote('');
            setSlipReference('');
            setIsBillingModalOpen(false);
        }
    };

    const showWarningBanner =
        !isSubscriptionLocked &&
        (computedSubscriptionStatus === 'GRACE_PERIOD' ||
            (daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7));

    // 1. Full-Screen Subscription Gate when EXPIRED or SUSPENDED
    if (isSubscriptionLocked && !superAdminBypass) {
        return (
            <div className="fixed inset-0 z-[95] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
                    {/* Header */}
                    <div className="px-6 py-5 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/60 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {computedSubscriptionStatus === 'SUSPENDED'
                                            ? 'องค์กรนี้ถูกระงับการใช้งานชั่วคราว (Suspended)'
                                            : 'แพ็กเกจขององค์กรหมดอายุการใช้งาน (Subscription Expired)'}
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                    องค์กร <span className="font-bold text-slate-900 dark:text-white">{currentOrg.name}</span> · แพ็กเกจ {planPreset.name}
                                    {currentOrg.expiresAt && (
                                        <span className="font-mono tabular-nums">
                                            {' '}· ครบกำหนดเมื่อ {format(new Date(currentOrg.expiresAt), 'dd/MM/yyyy')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {myOrganizations.length > 1 && (
                            <button
                                type="button"
                                onClick={() => openSwitcherModal('SWITCH')}
                                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                สลับองค์กรอื่น
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto overscroll-contain">
                        {isSuperAdmin && (
                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                        คุณกำลังเข้าชมด้วยสิทธิ์ Super Admin
                                    </p>
                                    <p className="text-[11px] text-indigo-700">
                                        สามารถกดต่ออายุให้ลูกค้าทันที หรือข้ามหน้าจอล็อกเพื่อเข้าไปตั้งค่าภายในองค์กรได้
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => renewOrganizationSubscription(currentOrg.id, 'MONTHLY')}
                                        className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                                    >
                                        + ต่ออายุ 1 เดือนทันที
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSuperAdminBypass(true)}
                                        className="px-3 py-2 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors"
                                    >
                                        เข้าใช้งาน (Bypass)
                                    </button>
                                </div>
                            </div>
                        )}

                        {hasPendingRenewal ? (
                            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <span>ส่งคำขอแจ้งชำระเงินต่ออายุแล้ว (รอผู้ดูแลระบบตรวจสอบ)</span>
                                </div>
                                <p className="text-xs text-amber-700">
                                    ระบบได้รับรายการแจ้งชำระเงินขององค์กรคุณเรียบร้อยแล้ว เมื่อผู้ดูแลระบบกดอนุมัติ องค์กรของคุณจะกลับมาใช้งานได้ตามปกติทันทีพร้อมข้อมูลเดิมครบถ้วน
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleRenewalSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCycle('MONTHLY')}
                                        className={`p-4 rounded-2xl border text-left transition-all ${
                                            selectedCycle === 'MONTHLY'
                                                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <p className="text-xs font-bold text-slate-500">ต่ออายุรายเดือน (30 วัน)</p>
                                        <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                                            ฿{planPreset.monthlyPriceTHB.toLocaleString()}
                                            <span className="text-xs font-normal text-slate-500"> / เดือน</span>
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedCycle('YEARLY')}
                                        className={`p-4 rounded-2xl border text-left transition-all ${
                                            selectedCycle === 'YEARLY'
                                                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <p className="text-xs font-bold text-emerald-600">ต่ออายุรายปี (365 วัน · ประหยัด 2 เดือน)</p>
                                        <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                                            ฿{planPreset.yearlyPriceTHB.toLocaleString()}
                                            <span className="text-xs font-normal text-slate-500"> / ปี</span>
                                        </p>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            เลขอ้างอิงสลิป / ลิงก์หลักฐานการโอน
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={slipReference}
                                            onChange={e => setSlipReference(e.target.value)}
                                            placeholder="เช่น เวลาโอน 14:32 หรือเลขที่รายการ"
                                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            หมายเหตุเพิ่มเติม (เบอร์ติดต่อ / ใบกำกับภาษี)
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentNote}
                                            onChange={e => setPaymentNote(e.target.value)}
                                            placeholder="ระบุชื่อผู้ติดต่อหรือรายละเอียดบิล"
                                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !slipReference.trim()}
                                    className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {isSubmitting
                                        ? 'กำลังส่งข้อมูลแจ้งต่ออายุ...'
                                        : `แจ้งชำระเงินต่ออายุแพ็กเกจ (฿${selectedPrice.toLocaleString()})`}
                                </button>
                            </form>
                        )}

                        {orgInvoices.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    ประวัติบิลและการแจ้งชำระเงินล่าสุด
                                </p>
                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                                    {orgInvoices.slice(0, 3).map(inv => (
                                        <div key={inv.id} className="px-4 py-2.5 flex items-center justify-between text-xs bg-slate-50/60">
                                            <div>
                                                <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</span>
                                                <span className="text-slate-500"> · {inv.billingCycle} · </span>
                                                <span className="font-mono tabular-nums font-bold text-slate-900">
                                                    ฿{inv.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <span
                                                className={`font-bold ${
                                                    inv.paymentStatus === 'PAID'
                                                        ? 'text-emerald-600'
                                                        : inv.paymentStatus === 'PENDING'
                                                        ? 'text-amber-600'
                                                        : 'text-rose-600'
                                                }`}
                                            >
                                                {inv.paymentStatus === 'PAID'
                                                    ? 'ชำระแล้ว'
                                                    : inv.paymentStatus === 'PENDING'
                                                    ? 'รอตรวจสอบ'
                                                    : 'ไม่สำเร็จ'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 2. Grace Period / Approaching Expiry Warning Strip + Self-Service Billing Modal
    return (
        <>
            {showWarningBanner && (
                <div
                    className={`w-full px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b z-40 shrink-0 ${
                        computedSubscriptionStatus === 'GRACE_PERIOD'
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold truncate">
                            {computedSubscriptionStatus === 'GRACE_PERIOD'
                                ? `แพ็กเกจของ "${currentOrg.name}" ครบกำหนดแล้ว (อยู่ในช่วงผ่อนผันเหลืออีก ${graceDaysRemaining ?? 0} วันก่อนระบบระงับการใช้งาน)`
                                : `แพ็กเกจของ "${currentOrg.name}" จะครบกำหนดต่ออายุในอีก ${daysUntilExpiry} วัน`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsBillingModalOpen(true)}
                            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                                computedSubscriptionStatus === 'GRACE_PERIOD'
                                    ? 'bg-white text-rose-700 hover:bg-rose-50'
                                    : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                        >
                            ต่ออายุแพ็กเกจ / แจ้งชำระเงิน
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isBillingModalOpen && (
                    <div
                        onClick={() => setIsBillingModalOpen(false)}
                        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                        ต่ออายุแพ็กเกจ · {currentOrg.name}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBillingModalOpen(false)}
                                    className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleRenewalSubmit} className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold">แพ็กเกจปัจจุบัน</p>
                                        <p className="text-base font-bold text-slate-900">{planPreset.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-semibold">โควตาสมาชิกสูงสุด</p>
                                        <p className="text-base font-bold font-mono tabular-nums text-indigo-600">
                                            {currentOrg.maxMembers || planPreset.defaultMaxMembers} คน
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCycle('MONTHLY')}
                                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                                            selectedCycle === 'MONTHLY'
                                                ? 'bg-indigo-50 border-indigo-500'
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <p className="text-xs font-bold text-slate-600">รายเดือน (30 วัน)</p>
                                        <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                                            ฿{planPreset.monthlyPriceTHB.toLocaleString()}
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCycle('YEARLY')}
                                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                                            selectedCycle === 'YEARLY'
                                                ? 'bg-indigo-50 border-indigo-500'
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <p className="text-xs font-bold text-emerald-600">รายปี (365 วัน)</p>
                                        <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                                            ฿{planPreset.yearlyPriceTHB.toLocaleString()}
                                        </p>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        เลขอ้างอิงสลิป / หลักฐานการชำระเงิน *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={slipReference}
                                        onChange={e => setSlipReference(e.target.value)}
                                        placeholder="ระบุเวลาโอน หรือเลขอ้างอิงรายการ"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        หมายเหตุเพิ่มเติม
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={e => setPaymentNote(e.target.value)}
                                        placeholder="ชื่อผู้ติดต่อ หรือข้อมูลออกใบเสร็จ"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsBillingModalOpen(false)}
                                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !slipReference.trim()}
                                        className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isSubmitting ? 'กำลังบันทึก...' : 'ส่งแจ้งชำระเงินต่ออายุ'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SubscriptionGateOverlay;
