import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Play, Webhook } from 'lucide-react';
import { Organization, PlanTier, SubscriptionInvoice } from '../../../../../types';
import { SAAS_PLAN_PRESETS } from '../../../../../lib/multiTenantMigrationSql';
import { useToast } from '../../../../../context/ToastContext';
import { PLAN_BADGE_STYLE } from './multiTenantConstants';

interface BillingWebhookTabProps {
    isSuperAdmin: boolean;
    currentOrgId: string;
    allPlatformOrganizations: Organization[];
    subscriptionInvoices: SubscriptionInvoice[];
    onApproveInvoice: (invoiceId: string) => Promise<boolean>;
    onRejectInvoice: (invoiceId: string) => Promise<boolean>;
    onRefreshOrganizations: () => Promise<void>;
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

    const [simOrgId, setSimOrgId] = useState<string>(currentOrgId);
    const [simPlan, setSimPlan] = useState<PlanTier>('PRO');
    const [simCycle, setSimCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [simProvider, setSimProvider] = useState<'STRIPE' | 'OMISE'>('STRIPE');
    const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

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
                    amountTHB: amount,
                    transactionRef: `SIM_${simProvider}_${Date.now()}`
                })
            });
            const data = await res.json();
            if (res.ok && data.received) {
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

    return (
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
                            รองรับทั้งการกดอนุมัติมือโดย Super Admin และการบันทึกอัตโนมัติผ่าน Payment Webhook
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
                                                    PLAN_BADGE_STYLE[inv.planTier]
                                                }`}
                                            >
                                                {inv.planTier} ({inv.billingCycle})
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                                    inv.paymentStatus === 'PAID'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : inv.paymentStatus === 'PENDING'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-rose-100 text-rose-800'
                                                }`}
                                            >
                                                {inv.paymentStatus}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                                            ยอดชำระ: ฿{Number(inv.amount).toLocaleString()} • ช่องทาง: {inv.paymentMethod}{' '}
                                            • Ref: {inv.externalChargeId || inv.invoiceNumber || '-'}
                                        </p>
                                        {inv.note && <p className="text-xs text-slate-600">{inv.note}</p>}
                                    </div>

                                    {inv.paymentStatus === 'PENDING' && isSuperAdmin && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => onApproveInvoice(inv.id)}
                                                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                อนุมัติ & ต่ออายุ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRejectInvoice(inv.id)}
                                                className="px-3 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors"
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
                        <p className="text-xs text-slate-500">พร้อมเชื่อมต่อ Stripe / Omise ทันที</p>
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
                                onChange={e => setSimProvider(e.target.value as 'STRIPE' | 'OMISE')}
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
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                        simCycle === cycle
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                            : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                >
                                    {cycle === 'MONTHLY' ? 'รายเดือน (+30 วัน)' : 'รายปี (+365 วัน)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSimulateWebhook}
                        disabled={isSimulatingWebhook}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Play className="w-3.5 h-3.5" />
                        {isSimulatingWebhook
                            ? 'กำลังส่ง Payload เข้า Webhook...'
                            : 'จำลองการยิง Webhook ต่ออายุอัตโนมัติ'}
                    </button>
                </div>
            </div>
        </div>
    );
};
