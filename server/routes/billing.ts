import express from 'express';
import { serverSupabase as supabase } from '../utils/supabase.js';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql.js';

const router = express.Router();

type PlanKey = keyof typeof SAAS_PLAN_PRESETS;

function resolvePlanPriceTHB(planTier: string, billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME'): number {
    const key = (planTier in SAAS_PLAN_PRESETS ? planTier : 'PRO') as PlanKey;
    const preset = SAAS_PLAN_PRESETS[key];
    if (billingCycle === 'LIFETIME' || key === 'LIFETIME') {
        return SAAS_PLAN_PRESETS.LIFETIME.yearlyPriceTHB;
    }
    return billingCycle === 'YEARLY' ? preset.yearlyPriceTHB : preset.monthlyPriceTHB;
}

/**
 * Helper: Fulfill organization subscription renewal and create PAID invoice
 */
async function fulfillSubscriptionRenewal(params: {
    orgId: string;
    planTier: string;
    billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    amount: number;
    paymentMethod: 'STRIPE' | 'OMISE' | 'BANK_TRANSFER' | 'MANUAL';
    externalChargeId?: string | null;
    note?: string;
}) {
    const { orgId, planTier, billingCycle, amount, paymentMethod, externalChargeId, note } = params;

    const { data: orgRow } = await supabase
        .from('organizations')
        .select('id, name, expires_at, plan_tier, max_members')
        .eq('id', orgId)
        .maybeSingle();

    const now = new Date();
    const baseDate =
        orgRow?.expires_at && new Date(orgRow.expires_at) > now
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

    const resolvedPlan = (
        billingCycle === 'LIFETIME'
            ? 'LIFETIME'
            : planTier || orgRow?.plan_tier || 'PRO'
    ) as PlanKey;

    const preset = SAAS_PLAN_PRESETS[resolvedPlan] || SAAS_PLAN_PRESETS.PRO;
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Update organization subscription status, plan tier, max_members, allowed_modules & expiry
    await supabase
        .from('organizations')
        .update({
            plan_tier: resolvedPlan,
            subscription_status: 'ACTIVE',
            expires_at: nextExpiresAt,
            max_members: Math.max(orgRow?.max_members || 0, preset.defaultMaxMembers),
            allowed_modules: [...preset.defaultModules],
            is_active: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', orgId);

    // 2. Insert PAID invoice record
    await supabase
        .from('subscription_invoices')
        .insert([
            {
                org_id: orgId,
                invoice_number: invoiceNumber,
                plan_tier: resolvedPlan,
                amount,
                currency: 'THB',
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                payment_status: 'PAID',
                external_charge_id: externalChargeId || null,
                note: note || `ชำระเงินต่ออายุอัตโนมัติผ่าน ${paymentMethod}`,
                period_start: baseDate.toISOString(),
                period_end: nextExpiresAt
            }
        ]);

    return {
        orgId,
        invoiceNumber,
        planTier: resolvedPlan,
        subscriptionStatus: 'ACTIVE',
        expiresAt: nextExpiresAt,
        maxMembers: Math.max(orgRow?.max_members || 0, preset.defaultMaxMembers)
    };
}

/**
 * GET /api/billing/webhook-info
 * Returns readiness and schema specification for Stripe / Omise / Custom Billing Webhooks
 */
router.get('/api/billing/webhook-info', (_req, res) => {
    const hasSecret = Boolean(process.env.BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET);
    const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasOmiseKey = Boolean(process.env.OMISE_SECRET_KEY);

    res.json({
        status: 'READY',
        endpoint: '/api/billing/webhook',
        checkoutEndpoint: '/api/billing/create-checkout-session',
        secretConfigured: hasSecret,
        stripeLiveConfigured: hasStripeKey,
        omiseLiveConfigured: hasOmiseKey,
        supportedProviders: ['STRIPE', 'OMISE', 'CUSTOM_SAAS_WEBHOOK'],
        supportedEvents: ['checkout.session.completed', 'invoice.paid', 'charge.complete', 'subscription.renewed']
    });
});

/**
 * POST /api/billing/create-checkout-session
 * Creates an automated payment checkout session for Stripe (Card / PromptPay) or Omise (PromptPay QR).
 * Falls back to Interactive Instant Checkout Simulator when live keys are not configured yet.
 */
router.post('/api/billing/create-checkout-session', async (req, res) => {
    try {
        const body = req.body || {};
        const orgId: string | undefined = body.orgId || body.org_id;
        const planTier: string = body.planTier || body.plan_tier || 'PRO';
        const billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME' =
            body.billingCycle || body.billing_cycle || 'MONTHLY';
        const gateway: 'STRIPE' | 'OMISE' = body.gateway === 'OMISE' ? 'OMISE' : 'STRIPE';
        const origin =
            (req.headers.origin as string) ||
            process.env.APP_URL ||
            `http://localhost:3000`;

        if (!orgId) {
            return res.status(400).json({ error: 'กรุณาระบุรหัสองค์กร (orgId)' });
        }

        const amountTHB = resolvePlanPriceTHB(planTier, billingCycle);
        const amountSatang = Math.round(amountTHB * 100);
        const preset =
            SAAS_PLAN_PRESETS[(planTier in SAAS_PLAN_PRESETS ? planTier : 'PRO') as PlanKey] ||
            SAAS_PLAN_PRESETS.PRO;

        // 1. Live Stripe Checkout Session (when STRIPE_SECRET_KEY is configured)
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (gateway === 'STRIPE' && stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
            const params = new URLSearchParams();
            params.append('mode', 'payment');
            params.append('client_reference_id', orgId);
            params.append('success_url', `${origin}/?billing_success=1&org_id=${encodeURIComponent(orgId)}&plan=${encodeURIComponent(planTier)}`);
            params.append('cancel_url', `${origin}/?billing_canceled=1`);
            params.append('payment_method_types[0]', 'card');
            params.append('payment_method_types[1]', 'promptpay');
            params.append('line_items[0][price_data][currency]', 'thb');
            params.append('line_items[0][price_data][unit_amount]', String(amountSatang));
            params.append(
                'line_items[0][price_data][product_data][name]',
                `Kontent OS - แพ็กเกจ ${preset.name} (${billingCycle})`
            );
            params.append('metadata[org_id]', orgId);
            params.append('metadata[plan_tier]', planTier);
            params.append('metadata[billing_cycle]', billingCycle);

            const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${stripeSecretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            const stripeData: any = await stripeRes.json();
            if (!stripeRes.ok) {
                throw new Error(stripeData?.error?.message || 'Stripe session creation failed');
            }

            return res.json({
                success: true,
                mode: 'LIVE_REDIRECT',
                gateway: 'STRIPE',
                sessionId: stripeData.id,
                checkoutUrl: stripeData.url,
                amount: amountTHB,
                planTier,
                billingCycle
            });
        }

        // 2. Live Omise PromptPay QR Charge (when OMISE_SECRET_KEY is configured)
        const omiseSecretKey = process.env.OMISE_SECRET_KEY;
        if (gateway === 'OMISE' && omiseSecretKey && omiseSecretKey.startsWith('skey_')) {
            const basicAuth = Buffer.from(`${omiseSecretKey}:`).toString('base64');

            const sourceParams = new URLSearchParams();
            sourceParams.append('type', 'promptpay');
            sourceParams.append('amount', String(amountSatang));
            sourceParams.append('currency', 'thb');

            const sourceRes = await fetch('https://api.omise.co/sources', {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: sourceParams.toString()
            });
            const sourceData: any = await sourceRes.json();
            if (!sourceRes.ok || !sourceData.id) {
                throw new Error(sourceData?.message || 'Omise PromptPay source creation failed');
            }

            const chargeParams = new URLSearchParams();
            chargeParams.append('amount', String(amountSatang));
            chargeParams.append('currency', 'thb');
            chargeParams.append('source', sourceData.id);
            chargeParams.append('metadata[org_id]', orgId);
            chargeParams.append('metadata[plan_tier]', planTier);
            chargeParams.append('metadata[billing_cycle]', billingCycle);

            const chargeRes = await fetch('https://api.omise.co/charges', {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: chargeParams.toString()
            });
            const chargeData: any = await chargeRes.json();
            if (!chargeRes.ok || !chargeData.id) {
                throw new Error(chargeData?.message || 'Omise PromptPay charge creation failed');
            }

            const qrImageUrl =
                chargeData?.source?.scannable_code?.image?.download_uri || null;

            return res.json({
                success: true,
                mode: 'LIVE_QR',
                gateway: 'OMISE',
                sessionId: chargeData.id,
                qrImageUrl,
                amount: amountTHB,
                planTier,
                billingCycle
            });
        }

        // 3. Interactive Self-Serve Checkout Session (Works immediately in Demo / Pre-Key Setup)
        const sessionId = `chk_${gateway.toLowerCase()}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        return res.json({
            success: true,
            mode: 'INSTANT_CHECKOUT',
            gateway,
            sessionId,
            orgId,
            planTier,
            planName: preset.name,
            billingCycle,
            amount: amountTHB,
            currency: 'THB',
            promptPayNumber: process.env.PROMPTPAY_ID || '089-999-9999 (บจก. คอนเทนต์ โอเอส)'
        });
    } catch (err: any) {
        console.error('[Billing Checkout] Error creating checkout session:', err);
        return res.status(500).json({ error: err.message || 'ไม่สามารถสร้างรายการชำระเงินได้' });
    }
});

/**
 * POST /api/billing/complete-checkout-session
 * Completes an Instant / PromptPay QR / Stripe Checkout Session and renews the organization immediately.
 */
router.post('/api/billing/complete-checkout-session', async (req, res) => {
    try {
        const body = req.body || {};
        const orgId: string | undefined = body.orgId || body.org_id;
        const planTier: string = body.planTier || body.plan_tier || 'PRO';
        const billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME' =
            body.billingCycle || body.billing_cycle || 'MONTHLY';
        const gateway: 'STRIPE' | 'OMISE' = body.gateway === 'OMISE' ? 'OMISE' : 'STRIPE';
        const sessionId: string =
            body.sessionId || `chg_${gateway.toLowerCase()}_${Date.now()}`;

        if (!orgId) {
            return res.status(400).json({ error: 'Missing orgId' });
        }

        const amount = Number(body.amount || resolvePlanPriceTHB(planTier, billingCycle));
        const result = await fulfillSubscriptionRenewal({
            orgId,
            planTier,
            billingCycle,
            amount,
            paymentMethod: gateway,
            externalChargeId: sessionId,
            note: `ชำระเงินอัตโนมัติสำเร็จผ่าน ${gateway === 'OMISE' ? 'Omise PromptPay QR' : 'Stripe Checkout'} (${sessionId})`
        });

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (err: any) {
        console.error('[Billing Complete Checkout] Error:', err);
        return res.status(500).json({ error: err.message || 'Failed to complete checkout session' });
    }
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

        const resolvedAmount = amount > 0 ? amount : resolvePlanPriceTHB(planTier, billingCycle);
        const result = await fulfillSubscriptionRenewal({
            orgId,
            planTier,
            billingCycle,
            amount: resolvedAmount,
            paymentMethod,
            externalChargeId,
            note: `ต่ออายุอัตโนมัติผ่าน Webhook (${paymentMethod})`
        });

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (err: any) {
        console.error('[Billing Webhook] Error processing webhook:', err);
        return res.status(500).json({ error: err.message || 'Internal webhook error' });
    }
});

export default router;
