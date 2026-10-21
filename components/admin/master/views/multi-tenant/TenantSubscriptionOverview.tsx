import React, { useState } from 'react';
import { Calendar, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Organization, SubscriptionInvoice, SubscriptionStatus } from '../../../../../types';
import { SAAS_PLAN_PRESETS } from '../../../../../lib/multiTenantMigrationSql';
import {
    ALL_AVAILABLE_MODULES,
    PLAN_BADGE_STYLE,
    STATUS_BADGE_STYLE
} from './multiTenantConstants';

interface TenantSubscriptionOverviewProps {
    currentOrg: Organization;
    computedSubscriptionStatus: SubscriptionStatus;
    daysUntilExpiry: number | null;
    invoices: SubscriptionInvoice[];
    onSubmitRenewalRequest: (input: {
        billingCycle: 'MONTHLY' | 'YEARLY';
        amount: number;
        note?: string;
        slipUrl?: string;
    }) => Promise<boolean>;
}

export const TenantSubscriptionOverview: React.FC<TenantSubscriptionOverviewProps> = ({
    currentOrg,
    computedSubscriptionStatus,
    daysUntilExpiry,
    invoices,
    onSubmitRenewalRequest
}) => {
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [note, setNote] = useState('');
    const [slipUrl, setSlipUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tier = currentOrg.planTier || 'PRO';
    const preset = SAAS_PLAN_PRESETS[tier] || SAAS_PLAN_PRESETS.PRO;
    const price = billingCycle === 'YEARLY' ? preset.yearlyPriceTHB : preset.monthlyPriceTHB;

    const myOrgInvoices = invoices.filter(inv => inv.orgId === currentOrg.id);
    const allowedModuleCount = currentOrg.allowedModules
        ? currentOrg.allowedModules.length
        : ALL_AVAILABLE_MODULES.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        const ok = await onSubmitRenewalRequest({
            billingCycle,
            amount: price,
            note: note.trim() || `แจ้งชำระเงินต่ออายุแพ็กเกจ ${preset.name} (${billingCycle})`,
            slipUrl: slipUrl.trim() || undefined
        });
        setIsSubmitting(false);
        if (ok) {
            setNote('');
            setSlipUrl('');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Plan Details & Renewal Submission */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            แพ็กเกจการใช้งานของ {currentOrg.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            ตรวจสอบสถานะอายุการใช้งาน โมดูลที่เปิดสิทธิ์ และการแจ้งต่ออายุแพ็กเกจของบริษัท
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${PLAN_BADGE_STYLE[tier]}`}
                        >
                            แพ็กเกจ {tier}
                        </span>
                        <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${STATUS_BADGE_STYLE[computedSubscriptionStatus]}`}
                        >
                            {computedSubscriptionStatus}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <p className="text-xs text-slate-500 font-semibold">วันครบกำหนดอายุ</p>
                        <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            {currentOrg.expiresAt
                                ? new Date(currentOrg.expiresAt).toLocaleDateString('th-TH', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                  })
                                : 'ไม่จำกัดวันหมดอายุ'}
                        </p>
                        {daysUntilExpiry !== null && (
                            <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                                {daysUntilExpiry >= 0
                                    ? `คงเหลืออีก ${daysUntilExpiry} วัน`
                                    : `เกินกำหนด ${Math.abs(daysUntilExpiry)} วัน`}
                            </p>
                        )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <p className="text-xs text-slate-500 font-semibold">โควตาสมาชิกสูงสุด</p>
                        <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                            {currentOrg.maxMembers || 50} บัญชีผู้ใช้งาน
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            แยกข้อมูลเฉพาะองค์กรของคุณ
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <p className="text-xs text-slate-500 font-semibold">โมดูลที่ได้รับสิทธิ์</p>
                        <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                            {allowedModuleCount} / {ALL_AVAILABLE_MODULES.length} โมดูล
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            ตามระดับแพ็กเกจ {preset.name}
                        </p>
                    </div>
                </div>

                {/* Renewal Form for Customer Org Admin */}
                <form
                    onSubmit={handleSubmit}
                    className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                                แจ้งชำระเงินเพื่อต่ออายุแพ็กเกจ ({preset.name})
                            </h4>
                            <p className="text-xs text-slate-500">
                                ส่งคำขอแจ้งโอนเงินเพื่อให้ระบบต่ออายุวันใช้งานของบริษัทคุณ
                            </p>
                        </div>

                        <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shrink-0">
                            <button
                                type="button"
                                onClick={() => setBillingCycle('MONTHLY')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    billingCycle === 'MONTHLY'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                รายเดือน (฿{preset.monthlyPriceTHB.toLocaleString()})
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingCycle('YEARLY')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    billingCycle === 'YEARLY'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                รายปี (฿{preset.yearlyPriceTHB.toLocaleString()})
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={slipUrl}
                            onChange={e => setSlipUrl(e.target.value)}
                            placeholder="เลขอ้างอิงสลิป / ลิงก์หลักฐานการโอน"
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม (เช่น โอนจากธนาคารกสิกรไทย เวลา 14:20)"
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSubmitting
                                ? 'กำลังส่งข้อมูล...'
                                : `ส่งคำขอต่ออายุ (฿${price.toLocaleString()})`}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right 5 Cols: This Company's Invoice History */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        ประวัติการชำระเงินของบริษัท
                    </h3>
                    <span className="text-xs font-bold font-mono tabular-nums text-slate-500">
                        {myOrgInvoices.length} รายการ
                    </span>
                </div>

                {myOrgInvoices.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                        <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">
                            ยังไม่มีประวัติใบแจ้งหนี้ขององค์กรนี้
                        </p>
                        <p className="text-xs text-slate-500">
                            เมื่อมีการแจ้งชำระเงินหรือต่ออายุแพ็กเกจ รายการจะแสดงที่นี่
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {myOrgInvoices.map(inv => (
                            <div
                                key={inv.id}
                                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900 font-mono">
                                            {inv.invoiceNumber}
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
                                        {inv.planTier} ({inv.billingCycle}) · ฿
                                        {Number(inv.amount).toLocaleString()}
                                    </p>
                                    {inv.note && (
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {inv.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
