import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Organization,
    PlanTier,
    SubscriptionInvoice,
    User
} from '../../types';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { UpdateOrganizationLicenseInput } from './types';

interface UseOrganizationBillingDomainProps {
    currentUserProfile: User | null;
    isSuperAdmin: boolean;
    currentOrg: Organization;
    allPlatformOrganizations: Organization[];
    invoices: SubscriptionInvoice[];
    updateOrganizationLicense: (orgId: string, updates: UpdateOrganizationLicenseInput) => Promise<boolean>;
    fetchOrganizationsAndMembers: () => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useOrganizationBillingDomain({
    currentUserProfile,
    isSuperAdmin,
    currentOrg,
    allPlatformOrganizations,
    invoices,
    updateOrganizationLicense,
    fetchOrganizationsAndMembers,
    showToast
}: UseOrganizationBillingDomainProps) {
    const renewOrganizationSubscription = useCallback(async (
        orgId: string,
        cycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
        amount?: number,
        note?: string
    ): Promise<boolean> => {
        if (!isSuperAdmin) {
            showToast('เฉพาะ Super Admin เท่านั้นที่สามารถอนุมัติต่ออายุแพ็กเกจได้', 'error');
            return false;
        }

        const targetOrg = allPlatformOrganizations.find(o => o.id === orgId);
        if (!targetOrg) return false;

        const now = new Date();
        const baseDate = targetOrg.expiresAt && new Date(targetOrg.expiresAt) > now
            ? new Date(targetOrg.expiresAt)
            : now;

        let nextExpiresAt: string | null = null;
        if (cycle === 'MONTHLY') {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + 30);
            nextExpiresAt = d.toISOString();
        } else if (cycle === 'YEARLY') {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + 365);
            nextExpiresAt = d.toISOString();
        } else {
            nextExpiresAt = null;
        }

        const nextPlanTier: PlanTier = cycle === 'LIFETIME' ? 'LIFETIME' : (targetOrg.planTier || 'PRO');
        const preset = SAAS_PLAN_PRESETS[nextPlanTier] || SAAS_PLAN_PRESETS.PRO;
        const resolvedAmount = amount ?? (
            cycle === 'YEARLY'
                ? preset.yearlyPriceTHB
                : cycle === 'MONTHLY'
                ? preset.monthlyPriceTHB
                : preset.yearlyPriceTHB
        );
        const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const updated = await updateOrganizationLicense(orgId, {
            planTier: nextPlanTier,
            subscriptionStatus: 'ACTIVE',
            expiresAt: nextExpiresAt,
            isActive: true
        });

        if (!updated) return false;

        try {
            await supabase
                .from('subscription_invoices')
                .insert([{
                    org_id: orgId,
                    invoice_number: invoiceNumber,
                    plan_tier: nextPlanTier,
                    amount: resolvedAmount,
                    currency: 'THB',
                    billing_cycle: cycle,
                    payment_method: 'MANUAL',
                    payment_status: 'PAID',
                    note: note || `ต่ออายุแพ็กเกจ (${cycle}) โดย Super Admin`,
                    period_start: baseDate.toISOString(),
                    period_end: nextExpiresAt,
                    approved_by: currentUserProfile?.id || null
                }]);

            await fetchOrganizationsAndMembers();
            showToast(`ต่ออายุแพ็กเกจให้ "${targetOrg.name}" (${cycle}) เรียบร้อยแล้ว`, 'success');
            return true;
        } catch (err) {
            console.warn('[OrganizationContext] Invoice log warning:', err);
            return true;
        }
    }, [
        isSuperAdmin,
        allPlatformOrganizations,
        updateOrganizationLicense,
        currentUserProfile?.id,
        fetchOrganizationsAndMembers,
        showToast
    ]);

    const submitRenewalRequest = useCallback(async (input: {
        billingCycle: 'MONTHLY' | 'YEARLY';
        amount: number;
        note?: string;
        slipUrl?: string;
    }): Promise<boolean> => {
        if (!currentUserProfile?.id) return false;
        const invoiceNumber = `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const planTier = currentOrg.planTier || 'PRO';

        try {
            const { error } = await supabase
                .from('subscription_invoices')
                .insert([{
                    org_id: currentOrg.id,
                    invoice_number: invoiceNumber,
                    plan_tier: planTier,
                    amount: input.amount,
                    currency: 'THB',
                    billing_cycle: input.billingCycle,
                    payment_method: 'BANK_TRANSFER',
                    payment_status: 'PENDING',
                    slip_url: input.slipUrl || null,
                    note: input.note || `แจ้งชำระเงินต่ออายุแพ็กเกจ ${planTier} (${input.billingCycle})`
                }]);
            if (error) throw error;

            await fetchOrganizationsAndMembers();
            showToast('ส่งรายการแจ้งชำระเงินต่ออายุเรียบร้อยแล้ว รอผู้ดูแลระบบตรวจสอบ', 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] submitRenewalRequest error:', err);
            showToast('ไม่สามารถส่งคำขอต่ออายุได้: ' + err.message, 'error');
            return false;
        }
    }, [currentUserProfile?.id, currentOrg.id, currentOrg.planTier, fetchOrganizationsAndMembers, showToast]);

    const approveInvoiceRequest = useCallback(async (invoiceId: string): Promise<boolean> => {
        if (!isSuperAdmin) return false;
        const targetInv = invoices.find(i => i.id === invoiceId);
        if (!targetInv) return false;

        try {
            const renewed = await renewOrganizationSubscription(
                targetInv.orgId,
                targetInv.billingCycle,
                targetInv.amount,
                `อนุมัติใบแจ้งหนี้ ${targetInv.invoiceNumber}`
            );
            if (!renewed) return false;

            await supabase
                .from('subscription_invoices')
                .update({
                    payment_status: 'PAID',
                    approved_by: currentUserProfile?.id || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoiceId);

            await fetchOrganizationsAndMembers();
            return true;
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาดในการอนุมัติบิล: ' + err.message, 'error');
            return false;
        }
    }, [isSuperAdmin, invoices, renewOrganizationSubscription, currentUserProfile?.id, fetchOrganizationsAndMembers, showToast]);

    const rejectInvoiceRequest = useCallback(async (invoiceId: string): Promise<boolean> => {
        if (!isSuperAdmin) return false;
        try {
            await supabase
                .from('subscription_invoices')
                .update({
                    payment_status: 'REJECTED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoiceId);

            await fetchOrganizationsAndMembers();
            showToast('ปฏิเสธรายการแจ้งชำระเงินแล้ว', 'info');
            return true;
        } catch (err: any) {
            showToast('ไม่สามารถปฏิเสธรายการได้: ' + err.message, 'error');
            return false;
        }
    }, [isSuperAdmin, fetchOrganizationsAndMembers, showToast]);

    return {
        renewOrganizationSubscription,
        submitRenewalRequest,
        approveInvoiceRequest,
        rejectInvoiceRequest
    };
}
