import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Lock,
    QrCode,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Upload,
    X,
    Zap
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { PlanTier } from '../../types';
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

type PaymentChannelTab = 'STRIPE' | 'OMISE_QR' | 'BANK_SLIP';

interface CheckoutSessionState {
    sessionId: string;
    mode: 'LIVE_REDIRECT' | 'LIVE_QR' | 'INSTANT_CHECKOUT';
    gateway: 'STRIPE' | 'OMISE';
    planTier: PlanTier;
    billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    amount: number;
    qrImageUrl?: string | null;
    promptPayNumber?: string;
}

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
        renewOrganizationSubscription,
        refreshOrganizations
    } = useOrganization();

    const { showToast } = useToast();

    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [superAdminBypass, setSuperAdminBypass] = useState(false);

    // Plan & Payment selection state
    const [selectedPlan, setSelectedPlan] = useState<PlanTier>(() =>
        currentOrg.planTier === 'LIFETIME' ? 'PRO' : (currentOrg.planTier || 'PRO')
    );
    const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [paymentChannel, setPaymentChannel] = useState<PaymentChannelTab>('STRIPE');

    // Manual Slip state
    const [paymentNote, setPaymentNote] = useState('');
    const [slipReference, setSlipReference] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Automated Checkout Session state
    const [activeCheckout, setActiveCheckout] = useState<CheckoutSessionState | null>(null);
    const [isCompletingCheckout, setIsCompletingCheckout] = useState(false);

    useEffect(() => {
        if (currentOrg.planTier && currentOrg.planTier !== 'LIFETIME') {
            setSelectedPlan(currentOrg.planTier);
        }
    }, [currentOrg.planTier]);

    // Listen for global event to open the Self-Serve Billing Modal from anywhere
    useEffect(() => {
        const handleOpenBilling = (e: Event) => {
            const detail = (e as CustomEvent)?.detail;
            if (detail?.planTier) {
                setSelectedPlan(detail.planTier);
            }
            if (detail?.billingCycle) {
                setSelectedCycle(detail.billingCycle);
            }
            setIsBillingModalOpen(true);
        };
        window.addEventListener('open-saas-billing-modal', handleOpenBilling);
        return () => window.removeEventListener('open-saas-billing-modal', handleOpenBilling);
    }, []);

    const activePreset = SAAS_PLAN_PRESETS[selectedPlan] || SAAS_PLAN_PRESETS.PRO;
    const currentPreset = SAAS_PLAN_PRESETS[currentOrg.planTier || 'PRO'] || SAAS_PLAN_PRESETS.PRO;
    const selectedPrice =
        selectedPlan === 'LIFETIME'
            ? SAAS_PLAN_PRESETS.LIFETIME.yearlyPriceTHB
            : selectedCycle === 'YEARLY'
            ? activePreset.yearlyPriceTHB
            : activePreset.monthlyPriceTHB;

    const orgInvoices = invoices.filter(inv => inv.orgId === currentOrg.id);
    const hasPendingRenewal = orgInvoices.some(inv => inv.paymentStatus === 'PENDING');

    const handleCreateAutomatedCheckout = async (gateway: 'STRIPE' | 'OMISE') => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setActiveCheckout(null);
        try {
            const billingCyclePayload = selectedPlan === 'LIFETIME' ? 'LIFETIME' : selectedCycle;
            const res = await fetch('/api/billing/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId: currentOrg.id,
                    planTier: selectedPlan,
                    billingCycle: billingCyclePayload,
                    gateway
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'ไม่สามารถสร้างลิงก์ชำระเงินได้');
            }

            if (data.mode === 'LIVE_REDIRECT' && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
                return;
            }

            setActiveCheckout({
                sessionId: data.sessionId,
                mode: data.mode,
                gateway,
                planTier: selectedPlan,
                billingCycle: billingCyclePayload,
                amount: data.amount || selectedPrice,
                qrImageUrl: data.qrImageUrl || null,
                promptPayNumber: data.promptPayNumber
            });
        } catch (err: any) {
            showToast(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบชำระเงิน', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmAutomatedCheckout = async () => {
        if (!activeCheckout || isCompletingCheckout) return;
        setIsCompletingCheckout(true);
        try {
            const res = await fetch('/api/billing/complete-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId: currentOrg.id,
                    planTier: activeCheckout.planTier,
                    billingCycle: activeCheckout.billingCycle,
                    gateway: activeCheckout.gateway,
                    sessionId: activeCheckout.sessionId,
                    amount: activeCheckout.amount
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'ไม่สามารถยืนยันยอดชำระเงินได้');
            }

            await refreshOrganizations();
            showToast(
                `ชำระเงินสำเร็จ! ต่ออายุแพ็กเกจ ${activeCheckout.planTier} (${activeCheckout.billingCycle}) เรียบร้อยแล้ว`,
                'success'
            );
            setActiveCheckout(null);
            setIsBillingModalOpen(false);
        } catch (err: any) {
            showToast(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบยอดชำระ', 'error');
        } finally {
            setIsCompletingCheckout(false);
        }
    };

    const handleManualSlipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        const ok = await submitRenewalRequest({
            billingCycle: selectedCycle,
            amount: selectedPrice,
            note:
                paymentNote.trim() ||
                `แจ้งชำระเงินต่ออายุแพ็กเกจ ${activePreset.name} (${selectedCycle})`,
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
            computedSubscriptionStatus === 'TRIAL' ||
            (daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7));

    // Shared Payment Interface Block (used inside both Locked Gate & Self-Serve Modal)
    const renderSelfServePaymentTabs = () => (
        <div className="space-y-4">
            {/* Plan Tier Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    1. เลือกแพ็กเกจที่ต้องการใช้งาน / ต่ออายุ
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {(['STARTER', 'PRO', 'ENTERPRISE'] as PlanTier[]).map(tier => {
                        const preset = SAAS_PLAN_PRESETS[tier];
                        const isSelected = selectedPlan === tier;
                        return (
                            <button
                                key={tier}
                                type="button"
                                onClick={() => {
                                    setSelectedPlan(tier);
                                    setActiveCheckout(null);
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                    isSelected
                                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-500/20'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {preset.name}
                                    </span>
                                    {tier === 'PRO' && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                                            ฮิต
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
                                    ฿{(selectedCycle === 'YEARLY' ? preset.yearlyPriceTHB : preset.monthlyPriceTHB).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                                    สูงสุด {preset.defaultMaxMembers} คน
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Billing Cycle Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    2. เลือกรอบบิลชำระเงิน
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCycle('MONTHLY');
                            setActiveCheckout(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                            selectedCycle === 'MONTHLY'
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            รายเดือน (30 วัน)
                        </p>
                        <p className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                            ฿{activePreset.monthlyPriceTHB.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500"> / เดือน</span>
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCycle('YEARLY');
                            setActiveCheckout(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                            selectedCycle === 'YEARLY'
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            รายปี (365 วัน · ประหยัด ~17%)
                        </p>
                        <p className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                            ฿{activePreset.yearlyPriceTHB.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500"> / ปี</span>
                        </p>
                    </button>
                </div>
            </div>

            {/* Payment Method Channel Switcher */}
            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    3. เลือกช่องทางชำระเงิน
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => {
                            setPaymentChannel('STRIPE');
                            setActiveCheckout(null);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            paymentChannel === 'STRIPE'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Stripe (บัตร/QR)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPaymentChannel('OMISE_QR');
                            setActiveCheckout(null);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            paymentChannel === 'OMISE_QR'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <QrCode className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">PromptPay QR</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPaymentChannel('BANK_SLIP');
                            setActiveCheckout(null);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            paymentChannel === 'BANK_SLIP'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">โอนแนบสลิป</span>
                    </button>
                </div>
            </div>

            {/* Channel 1: Stripe Automated Checkout */}
            {paymentChannel === 'STRIPE' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" />
                                ชำระด้วยบัตรเครดิต / เดบิต หรือ Stripe PromptPay (ต่ออายุอัตโนมัติ)
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                ระบบจะปลดล็อกโควตาและต่ออายุวันหมดอายุให้ทันทีภายใน 3 วินาทีหลังชำระเงินสำเร็จ
                            </p>
                        </div>
                        <span className="text-sm font-bold font-mono tabular-nums text-indigo-600 shrink-0">
                            ฿{selectedPrice.toLocaleString()}
                        </span>
                    </div>

                    {!activeCheckout ? (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleCreateAutomatedCheckout('STRIPE')}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>
                                {isSubmitting
                                    ? 'กำลังสร้างรายการ Stripe Checkout...'
                                    : `ชำระเงินผ่าน Stripe ทันที (฿${selectedPrice.toLocaleString()})`}
                            </span>
                        </button>
                    ) : (
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-indigo-900 dark:text-indigo-300">
                                    รายการชำระเงินพร้อมแล้ว ({activeCheckout.sessionId})
                                </span>
                                <span className="font-mono tabular-nums font-bold text-emerald-600">
                                    ฿{activeCheckout.amount.toLocaleString()}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                กดยืนยันการชำระเงินด้านล่างเพื่อต่ออายุแพ็กเกจ {activeCheckout.planTier} และออกใบเสร็จรับเงินอัตโนมัติทันที
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={isCompletingCheckout}
                                    onClick={handleConfirmAutomatedCheckout}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                        {isCompletingCheckout
                                            ? 'กำลังตรวจสอบและต่ออายุ...'
                                            : 'ยืนยันชำระเงินสำเร็จ (ปลดล็อกใน 3 วินาที)'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveCheckout(null)}
                                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Channel 2: Omise PromptPay QR */}
            {paymentChannel === 'OMISE_QR' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 text-indigo-600" />
                                สแกนจ่ายด้วยแอปธนาคารทุกธนาคาร (Thai QR PromptPay)
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                สร้าง QR Code ยอดชำระตรงตามแพ็กเกจ เมื่อสแกนจ่ายแล้วระบบต่ออายุให้อัตโนมัติทันที
                            </p>
                        </div>
                        <span className="text-sm font-bold font-mono tabular-nums text-indigo-600 shrink-0">
                            ฿{selectedPrice.toLocaleString()}
                        </span>
                    </div>

                    {!activeCheckout ? (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleCreateAutomatedCheckout('OMISE')}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <QrCode className="w-4 h-4" />
                            <span>
                                {isSubmitting
                                    ? 'กำลังสร้าง QR Code...'
                                    : `สร้างคิวอาร์โค้ด PromptPay (฿${selectedPrice.toLocaleString()})`}
                            </span>
                        </button>
                    ) : (
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3 text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                                <QrCode className="w-3.5 h-3.5" />
                                Thai QR PromptPay · ยอดชำระ ฿{activeCheckout.amount.toLocaleString()}
                            </div>

                            <div className="w-44 h-44 mx-auto rounded-2xl border-2 border-indigo-100 bg-slate-50 flex flex-col items-center justify-center p-3">
                                {activeCheckout.qrImageUrl ? (
                                    <img
                                        src={activeCheckout.qrImageUrl}
                                        alt="PromptPay QR"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center space-y-1.5">
                                        <QrCode className="w-20 h-20 text-indigo-600" />
                                        <span className="text-[10px] font-mono font-bold text-slate-600">
                                            {activeCheckout.promptPayNumber || 'PromptPay QR'}
                                        </span>
                                        <span className="text-xs font-mono tabular-nums font-bold text-slate-900">
                                            ฿{activeCheckout.amount.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={isCompletingCheckout}
                                    onClick={handleConfirmAutomatedCheckout}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                        {isCompletingCheckout
                                            ? 'กำลังตรวจสอบยอดโอน...'
                                            : 'สแกนชำระเงินเรียบร้อยแล้ว (ต่ออายุทันที)'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveCheckout(null)}
                                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                                >
                                    เปลี่ยนวิธี
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Channel 3: Manual Bank Transfer & Slip */}
            {paymentChannel === 'BANK_SLIP' && (
                <form onSubmit={handleManualSlipSubmit} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                เลขอ้างอิงสลิป / ลิงก์หลักฐานการโอน *
                            </label>
                            <input
                                type="text"
                                required
                                value={slipReference}
                                onChange={e => setSlipReference(e.target.value)}
                                placeholder="เช่น เวลาโอน 14:32 หรือเลขรายการ"
                                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                หมายเหตุเพิ่มเติม (ใบกำกับภาษี / เบอร์ติดต่อ)
                            </label>
                            <input
                                type="text"
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                                placeholder="ระบุชื่อบริษัทหรือผู้ติดต่อ"
                                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !slipReference.trim()}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        <span>
                            {isSubmitting
                                ? 'กำลังส่งข้อมูลแจ้งโอน...'
                                : `ส่งหลักฐานการโอนเงิน (฿${selectedPrice.toLocaleString()})`}
                        </span>
                    </button>
                </form>
            )}
        </div>
    );

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
                                    องค์กร <span className="font-bold text-slate-900 dark:text-white">{currentOrg.name}</span> · แพ็กเกจ {currentPreset.name}
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

                        {hasPendingRenewal && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    <span>มีรายการแจ้งโอนเงินรอตรวจสอบ หรือสามารถเลือกชำระแบบอัตโนมัติ (Stripe / QR) เพื่อปลดล็อกทันที</span>
                                </div>
                            </div>
                        )}

                        {renderSelfServePaymentTabs()}

                        {orgInvoices.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    ประวัติบิลและการชำระเงินล่าสุด
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

    // 2. Trial / Grace Period / Approaching Expiry Strip + Self-Service Billing Modal
    return (
        <>
            {showWarningBanner && (
                <div
                    className={`w-full px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b z-40 shrink-0 ${
                        computedSubscriptionStatus === 'GRACE_PERIOD'
                            ? 'bg-rose-600 text-white border-rose-700'
                            : computedSubscriptionStatus === 'TRIAL'
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {computedSubscriptionStatus === 'TRIAL' ? (
                            <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        <span className="font-semibold truncate">
                            {computedSubscriptionStatus === 'GRACE_PERIOD'
                                ? `แพ็กเกจของ "${currentOrg.name}" ครบกำหนดแล้ว (อยู่ในช่วงผ่อนผันเหลืออีก ${graceDaysRemaining ?? 0} วันก่อนระงับการใช้งาน)`
                                : computedSubscriptionStatus === 'TRIAL'
                                ? `โหมดทดลองใช้ฟรี 7 วัน (แผน ${currentPreset.name} · สูงสุด ${currentOrg.maxMembers} คน) เหลือเวลาอีก ${daysUntilExpiry ?? 7} วัน`
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
                                    : computedSubscriptionStatus === 'TRIAL'
                                    ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                                    : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                        >
                            {computedSubscriptionStatus === 'TRIAL'
                                ? 'อัปเกรดเป็นแพ็กเกจเต็ม / ชำระเงิน'
                                : 'ต่ออายุแพ็กเกจ / ชำระเงิน'}
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
                            className="w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* 1. Rigid Header */}
                            <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                                            ชำระเงิน & อัปเกรดแพ็กเกจ · {currentOrg.name}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            รองรับ Stripe Checkout, PromptPay QR อัตโนมัติ และแนบสลิปโอนเงิน
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBillingModalOpen(false)}
                                    className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* 2. Scrollable Body */}
                            <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-semibold">แพ็กเกจปัจจุบัน</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {currentPreset.name} ({computedSubscriptionStatus})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-slate-500 font-semibold">โควตาสมาชิกปัจจุบัน</p>
                                        <p className="text-sm font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                                            สูงสุด {currentOrg.maxMembers || currentPreset.defaultMaxMembers} คน
                                        </p>
                                    </div>
                                </div>

                                {renderSelfServePaymentTabs()}
                            </div>

                            {/* 3. Rigid Sticky Footer */}
                            <div className="flex-shrink-0 px-5 sm:px-6 py-3 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                                <span className="text-[11px] text-slate-500">
                                    ออกใบเสร็จรับเงินอิเล็กทรอนิกส์และปลดล็อกโควตาทันที
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsBillingModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SubscriptionGateOverlay;
