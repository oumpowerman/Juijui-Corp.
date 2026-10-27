import React, { useState, useEffect, useRef } from 'react';
import {
    Building2,
    CheckCircle2,
    Copy,
    CreditCard,
    FileText,
    Image as ImageIcon,
    Loader2,
    Play,
    QrCode,
    RefreshCw,
    Save,
    ShieldCheck,
    Sparkles,
    Trash2,
    Upload,
    Webhook
} from 'lucide-react';
import { Organization, PlanTier, SubscriptionInvoice } from '../../../../../types';
import { SAAS_PLAN_PRESETS } from '../../../../../lib/multiTenantMigrationSql';
import { useToast } from '../../../../../context/ToastContext';
import { PLAN_BADGE_STYLE } from './multiTenantConstants';
import {
    DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG,
    getPlatformLandingConfig,
    PlatformBillingPaymentConfig,
    savePlatformBillingPaymentConfig
} from '../../../../../services/landingConfigService';

interface BillingWebhookTabProps {
    isSuperAdmin: boolean;
    currentOrgId: string;
    allPlatformOrganizations: Organization[];
    subscriptionInvoices: SubscriptionInvoice[];
    onApproveInvoice: (invoiceId: string) => Promise<boolean>;
    onRejectInvoice: (invoiceId: string) => Promise<boolean>;
    onRefreshOrganizations: () => Promise<void>;
}

interface WebhookReadinessInfo {
    status: string;
    endpoint: string;
    checkoutEndpoint: string;
    secretConfigured: boolean;
    stripeLiveConfigured: boolean;
    omiseLiveConfigured: boolean;
    supportedProviders: string[];
    supportedEvents: string[];
}

export const BillingWebhookTab: React.FC<BillingWebhookTabProps> = ({
    isSuperAdmin,
    currentOrgId,
    allPlatformOrganizations,
    subscriptionInvoices,
    onApproveInvoice,
    onRejectInvoice,
    onRefreshOrganizations
}) => {
    const { showToast } = useToast();
    const qrFileInputRef = useRef<HTMLInputElement | null>(null);

    // Platform Billing & Payment Config State (PromptPay QR, Bank Account, Toggles)
    const [billingConfig, setBillingConfig] = useState<PlatformBillingPaymentConfig>(
        DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG
    );
    const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
    const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

    // Server Gateway Readiness State (/api/billing/webhook-info)
    const [gatewayInfo, setGatewayInfo] = useState<WebhookReadinessInfo | null>(null);
    const [isLoadingGatewayInfo, setIsLoadingGatewayInfo] = useState<boolean>(false);

    // Webhook Simulator State
    const [simOrgId, setSimOrgId] = useState<string>(currentOrgId);
    const [simPlan, setSimPlan] = useState<PlanTier>('PRO');
    const [simCycle, setSimCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [simProvider, setSimProvider] = useState<'STRIPE' | 'OMISE'>('STRIPE');
    const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

    const fetchBillingConfiguration = async () => {
        setIsLoadingConfig(true);
        try {
            const landingCfg = await getPlatformLandingConfig();
            if (landingCfg.billing_payment_config) {
                setBillingConfig(landingCfg.billing_payment_config);
            }
        } catch (err) {
            console.warn('Failed to load billing config:', err);
        } finally {
            setIsLoadingConfig(false);
        }
    };

    const fetchGatewayReadiness = async () => {
        setIsLoadingGatewayInfo(true);
        try {
            const res = await fetch('/api/billing/webhook-info');
            if (res.ok) {
                const data = await res.json();
                setGatewayInfo(data);
            }
        } catch (err) {
            console.warn('Could not load /api/billing/webhook-info:', err);
        } finally {
            setIsLoadingGatewayInfo(false);
        }
    };

    useEffect(() => {
        fetchBillingConfiguration();
        fetchGatewayReadiness();
    }, []);

    const handleSaveBillingConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSuperAdmin) return;

        if (
            !billingConfig.enablePromptPayQr &&
            !billingConfig.enableStripeCard &&
            !billingConfig.enableBankSlip
        ) {
            showToast('กรุณาเปิดใช้งานช่องทางชำระเงินอย่างน้อย 1 ช่องทาง', 'error');
            return;
        }

        setIsSavingConfig(true);
        try {
            const result = await savePlatformBillingPaymentConfig(billingConfig);
            if (result.success) {
                showToast(
                    'บันทึกการตั้งค่า PromptPay QR, บัญชีธนาคาร และช่องทางรับเงินเรียบร้อยแล้ว',
                    'success'
                );
            } else {
                showToast(
                    result.error || 'บันทึกสำเร็จในหน่วยความจำเครื่อง แต่ฐานข้อมูลหลักขัดข้อง',
                    'warning'
                );
            }
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาดในการบันทึก: ' + (err?.message || 'Unknown error'), 'error');
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('ไฟล์รูป QR Code ต้องมีขนาดไม่เกิน 2 MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setBillingConfig(prev => ({
                    ...prev,
                    promptPayQrImageUrl: reader.result as string
                }));
                showToast('อัปโหลดรูป QR Code พร้อมเพย์แล้ว กรุณากดบันทึกการตั้งค่า', 'info');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCopyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`คัดลอก ${label} เรียบร้อยแล้ว`, 'success');
    };

    const handleSimulateWebhook = async () => {
        setIsSimulatingWebhook(true);
        try {
            const preset = SAAS_PLAN_PRESETS[simPlan];
            const amount = simCycle === 'YEARLY' ? preset.yearlyPriceTHB : preset.monthlyPriceTHB;
            const res = await fetch('/api/billing/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: simProvider,
                    orgId: simOrgId,
                    planTier: simPlan,
                    billingCycle: simCycle,
                    amount: amount,
                    paymentMethod: simProvider,
                    externalChargeId: `SIM_${simProvider}_${Date.now()}`
                })
            });
            const data = await res.json();
            if (res.ok && (data.received || data.success)) {
                showToast(
                    `จำลอง Webhook (${simProvider}) สำเร็จ! ต่ออายุแพ็กเกจ ${simPlan} เรียบร้อย`,
                    'success'
                );
                await onRefreshOrganizations();
            } else {
                showToast(data.error || 'Webhook จำลองทำงานไม่สำเร็จ', 'error');
            }
        } catch (err: any) {
            showToast('ไม่สามารถเรียก /api/billing/webhook ได้: ' + err.message, 'error');
        } finally {
            setIsSimulatingWebhook(false);
        }
    };

    const fullWebhookUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/api/billing/webhook`
            : '/api/billing/webhook';

    return (
        <div className="space-y-6">
            {/* SECTION 1: Super Admin Payment Channels, PromptPay QR & Bank Account Configuration */}
            <form
                onSubmit={handleSaveBillingConfig}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold mb-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Super Admin Payment Control (dramaeveryday222@gmail.com)</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-indigo-600" />
                            ตั้งค่าช่องทางรับชำระเงิน, รูป QR พร้อมเพย์ และบัญชีธนาคาร
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            ข้อมูลที่บันทึกที่นี่จะแสดงผลทันทีในหน้าต่าง Fast Checkout (หน้า Pricing / À La Carte) และหน้าต่ออายุแพ็กเกจของลูกค้าทุกองค์กร
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={fetchBillingConfiguration}
                            disabled={isLoadingConfig || isSavingConfig}
                            className="px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConfig ? 'animate-spin' : ''}`} />
                            <span>รีเฟรช</span>
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingConfig || !isSuperAdmin}
                            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            {isSavingConfig ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>บันทึกการตั้งค่าระบบรับเงิน</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 1.1 Payment Channel Toggles */}
                <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700">
                        1. เปิด / ปิด ช่องทางชำระเงินในหน้าต่าง Fast Checkout & ต่ออายุแพ็กเกจ
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            {
                                key: 'enablePromptPayQr' as const,
                                title: 'PromptPay QR Code',
                                desc: 'สแกนจ่ายผ่านแอปธนาคาร',
                                icon: QrCode
                            },
                            {
                                key: 'enableStripeCard' as const,
                                title: 'บัตรเครดิต / เดบิต (Stripe)',
                                desc: 'ตัดบัตรอัตโนมัติผ่าน Stripe API',
                                icon: CreditCard
                            },
                            {
                                key: 'enableBankSlip' as const,
                                title: 'โอนบัญชีธนาคาร / แนบสลิป',
                                desc: 'โอนเงินและกรอกเลขอ้างอิงสลิป',
                                icon: FileText
                            },
                            {
                                key: 'enableFreeTrialButton' as const,
                                title: 'ปุ่มทดลองใช้ฟรี 7 วัน',
                                desc: 'แสดงปุ่มข้ามไปเริ่ม Trial 7 วันใน Checkout',
                                icon: Sparkles
                            }
                        ].map(item => {
                            const Icon = item.icon;
                            const isEnabled = billingConfig[item.key];
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            [item.key]: !prev[item.key]
                                        }))
                                    }
                                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                        isEnabled
                                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500/20'
                                            : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <div
                                            className={`p-2 rounded-xl shrink-0 ${
                                                isEnabled
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 truncate">
                                                {item.title}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                            isEnabled
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {isEnabled ? 'เปิดใช้' : 'ปิด'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 1.2 Two-Column Configuration: PromptPay QR (Left) & Bank Account Details (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    {/* Left Card: PromptPay QR Configuration */}
                    <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900">
                                    2. ข้อมูลรับเงิน PromptPay QR Code
                                </h4>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-600">
                                แสดงในแท็บ PromptPay QR
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    หมายเลขพร้อมเพย์ (เบอร์โทร / เลขนิติบุคคล)
                                </label>
                                <input
                                    type="text"
                                    value={billingConfig.promptPayId}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            promptPayId: e.target.value
                                        }))
                                    }
                                    placeholder="เช่น 089-999-9999 หรือ 010556xxxxxxx"
                                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ชื่อบัญชีพร้อมเพย์ที่แสดงใต้ QR
                                </label>
                                <input
                                    type="text"
                                    value={billingConfig.promptPayAccountName}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            promptPayAccountName: e.target.value
                                        }))
                                    }
                                    placeholder="เช่น บจก. คอนเทนต์ โอเอส"
                                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                รูปภาพ QR Code พร้อมเพย์ (วางลิงก์รูปภาพ หรือกดอัปโหลดไฟล์รูป QR ของบริษัท)
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={billingConfig.promptPayQrImageUrl}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            promptPayQrImageUrl: e.target.value
                                        }))
                                    }
                                    placeholder="https://... หรืออัปโหลดไฟล์รูป QR ด้านขวา"
                                    className="flex-1 px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                    ref={qrFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrFileUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => qrFileInputRef.current?.click()}
                                    className="px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>อัปโหลดรูป QR</span>
                                </button>
                                {billingConfig.promptPayQrImageUrl && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setBillingConfig(prev => ({
                                                ...prev,
                                                promptPayQrImageUrl: ''
                                            }))
                                        }
                                        className="px-3 py-2.5 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                                        title="ลบรูป QR"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Live QR Preview Box */}
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl border border-indigo-100 bg-slate-50 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                                {billingConfig.promptPayQrImageUrl ? (
                                    <img
                                        src={billingConfig.promptPayQrImageUrl}
                                        alt="PromptPay QR Preview"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon className="w-6 h-6 mb-0.5 text-indigo-500" />
                                        <span className="text-[9px] font-bold text-indigo-600">
                                            QR มาตรฐาน
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 space-y-1">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                    ตัวอย่างการแสดงผลในหน้าต่างจ่ายเงินของลูกค้า
                                </div>
                                <div className="text-xs text-slate-600 font-medium truncate">
                                    พร้อมเพย์: <span className="font-mono font-bold text-indigo-700">{billingConfig.promptPayId || '-'}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                    ชื่อบัญชี: {billingConfig.promptPayAccountName || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Bank Account Configuration (for Slip Transfer) */}
                    <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900">
                                    3. ข้อมูลบัญชีธนาคาร (สำหรับโอนเงิน & แนบสลิป)
                                </h4>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-600">
                                แสดงในแท็บโอนเงิน/สลิป
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ชื่อธนาคาร
                                </label>
                                <input
                                    type="text"
                                    value={billingConfig.bankName}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            bankName: e.target.value
                                        }))
                                    }
                                    placeholder="เช่น ธนาคารกสิกรไทย (KBANK)"
                                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    เลขที่บัญชีธนาคาร
                                </label>
                                <input
                                    type="text"
                                    value={billingConfig.bankAccountNumber}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            bankAccountNumber: e.target.value
                                        }))
                                    }
                                    placeholder="เช่น 123-4-56789-0"
                                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-indigo-700 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ชื่อบัญชีนิติบุคคล / ผู้รับเงิน
                                </label>
                                <input
                                    type="text"
                                    value={billingConfig.bankAccountName}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            bankAccountName: e.target.value
                                        }))
                                    }
                                    placeholder="เช่น บจก. คอนเทนต์ โอเอส"
                                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    สาขา / ประเภทบัญชี / คำแนะนำเพิ่มเติม
                                </label>
                                <input
                                    type="text"
                                    value={billingConfig.bankBranch}
                                    onChange={e =>
                                        setBillingConfig(prev => ({
                                            ...prev,
                                            bankBranch: e.target.value
                                        }))
                                    }
                                    placeholder="เช่น สาขาสยามพารากอน · บัญชีออมทรัพย์"
                                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Live Bank Card Preview */}
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                            <div className="text-[11px] font-semibold text-slate-400">
                                ตัวอย่างการ์ดบัญชีธนาคารที่แสดงให้ลูกค้าเห็น
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                                {billingConfig.bankName || '-'} · {billingConfig.bankAccountName || '-'}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-mono font-bold text-indigo-600">
                                    {billingConfig.bankAccountNumber || '-'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    {billingConfig.bankBranch}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* SECTION 2: Credit Card & Subscription API Connection Status (Stripe / Omise Server Readiness) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            สถานะการเชื่อมต่อ API ระบบตัดบัตรเครดิต & Payment Gateway (Server-Side API Status)
                        </h3>
                        <p className="text-xs text-slate-500">
                            ระบบตรวจจับ Environment Variables ของเซิร์ฟเวอร์อัตโนมัติ (หากยังไม่ได้ตั้งค่า Live Key ระบบจะทำงานในโหมด Interactive Instant Checkout ให้ลูกค้าทดสอบจนจบ Flow ได้ทันที)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchGatewayReadiness}
                        disabled={isLoadingGatewayInfo}
                        className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGatewayInfo ? 'animate-spin' : ''}`} />
                        <span>ตรวจสอบสถานะ API</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stripe Card API Status */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-indigo-600" />
                                Stripe Checkout API (บัตรเครดิต)
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    gatewayInfo?.stripeLiveConfigured
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                                {gatewayInfo?.stripeLiveConfigured
                                    ? 'LIVE API CONNECTED'
                                    : 'INSTANT CHECKOUT MODE'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Endpoint: <code className="font-mono text-indigo-600">POST /api/billing/create-checkout-session</code>
                        </p>
                        <p className="text-[11px] text-slate-500">
                            ตัวแปรฝั่งเซิร์ฟเวอร์: <code className="font-mono font-semibold text-slate-700">STRIPE_SECRET_KEY</code> (ขึ้นต้นด้วย <code className="font-mono">sk_live_</code> หรือ <code className="font-mono">sk_test_</code>)
                        </p>
                    </div>

                    {/* Omise PromptPay QR API Status */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 text-indigo-600" />
                                Omise PromptPay QR API
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    gatewayInfo?.omiseLiveConfigured
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                }`}
                            >
                                {gatewayInfo?.omiseLiveConfigured
                                    ? 'LIVE OMISE QR'
                                    : 'CUSTOM QR / INSTANT'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            หากไม่ได้ผูก <code className="font-mono text-indigo-600">OMISE_SECRET_KEY</code> ระบบจะแสดงรูป QR และเลขพร้อมเพย์ที่คุณตั้งค่าไว้ด้านบนโดยอัตโนมัติ
                        </p>
                        <p className="text-[11px] text-slate-500">
                            ตัวแปรฝั่งเซิร์ฟเวอร์: <code className="font-mono font-semibold text-slate-700">OMISE_SECRET_KEY</code>
                        </p>
                    </div>

                    {/* Webhook Endpoint & Secret Status */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <Webhook className="w-4 h-4 text-indigo-600" />
                                Billing Webhook Endpoint
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    gatewayInfo?.secretConfigured
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {gatewayInfo?.secretConfigured ? 'SECRET ACTIVE' : 'OPEN / DEV MODE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-800 truncate">
                                {fullWebhookUrl}
                            </code>
                            <button
                                type="button"
                                onClick={() => handleCopyText(fullWebhookUrl, 'Webhook URL')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                title="คัดลอก Webhook URL"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            รองรับ Event: <code className="font-mono">checkout.session.completed</code>, <code className="font-mono">charge.complete</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Invoices List (Left 2 Cols) & Live Webhook Simulator (Right Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Invoices & Renewal Requests */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                รายการแจ้งชำระเงินและประวัติบิล (Subscription Invoices)
                            </h3>
                            <p className="text-xs text-slate-500">
                                รองรับทั้งการกดอนุมัติมือโดย Super Admin และการบันทึกอัตโนมัติผ่าน Fast Checkout / Payment Webhook
                            </p>
                        </div>
                        <span className="text-xs font-bold font-mono tabular-nums text-slate-500">
                            ทั้งหมด {subscriptionInvoices.length} รายการ
                        </span>
                    </div>

                    {subscriptionInvoices.length === 0 ? (
                        <div className="p-10 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                            <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-sm font-bold text-slate-700">
                                ยังไม่มีประวัติบิลหรือคำขอต่ออายุแพ็กเกจ
                            </p>
                            <p className="text-xs text-slate-500">
                                คุณสามารถทดสอบยิง Payment Webhook จากกล่องด้านขวาเพื่อจำลองการต่ออายุอัตโนมัติได้ทันที
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {subscriptionInvoices.map(inv => {
                                const orgObj = allPlatformOrganizations.find(o => o.id === inv.orgId);
                                const isPending =
                                    inv.paymentStatus === 'PENDING' ||
                                    (inv.paymentStatus as string) === 'PENDING_VERIFICATION';
                                return (
                                    <div
                                        key={inv.id}
                                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {orgObj?.name || inv.orgId}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                                        PLAN_BADGE_STYLE[inv.planTier] ||
                                                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    }`}
                                                >
                                                    {inv.planTier} ({inv.billingCycle})
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                                        inv.paymentStatus === 'PAID'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : isPending
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}
                                                >
                                                    {inv.paymentStatus}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono tabular-nums">
                                                ยอดชำระ: ฿{Number(inv.amount).toLocaleString()} • ช่องทาง:{' '}
                                                {inv.paymentMethod} • Ref:{' '}
                                                {inv.externalChargeId || inv.invoiceNumber || '-'}
                                            </p>
                                            {inv.note && (
                                                <p className="text-xs text-slate-600">{inv.note}</p>
                                            )}
                                        </div>

                                        {isPending && isSuperAdmin && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => onApproveInvoice(inv.id)}
                                                    className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    อนุมัติ & ต่ออายุ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onRejectInvoice(inv.id)}
                                                    className="px-3 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    ปฏิเสธ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Payment Webhook Architecture & Live Simulator */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Webhook className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">
                                Payment Webhook Simulator
                            </h3>
                            <p className="text-xs text-slate-500">ทดสอบยิงสัญญาณต่ออายุอัตโนมัติ</p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono space-y-1">
                        <p className="text-indigo-400 font-bold">POST /api/billing/webhook</p>
                        <p className="text-slate-400 text-[11px]">
                            Header: x-webhook-secret: BILLING_WEBHOOK_SECRET
                        </p>
                    </div>

                    <div className="space-y-3 pt-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                เลือกองค์กรลูกค้าที่ต้องการจำลองชำระเงิน
                            </label>
                            <select
                                value={simOrgId}
                                onChange={e => setSimOrgId(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                            >
                                {allPlatformOrganizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name} ({org.planTier || 'PRO'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Payment Gateway
                                </label>
                                <select
                                    value={simProvider}
                                    onChange={e =>
                                        setSimProvider(e.target.value as 'STRIPE' | 'OMISE')
                                    }
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                                >
                                    <option value="STRIPE">Stripe</option>
                                    <option value="OMISE">Omise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    แพ็กเกจ
                                </label>
                                <select
                                    value={simPlan}
                                    onChange={e => setSimPlan(e.target.value as PlanTier)}
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                                >
                                    <option value="STARTER">STARTER</option>
                                    <option value="PRO">PRO</option>
                                    <option value="ENTERPRISE">ENTERPRISE</option>
                                    <option value="LIFETIME">LIFETIME</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                รอบบิล (Billing Cycle)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['MONTHLY', 'YEARLY'] as const).map(cycle => (
                                    <button
                                        key={cycle}
                                        type="button"
                                        onClick={() => setSimCycle(cycle)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                            simCycle === cycle
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                                : 'bg-white text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        {cycle === 'MONTHLY'
                                            ? 'รายเดือน (+30 วัน)'
                                            : 'รายปี (+365 วัน)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSimulateWebhook}
                            disabled={isSimulatingWebhook}
                            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Play className="w-3.5 h-3.5" />
                            {isSimulatingWebhook
                                ? 'กำลังส่ง Payload เข้า Webhook...'
                                : 'จำลองการยิง Webhook ต่ออายุอัตโนมัติ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
