import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Send,
  LayoutGrid,
  Info,
  RotateCcw,
  FileText,
  Sliders,
} from 'lucide-react';
import { MENU_GROUPS } from '../../sidebar/menuConfig';
import {
  CustomModulePricingConfig,
  CustomModuleItemConfig,
} from '../../../services/landingConfigService';
import {
  BillingCycleType,
  SummaryTabMode,
  BuilderCalculationResult,
  SPRING_TAB_TRANSITION,
} from './types';

interface CustomQuoteSummaryPanelProps {
  config: CustomModulePricingConfig;
  seatCount: number;
  selectedKeys: string[];
  billingCycle: BillingCycleType;
  sidebarPreviewMode: SummaryTabMode;
  calculation: BuilderCalculationResult;
  copiedQuote: boolean;
  onChangePreviewMode: (mode: SummaryTabMode) => void;
  onChangeBillingCycle: (cycle: BillingCycleType) => void;
  onToggleModule: (mod: CustomModuleItemConfig) => void;
  onResetAddons: () => void;
  onStartWithRecipe: () => void;
  onCopyQuote: () => void;
  onSendToSales: () => void;
}

const SUMMARY_TABS: { id: SummaryTabMode; label: string; icon: React.ElementType }[] = [
  { id: 'RECEIPT', label: 'ใบสรุปงบประมาณ', icon: FileText },
  { id: 'SIDEBAR', label: 'จำลองเมนู Sidebar', icon: LayoutGrid },
];

/**
 * Unified Spring Physics Curve (AGENTS.md Zero-Jitter Rulebook #5)
 * Used across all expanding/collapsing rows, panels, and indicators so parent
 * height and child items interpolate in lockstep without tail-end hitches.
 */
const UNIFIED_PANEL_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 32,
  mass: 0.8,
};

export const CustomQuoteSummaryPanel: React.FC<CustomQuoteSummaryPanelProps> = ({
  config,
  seatCount,
  selectedKeys,
  billingCycle,
  sidebarPreviewMode,
  calculation,
  copiedQuote,
  onChangePreviewMode,
  onChangeBillingCycle,
  onToggleModule,
  onResetAddons,
  onStartWithRecipe,
  onCopyQuote,
  onSendToSales,
}) => {
  const addonListScrollRef = useRef<HTMLDivElement | null>(null);
  const addonItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevAddonKeysRef = useRef<string[]>(
    calculation.addonModuleItems.map((m) => m.key)
  );
  const [highlightedKeys, setHighlightedKeys] = useState<Record<string, boolean>>({});

  // Detect newly added addon modules to trigger subtle highlight & smooth internal scroll
  useEffect(() => {
    const currentKeys = calculation.addonModuleItems.map((m) => m.key);
    const prevKeys = prevAddonKeysRef.current;
    const addedKeys = currentKeys.filter((k) => !prevKeys.includes(k));
    prevAddonKeysRef.current = currentKeys;

    if (addedKeys.length === 0) return;

    const nextHighlights: Record<string, boolean> = {};
    addedKeys.forEach((k) => {
      nextHighlights[k] = true;
    });
    setHighlightedKeys((prev) => ({ ...prev, ...nextHighlights }));

    // If a single module was toggled on, gently scroll the internal list so the user sees it enter
    if (addedKeys.length === 1) {
      const targetKey = addedKeys[0];
      const scrollTimer = window.setTimeout(() => {
        const container = addonListScrollRef.current;
        const itemEl = addonItemRefs.current[targetKey];
        if (container && itemEl) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = itemEl.getBoundingClientRect();
          const isAbove = itemRect.top < containerRect.top;
          const isBelow = itemRect.bottom > containerRect.bottom;
          if (isAbove || isBelow) {
            const targetTop =
              itemEl.offsetTop - container.clientHeight / 2 + itemEl.clientHeight / 2;
            container.scrollTo({
              top: Math.max(0, targetTop),
              behavior: 'smooth',
            });
          }
        }
      }, 60);

      const clearTimer = window.setTimeout(() => {
        setHighlightedKeys((prev) => {
          const copy = { ...prev };
          addedKeys.forEach((k) => delete copy[k]);
          return copy;
        });
      }, 950);

      return () => {
        window.clearTimeout(scrollTimer);
        window.clearTimeout(clearTimer);
      };
    }

    const clearTimer = window.setTimeout(() => {
      setHighlightedKeys((prev) => {
        const copy = { ...prev };
        addedKeys.forEach((k) => delete copy[k]);
        return copy;
      });
    }, 950);

    return () => window.clearTimeout(clearTimer);
  }, [calculation.addonModuleItems]);

  const addonBarPercent = Math.min(
    82,
    Math.round((calculation.addonModuleItems.length / 22) * 82)
  );

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-indigo-600/90 shadow-xl shadow-indigo-500/10 overflow-hidden transition-shadow duration-300">
      {/* Top Panel Header */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Custom Package Summary
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/25 text-indigo-200 font-google-sans tabular-nums inline-flex items-center">
            <motion.span
              key={selectedKeys.length}
              initial={{ y: -5, opacity: 0.35 }}
              animate={{ y: 0, opacity: 1 }}
              transition={UNIFIED_PANEL_SPRING}
              className="inline-block"
            >
              {selectedKeys.length}
            </motion.span>
            <span>/{config.modules.length} เมนูที่เปิดใช้</span>
          </span>
        </div>

        {/* Module Allocation Progress Bar */}
        <div className="bg-slate-800/90 rounded-xl p-2.5 mb-3.5 border border-slate-700/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
            <span>สัดส่วนโครงสร้างระบบที่เลือก</span>
            <span className="font-google-sans tabular-nums">
              Base Core 4 + เสริม{' '}
              <motion.span
                key={calculation.addonModuleItems.length}
                initial={{ scale: 1.18, color: '#a5b4fc' }}
                animate={{ scale: 1, color: '#cbd5e1' }}
                transition={UNIFIED_PANEL_SPRING}
                className="inline-block font-bold"
              >
                {calculation.addonModuleItems.length}
              </motion.span>{' '}
              โมดูล
            </span>
          </div>
          <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-slate-950 p-0.5">
            <div
              className="h-full rounded-l-full bg-emerald-400 shrink-0"
              style={{ width: '18%' }}
              title="Base Core Modules (4)"
            />
            <motion.div
              initial={false}
              animate={{ width: `${addonBarPercent}%` }}
              transition={UNIFIED_PANEL_SPRING}
              className="h-full rounded-r-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
            />
          </div>
        </div>

        {/* Mode Switcher Tabs with Framer Motion layoutId */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl">
          {SUMMARY_TABS.map((tab) => {
            const isActive = sidebarPreviewMode === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangePreviewMode(tab.id)}
                className={`relative z-10 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="custom-builder-summary-tab"
                    transition={SPRING_TAB_TRANSITION}
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-xs -z-10"
                  />
                )}
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Content - Uses explicit padding inside animated containers instead of space-y to prevent Phantom Gap Jumps */}
      <div className="p-5 sm:p-6">
        <AnimatePresence initial={false}>
          {sidebarPreviewMode === 'SIDEBAR' ? (
            /* TAB 2: LIVE MINI SIDEBAR SIMULATOR */
            <motion.div
              key="sidebar-preview"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={UNIFIED_PANEL_SPRING}
              className="overflow-hidden"
            >
              <div className="space-y-3.5 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    จำลองแถบเมนู Sidebar ในองค์กรจริง
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    ซ่อนเมนูที่ไม่ได้เลือกอัตโนมัติ
                  </span>
                </div>

                <div
                  style={{ scrollbarGutter: 'stable' }}
                  className="bg-slate-900 text-slate-200 rounded-2xl p-4 max-h-[360px] overflow-y-auto overscroll-contain border border-slate-800"
                >
                  <AnimatePresence initial={false}>
                    {MENU_GROUPS.map((grp) => {
                      const enabledItems = grp.items.filter((it) =>
                        selectedKeys.includes(it.view)
                      );
                      if (enabledItems.length === 0) return null;

                      return (
                        <motion.div
                          key={grp.id}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={UNIFIED_PANEL_SPRING}
                          className="overflow-hidden"
                        >
                          <div className="pb-3.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 px-2 pb-1.5">
                              {grp.label} ({enabledItems.length})
                            </div>
                            <div>
                              <AnimatePresence initial={false}>
                                {enabledItems.map((item) => {
                                  const ItemIcon = item.icon;
                                  return (
                                    <motion.div
                                      key={item.view}
                                      initial={{ height: 0, opacity: 0, scale: 0.97 }}
                                      animate={{ height: 'auto', opacity: 1, scale: 1 }}
                                      exit={{ height: 0, opacity: 0, scale: 0.97 }}
                                      transition={UNIFIED_PANEL_SPRING}
                                      className="overflow-hidden"
                                    >
                                      <div className="pb-1">
                                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-800/90 text-xs font-semibold text-white">
                                          <div className="flex items-center gap-2">
                                            <ItemIcon className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>{item.label}</span>
                                          </div>
                                          <span className="text-[10px] text-emerald-400 font-bold">
                                            เปิดใช้งาน
                                          </span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            /* TAB 1: ITEMIZED PACKAGE QUOTE RECEIPT */
            <motion.div
              key="quote-receipt"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={UNIFIED_PANEL_SPRING}
              className="overflow-hidden"
            >
              <div className="space-y-4 pb-5">
                {/* Base Core Row */}
                <div className="flex items-start justify-between text-xs pb-3 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-slate-800">
                      โครงสร้างพื้นฐาน (Base Core)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      4 เมนูหลัก + ฟรีโควตา {config.includedBaseSeats} บัญชีแรก
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 font-google-sans tabular-nums">
                    ฿{config.baseMonthlyPrice.toLocaleString()}/ด.
                  </span>
                </div>

                {/* Member Seats Row */}
                <div className="flex items-start justify-between text-xs pb-3 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-slate-800">
                      โควตาผู้ใช้งานทั้งหมด ({seatCount} บัญชี)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {calculation.extraSeats > 0
                        ? `บัญชีส่วนเพิ่ม ${calculation.extraSeats} คน × ฿${config.extraSeatMonthlyPrice}`
                        : `อยู่ในโควตาฟรี ${config.includedBaseSeats} บัญชีแรก`}
                    </div>
                  </div>
                  <motion.span
                    key={calculation.extraSeatsMonthly}
                    initial={{ y: -4, opacity: 0.4 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={UNIFIED_PANEL_SPRING}
                    className="font-bold text-slate-900 font-google-sans tabular-nums inline-block"
                  >
                    {calculation.extraSeatsMonthly > 0
                      ? `+฿${calculation.extraSeatsMonthly.toLocaleString()}/ด.`
                      : 'ฟรี'}
                  </motion.span>
                </div>

                {/* Selected Add-on Modules List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs min-h-[20px]">
                    <span className="font-bold text-slate-800">
                      โมดูลเสริมที่เลือก ({calculation.addonModuleItems.length} รายการ)
                    </span>
                    <AnimatePresence initial={false}>
                      {calculation.addonModuleItems.length > 0 && (
                        <motion.button
                          key="reset-addons-btn"
                          type="button"
                          initial={{ opacity: 0, scale: 0.9, x: 6 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: 6 }}
                          transition={UNIFIED_PANEL_SPRING}
                          onClick={onResetAddons}
                          className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>ล้างโมดูลเสริม</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/*
                    Zero-Jitter Collapsible List:
                    No `space-y-*` on the scroll container. Each item animates its own
                    `height: 0 -> 'auto'` and wraps an inner `pb-1.5` container so the outer
                    card expands and shrinks smoothly without 1-frame margin snaps.
                  */}
                  <div
                    ref={addonListScrollRef}
                    style={{ scrollbarGutter: 'stable' }}
                    className="max-h-48 overflow-y-auto overscroll-contain pr-1"
                  >
                    <AnimatePresence initial={false}>
                      {calculation.addonModuleItems.length === 0 ? (
                        <motion.div
                          key="empty-addons"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={UNIFIED_PANEL_SPRING}
                          className="overflow-hidden"
                        >
                          <div className="text-xs text-slate-400 italic py-2">
                            ยังไม่ได้เลือกโมดูลเสริม (ใช้งานเฉพาะ Base Core)
                          </div>
                        </motion.div>
                      ) : (
                        calculation.addonModuleItems.map((m) => {
                          const isHighlighted = Boolean(highlightedKeys[m.key]);
                          return (
                            <motion.div
                              key={m.key}
                              ref={(el) => {
                                addonItemRefs.current[m.key] = el;
                              }}
                              initial={{ height: 0, opacity: 0, scale: 0.96 }}
                              animate={{ height: 'auto', opacity: 1, scale: 1 }}
                              exit={{ height: 0, opacity: 0, scale: 0.96 }}
                              transition={UNIFIED_PANEL_SPRING}
                              className="overflow-hidden"
                            >
                              <div className="pb-1.5">
                                <motion.div
                                  initial={false}
                                  animate={{
                                    backgroundColor: isHighlighted
                                      ? 'rgb(238 242 255)'
                                      : 'rgb(248 250 252)',
                                    borderColor: isHighlighted
                                      ? 'rgb(165 180 252)'
                                      : 'rgb(241 245 249)',
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl border"
                                >
                                  <span className="font-medium text-slate-700 truncate pr-2">
                                    + {m.label}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-slate-800 font-google-sans tabular-nums">
                                      ฿{m.monthlyPrice.toLocaleString()}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onToggleModule(m)}
                                      className="text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer px-1 rounded-md hover:bg-rose-50 transition-colors"
                                      title="นำโมดูลออก"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total Price Box */}
        <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-100 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-indigo-950">
              {billingCycle === 'YEARLY' ? 'ยอดชำระรายปีสุทธิ' : 'ยอดชำระรายเดือนสุทธิ'}
            </span>
            <div className="text-right">
              <motion.span
                key={`${billingCycle}-${calculation.displayTotal}`}
                initial={{ y: -5, opacity: 0.45, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={UNIFIED_PANEL_SPRING}
                className="text-2xl sm:text-3xl font-bold text-indigo-700 font-google-sans tabular-nums inline-block"
              >
                ฿{calculation.displayTotal.toLocaleString()}
              </motion.span>
              <span className="text-xs font-bold text-slate-500 ml-1">
                /{billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
              </span>
            </div>
          </div>

          {billingCycle === 'YEARLY' ? (
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>
                เฉลี่ยเดือนละ ฿{Math.round(calculation.totalYearly / 12).toLocaleString()}
              </span>
              <span>ประหยัดงบ ฿{calculation.yearlySavings.toLocaleString()}/ปี</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>ชำระรายปีประหยัดทันที ฿{calculation.yearlySavings.toLocaleString()}</span>
              <button
                type="button"
                onClick={() => onChangeBillingCycle('YEARLY')}
                className="font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                สลับเป็นรายปี
              </button>
            </div>
          )}
        </div>

        {/* Smart Tier Comparison Recommendation (Zero-Jitter Collapsible Wrapper) */}
        <AnimatePresence initial={false}>
          {calculation.recommendedStandardPlan && (
            <motion.div
              key="smart-tier-recommendation"
              initial={{ height: 0, opacity: 0, scale: 0.97 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.97 }}
              transition={UNIFIED_PANEL_SPRING}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-bold">คำแนะนำความคุ้มค่า:</strong> งบประมาณของโมดูลที่เลือกใกล้เคียงกับแพ็กเกจมาตรฐาน{' '}
                    <strong className="underline">
                      {calculation.recommendedStandardPlan.name} (฿
                      {(billingCycle === 'YEARLY'
                        ? calculation.recommendedStandardPlan.yearlyPrice
                        : calculation.recommendedStandardPlan.monthlyPrice
                      ).toLocaleString()}
                      )
                    </strong>{' '}
                    ซึ่งปลดล็อกฟีเจอร์ให้ครบคุ้มกว่า
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary & Secondary Action Buttons */}
        <div className="space-y-2.5 pt-5">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onStartWithRecipe}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>เปิดองค์กรด้วยโครงสร้างระบบนี้</span>
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCopyQuote}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedQuote ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกใบสรุปงบ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSendToSales}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งใบสรุปให้ฝ่ายขาย</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400 pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>สามารถปรับเพิ่ม-ลดโมดูลได้ตลอดเวลาในหน้าตั้งค่าองค์กร</span>
        </div>
      </div>
    </div>
  );
};
