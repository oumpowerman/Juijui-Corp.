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
    customAllowedModules?: string[];
    customMaxMembers?: number;
}) {
    const {
        orgId,
        planTier,
        billingCycle,
        amount,
        paymentMethod,
        externalChargeId,
        note,
        customAllowedModules,
        customMaxMembers
    } = params;

    const { data: orgRow } = await supabase
        .from('organizations')
        .select('id, name, expires_at, plan_tier, max_members, allowed_modules')
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

    const resolvedAllowedModules =
        Array.isArray(customAllowedModules) && customAllowedModules.length > 0
            ? customAllowedModules
            : Array.isArray(orgRow?.allowed_modules) && orgRow.allowed_modules.length > 0
            ? orgRow.allowed_modules
            : [...preset.defaultModules];

    const resolvedMaxMembers =
        typeof customMaxMembers === 'number' && customMaxMembers > 0
            ? customMaxMembers
            : Math.max(orgRow?.max_members || 0, preset.defaultMaxMembers);

    // 1. Update organization subscription status, plan tier, max_members, allowed_modules & expiry
    await supabase
        .from('organizations')
        .update({
            plan_tier: resolvedPlan,
            subscription_status: 'ACTIVE',
            expires_at: nextExpiresAt,
            max_members: resolvedMaxMembers,
            allowed_modules: resolvedAllowedModules,
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
        maxMembers: resolvedMaxMembers,
        allowedModules: resolvedAllowedModules
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
 * POST /api/billing/provision-fast-checkout-org
 * Server-Side Admin Provisioning for Fast Checkout Modal (Step 1).
 * Uses Service Role Key to bypass RLS & legacy COALESCE triggers, ensuring:
 * 1. New row in `organizations` with exact allowed_modules & max_members
 * 2. Creator enrolled as ACTIVE OWNER in `organization_members`
 * 3. Default `master_options` seeded for the new org
 * 4. `profiles.current_org_id` forcibly updated to the new org ID
 */
router.post('/api/billing/provision-fast-checkout-org', async (req, res) => {
    try {
        const body = req.body || {};
        const userId: string | undefined = body.userId;
        const userEmail: string | undefined = body.userEmail;
        const orgName: string = String(body.orgName || '').trim();
        const description: string = String(body.description || '').trim();
        const planTier: PlanKey = (body.planTier in SAAS_PLAN_PRESETS ? body.planTier : 'PRO') as PlanKey;
        const preset = SAAS_PLAN_PRESETS[planTier] || SAAS_PLAN_PRESETS.PRO;
        const maxMembers: number = Number(body.maxMembers) > 0 ? Number(body.maxMembers) : preset.defaultMaxMembers;
        const allowedModules: string[] =
            Array.isArray(body.allowedModules) && body.allowedModules.length > 0
                ? body.allowedModules
                : [...preset.defaultModules];
        const inviteCode: string =
            String(body.inviteCode || '').trim() ||
            `ORG-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        if (!userId || !orgName) {
            return res.status(400).json({ error: 'กรุณาระบุ userId และชื่อองค์กร (orgName)' });
        }

        // 1. Ensure user's profile row exists before linking organization_members FK
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', userId)
            .maybeSingle();

        if (!existingProfile) {
            const emailPrefix = (userEmail || 'owner')
                .split('@')[0]
                .toLowerCase()
                .replace(/[^a-z0-9_.]/g, '')
                .slice(0, 14) || 'owner';
            const autoUsername = `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;

            await supabase.from('profiles').upsert({
                id: userId,
                email: userEmail || null,
                username: autoUsername,
                full_name: orgName,
                first_name: orgName,
                last_name: '',
                nickname: orgName.slice(0, 20),
                position: 'Founder / Owner',
                employment_type: 'FULL_TIME',
                start_date: new Date().toISOString(),
                role: 'ADMIN',
                is_approved: true,
                is_active: true,
                status: 'ACTIVE',
                work_days: [1, 2, 3, 4, 5],
                hp: 100,
                max_hp: 100,
                xp: 0,
                level: 1,
                available_points: 0,
                death_count: 0,
                emoji: '👑'
            }, { onConflict: 'id' });
        }

        // 2. Insert new organization
        const slugBase =
            orgName
                .toLowerCase()
                .replace(/[^a-z0-9ก-๙]+/g, '-')
                .replace(/^-+|-+$/g, '') || `studio-${Date.now()}`;
        const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
        const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const orgInsertPayload: Record<string, any> = {
            name: orgName,
            slug: uniqueSlug,
            description: description || `แพ็กเกจ ${preset.name} (Trial 7 วัน)`,
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            logo_url: '',
            invite_code: inviteCode,
            invite_enabled: true,
            owner_id: userId,
            plan_tier: planTier,
            subscription_status: 'TRIAL',
            expires_at: trialExpiresAt,
            grace_period_days: 3,
            max_members: maxMembers,
            allowed_modules: allowedModules,
            billing_email: userEmail || null,
            is_active: true
        };

        let { data: createdOrg, error: createOrgErr } = await supabase
            .from('organizations')
            .insert([orgInsertPayload])
            .select('*')
            .single();

        if (createOrgErr) {
            const minimalPayload = {
                name: orgName,
                slug: uniqueSlug,
                description: orgInsertPayload.description,
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                invite_code: inviteCode,
                invite_enabled: true,
                owner_id: userId,
                plan_tier: planTier,
                is_active: true
            };
            const retry = await supabase
                .from('organizations')
                .insert([minimalPayload])
                .select('*')
                .single();
            if (retry.error) {
                throw retry.error;
            }
            createdOrg = retry.data;
        }

        const newOrgId: string = createdOrg.id;

        // 3. Upsert creator as ACTIVE OWNER in organization_members
        const { error: memberErr } = await supabase
            .from('organization_members')
            .upsert(
                [
                    {
                        org_id: newOrgId,
                        user_id: userId,
                        role: 'OWNER',
                        status: 'ACTIVE'
                    }
                ],
                { onConflict: 'org_id,user_id' }
            );

        if (memberErr) {
            console.warn('[FastCheckout Provision] organization_members upsert warning:', memberErr.message);
        }

        // 4. Seed default master_options for the new organization
        try {
            await supabase.rpc('seed_organization_defaults', { target_org_id: newOrgId });
        } catch (seedErr) {
            console.warn('[FastCheckout Provision] seed_organization_defaults warning:', seedErr);
        }

        // 5. CRITICAL: Force update profiles.current_org_id AFTER organization_members trigger
        // so COALESCE(current_org_id, NEW.org_id) never leaves the user stuck on their first org!
        const { error: profileUpdateErr } = await supabase
            .from('profiles')
            .update({
                is_approved: true,
                role: 'ADMIN',
                current_org_id: newOrgId
            })
            .eq('id', userId);

        if (profileUpdateErr) {
            // Fallback if current_org_id column is not yet present
            await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    role: 'ADMIN'
                })
                .eq('id', userId);
        }

        return res.status(200).json({
            success: true,
            orgId: newOrgId,
            orgName: createdOrg.name,
            org: createdOrg
        });
    } catch (err: any) {
        console.error('[Billing Provision Fast Checkout Org] Error:', err);
        return res.status(500).json({
            error: err.message || 'ไม่สามารถสร้างพื้นที่ทำงานองค์กรใหม่ได้'
        });
    }
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
        const customAmountTHB = Number(body.customAmountTHB || body.amount || 0);
        const customPlanLabel: string | undefined = body.customPlanLabel;
        const origin =
            (req.headers.origin as string) ||
            process.env.APP_URL ||
            `http://localhost:3000`;

        if (!orgId) {
            return res.status(400).json({ error: 'กรุณาระบุรหัสองค์กร (orgId)' });
        }

        const amountTHB =
            customAmountTHB > 0 ? customAmountTHB : resolvePlanPriceTHB(planTier, billingCycle);
        const amountSatang = Math.round(amountTHB * 100);
        const preset =
            SAAS_PLAN_PRESETS[(planTier in SAAS_PLAN_PRESETS ? planTier : 'PRO') as PlanKey] ||
            SAAS_PLAN_PRESETS.PRO;
        const resolvedPlanLabel = customPlanLabel || preset.name;

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
                `Kontent OS - ${resolvedPlanLabel} (${billingCycle})`
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
            planName: resolvedPlanLabel,
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
        const customAllowedModules: string[] | undefined = Array.isArray(body.customAllowedModules)
            ? body.customAllowedModules
            : undefined;
        const customMaxMembers: number | undefined =
            typeof body.customMaxMembers === 'number' ? body.customMaxMembers : undefined;
        const customNote: string | undefined = body.customNote;

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
            customAllowedModules,
            customMaxMembers,
            note:
                customNote ||
                `ชำระเงินอัตโนมัติสำเร็จผ่าน ${gateway === 'OMISE' ? 'Omise PromptPay QR' : 'Stripe Checkout'} (${sessionId})`
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
