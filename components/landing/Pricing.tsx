import React, { useState } from 'react';
import { Check, Zap, Sparkles, Building2, Crown, ShieldCheck, Users, Cake, ArrowRight } from 'lucide-react';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { PlanTier } from '../../types';
import { SectionAuraHeader, ScrollRevealItem } from './ScrollRevealSection';

import { PlatformPricingPlan } from '../../services/landingConfigService';
import { FastCheckoutOrderPayload } from './FastCheckoutOnboardingModal';

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
}

interface PricingProps {
  onContact?: () => void;
  onStartFreeTrial?: (planTier?: PlanTier) => void;
  onOpenFastCheckout?: (order: FastCheckoutOrderPayload) => void;
  onOpenCustomBuilder?: () => void;
  plans?: (CommercialTierCard | PlatformPricingPlan)[];
}

interface CommercialTierCard {
  tier: PlanTier;
  name: string;
  audience: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxMembers: number;
  recommended?: boolean;
  badge?: string;
  features: string[];
}

const COMMERCIAL_TIERS: CommercialTierCard[] = [
  {
    tier: 'STARTER',
    name: SAAS_PLAN_PRESETS.STARTER.name,
    audience: 'สำหรับทีมครีเอเตอร์และช่องขนาดเล็ก',
    monthlyPrice: SAAS_PLAN_PRESETS.STARTER.monthlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.STARTER.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.STARTER.defaultMaxMembers,
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 10 คน',
      'แยกฐานข้อมูลองค์กรอิสระ (Tenant Isolation)',
      'ปฏิทินคอนเทนต์, สต็อกงาน และบอร์ดสถานะ',
      'ระบบเช็คอินเข้างาน & ตารางเวรทำความสะอาด',
      'ห้องแชทภายในทีมและระบบแจ้งเตือนพื้นฐาน',
    ],
  },
  {
    tier: 'PRO',
    name: SAAS_PLAN_PRESETS.PRO.name,
    audience: 'ยอดนิยมสำหรับสตูดิโอและบริษัทผลิตคอนเทนต์',
    monthlyPrice: SAAS_PLAN_PRESETS.PRO.monthlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.PRO.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.PRO.defaultMaxMembers,
    recommended: true,
    badge: 'ทดลองใช้ฟรี 7 วัน',
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 30 คน (Trial 5 คน)',
      'ทุกฟีเจอร์ในแผน Starter + ระบบแยกแบรนด์ในเครือ',
      'Script Hub, คลังเก็บเรฟ (Workbox) & จัดทริปออกกอง',
      'ระบบตรวจคุณภาพงาน (Quality Gate) & RPG Gamification',
      'ศูนย์คู่มือ Wiki, ห้องประชุม & ตารางเวรครบวงจร',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: SAAS_PLAN_PRESETS.ENTERPRISE.name,
    audience: 'สำหรับเอเจนซี่และเครือบริษัทหลายแบรนด์',
    monthlyPrice: SAAS_PLAN_PRESETS.ENTERPRISE.monthlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.ENTERPRISE.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.ENTERPRISE.defaultMaxMembers,
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 100 คน',
      'ปลดล็อกทุกโมดูล 100% เต็มรูปแบบ',
      'ระบบบริหารการเงิน & บัญชีรายรับ-รายจ่าย (Finance)',
      'ระบบประเมินผล KPI รายบุคคลและแดชบอร์ดผู้บริหาร',
      'จัดการหลายบริษัทย่อย/แบรนด์ในเครือเดียวกันไม่จำกัด',
    ],
  },
  {
    tier: 'LIFETIME',
    name: SAAS_PLAN_PRESETS.LIFETIME.name,
    audience: 'สิทธิ์ใช้งานตลอดชีพสำหรับองค์กรขนาดใหญ่',
    monthlyPrice: SAAS_PLAN_PRESETS.LIFETIME.yearlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.LIFETIME.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.LIFETIME.defaultMaxMembers,
    badge: 'จ่ายครั้งเดียวจบ',
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 500 คน',
      'ชำระครั้งเดียว ใช้งานได้ตลอดชีพไม่มีรายเดือน',
      'ปลดล็อกทุกโมดูลปัจจุบันและอัปเดตใหม่ในอนาคต',
      'รองรับการตั้งค่า Master Data เฉพาะขององค์กรเต็มรูปแบบ',
      'ทีมซัพพอร์ตดูแลการตั้งค่าองค์กรแบบ Priority',
    ],
  },
];

const Pricing: React.FC<PricingProps> = ({
  onContact,
  onStartFreeTrial,
  onOpenFastCheckout,
  onOpenCustomBuilder,
  plans,
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const activeTiers = plans && plans.length > 0 ? plans : COMMERCIAL_TIERS;

  return (
    <section className="relative z-10 py-20 md:py-24 bg-transparent border-t border-white/60 font-google-sans">
      <div className="max-w-7xl mx-auto px-6">
        <SectionAuraHeader
          className="text-center mb-12"
          titleClassName="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
          subtitleClassName="text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto"
          badge={
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-indigo-100/90 text-indigo-700 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Multi-Tenant SaaS · แยกข้อมูลแต่ละบริษัทปลอดภัย 100%</span>
            </div>
          }
          title={
            <>
              แพ็กเกจที่เติบโตไปพร้อมกับ{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                สเกลทีมของคุณ
              </span>
            </>
          }
          subtitle={
            <>
              เริ่มต้นเปิดองค์กรใหม่และทดลองใช้ฟีเจอร์ระดับ PRO ฟรี 7 วัน (รองรับสูงสุด 5 คน){' '}
              <br className="hidden md:block" />
              ชำระเงินอัตโนมัติผ่าน Stripe, PromptPay QR หรือโอนเงินธนาคารได้ทันที
            </>
          }
        >
          {/* Monthly / Yearly Switcher + | + À La Carte Custom Module Builder */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-indigo-500/5">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-indigo-50/90 text-indigo-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ชำระรายเดือน
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>ชำระรายปี</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  billingCycle === 'YEARLY'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                ประหยัด 2 เดือน
              </span>
            </button>

            {onOpenCustomBuilder && (
              <>
                {/* Vertical | Divider */}
                <span
                  aria-hidden="true"
                  className="hidden sm:inline-block h-6 w-px bg-slate-200 mx-1.5 select-none"
                />
                <button
                  type="button"
                  onClick={onOpenCustomBuilder}
                  className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-md shadow-pink-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Cake className="w-4 h-4" />
                  <span>ผสมสูตรเลือกเฉพาะฟีเจอร์ (À La Carte)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </SectionAuraHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {activeTiers.map((plan, idx) => {
            const isLifetime = plan.tier === 'LIFETIME';
            const displayPrice = isLifetime
              ? plan.yearlyPrice
              : billingCycle === 'YEARLY'
              ? plan.yearlyPrice
              : plan.monthlyPrice;

            const shortTierLabel =
              plan.tier === 'STARTER'
                ? 'Starter'
                : plan.tier === 'PRO'
                ? 'PRO'
                : plan.tier === 'ENTERPRISE'
                ? 'Enterprise'
                : plan.name;

            return (
              <ScrollRevealItem
                key={plan.tier}
                index={idx}
                direction="up"
                className={`bg-white/90 backdrop-blur-xl p-7 rounded-3xl border transition-all flex flex-col relative ${
                  plan.recommended
                    ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-100/80 z-10'
                    : 'border-white/95 shadow-lg shadow-indigo-500/5 hover:border-indigo-200 hover:shadow-xl'
                }`}
              >
                {/* Top Row: Icon on Left, Badge on Top-Right (Fixed 44px height across all cards) */}
                <div className="flex items-start justify-between gap-2 mb-4 h-11">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      plan.recommended ? 'bg-indigo-50' : 'bg-slate-50/90'
                    }`}
                  >
                    {plan.tier === 'STARTER' && <Zap className="w-5 h-5 text-slate-600" />}
                    {plan.tier === 'PRO' && <Sparkles className="w-5 h-5 text-indigo-600" />}
                    {plan.tier === 'ENTERPRISE' && <Building2 className="w-5 h-5 text-purple-600" />}
                    {plan.tier === 'LIFETIME' && <Crown className="w-5 h-5 text-amber-500" />}
                  </div>

                  {plan.badge && (
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                        plan.recommended
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Plan Title & Subtitle (Uniform height so price rows align horizontally) */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {plan.name}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed min-h-[2.25rem] line-clamp-2">
                    {plan.audience}
                  </p>
                </div>

                {/* Price & Member Capacity Block */}
                <div className="mb-6 py-5 border-y border-slate-100/90">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-google-sans tabular-nums text-slate-900 tracking-tight">
                      ฿{displayPrice.toLocaleString()}
                    </span>
                    <span className="text-slate-400 font-bold text-xs whitespace-nowrap">
                      / {isLifetime ? 'ตลอดชีพ' : billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
                    </span>
                  </div>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 font-google-sans tabular-nums">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>รองรับสูงสุด {plan.maxMembers} บัญชีผู้ใช้</span>
                  </div>
                </div>

                {/* Feature List (Balanced row spacing and alignment) */}
                <ul className="space-y-3.5 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-start gap-2.5 text-slate-600 text-xs font-medium leading-relaxed min-h-[2.25rem]"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.recommended ? 'text-indigo-600' : 'text-emerald-500'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Uniform Single-Line CTA Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFastCheckout) {
                      const preset =
                        SAAS_PLAN_PRESETS[plan.tier] || SAAS_PLAN_PRESETS.PRO;
                      onOpenFastCheckout({
                        source: 'PRICING',
                        planTier: plan.tier,
                        planTitle: `แพ็กเกจ ${plan.name}`,
                        planSubtitle: plan.audience,
                        billingCycle: isLifetime ? 'LIFETIME' : billingCycle,
                        amountTHB: displayPrice,
                        maxMembers: plan.maxMembers,
                        allowedModules: [...preset.defaultModules],
                      });
                      return;
                    }
                    if (plan.tier === 'LIFETIME' && onContact) {
                      onContact();
                      return;
                    }
                    if (onStartFreeTrial) {
                      onStartFreeTrial(plan.tier);
                    }
                  }}
                  className={`mt-auto w-full h-12 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center whitespace-nowrap ${
                    plan.recommended
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.tier === 'LIFETIME'
                    ? 'สั่งซื้อสิทธิ์ตลอดชีพ · เปิดองค์กร'
                    : `เลือกแผน ${shortTierLabel} · เปิดองค์กรทันที`}
                </button>
              </ScrollRevealItem>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
