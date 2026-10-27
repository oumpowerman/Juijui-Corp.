import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Loader2,
  Lock,
  Mail,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PlanTier } from '../../types';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { setActiveOrgIdSync, setForceActiveOrgIdSync } from '../../lib/tenantStorage';
import { generateRandomInviteCode } from '../../context/organization/types';
import {
  stageAuthPortalTransition,
  triggerAuthPortalTransition,
} from '../auth/AuthPortalTransition';
import {
  getPlatformLandingConfig,
  normalizeBillingPaymentConfig,
  PlatformBillingPaymentConfig,
} from '../../services/landingConfigService';

export interface FastCheckoutOrderPayload {
  source: 'PRICING' | 'ALACARTE';
  planTier: PlanTier;
  planTitle: string;
  planSubtitle?: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  amountTHB: number;
  maxMembers: number;
  allowedModules: string[];
  addonCount?: number;
}

interface FastCheckoutOnboardingModalProps {
  order: FastCheckoutOrderPayload | null;
  billingConfig?: PlatformBillingPaymentConfig;
  onClose: () => void;
  onCompletedEnterApp: () => void;
}

type StepMode = 'STEP_1_IDENTITY' | 'STEP_2_PAYMENT';
type AuthTabMode = 'REGISTER' | 'LOGIN';
type PaymentChannelTab = 'OMISE_QR' | 'STRIPE' | 'BANK_SLIP';

interface ActiveCheckoutSession {
  sessionId: string;
  mode: 'LIVE_REDIRECT' | 'LIVE_QR' | 'INSTANT_CHECKOUT';
  gateway: 'STRIPE' | 'OMISE';
  amount: number;
  qrImageUrl?: string | null;
  checkoutUrl?: string | null;
  promptPayNumber?: string;
}

const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } },
};

const modalDialogVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stepContentVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const tabIndicatorSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
};

export function setFastCheckoutHold(hold: boolean) {
  if (typeof window === 'undefined') return;
  if (hold) {
    sessionStorage.setItem('juijui_fast_checkout_hold', '1');
  } else {
    sessionStorage.removeItem('juijui_fast_checkout_hold');
  }
  window.dispatchEvent(
    new CustomEvent('juijui-fast-checkout-hold-change', { detail: { hold } })
  );
}

export function isFastCheckoutHoldActive(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('juijui_fast_checkout_hold') === '1';
}

export const FastCheckoutOnboardingModal: React.FC<FastCheckoutOnboardingModalProps> = ({
  order,
  billingConfig: propBillingConfig,
  onClose,
  onCompletedEnterApp,
}) => {
  const [billingConfig, setBillingConfig] = useState<PlatformBillingPaymentConfig>(() =>
    normalizeBillingPaymentConfig(propBillingConfig || null)
  );

  // Sync with prop or latest database config + live Super Admin updates
  useEffect(() => {
    if (propBillingConfig) {
      setBillingConfig(normalizeBillingPaymentConfig(propBillingConfig));
    } else {
      getPlatformLandingConfig()
        .then((cfg) => {
          if (cfg.billing_payment_config) {
            setBillingConfig(cfg.billing_payment_config);
          }
        })
        .catch(() => {});
    }

    const handleConfigUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail) {
        setBillingConfig(normalizeBillingPaymentConfig(detail));
      }
    };

    window.addEventListener('platform-billing-config-updated', handleConfigUpdated);
    return () => window.removeEventListener('platform-billing-config-updated', handleConfigUpdated);
  }, [propBillingConfig]);

  const availableChannels = useMemo(() => {
    const list: { id: PaymentChannelTab; label: string; icon: React.ElementType }[] = [];
    if (billingConfig.enablePromptPayQr) {
      list.push({ id: 'OMISE_QR', label: 'PromptPay QR', icon: QrCode });
    }
    if (billingConfig.enableStripeCard) {
      list.push({ id: 'STRIPE', label: 'บัตรเครดิต Stripe', icon: CreditCard });
    }
    if (billingConfig.enableBankSlip) {
      list.push({ id: 'BANK_SLIP', label: 'โอนเงิน / สลิป', icon: FileText });
    }
    if (list.length === 0) {
      list.push({ id: 'OMISE_QR', label: 'PromptPay QR', icon: QrCode });
    }
    return list;
  }, [
    billingConfig.enablePromptPayQr,
    billingConfig.enableStripeCard,
    billingConfig.enableBankSlip,
  ]);

  const [step, setStep] = useState<StepMode>('STEP_1_IDENTITY');
  const [authTab, setAuthTab] = useState<AuthTabMode>('REGISTER');
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannelTab>(() =>
    availableChannels[0]?.id || 'OMISE_QR'
  );

  // Ensure paymentChannel stays valid if Super Admin toggles channels
  useEffect(() => {
    if (!availableChannels.some((c) => c.id === paymentChannel)) {
      setPaymentChannel(availableChannels[0]?.id || 'OMISE_QR');
    }
  }, [availableChannels, paymentChannel]);

  // Step 1 form state (3 concise fields)
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [existingUser, setExistingUser] = useState<{ id: string; email?: string } | null>(null);

  // Created Workspace state from Step 1
  const [provisionedOrgId, setProvisionedOrgId] = useState<string | null>(null);
  const [provisionedOrgName, setProvisionedOrgName] = useState<string>('');

  // Step 2 Payment state
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckoutSession | null>(null);
  const [slipReference, setSlipReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status & Loading state
  const [isStep1Submitting, setIsStep1Submitting] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if user is already signed in when opening the modal
  useEffect(() => {
    if (!order) return;
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session?.user) {
        setExistingUser({
          id: data.session.user.id,
          email: data.session.user.email,
        });
        if (data.session.user.email) {
          setEmail(data.session.user.email);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [order]);

  // Support Escape key dismissal when not actively processing
  useEffect(() => {
    if (!order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isStep1Submitting && !isCompletingPayment) {
        handleDismissModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, isStep1Submitting, isCompletingPayment, provisionedOrgId]);

  const releaseHoldAndEnterWorkspace = useCallback(() => {
    if (provisionedOrgId) {
      setForceActiveOrgIdSync(provisionedOrgId);
      setActiveOrgIdSync(provisionedOrgId);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('juijui_superadmin_portal_mode', 'WORKSPACE');
        window.dispatchEvent(
          new CustomEvent('org-workspace-switched', {
            detail: { orgId: provisionedOrgId, orgName: provisionedOrgName },
          })
        );
      }
    }
    stageAuthPortalTransition('REGISTER_TRIAL');
    triggerAuthPortalTransition('REGISTER_TRIAL');
    onCompletedEnterApp();
    window.setTimeout(() => {
      setFastCheckoutHold(false);
    }, 180);
  }, [onCompletedEnterApp, provisionedOrgId, provisionedOrgName]);

  const handleDismissModal = () => {
    if (provisionedOrgId) {
      // If Step 1 already created a trial workspace and user closes modal, enter their new workspace
      releaseHoldAndEnterWorkspace();
      return;
    }
    setFastCheckoutHold(false);
    onClose();
  };

  const handleCopyValue = (value: string, key: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  // Automatically create checkout session when entering Step 2 and choosing OMISE_QR or STRIPE
  const initiateGatewaySession = useCallback(
    async (targetOrgId: string, gateway: 'OMISE' | 'STRIPE') => {
      if (!order) return;
      setIsCreatingSession(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/billing/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: targetOrgId,
            planTier: order.planTier,
            billingCycle: order.billingCycle,
            gateway,
            customAmountTHB: order.amountTHB,
            customPlanLabel: order.planTitle,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'ไม่สามารถสร้างรายการชำระเงินได้');
        }
        setActiveCheckout({
          sessionId: data.sessionId,
          mode: data.mode,
          gateway,
          amount: data.amount || order.amountTHB,
          qrImageUrl:
            data.qrImageUrl ||
            (gateway === 'OMISE' && billingConfig.promptPayQrImageUrl
              ? billingConfig.promptPayQrImageUrl
              : null),
          checkoutUrl: data.checkoutUrl || null,
          promptPayNumber:
            billingConfig.promptPayId ||
            data.promptPayNumber ||
            '089-999-9999',
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างเซสชันชำระเงิน');
      } finally {
        setIsCreatingSession(false);
      }
    },
    [order, billingConfig.promptPayQrImageUrl, billingConfig.promptPayId]
  );

  useEffect(() => {
    if (step === 'STEP_2_PAYMENT' && provisionedOrgId) {
      if (paymentChannel === 'OMISE_QR') {
        initiateGatewaySession(provisionedOrgId, 'OMISE');
      } else if (paymentChannel === 'STRIPE') {
        initiateGatewaySession(provisionedOrgId, 'STRIPE');
      }
    }
  }, [step, provisionedOrgId, paymentChannel, initiateGatewaySession]);

  if (!order) return null;

  const cycleLabel =
    order.billingCycle === 'LIFETIME'
      ? 'ตลอดชีพ (จ่ายครั้งเดียว)'
      : order.billingCycle === 'YEARLY'
      ? 'รายปี (ประหยัด 2 เดือน)'
      : 'รายเดือน';

  /**
   * STEP 1 HANDLER: Authenticate/Register User + Provision Workspace with Custom Modules
   */
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOrgName = orgName.trim();
    if (!cleanOrgName) {
      setErrorMsg('กรุณาระบุชื่อบริษัท หรือชื่อสตูดิโอของคุณ');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!existingUser) {
      if (!cleanEmail) {
        setErrorMsg('กรุณากรอกอีเมลสำหรับบัญชีผู้ดูแลสูงสุด');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
    }

    setIsStep1Submitting(true);
    setFastCheckoutHold(true);

    try {
      let resolvedUserId = existingUser?.id || '';
      let resolvedUserEmail = existingUser?.email || cleanEmail;

      if (!existingUser) {
        if (authTab === 'REGISTER') {
          const emailPrefix =
            cleanEmail
              .split('@')[0]
              .replace(/[^a-z0-9_.]/g, '')
              .slice(0, 14) || 'owner';
          const autoUsername = `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;

          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanOrgName,
                position: 'Founder / Owner',
              },
            },
          });

          if (signUpErr) {
            if (
              signUpErr.message.toLowerCase().includes('already registered') ||
              signUpErr.message.toLowerCase().includes('already exists')
            ) {
              throw new Error(
                'อีเมลนี้มีในระบบแล้ว กรุณาสลับไปที่แท็บ "มีบัญชีอยู่แล้ว (เข้าสู่ระบบ)" ด้านบน'
              );
            }
            throw signUpErr;
          }

          if (!signUpData.user) {
            throw new Error('ไม่สามารถสร้างบัญชีผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
          }

          resolvedUserId = signUpData.user.id;
          resolvedUserEmail = signUpData.user.email || cleanEmail;

          await supabase.from('profiles').upsert({
            id: resolvedUserId,
            email: resolvedUserEmail,
            username: autoUsername,
            full_name: cleanOrgName,
            first_name: cleanOrgName,
            last_name: '',
            nickname: cleanOrgName.slice(0, 20),
            position: 'Founder / Owner',
            employment_type: 'FULL_TIME',
            start_date: new Date().toISOString(),
            role: 'ADMIN',
            is_approved: true,
            work_days: [1, 2, 3, 4, 5],
            hp: 100,
            max_hp: 100,
            xp: 0,
            level: 1,
            available_points: 0,
            death_count: 0,
            emoji: '👑',
          });
        } else {
          let loginEmail = cleanEmail;
          if (!cleanEmail.includes('@')) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('email')
              .eq('username', cleanEmail)
              .maybeSingle();
            loginEmail = prof?.email || `${cleanEmail}@juijui-app.com`;
          }

          const { data: signInData, error: signInErr } =
            await supabase.auth.signInWithPassword({
              email: loginEmail,
              password,
            });

          if (signInErr || !signInData.user) {
            throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
          }

          resolvedUserId = signInData.user.id;
          resolvedUserEmail = signInData.user.email || loginEmail;
        }
      }

      const inviteCode = generateRandomInviteCode(cleanOrgName);
      const preset = SAAS_PLAN_PRESETS[order.planTier] || SAAS_PLAN_PRESETS.PRO;
      const finalAllowedModules =
        order.allowedModules && order.allowedModules.length > 0
          ? order.allowedModules
          : [...preset.defaultModules];
      const orgDescription =
        order.source === 'ALACARTE'
          ? `โครงสร้าง À La Carte (${finalAllowedModules.length} โมดูล · สูงสุด ${order.maxMembers} บัญชี)`
          : `แพ็กเกจ ${order.planTitle} (${cycleLabel})`;

      let newOrgId = '';

      // Primary Path: Server-Side Admin Provisioning (bypasses RLS & legacy COALESCE triggers)
      try {
        const provRes = await fetch('/api/billing/provision-fast-checkout-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: resolvedUserId,
            userEmail: resolvedUserEmail,
            orgName: cleanOrgName,
            description: orgDescription,
            planTier: order.planTier,
            maxMembers: order.maxMembers,
            allowedModules: finalAllowedModules,
            inviteCode,
          }),
        });
        const provData = await provRes.json();
        if (provRes.ok && provData?.orgId) {
          newOrgId = provData.orgId;
        }
      } catch (serverErr) {
        console.warn('[FastCheckout] Fallback to client-side org provisioning:', serverErr);
      }

      // Fallback Path if server route was unreachable
      if (!newOrgId) {
        const slugBase =
          cleanOrgName
            .toLowerCase()
            .replace(/[^a-z0-9ก-๙]+/g, '-')
            .replace(/^-+|-+$/g, '') || `studio-${Date.now()}`;
        const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
        const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const orgInsertPayload: Record<string, any> = {
          name: cleanOrgName,
          slug: uniqueSlug,
          description: orgDescription,
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          logo_url: '',
          invite_code: inviteCode,
          invite_enabled: true,
          owner_id: resolvedUserId,
          plan_tier: order.planTier,
          subscription_status: 'TRIAL',
          expires_at: trialExpiresAt,
          grace_period_days: 3,
          max_members: order.maxMembers,
          allowed_modules: finalAllowedModules,
          billing_email: resolvedUserEmail || null,
          is_active: true,
        };

        let { data: createdOrg, error: createOrgErr } = await supabase
          .from('organizations')
          .insert([orgInsertPayload])
          .select('*')
          .single();

        if (createOrgErr) {
          const minimalPayload = {
            name: cleanOrgName,
            slug: uniqueSlug,
            description: orgInsertPayload.description,
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            invite_code: inviteCode,
            invite_enabled: true,
            owner_id: resolvedUserId,
            plan_tier: order.planTier,
            is_active: true,
          };
          const retry = await supabase
            .from('organizations')
            .insert([minimalPayload])
            .select('*')
            .single();
          if (retry.error) throw retry.error;
          createdOrg = retry.data;
        }

        newOrgId = createdOrg.id;

        await supabase.from('organization_members').upsert(
          [
            {
              org_id: newOrgId,
              user_id: resolvedUserId,
              role: 'OWNER',
              status: 'ACTIVE',
            },
          ],
          { onConflict: 'org_id,user_id' }
        );

        try {
          await supabase.rpc('seed_organization_defaults', { target_org_id: newOrgId });
        } catch {
          // Ignore if RPC is not present
        }

        await supabase
          .from('profiles')
          .update({
            is_approved: true,
            role: 'ADMIN',
            current_org_id: newOrgId,
          })
          .eq('id', resolvedUserId);
      }

      setForceActiveOrgIdSync(newOrgId);
      setActiveOrgIdSync(newOrgId);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('juijui_superadmin_portal_mode', 'WORKSPACE');
        window.dispatchEvent(
          new CustomEvent('org-workspace-switched', {
            detail: { orgId: newOrgId, orgName: cleanOrgName },
          })
        );
      }
      setProvisionedOrgId(newOrgId);
      setProvisionedOrgName(cleanOrgName);
      setStep('STEP_2_PAYMENT');
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างพื้นที่ทำงาน');
      if (!provisionedOrgId) {
        setFastCheckoutHold(false);
      }
    } finally {
      setIsStep1Submitting(false);
    }
  };

  /**
   * STEP 2 HANDLER A: Complete Instant / PromptPay QR / Stripe Payment
   */
  const handleCompleteGatewayPayment = async () => {
    if (!provisionedOrgId) return;
    setIsCompletingPayment(true);
    setErrorMsg(null);

    try {
      if (activeCheckout?.mode === 'LIVE_REDIRECT' && activeCheckout.checkoutUrl) {
        setFastCheckoutHold(false);
        window.location.href = activeCheckout.checkoutUrl;
        return;
      }

      const gateway = paymentChannel === 'OMISE_QR' ? 'OMISE' : 'STRIPE';
      const customNote =
        order.source === 'ALACARTE'
          ? `ชำระเงินเปิดองค์กร À La Carte (${order.allowedModules.length} โมดูล, ${order.maxMembers} บัญชี) ผ่าน ${
              gateway === 'OMISE' ? 'PromptPay QR' : 'Stripe Checkout'
            }`
          : `ชำระเงินเปิดองค์กรแพ็กเกจ ${order.planTitle} ผ่าน ${
              gateway === 'OMISE' ? 'PromptPay QR' : 'Stripe Checkout'
            }`;

      const res = await fetch('/api/billing/complete-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: provisionedOrgId,
          planTier: order.planTier,
          billingCycle: order.billingCycle,
          gateway,
          sessionId: activeCheckout?.sessionId,
          amount: order.amountTHB,
          customAllowedModules: order.allowedModules,
          customMaxMembers: order.maxMembers,
          customNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'ไม่สามารถยืนยันการชำระเงินได้');
      }

      releaseHoldAndEnterWorkspace();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการยืนยันยอดชำระ');
      setIsCompletingPayment(false);
    }
  };

  /**
   * STEP 2 HANDLER B: Submit Bank Slip Reference & Enter Workspace Immediately
   */
  const handleSubmitBankSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionedOrgId) return;
    if (!slipReference.trim()) {
      setErrorMsg('กรุณากรอกเลขที่อ้างอิงสลิป หรือวัน-เวลาที่โอนเงิน');
      return;
    }

    setIsCompletingPayment(true);
    setErrorMsg(null);

    try {
      const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      await supabase.from('subscription_invoices').insert([
        {
          org_id: provisionedOrgId,
          invoice_number: invoiceNumber,
          plan_tier: order.planTier,
          amount: order.amountTHB,
          currency: 'THB',
          billing_cycle: order.billingCycle,
          payment_method: 'BANK_TRANSFER',
          payment_status: 'PENDING_VERIFICATION',
          external_charge_id: slipReference.trim(),
          note:
            paymentNote.trim() ||
            `แจ้งโอนเงินเปิดองค์กร (${order.planTitle}) · อ้างอิง: ${slipReference.trim()}`,
          period_start: new Date().toISOString(),
        },
      ]);

      releaseHoldAndEnterWorkspace();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถส่งข้อมูลแจ้งโอนเงินได้');
      setIsCompletingPayment(false);
    }
  };

  /**
   * STEP 2 HANDLER C: Start 7-Day Free Trial Immediately with Selected Modules
   */
  const handleStartFreeTrialNow = () => {
    releaseHoldAndEnterWorkspace();
  };

  const resolvedQrImage =
    activeCheckout?.qrImageUrl || billingConfig.promptPayQrImageUrl || null;

  return (
    <motion.div
      key="fast-checkout-backdrop"
      variants={modalBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={handleDismissModal}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm font-google-sans"
    >
        {/*
          FIXED-VIEWPORT 3-LAYER MODAL CONTRACT:
          Locked height (`h-[85dvh] sm:h-[660px] max-h-[90dvh]`) prevents any vertical
          shrinking or expanding when switching between internal tabs or steps.
        */}
        <motion.div
          key="fast-checkout-dialog"
          variants={modalDialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl h-[85dvh] sm:h-[660px] max-h-[90dvh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden"
        >
          {/* 1. RIGID HEADER */}
          <div className="flex-shrink-0 bg-slate-900 text-white px-5 sm:px-6 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-300">
                    <span>
                      {order.source === 'ALACARTE'
                        ? 'À La Carte Custom Configuration'
                        : 'Standard SaaS Plan Checkout'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{step === 'STEP_1_IDENTITY' ? 'ขั้นตอนที่ 1 / 2' : 'ขั้นตอนที่ 2 / 2'}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {order.planTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissModal}
                disabled={isStep1Submitting || isCompletingPayment}
                className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compact Order Summary Strip */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="tabular-nums font-semibold text-white">
                    {order.maxMembers}
                  </span>{' '}
                  บัญชีผู้ใช้
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="tabular-nums font-semibold text-white">
                    {order.allowedModules.length}
                  </span>{' '}
                  โมดูลระบบ
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>{cycleLabel}</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold text-amber-300 tabular-nums">
                  ฿{order.amountTHB.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {order.billingCycle === 'LIFETIME'
                    ? 'ครั้งเดียว'
                    : order.billingCycle === 'YEARLY'
                    ? '/ ปี'
                    : '/ เดือน'}
                </span>
              </div>
            </div>

            {/* 2-Step Progress Pills */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  step === 'STEP_1_IDENTITY'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">1. ข้อมูลองค์กรและบัญชี</span>
              </div>
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  step === 'STEP_2_PAYMENT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">2. ชำระเงิน / เปิดใช้งานทันที</span>
              </div>
            </div>
          </div>

          {/* 2. ADAPTIVE SCROLLABLE BODY (Fills fixed height smoothly without jumping) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 flex flex-col">
            {errorMsg && (
              <div className="mb-3.5 flex-shrink-0 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 'STEP_1_IDENTITY' ? (
                <motion.form
                  key="step-1-identity"
                  id="fast-checkout-step1-form"
                  variants={stepContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleStep1Submit}
                  className="flex-1 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3.5">
                    {/* Account Mode Toggle (Only shown if not already logged in) */}
                    {!existingUser ? (
                      <div className="p-1 bg-slate-100 rounded-2xl grid grid-cols-2 gap-1 border border-slate-200/70">
                        {(
                          [
                            { id: 'REGISTER' as const, label: 'สร้างบัญชีเจ้าของใหม่' },
                            { id: 'LOGIN' as const, label: 'มีบัญชีอยู่แล้ว (เข้าสู่ระบบ)' },
                          ] as const
                        ).map((tab) => {
                          const isActive = authTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setAuthTab(tab.id);
                                setErrorMsg(null);
                              }}
                              className={`relative py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="fast-checkout-auth-tab-pill"
                                  transition={tabIndicatorSpring}
                                  className="absolute inset-0 rounded-xl bg-white shadow-xs border border-slate-200/80"
                                />
                              )}
                              <span className="relative z-10">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-emerald-700">
                              ตรวจพบบัญชีที่เข้าสู่ระบบอยู่แล้ว
                            </div>
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {existingUser.email || 'บัญชีผู้ใช้งานปัจจุบัน'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 shrink-0">
                          พร้อมเปิดองค์กร
                        </span>
                      </div>
                    )}

                    {/* Field 1: Organization / Studio Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        1. ชื่อบริษัท / สตูดิโอ / ช่องของคุณ
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="เช่น JuiJui Creative Studio หรือ บริษัท คอนเทนต์ จำกัด"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Field 2 & 3: Email & Password (when not already signed in) */}
                    {!existingUser && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {authTab === 'REGISTER'
                              ? '2. อีเมลผู้ดูแลระบบสูงสุด (Owner Email)'
                              : '2. อีเมล หรือ ชื่อผู้ใช้เดิมของคุณ'}
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={authTab === 'REGISTER' ? 'email' : 'text'}
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={
                                authTab === 'REGISTER'
                                  ? 'name@company.com'
                                  : 'กรอกอีเมล หรือ Username เดิม'
                              }
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            3. รหัสผ่านสำหรับเข้าใช้งาน (อย่างน้อย 6 ตัวอักษร)
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                              aria-label="แสดงหรือซ่อนรหัสผ่าน"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bottom Anchored Architecture & Security Assurance Box (Balances space when fields are few) */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-600 space-y-1.5">
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>ระบบจัดเตรียมพื้นที่ทำงานแยกอิสระ (Tenant Isolation) ทันที:</span>
                    </div>
                    <p className="leading-relaxed pl-5">
                      ล็อกสิทธิ์การใช้งาน{' '}
                      <strong className="text-indigo-700 tabular-nums">
                        {order.allowedModules.length} โมดูล
                      </strong>{' '}
                      และโควตาสมาชิกสูงสุด{' '}
                      <strong className="text-indigo-700 tabular-nums">
                        {order.maxMembers} บัญชี
                      </strong>{' '}
                      ให้กับองค์กรของคุณโดยอัตโนมัติ
                    </p>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="step-2-payment"
                  variants={stepContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex-1 flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-3.5">
                    {/* Created Workspace Banner */}
                    <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-emerald-700">
                            สร้างพื้นที่ทำงานเรียบร้อยแล้ว
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {provisionedOrgName}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 shrink-0">
                        พร้อมเปิดใช้งาน
                      </span>
                    </div>

                    {/* Enabled Payment Channels Segmented Bar with layoutId */}
                    <div
                      className={`p-1 bg-slate-100 rounded-2xl grid gap-1 border border-slate-200/70 ${
                        availableChannels.length === 1
                          ? 'grid-cols-1'
                          : availableChannels.length === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-3'
                      }`}
                    >
                      {availableChannels.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = paymentChannel === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setPaymentChannel(tab.id);
                              setErrorMsg(null);
                            }}
                            className={`relative py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="fast-checkout-payment-channel-pill"
                                transition={tabIndicatorSpring}
                                className="absolute inset-0 rounded-xl bg-white shadow-xs border border-slate-200/80"
                              />
                            )}
                            <Icon className="w-3.5 h-3.5 relative z-10 shrink-0 text-indigo-600" />
                            <span className="relative z-10 truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Channel 1: PromptPay QR */}
                    {paymentChannel === 'OMISE_QR' && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-2.5">
                        <div className="text-xs font-bold text-slate-700">
                          สแกน QR พร้อมเพย์ผ่านแอปธนาคารใดก็ได้ (ปลดล็อกระบบทันที)
                        </div>

                        {isCreatingSession ? (
                          <div className="h-36 flex flex-col items-center justify-center gap-2 text-slate-500">
                            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                            <span className="text-xs font-semibold">กำลังสร้างรหัส QR พร้อมเพย์...</span>
                          </div>
                        ) : (
                          <div className="mx-auto w-36 h-36 rounded-2xl bg-white border-2 border-indigo-100 p-2.5 flex flex-col items-center justify-center shadow-xs overflow-hidden">
                            {resolvedQrImage ? (
                              <img
                                src={resolvedQrImage}
                                alt="PromptPay QR"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <>
                                <QrCode className="w-20 h-20 text-slate-800 mb-1" />
                                <span className="text-[10px] font-bold text-indigo-600">
                                  THAI QR PROMPTPAY
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <span>พร้อมเพย์: {billingConfig.promptPayId}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyValue(billingConfig.promptPayId, 'promptpay')
                              }
                              className="p-1 rounded-md hover:bg-slate-200/70 text-indigo-600 transition-colors cursor-pointer"
                              title="คัดลอกหมายเลขพร้อมเพย์"
                            >
                              {copiedKey === 'promptpay' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            ชื่อบัญชี: {billingConfig.promptPayAccountName}
                          </div>
                          <div className="text-sm font-bold text-slate-900 tabular-nums pt-0.5">
                            ยอดชำระสุทธิ: ฿{order.amountTHB.toLocaleString()} บาท
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Channel 2: Stripe Card */}
                    {paymentChannel === 'STRIPE' && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            ชำระด้วยบัตรเครดิต / เดบิต (Stripe Automated Checkout)
                          </span>
                          <span className="text-xs font-bold text-indigo-600 tabular-nums">
                            ฿{order.amountTHB.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          ระบบจะตัดชำระผ่านเกตเวย์ Stripe และเปิดสถานะองค์กรเป็น{' '}
                          <strong className="text-emerald-700">ACTIVE</strong> พร้อมออกใบเสร็จรับเงินอิเล็กทรอนิกส์ให้ทันที
                        </p>
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>รหัสรายการ (Session ID)</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {activeCheckout?.sessionId || 'พร้อมทำรายการ'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2">
                            <span>บัตรที่รองรับ</span>
                            <span className="font-bold text-indigo-700">
                              Visa · Mastercard · JCB · Corporate Card
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Channel 3: Bank Slip Transfer */}
                    {paymentChannel === 'BANK_SLIP' && (
                      <form
                        id="fast-checkout-slip-form"
                        onSubmit={handleSubmitBankSlip}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5"
                      >
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-bold text-slate-800 truncate">
                              {billingConfig.bankName} · {billingConfig.bankAccountName}
                            </div>
                            <div className="font-mono font-bold text-indigo-600 text-sm">
                              {billingConfig.bankAccountNumber}
                            </div>
                            {billingConfig.bankBranch && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {billingConfig.bankBranch}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyValue(billingConfig.bankAccountNumber, 'bank')
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedKey === 'bank' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>คัดลอกเลขบัญชี</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              เลขอ้างอิงสลิป / เวลาโอน *
                            </label>
                            <input
                              type="text"
                              required
                              value={slipReference}
                              onChange={(e) => setSlipReference(e.target.value)}
                              placeholder="เช่น โอนเวลา 14:30 น."
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              หมายเหตุ / ใบกำกับภาษี
                            </label>
                            <input
                              type="text"
                              value={paymentNote}
                              onChange={(e) => setPaymentNote(e.target.value)}
                              placeholder="ชื่อผู้โอน หรือเบอร์ติดต่อ"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Bottom Anchored Guarantee Strip (Keeps Step 2 balanced across all 3 tabs) */}
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>เปิดระบบและล็อกสิทธิ์ {order.allowedModules.length} โมดูลทันทีหลังยืนยัน</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      ฿{order.amountTHB.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. RIGID STICKY FOOTER */}
          <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {step === 'STEP_1_IDENTITY' ? (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDismissModal}
                  disabled={isStep1Submitting}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  form="fast-checkout-step1-form"
                  disabled={isStep1Submitting}
                  className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isStep1Submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังจัดเตรียมองค์กร...</span>
                    </>
                  ) : (
                    <>
                      <span>ดำเนินการต่อไปยังขั้นตอนชำระเงิน</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Primary Payment Confirmation Button */}
                {paymentChannel === 'BANK_SLIP' ? (
                  <button
                    type="submit"
                    form="fast-checkout-slip-form"
                    disabled={isCompletingPayment}
                    className="w-full py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isCompletingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังบันทึกข้อมูลและเข้าสู่ระบบ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ยืนยันแจ้งโอนเงิน · เข้าสู่ระบบ Dashboard ทันที</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteGatewayPayment}
                    disabled={isCompletingPayment || isCreatingSession}
                    className="w-full py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isCompletingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังยืนยันยอดชำระและเปิดระบบ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {paymentChannel === 'OMISE_QR'
                            ? `สแกนชำระ ฿${order.amountTHB.toLocaleString()} เรียบร้อย · เข้าสู่ระบบทันที`
                            : `ชำระเงิน ฿${order.amountTHB.toLocaleString()} ด้วยบัตร · เข้าสู่ระบบทันที`}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {/* Secondary Instant 7-Day Free Trial Option (Configurable by Super Admin) */}
                {billingConfig.enableFreeTrialButton && (
                  <button
                    type="button"
                    onClick={handleStartFreeTrialNow}
                    disabled={isCompletingPayment}
                    className="w-full py-2 px-4 rounded-xl bg-white hover:bg-indigo-50/60 text-indigo-700 border border-indigo-200/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ทดลองใช้โครงสร้างระบบนี้ฟรี 7 วันก่อน (ยังไม่ตัดเงิน)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  );
};

export default FastCheckoutOnboardingModal;
