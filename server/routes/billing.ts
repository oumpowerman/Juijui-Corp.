import express from 'express';
import { serverSupabase as supabase } from '../utils/supabase.js';

const router = express.Router();

/**
 * GET /api/billing/webhook-info
 * Returns readiness and schema specification for Stripe / Omise / Custom Billing Webhooks
 */
router.get('/api/billing/webhook-info', (_req, res) => {
    const hasSecret = Boolean(process.env.BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET);
    res.json({
        status: 'READY',
        endpoint: '/api/billing/webhook',
        secretConfigured: hasSecret,
        supportedProviders: ['STRIPE', 'OMISE', 'CUSTOM_SAAS_WEBHOOK'],
        supportedEvents: ['checkout.session.completed', 'invoice.paid', 'charge.complete', 'subscription.renewed']
    });
});

/**
 * POST /api/billing/webhook
 * Unified Payment Gateway Webhook Handler (Stripe / Omise / Custom SaaS Billing)
 */
router.post('/api/billing/webhook', async (req, res) => {
    try {
        const configuredSecret = process.env.BILLING_WEBHOOK_SECRET;
        const incomingSecret = req.headers['x-webhook-secret'] || req.headers['x-billing-token'];

        if (configuredSecret && incomingSecret !== configuredSecret) {
            return res.status(401).json({ error: 'Invalid webhook secret signature' });
        }

        const body = req.body || {};

        // Normalize Stripe, Omise, or Direct SaaS payload
        let orgId: string | undefined = body.orgId || body.org_id;
        let planTier: string = body.planTier || body.plan_tier || 'PRO';
        let billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME' = body.billingCycle || body.billing_cycle || 'MONTHLY';
        let amount = Number(body.amount || 0);
        let paymentMethod: 'STRIPE' | 'OMISE' | 'BANK_TRANSFER' | 'MANUAL' = body.paymentMethod || 'STRIPE';
        let externalChargeId: string | null = body.externalChargeId || body.id || null;

        // Stripe Event Normalization
        if (body.type === 'checkout.session.completed' || body.type === 'invoice.paid') {
            const obj = body.data?.object || {};
            const meta = obj.metadata || {};
            orgId = orgId || meta.org_id || meta.orgId || obj.client_reference_id;
            planTier = meta.plan_tier || meta.planTier || planTier;
            billingCycle = (meta.billing_cycle || meta.billingCycle || billingCycle) as any;
            amount = obj.amount_total ? Number(obj.amount_total) / 100 : amount;
            paymentMethod = 'STRIPE';
            externalChargeId = obj.id || body.id || null;
        }

        // Omise Event Normalization
        if (body.key === 'charge.complete' && body.data) {
            const charge = body.data;
            if (charge.status !== 'successful') {
                return res.status(200).json({ received: true, ignored: 'Charge not successful' });
            }
            const meta = charge.metadata || {};
            orgId = orgId || meta.org_id || meta.orgId;
            planTier = meta.plan_tier || meta.planTier || planTier;
            billingCycle = (meta.billing_cycle || meta.billingCycle || billingCycle) as any;
            amount = charge.amount ? Number(charge.amount) / 100 : amount;
            paymentMethod = 'OMISE';
            externalChargeId = charge.id || null;
        }

        if (!orgId) {
            return res.status(400).json({ error: 'Missing orgId in webhook payload or metadata' });
        }

        // Fetch existing organization to compute new expiration date
        const { data: orgRow } = await supabase
            .from('organizations')
            .select('id, name, expires_at, plan_tier')
            .eq('id', orgId)
            .maybeSingle();

        const now = new Date();
        const baseDate = orgRow?.expires_at && new Date(orgRow.expires_at) > now
            ? new Date(orgRow.expires_at)
            : now;

        let nextExpiresAt: string | null = null;
        if (billingCycle === 'MONTHLY') {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + 30);
            nextExpiresAt = d.toISOString();
        } else if (billingCycle === 'YEARLY') {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + 365);
            nextExpiresAt = d.toISOString();
        } else {
            nextExpiresAt = null;
        }

        const resolvedPlan = billingCycle === 'LIFETIME' ? 'LIFETIME' : (planTier || orgRow?.plan_tier || 'PRO');
        const invoiceNumber = `WH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 1. Update organization subscription status & expiry
        await supabase
            .from('organizations')
            .update({
                plan_tier: resolvedPlan,
                subscription_status: 'ACTIVE',
                expires_at: nextExpiresAt,
                is_active: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId);

        // 2. Insert PAID invoice record
        await supabase
            .from('subscription_invoices')
            .insert([{
                org_id: orgId,
                invoice_number: invoiceNumber,
                plan_tier: resolvedPlan,
                amount,
                currency: 'THB',
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                payment_status: 'PAID',
                external_charge_id: externalChargeId,
                note: `ต่ออายุอัตโนมัติผ่าน Webhook (${paymentMethod})`,
                period_start: baseDate.toISOString(),
                period_end: nextExpiresAt
            }]);

        return res.status(200).json({
            success: true,
            orgId,
            invoiceNumber,
            planTier: resolvedPlan,
            subscriptionStatus: 'ACTIVE',
            expiresAt: nextExpiresAt
        });
    } catch (err: any) {
        console.error('[Billing Webhook] Error processing webhook:', err);
        return res.status(500).json({ error: err.message || 'Internal webhook error' });
    }
});

export default router;
