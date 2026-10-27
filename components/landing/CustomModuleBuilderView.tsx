import React, { useState, useMemo } from 'react';
import { ArrowLeft, Sliders, ShieldCheck } from 'lucide-react';
import { MENU_GROUPS } from '../sidebar/menuConfig';
import SweetDessertSkyBackground from './SweetDessertSkyBackground';
import {
  CustomModulePricingConfig,
  CustomModuleItemConfig,
  QUICK_RECIPE_PRESETS,
  PlatformPricingPlan,
  ModuleGroupId,
  DEFAULT_CUSTOM_MODULE_CONFIG,
} from '../../services/landingConfigService';
import {
  BillingCycleType,
  SummaryTabMode,
  CategoryFilterType,
  BuilderCalculationResult,
} from './custom-builder/types';
import { CustomBuilderTopbar } from './custom-builder/CustomBuilderTopbar';
import { WorkflowPresetSelector } from './custom-builder/WorkflowPresetSelector';
import { TeamSeatConfigurator } from './custom-builder/TeamSeatConfigurator';
import { ModuleCatalogSection } from './custom-builder/ModuleCatalogSection';
import { CustomQuoteSummaryPanel } from './custom-builder/CustomQuoteSummaryPanel';
import { FastCheckoutOrderPayload } from './FastCheckoutOnboardingModal';

interface CustomModuleBuilderViewProps {
  config?: CustomModulePricingConfig;
  pricingPlans?: PlatformPricingPlan[];
  onBack: () => void;
  onStartWithRecipe: () => void;
  onOpenFastCheckout?: (order: FastCheckoutOrderPayload) => void;
  onContact?: () => void;
}

const CustomModuleBuilderView: React.FC<CustomModuleBuilderViewProps> = ({
  config = DEFAULT_CUSTOM_MODULE_CONFIG,
  pricingPlans = [],
  onBack,
  onStartWithRecipe,
  onOpenFastCheckout,
  onContact,
}) => {
  const safeConfig = config?.modules?.length ? config : DEFAULT_CUSTOM_MODULE_CONFIG;

  // Map module key -> Lucide Icon component from sidebar/menuConfig.ts
  const iconMap = useMemo(() => {
    const map: Record<string, React.ElementType> = {};
    for (const grp of MENU_GROUPS) {
      for (const item of grp.items) {
        map[item.view] = item.icon;
      }
    }
    return map;
  }, []);

  const coreModuleKeys = useMemo(
    () => safeConfig.modules.filter((m) => m.isCore).map((m) => m.key),
    [safeConfig.modules]
  );

  const [activePresetId, setActivePresetId] = useState<string>('content-planner');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const initial = new Set<string>([
      ...coreModuleKeys,
      ...(QUICK_RECIPE_PRESETS[0]?.moduleKeys || []),
    ]);
    return Array.from(initial);
  });

  const [billingCycle, setBillingCycle] = useState<BillingCycleType>('MONTHLY');
  const [seatCount, setSeatCount] = useState<number>(10);
  const [activeGroupFilter, setActiveGroupFilter] = useState<CategoryFilterType>('ALL');
  const [sidebarPreviewMode, setSidebarPreviewMode] = useState<SummaryTabMode>('RECEIPT');
  const [copiedQuote, setCopiedQuote] = useState(false);

  const yearlyPayableMonths = Math.max(1, 12 - (safeConfig.yearlyDiscountMonths || 2));

  const applyPreset = (presetId: string, presetKeys: string[]) => {
    setActivePresetId(presetId);
    const combined = new Set<string>([...coreModuleKeys, ...presetKeys]);
    setSelectedKeys(Array.from(combined));
  };

  const selectAllModules = () => {
    setActivePresetId('all-modules');
    setSelectedKeys(safeConfig.modules.map((m) => m.key));
  };

  const toggleModule = (mod: CustomModuleItemConfig) => {
    if (mod.isCore) return;
    setActivePresetId('custom');
    setSelectedKeys((prev) =>
      prev.includes(mod.key) ? prev.filter((k) => k !== mod.key) : [...prev, mod.key]
    );
  };

  const toggleEntireGroup = (groupId: ModuleGroupId) => {
    const groupMods = safeConfig.modules.filter((m) => m.group === groupId && !m.isCore);
    const allGroupSelected = groupMods.every((m) => selectedKeys.includes(m.key));

    setActivePresetId('custom');
    if (allGroupSelected) {
      const removeSet = new Set(groupMods.map((m) => m.key));
      setSelectedKeys((prev) => prev.filter((k) => !removeSet.has(k)));
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        groupMods.forEach((m) => next.add(m.key));
        return Array.from(next);
      });
    }
  };

  const calculation: BuilderCalculationResult = useMemo(() => {
    const extraSeats = Math.max(0, seatCount - safeConfig.includedBaseSeats);
    const extraSeatsMonthly = extraSeats * safeConfig.extraSeatMonthlyPrice;

    const selectedModuleItems = safeConfig.modules.filter((m) => selectedKeys.includes(m.key));
    const addonModuleItems = selectedModuleItems.filter((m) => !m.isCore);

    const addonsMonthly = addonModuleItems.reduce((sum, m) => sum + (m.monthlyPrice || 0), 0);
    const totalMonthly = safeConfig.baseMonthlyPrice + extraSeatsMonthly + addonsMonthly;

    const totalYearly = totalMonthly * yearlyPayableMonths;
    const yearlySavings = totalMonthly * 12 - totalYearly;

    const displayTotal = billingCycle === 'YEARLY' ? totalYearly : totalMonthly;

    const proPlan = pricingPlans.find((p) => p.tier === 'PRO');
    const entPlan = pricingPlans.find((p) => p.tier === 'ENTERPRISE');

    let recommendedStandardPlan: PlatformPricingPlan | null = null;
    if (proPlan && seatCount <= proPlan.maxMembers) {
      const proComparePrice = billingCycle === 'YEARLY' ? proPlan.yearlyPrice : proPlan.monthlyPrice;
      if (displayTotal >= proComparePrice && addonModuleItems.length >= 5) {
        recommendedStandardPlan = proPlan;
      }
    } else if (entPlan && seatCount <= entPlan.maxMembers) {
      const entComparePrice = billingCycle === 'YEARLY' ? entPlan.yearlyPrice : entPlan.monthlyPrice;
      if (displayTotal >= entComparePrice) {
        recommendedStandardPlan = entPlan;
      }
    }

    return {
      extraSeats,
      extraSeatsMonthly,
      selectedModuleItems,
      addonModuleItems,
      addonsMonthly,
      totalMonthly,
      totalYearly,
      yearlySavings,
      displayTotal,
      recommendedStandardPlan,
    };
  }, [
    seatCount,
    safeConfig,
    selectedKeys,
    billingCycle,
    yearlyPayableMonths,
    pricingPlans,
  ]);

  const buildQuoteText = () => {
    const cycleLabel =
      billingCycle === 'YEARLY'
        ? `รายปี (คิดราคา ${yearlyPayableMonths} เดือน ประหยัดฟรี ${safeConfig.yearlyDiscountMonths} เดือน)`
        : 'รายเดือน';
    const addonLines =
      calculation.addonModuleItems.length > 0
        ? calculation.addonModuleItems
            .map((m) => `  • ${m.label}: ฿${m.monthlyPrice.toLocaleString()}/เดือน`)
            .join('\n')
        : '  • (ใช้งานเฉพาะโมดูลแกนกลางใน Base Core)';

    return [
      '📋 ใบสรุปโครงสร้างแพ็กเกจ (À La Carte Custom Enterprise Quote)',
      `รอบการชำระเงิน: ${cycleLabel}`,
      `โควตาผู้ใช้งานในองค์กร: ${seatCount} บัญชี (ฟรี ${safeConfig.includedBaseSeats} บัญชีแรกใน Base Core)`,
      `----------------------------------------`,
      `1. โครงสร้างพื้นฐาน (Base Core): ฿${safeConfig.baseMonthlyPrice.toLocaleString()}/เดือน`,
      `   (รวม: ภาพรวม Dashboard, ทีมงาน, ตั้งค่าระบบ, คู่มือระบบ)`,
      `2. บัญชีผู้ใช้งานส่วนเพิ่ม (${calculation.extraSeats} บัญชี): ฿${calculation.extraSeatsMonthly.toLocaleString()}/เดือน`,
      `3. โมดูลเสริมที่เลือกเปิดใช้งาน (${calculation.addonModuleItems.length} โมดูล):`,
      addonLines,
      `----------------------------------------`,
      `ยอดรวมรายเดือน: ฿${calculation.totalMonthly.toLocaleString()} / เดือน`,
      ...(billingCycle === 'YEARLY'
        ? [
            `ยอดสุทธิชำระรายปี: ฿${calculation.totalYearly.toLocaleString()} / ปี (ประหยัด ฿${calculation.yearlySavings.toLocaleString()})`,
          ]
        : []),
    ].join('\n');
  };

  const handleCopyRecipeQuote = async () => {
    try {
      await navigator.clipboard.writeText(buildQuoteText());
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 3500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleConfirmStartWithRecipe = () => {
    if (typeof window !== 'undefined') {
      const recipePayload = {
        mode: 'ALACARTE_CUSTOM_RECIPE',
        billingCycle,
        seatCount,
        selectedModuleKeys: selectedKeys,
        totalMonthlyTHB: calculation.totalMonthly,
        totalYearlyTHB: calculation.totalYearly,
        displayTotalTHB: calculation.displayTotal,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem('juijui_custom_recipe_intent', JSON.stringify(recipePayload));
    }

    if (onOpenFastCheckout) {
      onOpenFastCheckout({
        source: 'ALACARTE',
        planTier: 'PRO',
        planTitle: 'โครงสร้างระบบ À La Carte Custom',
        planSubtitle: `เปิดใช้งาน ${selectedKeys.length} โมดูล · รองรับสูงสุด ${seatCount} บัญชี`,
        billingCycle,
        amountTHB: calculation.displayTotal,
        maxMembers: seatCount,
        allowedModules: selectedKeys,
        addonCount: calculation.addonModuleItems.length,
      });
      return;
    }

    onStartWithRecipe();
  };

  return (
    <div className="relative min-h-screen font-google-sans text-slate-900">
      {/* Pastel Sky Background retained for atmospheric identity */}
      <SweetDessertSkyBackground />

      {/* Top Navigation & Billing Cycle Bar */}
      <CustomBuilderTopbar
        billingCycle={billingCycle}
        yearlyDiscountMonths={safeConfig.yearlyDiscountMonths}
        onChangeBillingCycle={setBillingCycle}
        onBack={onBack}
      />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs mb-4">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>À La Carte Module Configurator · ออกแบบโครงสร้างระบบตามการใช้งานจริง</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            เลือกเฉพาะฟีเจอร์ที่จำเป็น{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              ควบคุมงบประมาณได้ 100%
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            เริ่มต้นด้วยระบบแกนกลาง{' '}
            <strong className="text-indigo-700">Base Core Infrastructure</strong>{' '}
            แล้วเลือกเปิดใช้งานเฉพาะเมนู Sidebar ที่แต่ละแผนกในบริษัทของคุณต้องใช้จริง
            คำนวณงบประมาณแบบโปร่งใสและปรับขยายโมดูลเพิ่มได้ตลอดเวลา
          </p>
        </div>

        {/* Step 1: Workflow Presets Selector */}
        <WorkflowPresetSelector
          presets={QUICK_RECIPE_PRESETS}
          activePresetId={activePresetId}
          totalModuleCount={safeConfig.modules.length}
          onSelectPreset={applyPreset}
          onSelectAllModules={selectAllModules}
        />

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (8 Cols): Team Seats + 26 Sidebar Modules Catalog */}
          <div className="lg:col-span-8 space-y-6">
            <TeamSeatConfigurator
              seatCount={seatCount}
              includedBaseSeats={safeConfig.includedBaseSeats}
              extraSeatMonthlyPrice={safeConfig.extraSeatMonthlyPrice}
              extraSeats={calculation.extraSeats}
              extraSeatsMonthly={calculation.extraSeatsMonthly}
              onChangeSeatCount={setSeatCount}
            />

            <ModuleCatalogSection
              modules={safeConfig.modules}
              selectedKeys={selectedKeys}
              addonCount={calculation.addonModuleItems.length}
              activeGroupFilter={activeGroupFilter}
              billingCycle={billingCycle}
              yearlyPayableMonths={yearlyPayableMonths}
              iconMap={iconMap}
              onChangeGroupFilter={setActiveGroupFilter}
              onToggleModule={toggleModule}
              onToggleEntireGroup={toggleEntireGroup}
            />
          </div>

          {/* RIGHT COLUMN (4 Cols): Sticky Quote Summary & Live Sidebar Simulator */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <CustomQuoteSummaryPanel
              config={safeConfig}
              seatCount={seatCount}
              selectedKeys={selectedKeys}
              billingCycle={billingCycle}
              sidebarPreviewMode={sidebarPreviewMode}
              calculation={calculation}
              copiedQuote={copiedQuote}
              onChangePreviewMode={setSidebarPreviewMode}
              onChangeBillingCycle={setBillingCycle}
              onToggleModule={toggleModule}
              onResetAddons={() => applyPreset('blank-canvas', coreModuleKeys)}
              onStartWithRecipe={handleConfirmStartWithRecipe}
              onCopyQuote={handleCopyRecipeQuote}
              onSendToSales={() => {
                handleCopyRecipeQuote();
                if (onContact) onContact();
              }}
            />
          </div>
        </div>

        {/* Bottom Return Callout */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ต้องการเปรียบเทียบกับแพ็กเกจเหมาจ่ายมาตรฐานทั้ง 4 แผน (Starter / Pro / Enterprise / Lifetime)?</span>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ย้อนกลับไปหน้าแพ็กเกจหลัก</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModuleBuilderView;
