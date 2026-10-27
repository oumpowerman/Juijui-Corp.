import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sliders } from 'lucide-react';
import { BillingCycleType, SPRING_TAB_TRANSITION } from './types';

interface CustomBuilderTopbarProps {
  billingCycle: BillingCycleType;
  yearlyDiscountMonths: number;
  onChangeBillingCycle: (cycle: BillingCycleType) => void;
  onBack: () => void;
}

export const CustomBuilderTopbar: React.FC<CustomBuilderTopbarProps> = ({
  billingCycle,
  yearlyDiscountMonths,
  onChangeBillingCycle,
  onBack,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Back to Main Land Button */}
        <motion.button
          type="button"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปหน้าแพ็กเกจหลัก</span>
        </motion.button>

        {/* Center Studio Configurator Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-indigo-950 text-xs font-bold">
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>À La Carte Module Configurator · จัดสรรฟีเจอร์เฉพาะองค์กร</span>
        </div>

        {/* Right Billing Cycle Switcher with Framer Motion layoutId */}
        <div className="relative inline-flex items-center p-1 bg-slate-100/95 rounded-2xl border border-slate-200/80">
          {(['MONTHLY', 'YEARLY'] as BillingCycleType[]).map((cycle) => {
            const isActive = billingCycle === cycle;
            return (
              <button
                key={cycle}
                type="button"
                onClick={() => onChangeBillingCycle(cycle)}
                className={`relative z-10 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="custom-builder-billing-tab"
                    transition={SPRING_TAB_TRANSITION}
                    className="absolute inset-0 rounded-xl bg-indigo-600 shadow-xs -z-10"
                  />
                )}
                <span>{cycle === 'MONTHLY' ? 'ชำระรายเดือน' : 'ชำระรายปี'}</span>
                {cycle === 'YEARLY' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                      isActive
                        ? 'bg-amber-300 text-slate-950'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    ประหยัด {yearlyDiscountMonths} ด.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
